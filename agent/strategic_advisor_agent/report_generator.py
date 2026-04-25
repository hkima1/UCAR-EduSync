"""
report_generator.py - Calls Gemma LLM and saves advisory_report.txt
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


def call_strategic_llm(system_prompt: str, kpi_payload: dict) -> str:
    headers = {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Accept": "text/event-stream"}
    user_message = f"Generate the UCAR Strategic Advisory Report for this KPI data:\n\n{json.dumps(kpi_payload, indent=2)}"
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "max_tokens": 16384, "temperature": 0.85, "top_p": 0.95,
        "stream": True, "chat_template_kwargs": {"enable_thinking": True}
    }
    final_content = ""
    print("[Strategic Advisor] Streaming report...", flush=True)
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
        print("\n[Strategic Advisor] Done.", flush=True)
        return final_content.strip()
    except Exception as e:
        return f"ERROR: {str(e)}"


def save_report(report_text: str, report_id: str) -> Path:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    filepath = REPORTS_DIR / f"{report_id}.txt"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(report_text)
    print(f"[Strategic Advisor] Report saved -> {filepath}")
    return filepath


def generate_report(kpi_payload: dict) -> dict:
    system_prompt = load_agent_prompt()
    report_id = kpi_payload.get("_meta", {}).get("report_id",
        f"UCAR-SAR-{datetime.utcnow().strftime('%Y%m%d%H%M')}")
    report_text = call_strategic_llm(system_prompt, kpi_payload)
    if report_text.startswith("ERROR:"):
        return {"success": False, "error": report_text, "report_id": report_id}
    report_file = save_report(report_text, report_id)
    return {
        "success": True,
        "report_id": report_id,
        "report_text": report_text,
        "report_file": str(report_file),
        "warnings_count": report_text.upper().count("WARNING:"),
        "insights_count": report_text.upper().count("INSIGHT:"),
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }


if __name__ == "__main__":
    from kpi_loader import build_sample_kpi, validate_and_enrich
    result = generate_report(validate_and_enrich(build_sample_kpi()))
    print(f"\nReport ID: {result['report_id']}")
    print(f"Warnings: {result['warnings_count']} | Insights: {result['insights_count']}")
