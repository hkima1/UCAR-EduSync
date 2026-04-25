"""
api.py - Flask REST API for UCAR Equitable Employment Agent
Port: 5052

Endpoints:
  GET  /health                    - Health check
  POST /api/analyze               - Submit workforce KPI data (async -> job_id)
  POST /api/analyze/sample        - Run with built-in sample data (async)
  GET  /api/jobs/<job_id>         - Poll job status and get report when done
  GET  /api/reports               - List all saved reports
  GET  /api/reports/<report_id>   - Fetch report (JSON or ?format=text)
  GET  /api/kpi/schema            - Returns the expected KPI input schema
  GET  /api/benchmarks            - Returns salary benchmarks used for calculations
"""

import json, sys, uuid, threading
from pathlib import Path
from flask import Flask, request, jsonify, Response

sys.path.insert(0, str(Path(__file__).resolve().parent))

from employment_loader import (
    validate_and_enrich, build_sample_kpi,
    PROFESSOR_SALARY, POSTDOC_SALARY, TARGET_RATIO, CRITICAL_RATIO
)
from report_generator import generate_report, REPORTS_DIR

app = Flask(__name__)

# ─────────────────────────────────────────────
# Async job store
# ─────────────────────────────────────────────
JOBS = {}


def _run_job(job_id: str, enriched_kpi: dict):
    try:
        JOBS[job_id]["status"] = "running"
        result = generate_report(enriched_kpi)
        JOBS[job_id]["status"] = "done"
        JOBS[job_id]["result"] = result
    except Exception as e:
        JOBS[job_id]["status"] = "failed"
        JOBS[job_id]["result"] = {"success": False, "error": str(e)}


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "agent": "UCAR Equitable Employment Advisor",
        "model": "google/gemma-4-31b-it",
        "port": 5052,
        "active_jobs": len(JOBS)
    })


@app.route("/api/benchmarks", methods=["GET"])
def benchmarks():
    """Returns the salary benchmarks and ratio thresholds used in calculations."""
    return jsonify({
        "professor_salary_annual": PROFESSOR_SALARY,
        "postdoc_salary_annual": POSTDOC_SALARY,
        "target_student_professor_ratio": TARGET_RATIO,
        "critical_ratio_threshold": CRITICAL_RATIO,
        "currency": "Same as input budget units"
    })


@app.route("/api/kpi/schema", methods=["GET"])
def kpi_schema():
    """Returns the expected KPI input structure."""
    return jsonify({
        "description": "POST this structure to /api/analyze",
        "schema": {
            "period": "string — e.g. 'Academic Year 2025-2026'",
            "budget": {
                "total_budget": "number",
                "hiring_budget_available": "number — portion allocated to new hires",
                "per_institution": [
                    {"institution": "string", "hiring_budget": "number"}
                ]
            },
            "teaching_staff": {
                "total_professors": "number",
                "per_institution": [
                    {"institution": "string", "professor_count": "number"}
                ],
                "per_field": [
                    {"field": "string", "professor_count": "number"}
                ]
            },
            "students": {
                "total_students": "number",
                "per_institution": [
                    {"institution": "string", "student_count": "number"}
                ],
                "per_field": [
                    {"field": "string", "student_count": "number"}
                ]
            }
        }
    })


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    Submit workforce KPI data -> returns job_id immediately (202 Accepted).
    Poll GET /api/jobs/<job_id> for result.
    """
    raw_kpi = request.get_json(force=True)
    if not raw_kpi:
        return jsonify({"error": "Empty or invalid JSON body."}), 400
    try:
        enriched = validate_and_enrich(raw_kpi)
    except Exception as e:
        return jsonify({"error": f"KPI validation failed: {str(e)}"}), 422

    job_id = str(uuid.uuid4())[:8]
    JOBS[job_id] = {"status": "queued", "result": None}
    t = threading.Thread(target=_run_job, args=(job_id, enriched), daemon=True)
    t.start()
    return jsonify({
        "job_id": job_id, "status": "queued",
        "poll_url": f"/api/jobs/{job_id}"
    }), 202


@app.route("/api/analyze/sample", methods=["POST"])
def analyze_sample():
    """Trigger async analysis with built-in sample workforce data."""
    enriched = validate_and_enrich(build_sample_kpi())
    job_id = str(uuid.uuid4())[:8]
    JOBS[job_id] = {"status": "queued", "result": None}
    t = threading.Thread(target=_run_job, args=(job_id, enriched), daemon=True)
    t.start()
    return jsonify({
        "job_id": job_id, "status": "queued",
        "poll_url": f"/api/jobs/{job_id}"
    }), 202


@app.route("/api/jobs/<job_id>", methods=["GET"])
def get_job(job_id):
    """
    Poll job status.
    status: queued -> running -> done | failed
    Result when done contains: success, report_id, report_text, report_file,
    warnings_count, actions_count, generated_at
    """
    job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": f"Job '{job_id}' not found."}), 404
    return jsonify({
        "job_id": job_id,
        "status": job["status"],
        "result": job.get("result")
    }), 200


@app.route("/api/reports", methods=["GET"])
def list_reports():
    """List all saved employment advisory reports."""
    if not REPORTS_DIR.exists():
        return jsonify({"total": 0, "reports": []})
    reports = []
    for f in sorted(REPORTS_DIR.glob("*.txt"), reverse=True):
        stat = f.stat()
        reports.append({
            "report_id": f.stem,
            "filename": f.name,
            "size_bytes": stat.st_size,
            "created_at": stat.st_mtime
        })
    return jsonify({"total": len(reports), "reports": reports})


@app.route("/api/reports/<report_id>", methods=["GET"])
def get_report(report_id):
    """
    Fetch a specific report.
    Add ?format=text for plain text, default is JSON.
    """
    report_path = REPORTS_DIR / f"{report_id}.txt"
    if not report_path.exists():
        return jsonify({"error": f"Report '{report_id}' not found."}), 404
    with open(report_path, "r", encoding="utf-8") as f:
        content = f.read()
    if request.args.get("format") == "text":
        return Response(content, mimetype="text/plain; charset=utf-8")
    return jsonify({
        "report_id": report_id,
        "report_text": content,
        "warnings_count": content.upper().count("WARNING:"),
        "actions_count": content.upper().count("ACTION")
    })


if __name__ == "__main__":
    print("Starting UCAR Equitable Employment Agent API on port 5052...")
    print("Endpoints:")
    print("  GET  /health")
    print("  GET  /api/benchmarks")
    print("  GET  /api/kpi/schema")
    print("  POST /api/analyze           -> returns job_id (async)")
    print("  POST /api/analyze/sample    -> returns job_id (async)")
    print("  GET  /api/jobs/<job_id>     -> poll for result")
    print("  GET  /api/reports")
    print("  GET  /api/reports/<report_id>")
    app.run(host="0.0.0.0", port=5052, debug=True)
