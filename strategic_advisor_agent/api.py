"""
api.py - Flask REST API for UCAR Strategic Advisor Agent
Running on port 5051 (academic advisor runs on 5050)

Endpoints:
  GET  /health                      - Health check
  POST /api/analyze                 - Submit KPI data (async), returns job_id
  POST /api/analyze/sample          - Run with built-in sample data (async)
  GET  /api/jobs/<job_id>           - Poll job status; result when done
  GET  /api/reports                 - List all saved reports
  GET  /api/reports/<report_id>     - Fetch a specific report by ID
  GET  /api/kpi/schema              - Returns the expected KPI input schema
"""

import json, sys, uuid, threading
from pathlib import Path
from flask import Flask, request, jsonify, Response

sys.path.insert(0, str(Path(__file__).resolve().parent))

from kpi_loader import validate_and_enrich, build_sample_kpi
from report_generator import generate_report, REPORTS_DIR

app = Flask(__name__)

# ─────────────────────────────────────────────
# In-memory job store for async report generation
# ─────────────────────────────────────────────
JOBS = {}


def _run_report_job(job_id: str, enriched_kpi: dict):
    """Background thread: generates report and updates job store."""
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
        "agent": "UCAR Strategic Advisor",
        "model": "google/gemma-4-31b-it",
        "port": 5051,
        "active_jobs": len(JOBS)
    })


@app.route("/api/kpi/schema", methods=["GET"])
def kpi_schema():
    """Returns the expected KPI input structure."""
    return jsonify({
        "description": "POST this structure to /api/analyze",
        "schema": {
            "period": "string — e.g. 'Academic Year 2025-2026 Semester 2'",
            "budget": {
                "allowed_total": "number",
                "consumed_total": "number",
                "per_institution": [{"institution": "string", "allowed": "number", "consumed": "number"}],
                "per_field": [{"field": "string", "allowed": "number", "consumed": "number"}]
            },
            "success_rates": {
                "overall": "number (0-100)",
                "per_institution": [{"institution": "string", "rate": "number", "enrolled_students": "number"}],
                "per_field": [{"field": "string", "rate": "number"}]
            },
            "formations_seminars": {
                "total_count": "number", "total_budget": "number", "total_participants": "number",
                "per_field": [{"field": "string", "count": "number", "participants": "number", "budget": "number"}]
            },
            "events_academic_actions": {
                "total_count": "number", "total_budget": "number",
                "per_field": [{"field": "string", "count": "number", "budget": "number"}]
            },
            "conventions": {
                "national": {
                    "total_count": "number", "total_budget": "number", "partner_institutions": "number",
                    "per_field": [{"field": "string", "count": "number"}]
                },
                "international": {
                    "total_count": "number", "total_budget": "number", "partner_countries": "number",
                    "per_field": [{"field": "string", "count": "number"}]
                }
            }
        }
    })


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    Submit raw KPI data -> immediately returns a job_id (202 Accepted).
    Frontend polls GET /api/jobs/<job_id> until status == 'done'.
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
    t = threading.Thread(target=_run_report_job, args=(job_id, enriched), daemon=True)
    t.start()
    return jsonify({"job_id": job_id, "status": "queued", "poll_url": f"/api/jobs/{job_id}"}), 202


@app.route("/api/analyze/sample", methods=["POST"])
def analyze_sample():
    """Start async analysis with built-in sample KPI data."""
    enriched = validate_and_enrich(build_sample_kpi())
    job_id = str(uuid.uuid4())[:8]
    JOBS[job_id] = {"status": "queued", "result": None}
    t = threading.Thread(target=_run_report_job, args=(job_id, enriched), daemon=True)
    t.start()
    return jsonify({"job_id": job_id, "status": "queued", "poll_url": f"/api/jobs/{job_id}"}), 202


@app.route("/api/jobs/<job_id>", methods=["GET"])
def get_job(job_id):
    """
    Poll job status.
    status: queued -> running -> done | failed
    When done, result contains: { success, report_id, report_text, report_file, warnings_count, insights_count }
    """
    job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": f"Job '{job_id}' not found."}), 404
    return jsonify({"job_id": job_id, "status": job["status"], "result": job.get("result")}), 200


@app.route("/api/reports", methods=["GET"])
def list_reports():
    """List all saved advisory reports."""
    if not REPORTS_DIR.exists():
        return jsonify({"total": 0, "reports": []})
    reports = []
    for f in sorted(REPORTS_DIR.glob("*.txt"), reverse=True):
        stat = f.stat()
        reports.append({
            "report_id": f.stem, "filename": f.name,
            "size_bytes": stat.st_size, "created_at": stat.st_mtime
        })
    return jsonify({"total": len(reports), "reports": reports})


@app.route("/api/reports/<report_id>", methods=["GET"])
def get_report(report_id):
    """Fetch a specific report. Add ?format=text for plain text response."""
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
        "insights_count": content.upper().count("INSIGHT:")
    })


if __name__ == "__main__":
    print("Starting UCAR Strategic Advisor API on port 5051...")
    print("Endpoints:")
    print("  GET  /health")
    print("  GET  /api/kpi/schema")
    print("  POST /api/analyze          -> returns job_id (async)")
    print("  POST /api/analyze/sample   -> returns job_id (async)")
    print("  GET  /api/jobs/<job_id>    -> poll for result")
    print("  GET  /api/reports")
    print("  GET  /api/reports/<report_id>")
    app.run(host="0.0.0.0", port=5051, debug=True)
