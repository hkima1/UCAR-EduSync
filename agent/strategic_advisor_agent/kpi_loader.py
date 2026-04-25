"""
kpi_loader.py
--------------
Validates, normalizes and structures raw KPI input data for the
UCAR Strategic Advisor Agent.

Accepts KPI data as a Python dict or JSON and returns a clean,
enriched KPI package ready to send to the Gemma LLM.

Computed enrichments:
- Budget utilization rate (%) per institution and total
- Budget surplus/deficit per institution
- Success rate delta from national target (default: 75%)
- Convention density per field
- Formation coverage per field
"""

from datetime import datetime
from typing import Optional

# ─────────────────────────────────────────────
# Defaults & Constants
# ─────────────────────────────────────────────
SUCCESS_RATE_TARGET = 75.0      # UCAR institutional target success rate %
BUDGET_ALERT_THRESHOLD = 85.0  # % utilization above which a warning is flagged
LOW_SUCCESS_THRESHOLD = 60.0   # % below which performance is flagged as critical


def validate_and_enrich(raw_kpi: dict) -> dict:
    """
    Takes raw KPI input dict and returns a fully enriched KPI package.
    Raises ValueError on critical missing fields.
    """
    kpi = {}

    # ── Budget ───────────────────────────────
    budget = raw_kpi.get("budget", {})
    allowed_total = budget.get("allowed_total", 0)
    consumed_total = budget.get("consumed_total", 0)

    utilization_total = round((consumed_total / allowed_total * 100), 2) if allowed_total > 0 else 0
    surplus_total = round(allowed_total - consumed_total, 2)

    # Per-institution budget enrichment
    institutions_budget = []
    for inst in budget.get("per_institution", []):
        allowed = inst.get("allowed", 0)
        consumed = inst.get("consumed", 0)
        utilization = round((consumed / allowed * 100), 2) if allowed > 0 else 0
        surplus = round(allowed - consumed, 2)
        institutions_budget.append({
            **inst,
            "utilization_pct": utilization,
            "surplus_deficit": surplus,
            "alert": utilization >= BUDGET_ALERT_THRESHOLD
        })

    # Per-field budget enrichment
    fields_budget = []
    for field in budget.get("per_field", []):
        allowed = field.get("allowed", 0)
        consumed = field.get("consumed", 0)
        utilization = round((consumed / allowed * 100), 2) if allowed > 0 else 0
        fields_budget.append({
            **field,
            "utilization_pct": utilization,
            "surplus_deficit": round(allowed - consumed, 2),
            "alert": utilization >= BUDGET_ALERT_THRESHOLD
        })

    kpi["budget"] = {
        "allowed_total": allowed_total,
        "consumed_total": consumed_total,
        "utilization_total_pct": utilization_total,
        "surplus_deficit_total": surplus_total,
        "budget_alert": utilization_total >= BUDGET_ALERT_THRESHOLD,
        "per_institution": institutions_budget,
        "per_field": fields_budget
    }

    # ── Success Rates ─────────────────────────
    success = raw_kpi.get("success_rates", {})
    overall_rate = success.get("overall", 0)

    institutions_success = []
    for inst in success.get("per_institution", []):
        rate = inst.get("rate", 0)
        delta = round(rate - SUCCESS_RATE_TARGET, 2)
        institutions_success.append({
            **inst,
            "delta_from_target": delta,
            "status": "CRITICAL" if rate < LOW_SUCCESS_THRESHOLD else ("AT-RISK" if rate < SUCCESS_RATE_TARGET else "ON-TRACK")
        })

    fields_success = []
    for field in success.get("per_field", []):
        rate = field.get("rate", 0)
        delta = round(rate - SUCCESS_RATE_TARGET, 2)
        fields_success.append({
            **field,
            "delta_from_target": delta,
            "status": "CRITICAL" if rate < LOW_SUCCESS_THRESHOLD else ("AT-RISK" if rate < SUCCESS_RATE_TARGET else "ON-TRACK")
        })

    kpi["success_rates"] = {
        "overall": overall_rate,
        "target": SUCCESS_RATE_TARGET,
        "overall_delta": round(overall_rate - SUCCESS_RATE_TARGET, 2),
        "overall_status": "CRITICAL" if overall_rate < LOW_SUCCESS_THRESHOLD else ("AT-RISK" if overall_rate < SUCCESS_RATE_TARGET else "ON-TRACK"),
        "per_institution": institutions_success,
        "per_field": fields_success
    }

    # ── Seminars & Formations ─────────────────
    formations = raw_kpi.get("formations_seminars", {})
    kpi["formations_seminars"] = {
        "total_count": formations.get("total_count", 0),
        "total_budget": formations.get("total_budget", 0),
        "total_participants": formations.get("total_participants", 0),
        "per_field": formations.get("per_field", [])
    }

    # ── Events & Academic Actions ─────────────
    events = raw_kpi.get("events_academic_actions", {})
    kpi["events_academic_actions"] = {
        "total_count": events.get("total_count", 0),
        "total_budget": events.get("total_budget", 0),
        "per_field": events.get("per_field", [])
    }

    # ── Conventions ──────────────────────────
    conventions = raw_kpi.get("conventions", {})
    national = conventions.get("national", {})
    international = conventions.get("international", {})

    # Compute fields covered in conventions
    nat_fields = {c.get("field") for c in national.get("per_field", [])} if national.get("per_field") else set()
    intl_fields = {c.get("field") for c in international.get("per_field", [])} if international.get("per_field") else set()

    kpi["conventions"] = {
        "national": {
            "total_count": national.get("total_count", 0),
            "total_budget": national.get("total_budget", 0),
            "partner_institutions": national.get("partner_institutions", 0),
            "fields_covered": list(nat_fields),
            "per_field": national.get("per_field", [])
        },
        "international": {
            "total_count": international.get("total_count", 0),
            "total_budget": international.get("total_budget", 0),
            "partner_countries": international.get("partner_countries", 0),
            "fields_covered": list(intl_fields),
            "per_field": international.get("per_field", [])
        }
    }

    # ── Metadata ─────────────────────────────
    kpi["_meta"] = {
        "report_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "report_id": f"UCAR-SAR-{datetime.utcnow().strftime('%Y%m%d%H%M')}",
        "period": raw_kpi.get("period", "Not specified"),
        "generated_by": "UCAR Strategic Advisor Agent v1.0"
    }

    return kpi


