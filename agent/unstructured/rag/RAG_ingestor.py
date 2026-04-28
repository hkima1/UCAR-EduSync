import os
import glob
import requests
import base64
import json
import fitz  # PyMuPDF
from PIL import Image
import io
from dotenv import load_dotenv
from pathlib import Path

# Load API key from src/.env (relative to this file)
_env_path = Path(__file__).resolve().parent.parent / "src" / ".env"
load_dotenv(str(_env_path))

# ─── Gemma LLM Configuration (google/gemma-4-31b-it via NVIDIA NIM) ──────────
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "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")
INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL_NAME = "google/gemma-4-31b-it"
# ─────────────────────────────────────────────────────────────────────────────

invoke_url = "https://ai.api.nvidia.com/v1/cv/nvidia/nemotron-ocr-v1"
chat_url = INVOKE_URL

RAG_DATA_DIR = r"C:\Users\tlili\OneDrive\Bureau\UCAR-EduSync-main\unstructured\rag\data_for_rag"
RAG_OUTPUT_DIR = r"C:\Users\tlili\OneDrive\Bureau\UCAR-EduSync-main\unstructured\rag\rag_output"

def extract_json_with_llm(text_content, source_file):
    """Uses Gemma LLM (streaming) to convert arbitrary text into the required structured student schema."""
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Accept": "text/event-stream"
    }

    # Escape backslashes for JSON payload safety
    safe_source = source_file.replace("\\", "/")

    system_prompt = f"""You are a smart data extraction assistant. Extract any student information found in the following text and format it into a JSON object matching this exact schema:
{{
  "source_file": "{safe_source}",
  "students": {{
    "student_id_here": {{
      "student_id": "...",
      "first_name": "...",
      "last_name": "...",
      "date_of_birth": "YYYY-MM-DD",
      "gender": "M or F",
      "email": "...",
      "phone": "...",
      "institution": "...",
      "program": "...",
      "enrollment_year": 202X
    }}
  }},
  "warnings": []
}}
If some fields are missing but a student clearly exists, assign those fields null. 
If NO students are mentioned in the text (like if it's an invoice or general report), leave the "students" dictionary empty {{}} and put the general text summary under "warnings".
Return ONLY valid JSON, do not wrap it in markdown code blocks. Always return valid JSON.
"""

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Here is the parsed text:\n{text_content}"}
        ],
        "max_tokens": 16384,
        "temperature": 1.00,
        "top_p": 0.95,
        "stream": True,
        "chat_template_kwargs": {"enable_thinking": True},
    }

    print("  -> Engaging Gemma LLM to extract JSON structure (streaming)...")
    final_content = ""
    try:
        response = requests.post(chat_url, headers=headers, json=payload, stream=True, timeout=180)
        response.raise_for_status()
        for line in response.iter_lines():
            if not line:
                continue
            decoded = line.decode("utf-8")
            if not decoded.startswith("data:"):
                continue
            data_str = decoded[5:].strip()
            if data_str == "[DONE]":
                break
            try:
                data = json.loads(data_str)
                choices = data.get("choices", [])
                if not choices:
                    continue
                delta = choices[0].get("delta", {})
                # Handle reasoning tokens (thinking phase)
                reasoning = delta.get("reasoning_content")
                if reasoning:
                    print(reasoning, end="", flush=True)
                chunk = delta.get("content")
                if chunk:
                    final_content += chunk
                    print(chunk, end="", flush=True)
            except json.JSONDecodeError:
                continue
        print("\n  -> Gemma extraction done.")

        # Clean up possible markdown code blocks
        content = final_content.strip()
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        parsed_json = json.loads(content.strip())
        return parsed_json
    except Exception as e:
        print(f"     [!] LLM parsing failed or timed out: {e}")
        return {
            "source_file": safe_source,
            "students": {},
            "warnings": ["LLM extraction failed.", f"Raw Text Summary: {text_content[:500]}"]
        }

def extract_text_from_nemotron(response_json):
    """Filter out all the bounding boxes and confidence scores to just return simple readable text."""
    extracted_text = []
    
    if "data" in response_json:
        for data_item in response_json["data"]:
            if isinstance(data_item, list):
                for detection in data_item:
                    if "text" in detection:
                        extracted_text.append(detection["text"])
            elif "text_detections" in data_item:
                for detection in data_item["text_detections"]:
                    if "text_prediction" in detection and "text" in detection["text_prediction"]:
                        extracted_text.append(detection["text_prediction"]["text"])
                    elif "text" in detection:
                        extracted_text.append(detection["text"])
    
    if not extracted_text:
        # Fallback
        def find_text_values(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if k in ("text", "content", "value") and isinstance(v, str):
                        extracted_text.append(v)
                    else:
                        find_text_values(v)
            elif isinstance(obj, list):
                for item in obj:
                    find_text_values(item)
                    
        find_text_values(response_json)
                 
    if not extracted_text:
        return f"[Raw Response]\n{json.dumps(response_json, indent=2)}"
        
    return "\n".join(extracted_text)

def process_image_with_nemotron(image_b64, mime_type="image/png"):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json"
    }

    payload = {
        "input": [{"type": "image_url", "url": f"data:{mime_type};base64,{image_b64}"}]
    }

    try:
        response = requests.post(invoke_url, headers=headers, json=payload)
        response.raise_for_status()
        raw_json = response.json()
        return extract_text_from_nemotron(raw_json)
    except Exception as e:
        return f"Error: Failed to process image. Exception: {str(e)}"

