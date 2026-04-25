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
from pathlib import Path
from flask import Flask, request, jsonify

# Allow imports from the agent folder
sys.path.insert(0, str(Path(__file__).resolve().parent))

import requests as req
from ucars_scrapper import get_student_with_catalog, get_catalog_for_student, load_student, CATALOG
from aggregator import apply_for_certification, get_student_intents, update_intent_status

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
def call_advisor_llm(system_prompt: str, user_message: str) -> dict:
    """
    Calls the Gemma LLM with the advisor prompt and student data.
    Returns the parsed JSON advice dict.
    """
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Accept": "text/event-stream"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "max_tokens": 16384,
        "temperature": 1.00,
        "top_p": 0.95,
        "stream": True,
        "chat_template_kwargs": {"enable_thinking": True},
    }

    final_content = ""
    try:
        response = req.post(INVOKE_URL, headers=headers, json=payload, stream=True, timeout=120)
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
                chunk_content = delta.get("content")
                if chunk_content:
                    final_content += chunk_content
            except json.JSONDecodeError:
                continue

        # Strip markdown fences
        content = final_content.strip()
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        return json.loads(content.strip())

    except json.JSONDecodeError as e:
        return {"error": "LLM output could not be parsed as JSON", "raw": final_content, "detail": str(e)}
    except Exception as e:
        return {"error": str(e)}


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

    advice = call_advisor_llm(system_prompt, user_message)

    # Attach context metadata
    advice["_student_id"] = student_id
    advice["_catalog_used"] = context["academic_catalog"].get("program")
    advice["_grade_level"] = context["academic_catalog"].get("grade_level")

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
