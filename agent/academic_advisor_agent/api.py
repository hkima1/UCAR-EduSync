"""
api.py
-------
Flask REST API for the UCAR Academic Advisor Agent.
Uses google/gemma-4-31b-it via NVIDIA NIM (same model as merge.py).

Endpoints:
  GET  /api/student/<student_id>       — Load student profile
  POST /api/advise                     — Get personalized academic advice from LLM
  POST /api/apply                      — Apply for a certification (writes intent)
  GET  /api/intents/<student_id>       — List all student intents
  PUT  /api/intents/status             — Update intent status
  GET  /api/catalog/<program>          — Browse catalog for a program
  GET  /health                         — Health check
"""

import json
import sys
import threading
import queue
import logging
from pathlib import Path
from datetime import datetime
from flask import Flask, request, jsonify

# Allow imports from the agent folder
sys.path.insert(0, str(Path(__file__).resolve().parent))

import requests as req
from ucars_scrapper import get_student_with_catalog, get_catalog_for_student, load_student, CATALOG
from aggregator import apply_for_certification, get_student_intents, update_intent_status

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("academic_advisor")

# ─── Fallback Config ───────────────────────────────────────────────────────────
LLM_TIMEOUT_S  = 40
BASE_DIR       = Path(__file__).resolve().parent
FALLBACK_DIR   = BASE_DIR / "fallback_logs"
FALLBACK_LOG   = FALLBACK_DIR / "fallback_log.txt"

# Mock JSON advice — returned when LLM times out
MOCK_ADVICE = {
    "student_summary": "Student profile loaded from reference data (fallback mode).",
    "overall_assessment": "Based on reference academic data, this student shows strong potential in their primary field. Current GPA places them in the top 40% of their cohort.",
    "strengths": [
        "Consistent academic performance across core subjects",
        "Active participation in extracurricular activities",
        "Strong foundational skills in mathematics and science"
    ],
    "areas_for_improvement": [
        "Increase engagement with research seminars and workshops",
        "Consider pursuing international exchange opportunities",
        "Build professional network through internship applications"
    ],
    "recommended_certifications": [
        {
            "name": "Data Analysis Professional Certificate",
            "provider": "IBM / Coursera",
            "relevance": "High — aligns with current field specialization",
            "estimated_duration": "4-6 months",
            "match_score": 0.87
        },
        {
            "name": "Project Management Fundamentals",
            "provider": "PMI",
            "relevance": "Medium — valuable for career development",
            "estimated_duration": "2-3 months",
            "match_score": 0.72
        }
    ],
    "action_plan": [
        "Register for the upcoming research methodology seminar (next session: Month+1)",
        "Submit internship application to at least 3 partner institutions by end of semester",
        "Schedule a meeting with academic advisor to discuss thesis topic selection"
    ],
    "risk_flags": [],
    "next_review_date": "End of current academic semester",
    "_fallback": True,
    "_fallback_reason": f"LLM did not respond within {LLM_TIMEOUT_S}s",
    "_generated_at": datetime.utcnow().isoformat() + "Z"
}


def _write_fallback_log(student_id: str, reason: str):
    FALLBACK_DIR.mkdir(parents=True, exist_ok=True)
    entry = (
        f"[{datetime.utcnow().isoformat()}Z] "
        f"student_id={student_id} | status=SUCCESS(fallback) | reason={reason}\n"
    )
    with open(FALLBACK_LOG, "a", encoding="utf-8") as f:
        f.write(entry)
    log.info("[Academic Advisor] Fallback log written.")

# ─────────────────────────────────────────────
# NVIDIA NIM Configuration (same as merge.py)
# ─────────────────────────────────────────────
NVIDIA_API_KEY = "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"
INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL_NAME = "google/gemma-4-31b-it"

AGENT_PROMPT_PATH = Path(__file__).resolve().parent / "agent_prompt.txt"

# ─────────────────────────────────────────────
# Load system prompt
# ─────────────────────────────────────────────
def load_agent_prompt() -> str:
    with open(AGENT_PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read()


# ─────────────────────────────────────────────
# LLM Call — google/gemma-4-31b-it via SSE
# ─────────────────────────────────────────────
def _llm_worker_academic(system_prompt: str, user_message: str, result_q: queue.Queue):
    """Background thread — streams Gemma and puts final content into the queue."""
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Accept": "text/event-stream"
    }
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        "max_tokens": 16384, "temperature": 1.00, "top_p": 0.95,
        "stream": True, "chat_template_kwargs": {"enable_thinking": True},
    }
    final_content = ""
    try:
        response = req.post(INVOKE_URL, headers=headers, json=payload, stream=True, timeout=180)
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
                data    = json.loads(data_str)
                choices = data.get("choices", [])
                if not choices:
                    continue
                delta = choices[0].get("delta", {})
                reasoning = delta.get("reasoning_content")
                if reasoning:
                    print(reasoning, end="", flush=True)
                chunk = delta.get("content")
                if chunk:
                    final_content += chunk
                    print(chunk, end="", flush=True)
            except json.JSONDecodeError:
                continue
        print("\n[Academic Advisor] LLM done.", flush=True)
        result_q.put(("ok", final_content.strip()))
    except Exception as e:
        result_q.put(("error", str(e)))


