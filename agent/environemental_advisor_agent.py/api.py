import sys
import json
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add current directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from main import run_spatial_decision_pipeline

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from the HTML frontend

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "agent": "Environmental Advisor Agent", "port": 5054})

@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    Runs the multi-agent spatial decision pipeline.
    Expects JSON body: {"institution_name": "Name"}
    """
    body = request.get_json(force=True)
    institution_name = body.get("institution_name")
    
    if not institution_name:
        return jsonify({"error": "institution_name is required"}), 400

    try:
        # The main pipeline returns a JSON string, we parse it back to dict for Flask
        result_json_str = run_spatial_decision_pipeline(institution_name)
        if result_json_str is None:
             return jsonify({"error": "Pipeline failed. Check server logs."}), 500
             
        result = json.loads(result_json_str)
        return jsonify({"success": True, "data": result}), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    print("Starting UCAR Environmental Advisor API on port 5054...")
    app.run(host="0.0.0.0", port=5054, debug=True)
