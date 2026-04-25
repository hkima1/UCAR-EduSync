import os
import json
import glob
from pathlib import Path
import requests
import difflib

# Configuration for NVIDIA NIM - google/gemma-4-31b-it
NVIDIA_API_KEY = "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"
INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL_NAME = "google/gemma-4-31b-it"

def call_llm(system_prompt, record1, record2):
    """
    Sends two student records to the LLM via SSE streaming and returns structured JSON response.
    Uses google/gemma-4-31b-it with thinking enabled via NVIDIA NIM.
    """
    user_content = (
        f"Record 1:\n{json.dumps(record1, indent=2)}\n\n"
        f"Record 2:\n{json.dumps(record2, indent=2)}"
    )

    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Accept": "text/event-stream"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "max_tokens": 16384,
        "temperature": 1.00,
        "top_p": 0.95,
        "stream": True,
        "chat_template_kwargs": {"enable_thinking": True},
    }

    final_content = ""
    try:
        response = requests.post(INVOKE_URL, headers=headers, json=payload, stream=True, timeout=90)
        response.raise_for_status()

        # Parse the SSE stream line by line
        for line in response.iter_lines():
            if not line:
                continue
            decoded = line.decode("utf-8")

            # SSE lines look like: data: {...} or data: [DONE]
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

                # Print reasoning if present (thinking tokens)
                reasoning = delta.get("reasoning_content")
                if reasoning:
                    print(reasoning, end="", flush=True)

                # Accumulate actual response content
                chunk_content = delta.get("content")
                if chunk_content:
                    final_content += chunk_content

            except json.JSONDecodeError:
                continue  # skip malformed SSE chunks

        print()  # Newline after reasoning stream

        # Strip markdown code fences if model wraps JSON in them
        content = final_content.strip()
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        return json.loads(content.strip())

    except json.JSONDecodeError as e:
        print(f"Error parsing LLM output as JSON: {e}")
        print(f"Raw output: {final_content}")
        return {"match": False, "confidence_score": 0, "error": "JSON decode error"}
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return {"match": False, "confidence_score": 0, "error": str(e)}

def load_system_prompt(prompt_path):
    """Loads the instruction prompt for the LLM."""
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()