def resize_image_to_fit(pix):
    """Iteratively scales down an image (Pixmap) until its base64 string is under 180,000 bytes."""
    img_bytes = pix.tobytes("png")
    image_b64 = base64.b64encode(img_bytes).decode()
    
    scale = 1.0
    while len(image_b64) >= 170_000 and scale > 0.1:
        scale -= 0.15
        img = Image.open(io.BytesIO(img_bytes))
        new_size = (int(img.width * scale), int(img.height * scale))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        out_io = io.BytesIO()
        img.save(out_io, format="PNG")
        image_b64 = base64.b64encode(out_io.getvalue()).decode()
        
    return image_b64

def pdf_to_text(pdf_path):
    print(f"\nProcessing PDF: {os.path.basename(pdf_path)}")
    doc = fitz.open(pdf_path)
    text_content = []
    
    for page_num in range(len(doc)):
        print(f"  -> Extracting content from Page {page_num + 1} of {len(doc)}...")
        page = doc.load_page(page_num)
        
        text_content.append(f"--- PAGE {page_num + 1} ---\n")
        
        # 1. Native Text
        native_text = page.get_text()
        if native_text.strip():
            text_content.append("[Native Text Content]")
            text_content.append(native_text)
        
        # 2. Extract and OCR Embedded Images
        image_list = page.get_images()
        if image_list:
            text_content.append(f"[Found {len(image_list)} Embedded Image(s) - Extracted OCR Content follows]")
            for img_index, img_info in enumerate(image_list):
                xref = img_info[0]
                pix = fitz.Pixmap(doc, xref)
                if pix.n - pix.alpha >= 4:
                    rgb_pix = fitz.Pixmap(fitz.csRGB, pix)
                    image_b64 = resize_image_to_fit(rgb_pix)
                else:
                    image_b64 = resize_image_to_fit(pix)
                
                print(f"     -> Sending Image {img_index + 1} to Nemotron OCR...")
                ocr_text = process_image_with_nemotron(image_b64)
                text_content.append(f"-> OCR Image {img_index + 1}:\n{ocr_text}\n")
    
    return "\n".join(text_content)

def image_to_text(image_path):
    print(f"\nProcessing standalone Image: {os.path.basename(image_path)}")
    img_doc = fitz.open(image_path)
    pix = img_doc[0].get_pixmap()
    
    image_b64 = resize_image_to_fit(pix)
        
    print(f"  -> Sending Image to Nemotron OCR...")
    ocr_text = process_image_with_nemotron(image_b64)
    return ocr_text

def process_rag_directory():
    if not os.path.exists(RAG_DATA_DIR):
        print(f"Creating directory: {RAG_DATA_DIR}")
        os.makedirs(RAG_DATA_DIR, exist_ok=True)
        
    if not os.path.exists(RAG_OUTPUT_DIR):
        print(f"Creating output directory: {RAG_OUTPUT_DIR}")
        os.makedirs(RAG_OUTPUT_DIR, exist_ok=True)
        
    files = os.listdir(RAG_DATA_DIR)
    
    if not files:
        print(f"No files found in {RAG_DATA_DIR}. Please add some documents or images.")
        return

    for filename in files:
        file_path = os.path.join(RAG_DATA_DIR, filename)
        
        if not os.path.isfile(file_path):
            continue
            
        ext = os.path.splitext(filename)[1].lower()
        # Set extension to JSON
        output_filename = f"{os.path.splitext(filename)[0]}_parsed.json"
        output_path = os.path.join(RAG_OUTPUT_DIR, output_filename)
        
        # Check if already processed
        if os.path.exists(output_path):
            print(f"\nSkipping {filename} - already processed (output exists).")
            continue
            
        final_text = ""
        if ext == '.pdf':
            final_text = pdf_to_text(file_path)
        elif ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp']:
            final_text = image_to_text(file_path)
        else:
            print(f"\nSkipping unsupported file type: {filename}")
            continue

        # Extract JSON schema matching format
        json_data = extract_json_with_llm(final_text, file_path)
        
        # Save securely
        with open(output_path, "w", encoding="utf-8") as out_file:
            json.dump(json_data, out_file, indent=2, ensure_ascii=False)
            
        print(f"Saved formatted JSON to: {output_path}")

if __name__ == "__main__":
    print(f"Starting JSON Output RAG Ingestion from: {RAG_DATA_DIR}")
    print(f"Targeting RAG Output to: {RAG_OUTPUT_DIR}\n")
    process_rag_directory()
    print("\nRAG Ingestion Complete.")