"""
report_generator.py — Calls Gemma LLM, saves employment advisory report as .txt
"""

import json, requests
from pathlib import Path
from datetime import datetime

NVIDIA_API_KEY = "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"
INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL_NAME = "google/gemma-4-31b-it"

BASE_DIR = Path(__file__).resolve().parent
REPORTS_DIR = BASE_DIR / "reports"


def load_agent_prompt() -> str:
    with open(BASE_DIR / "agent_prompt.txt", "r", encoding="utf-8") as f:
        return f.read()


def call_employment_llm(system_prompt: str, kpi_payload: dict) -> str:
    headers = {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Accept": "text/event-stream"}
    user_message = (
        "Generate the UCAR Equitable Employment Advisory Report based on this workforce data:\n\n"
        f"{json.dumps(kpi_payload, indent=2)}"
    )
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "max_tokens": 16384,
        "temperature": 0.80,
        "top_p": 0.95,
        "stream": True,
        "chat_template_kwargs": {"enable_thinking": True}
    }
    final_content = ""
    print("[Employment Agent] Streaming report from Gemma...", flush=True)
    try:
        response = requests.post(INVOKE_URL, headers=headers, json=payload, stream=True, timeout=180)
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
                chunk = data.get("choices", [{}])[0].get("delta", {}).get("content")
                if chunk:
                    final_content += chunk
                    print(chunk, end="", flush=True)
            except json.JSONDecodeError:
                continue
        print("\n[Employment Agent] Done.", flush=True)
        return final_content.strip()
    except Exception as e:
        return f"ERROR: {str(e)}"


def save_report(report_text: str, report_id: str) -> Path:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    filepath = REPORTS_DIR / f"{report_id}.txt"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(report_text)
    print(f"[Employment Agent] Report saved -> {filepath}")
    return filepath


def generate_report(kpi_payload: dict) -> dict:
    system_prompt = load_agent_prompt()
    report_id = kpi_payload.get("_meta", {}).get(
        "report_id", f"UCAR-EEA-{datetime.now().strftime('%Y%m%d%H%M')}"
    )
    report_text = call_employment_llm(system_prompt, kpi_payload)
    if report_text.startswith("ERROR:"):
        return {"success": False, "error": report_text, "report_id": report_id}
    report_file = save_report(report_text, report_id)
    return {
        "success": True,
        "report_id": report_id,
        "report_text": report_text,
        "report_file": str(report_file),
        "warnings_count": report_text.upper().count("WARNING:"),
        "actions_count": report_text.upper().count("ACTION"),
        "generated_at": datetime.now().isoformat()
    }


if __name__ == "__main__":
    from employment_loader import build_sample_kpi, validate_and_enrich
    result = generate_report(validate_and_enrich(build_sample_kpi()))
    print(f"\nReport ID  : {result['report_id']}")
    print(f"Warnings   : {result['warnings_count']}")
    print(f"Actions    : {result['actions_count']}")
    print(f"Saved to   : {result['report_file']}")