def collect_student_records(structured_dir, unstructured_dir):
    """Iterates through JSON files and extracts all student records into a flat list."""
    records = []
    
    # Helper to load and append
    def load_from_dir(directory):
        if not Path(directory).exists():
            print(f"Warning: Directory {directory} does not exist.")
            return

        for filepath in Path(directory).rglob('*.json'):
            with open(filepath, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    if 'students' in data and isinstance(data['students'], dict):
                        # Append each student to our flat list
                        for student_key, student_data in data['students'].items():
                            student_data['_source_file'] = str(filepath)
                            student_data['_student_key'] = student_key
                            records.append(student_data)
                except json.JSONDecodeError:
                    print(f"Warning: Could not parse {filepath}")
    
    print(f"Searching in {structured_dir}")
    load_from_dir(structured_dir)
    print(f"Searching in {unstructured_dir}")
    load_from_dir(unstructured_dir)
    
    return records

def is_potential_match(record1, record2, threshold=0.6):
    """
    Fast pre-filter using difflib to measure string similarity between names and emails.
    Returns True if similarity > threshold, avoiding costly LLM calls for obvious non-matches.
    """
    def get_str(record):
        first = str(record.get('first_name') or '').strip().lower()
        last = str(record.get('last_name') or '').strip().lower()
        email = str(record.get('email') or '').strip().lower()
        return f"{first} {last} {email}".strip()
        
    str1 = get_str(record1)
    str2 = get_str(record2)
    
    # If both strings are empty, they can't be a meaningful match
    if not str1 or not str2:
        return False
        
    similarity = difflib.SequenceMatcher(None, str1, str2).ratio()
    return similarity >= threshold

def process_and_merge(records, system_prompt):
    """Iterates over the records and resolves identities using the LLM."""
    unified_profiles = []
    
    for i, new_record in enumerate(records):
        if '_source_info' not in new_record:
            new_record['_source_info'] = [{'file': new_record.get('_source_file'), 'key': new_record.get('_student_key')}]
            
        clean_new = {k: v for k, v in new_record.items() if not k.startswith('_')}
        print(f"\nProcessing record {i+1}/{len(records)}: {clean_new.get('first_name', '')} {clean_new.get('last_name', '')}")
        match_found = False
        
        for idx, existing_profile in enumerate(unified_profiles):
            print(f"  Comparing against unified profile {idx+1}/{len(unified_profiles)}...")
            
            clean_existing = {k: v for k, v in existing_profile.items() if not k.startswith('_')}
            
            # --- FAST PRE-FILTER ---
            if not is_potential_match(clean_existing, clean_new, threshold=0.75):
                print("  -> Pre-filter rejected match (low string similarity). Skipping LLM API.")
                continue
            
            # Use LLM to check if they match for ambiguous/similar pairs
            print("  -> Pre-filter passed! Querying 397B LLM for deep semantic verification...")
            llm_response = call_llm(system_prompt, clean_existing, clean_new)
            
            if llm_response.get("match") is True:
                print(f"  -> Match found! Confidence: {llm_response.get('confidence_score')}. Merging records.")
                # The LLM returns the merged record
                merged_record = llm_response.get("merged_record", {})
                combined_sources = existing_profile.get('_source_info', []) + new_record.get('_source_info', [])
                
                if merged_record:
                    merged_record['_source_info'] = combined_sources
                    unified_profiles[idx] = merged_record
                else:
                    # Fallback if merged_record is missing but match was true
                    unified_profiles[idx].update(clean_new)
                    unified_profiles[idx]['_source_info'] = combined_sources
                
                match_found = True
                break # Move to next new_record (assuming it only matches one person)
                
        if not match_found:
            print("  -> No match found. Adding as a new unified profile.")
            unified_profiles.append(new_record)
            
    return unified_profiles

def save_unified_profiles(profiles, output_dir):
    """Saves each unified profile as a separate JSON file in the target directory."""
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    for i, profile in enumerate(profiles):
        # Determine a filename, use student_id if available
        student_id = profile.get("student_id")
        if not student_id:
            # Construct from name if ID is missing
            first = profile.get("first_name", "unknown")
            last = profile.get("last_name", "student")
            filename = f"{first}_{last}_{i}.json".replace(" ", "_").lower()
        else:
            filename = f"{student_id}.json".replace(" ", "_").lower()
            
        # Clean potential invalid characters
        filename = "".join(c for c in filename if c.isalnum() or c in "._-")
            
        file_path = out_path / filename
        
        # Remove hidden keys for saving
        clean_profile = {k:v for k,v in profile.items() if not k.startswith('_')}
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(clean_profile, f, indent=4)
            
        # Deletion logic: only if it merged (i.e. more than 1 source)
        sources = profile.get('_source_info', [])
        if len(sources) > 1:
            for src in sources:
                src_file = src.get('file')
                src_key = src.get('key')
                if not src_file or not Path(src_file).exists():
                    continue
                
                try:
                    with open(src_file, 'r', encoding='utf-8') as f:
                        src_data = json.load(f)
                        
                    if 'students' in src_data and src_key in src_data['students']:
                        del src_data['students'][src_key]
                        
                        # If empty, delete the file entirely
                        if not src_data['students']:
                            Path(src_file).unlink()
                            print(f"  -> Deleted empty source file: {src_file}")
                        else:
                            # Save back the modified file without the matched student
                            with open(src_file, 'w', encoding='utf-8') as fw:
                                json.dump(src_data, fw, indent=4)
                            print(f"  -> Removed matched student {src_key} from {src_file}")
                except Exception as e:
                    print(f"  -> Error deleting record from {src_file}: {e}")
            
    print(f"\nSaved {len(profiles)} unified profiles to {output_dir}")

def main():
    # Resolve paths relative to the current script
    base_dir = Path(__file__).resolve().parent.parent
    structured_dir = base_dir / "Structured_data" / "normalized"
    unstructured_dir = base_dir / "unstructured" / "rag" / "rag_output"
    output_dir = base_dir / "unification_json_db"
    prompt_path = Path(__file__).resolve().parent / "prompt.txt"
    
    print("=== Student Profiling Resolution Engine ===")
    
    print(f"Loading system prompt from {prompt_path.name}...")
    try:
        system_prompt = load_system_prompt(prompt_path)
    except FileNotFoundError:
        print(f"Error: Prompt file not found at {prompt_path}")
        return
    
    print("Collecting records from structured and unstructured directories...")
    records = collect_student_records(structured_dir, unstructured_dir)
    print(f"Total records found across sources: {len(records)}")
    
    if not records:
        print("No records found. Exiting.")
        return
        
    print("\nStarting semantic merge process...")
    print("(Note: This may take a while depending on the size of the dataset and API latency)")
    unified_profiles = process_and_merge(records, system_prompt)
    
    print("\nSaving unified profiles...")
    save_unified_profiles(unified_profiles, output_dir)
    print("=== Process Complete ===")

if __name__ == "__main__":
    main()