def call_advisor_llm(system_prompt: str, user_message: str, student_id: str = "unknown") -> dict:
    """
    Calls Gemma LLM with a 40s timeout.
    Falls back to MOCK_ADVICE if LLM does not respond in time.
    Returns the parsed JSON advice dict with optional _fallback=True.
    """
    result_q: queue.Queue = queue.Queue()
    t = threading.Thread(
        target=_llm_worker_academic,
        args=(system_prompt, user_message, result_q),
        daemon=True
    )
    log.info("[Academic Advisor] Starting LLM call (timeout=%ds) for student=%s...", LLM_TIMEOUT_S, student_id)
    t.start()

    try:
        status, content = result_q.get(timeout=LLM_TIMEOUT_S)
        if status == "ok" and content:
            log.info("[Academic Advisor] LLM responded successfully.")
            # Strip markdown fences
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            try:
                return json.loads(content.strip())
            except json.JSONDecodeError as e:
                log.warning("[Academic Advisor] JSON parse error — using fallback. %s", e)
        else:
            log.warning("[Academic Advisor] LLM error — using fallback. %s", content)
    except queue.Empty:
        log.warning("[Academic Advisor] LLM timed out after %ds — using mock fallback.", LLM_TIMEOUT_S)

    # Write fallback log and return mock
    _write_fallback_log(student_id, f"LLM timeout after {LLM_TIMEOUT_S}s")
    return dict(MOCK_ADVICE)


# ─────────────────────────────────────────────
# Flask App
# ─────────────────────────────────────────────
app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "model": MODEL_NAME, "agent": "UCAR Academic Advisor"})


@app.route("/api/student/<student_id>", methods=["GET"])
def get_student(student_id):
    """Load a student's unified profile."""
    student = load_student(student_id)
    if not student:
        return jsonify({"error": f"Student '{student_id}' not found."}), 404
    return jsonify(student)


@app.route("/api/advise", methods=["POST"])
def advise():
    """
    Get personalized academic advice for a student.
    
    Body: { "student_id": "B-1002" }
    
    Returns structured JSON advice from the Gemma LLM.
    """
    body = request.get_json(force=True)
    student_id = body.get("student_id")
    if not student_id:
        return jsonify({"error": "Missing 'student_id' in request body."}), 400

    # Build student + catalog context
    context = get_student_with_catalog(student_id)
    if "error" in context:
        return jsonify(context), 404

    system_prompt = load_agent_prompt()

    user_message = (
        f"Here is the student profile and their available academic catalog.\n\n"
        f"Student Profile:\n{json.dumps(context['student_profile'], indent=2)}\n\n"
        f"Academic Catalog (grade-filtered):\n{json.dumps(context['academic_catalog'], indent=2)}\n\n"
        f"Please generate personalized academic advice for this student."
    )

    advice = call_advisor_llm(system_prompt, user_message, student_id=student_id)

    # Attach context metadata
    advice["_student_id"]   = student_id
    advice["_catalog_used"] = context["academic_catalog"].get("program")
    advice["_grade_level"]  = context["academic_catalog"].get("grade_level")
    advice.setdefault("_fallback", False)

    return jsonify(advice)


@app.route("/api/apply", methods=["POST"])
def apply():
    """
    Apply for a certification — writes student_intent to unified DB.
    
    Body: {
      "student_id": "B-1002",
      "certification_name": "IBM Data Science Professional Certificate",
      "provider": "IBM / Coursera",
      "notes": "Optional free-text note"
    }
    """
    body = request.get_json(force=True)
    student_id = body.get("student_id")
    cert_name = body.get("certification_name")
    provider = body.get("provider", "")
    notes = body.get("notes", "")

    if not student_id or not cert_name:
        return jsonify({"error": "Missing 'student_id' or 'certification_name'."}), 400

    result = apply_for_certification(student_id, cert_name, provider, notes)
    status_code = 200 if result["success"] else 409
    return jsonify(result), status_code


@app.route("/api/intents/<student_id>", methods=["GET"])
def get_intents(student_id):
    """List all recorded intents for a student."""
    result = get_student_intents(student_id)
    if not result["success"]:
        return jsonify(result), 404
    return jsonify(result)


@app.route("/api/intents/status", methods=["PUT"])
def update_status():
    """
    Update the status of a student's certification intent.
    
    Body: {
      "student_id": "B-1002",
      "certification_name": "...",
      "status": "approved" | "rejected" | "enrolled" | "completed"
    }
    """
    body = request.get_json(force=True)
    student_id = body.get("student_id")
    cert_name = body.get("certification_name")
    new_status = body.get("status")

    if not all([student_id, cert_name, new_status]):
        return jsonify({"error": "Missing required fields: student_id, certification_name, status."}), 400

    result = update_intent_status(student_id, cert_name, new_status)
    status_code = 200 if result["success"] else 400
    return jsonify(result), status_code


@app.route("/api/catalog/<program>", methods=["GET"])
def get_catalog(program):
    """Browse the full certification catalog for a given program."""
    catalog = CATALOG.get(program)
    if not catalog:
        available = list(CATALOG.keys())
        return jsonify({"error": f"No catalog for '{program}'.", "available_programs": available}), 404
    return jsonify({"program": program, "catalog": catalog})


@app.route("/api/catalog", methods=["GET"])
def list_programs():
    """List all available programs in the catalog."""
    return jsonify({"programs": list(CATALOG.keys())})


# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("Starting UCAR Academic Advisor API...")
    print(f"Model: {MODEL_NAME}")
    print("Endpoints:")
    print("  GET  /health")
    print("  GET  /api/student/<student_id>")
    print("  POST /api/advise")
    print("  POST /api/apply")
    print("  GET  /api/intents/<student_id>")
    print("  PUT  /api/intents/status")
    print("  GET  /api/catalog/<program>")
    app.run(host="0.0.0.0", port=5050, debug=True)
