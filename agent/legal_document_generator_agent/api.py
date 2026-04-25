"""
api.py - Flask REST API for Legal Document Generator Agent
Port: 5053

Endpoints:
  GET  /health                      - Health check
  POST /api/generate                - Generate Legal Document for a Student
  GET  /api/document/<student_id>   - Download the generated PDF
"""

import os
from flask import Flask, request, jsonify, send_file
from generator import process_legal_document, OUTPUT_DIR

app = Flask(__name__)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "agent": "UCAR Legal Document Generator Agent",
        "port": 5053
    })

@app.route("/api/generate", methods=["POST"])
def generate_document():
    """
    Generates a legal certification PDF for a student.
    Body: {"student_id": "B-1002"}
    """
    body = request.get_json(force=True)
    student_id = body.get("student_id")
    
    if not student_id:
        return jsonify({"error": "student_id is required"}), 400
        
    result = process_legal_document(student_id)
    
    if not result["success"]:
        return jsonify(result), 400
        
    # Return download URL
    result["download_url"] = f"/api/document/{student_id}"
    return jsonify(result), 200

@app.route("/api/document/<student_id>", methods=["GET"])
def download_document(student_id):
    """
    Downloads the most recent legal document for the student.
    """
    # Find the most recently generated PDF for this student
    student_id_norm = student_id.lower().strip()
    pdfs = list(OUTPUT_DIR.glob(f"UCAR_LegalCert_{student_id_norm}_*.pdf")) + \
           list(OUTPUT_DIR.glob(f"UCAR_LegalCert_{student_id}_*.pdf"))
           
    if not pdfs:
        return jsonify({"error": f"No legal document found for student '{student_id}'"}), 404
        
    # Sort by creation time (most recent first)
    latest_pdf = max(pdfs, key=os.path.getctime)
    
    return send_file(latest_pdf, as_attachment=True)

if __name__ == "__main__":
    print("Starting UCAR Legal Document Generator API on port 5053...")
    print("Endpoints:")
    print("  GET  /health")
    print("  POST /api/generate")
    print("  GET  /api/document/<student_id>")
    app.run(host="0.0.0.0", port=5053, debug=True)