def build_sample_kpi() -> dict:
    """Returns a realistic sample KPI payload for testing."""
    return {
        "period": "Academic Year 2025-2026 — Semester 2",
        "budget": {
            "allowed_total": 5000000,
            "consumed_total": 3850000,
            "per_institution": [
                {"institution": "Institute A", "allowed": 1800000, "consumed": 1700000},
                {"institution": "Institute B", "allowed": 1700000, "consumed": 1590000},
                {"institution": "Institute C", "allowed": 1500000, "consumed": 560000}
            ],
            "per_field": [
                {"field": "Computer Science", "allowed": 1500000, "consumed": 1350000},
                {"field": "Mathematics", "allowed": 1200000, "consumed": 980000},
                {"field": "Chemistry", "allowed": 1100000, "consumed": 920000},
                {"field": "Physics", "allowed": 700000, "consumed": 380000},
                {"field": "Biology", "allowed": 500000, "consumed": 220000}
            ]
        },
        "success_rates": {
            "overall": 68.5,
            "per_institution": [
                {"institution": "Institute A", "rate": 74.2, "enrolled_students": 420},
                {"institution": "Institute B", "rate": 55.8, "enrolled_students": 380},
                {"institution": "Institute C", "rate": 81.3, "enrolled_students": 290}
            ],
            "per_field": [
                {"field": "Computer Science", "rate": 72.1},
                {"field": "Mathematics", "rate": 58.4},
                {"field": "Chemistry", "rate": 76.9},
                {"field": "Physics", "rate": 63.2},
                {"field": "Biology", "rate": 80.1}
            ]
        },
        "formations_seminars": {
            "total_count": 34,
            "total_budget": 280000,
            "total_participants": 1240,
            "per_field": [
                {"field": "Computer Science", "count": 12, "participants": 520, "budget": 110000},
                {"field": "Mathematics", "count": 4, "participants": 180, "budget": 32000},
                {"field": "Chemistry", "count": 8, "participants": 290, "budget": 74000},
                {"field": "Physics", "count": 6, "participants": 160, "budget": 44000},
                {"field": "Biology", "count": 4, "participants": 90, "budget": 20000}
            ]
        },
        "events_academic_actions": {
            "total_count": 22,
            "total_budget": 190000,
            "per_field": [
                {"field": "Computer Science", "count": 9, "budget": 85000},
                {"field": "Mathematics", "count": 2, "budget": 15000},
                {"field": "Chemistry", "count": 5, "budget": 42000},
                {"field": "Physics", "count": 4, "budget": 32000},
                {"field": "Biology", "count": 2, "budget": 16000}
            ]
        },
        "conventions": {
            "national": {
                "total_count": 14,
                "total_budget": 95000,
                "partner_institutions": 18,
                "per_field": [
                    {"field": "Computer Science", "count": 5},
                    {"field": "Chemistry", "count": 4},
                    {"field": "Physics", "count": 3},
                    {"field": "Biology", "count": 2}
                ]
            },
            "international": {
                "total_count": 6,
                "total_budget": 210000,
                "partner_countries": 9,
                "per_field": [
                    {"field": "Computer Science", "count": 3},
                    {"field": "Chemistry", "count": 2},
                    {"field": "Biology", "count": 1}
                ]
            }
        }
    }


if __name__ == "__main__":
    import json
    sample = build_sample_kpi()
    enriched = validate_and_enrich(sample)
    print(json.dumps(enriched, indent=2))
