"""
aggregator.py
--------------
Handles student intent — when a student applies for a certification,
this module writes their intent into the unified JSON profile under
a 'student_intent' block in unification_json_db.
"""

import json
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent
UNIFIED_DB_DIR = BASE_DIR / "unification_json_db"


def _find_student_file(student_id: str) -> Path | None:
    """Locate the JSON file for a given student_id."""
    for filepath in UNIFIED_DB_DIR.glob("*.json"):
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                if str(data.get("student_id", "")).lower() == student_id.lower():
                    return filepath, data
            except json.JSONDecodeError:
                continue
    return None, None


def apply_for_certification(
    student_id: str,
    certification_name: str,
    provider: str,
    notes: str = ""
) -> dict:
    """
    Records a student's intent to apply for a certification.
    Appends or updates the 'student_intent' block in their unified JSON file.
    
    Returns a status dict.
    """
    filepath, student_data = _find_student_file(student_id)

    if not student_data:
        return {
            "success": False,
            "message": f"Student '{student_id}' not found in unified database."
        }

    # Build the intent record
    intent_entry = {
        "type": "certification_application",
        "certification_name": certification_name,
        "provider": provider,
        "notes": notes,
        "status": "pending",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    # Append to existing intent list or create new block
    if "student_intent" not in student_data:
        student_data["student_intent"] = []

    # Avoid duplicate entries for the same certification
    existing = [
        i for i in student_data["student_intent"]
        if i.get("certification_name") == certification_name and i.get("status") == "pending"
    ]
    if existing:
        return {
            "success": False,
            "message": f"Already applied for '{certification_name}'. Application is still pending.",
            "existing_application": existing[0]
        }

    student_data["student_intent"].append(intent_entry)

    # Write back to JSON file
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(student_data, f, indent=4)

    return {
        "success": True,
        "message": f"Successfully applied for '{certification_name}'.",
        "student_id": student_id,
        "intent": intent_entry
    }


def get_student_intents(student_id: str) -> dict:
    """Returns all recorded intents for a student."""
    _, student_data = _find_student_file(student_id)
    if not student_data:
        return {"success": False, "message": f"Student '{student_id}' not found."}

    return {
        "success": True,
        "student_id": student_id,
        "student_name": f"{student_data.get('first_name', '')} {student_data.get('last_name', '')}",
        "intents": student_data.get("student_intent", [])
    }


def update_intent_status(student_id: str, certification_name: str, new_status: str) -> dict:
    """
    Updates the status of an existing intent.
    Valid statuses: 'pending', 'approved', 'rejected', 'enrolled', 'completed'
    """
    valid_statuses = {"pending", "approved", "rejected", "enrolled", "completed"}
    if new_status not in valid_statuses:
        return {"success": False, "message": f"Invalid status. Must be one of: {valid_statuses}"}

    filepath, student_data = _find_student_file(student_id)
    if not student_data:
        return {"success": False, "message": f"Student '{student_id}' not found."}

    intents = student_data.get("student_intent", [])
    updated = False
    for intent in intents:
        if intent.get("certification_name") == certification_name:
            intent["status"] = new_status
            intent["updated_at"] = datetime.utcnow().isoformat() + "Z"
            updated = True

    if not updated:
        return {"success": False, "message": f"No intent found for '{certification_name}'."}

    student_data["student_intent"] = intents
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(student_data, f, indent=4)

    return {
        "success": True,
        "message": f"Status updated to '{new_status}' for '{certification_name}'.",
        "student_id": student_id
    }


if __name__ == "__main__":
    # Quick test
    result = apply_for_certification(
        student_id="B-1002",
        certification_name="IBM Data Science Professional Certificate",
        provider="IBM / Coursera",
        notes="Interested in AI career path"
    )
    print(json.dumps(result, indent=2))
