"""
employment_loader.py
---------------------
Validates, normalizes and enriches raw workforce/employment KPI data
for the UCAR Equitable Employment Agent.

Computed enrichments:
- Student-to-professor ratio per institution and per field
- Ratio status: OPTIMAL | AT-RISK | CRITICAL
- Budget hiring capacity (professors and post-docs)
- Gini coefficient for professor distribution equity
- Gap counts (how many professors needed to reach target ratio)
"""

from datetime import datetime

# ─────────────────────────────────────────────
# Thresholds
# ─────────────────────────────────────────────
TARGET_RATIO = 15       # Target student-to-professor ratio
AT_RISK_RATIO = 20      # Above this: AT-RISK
CRITICAL_RATIO = 25     # Above this: CRITICAL
GINI_AT_RISK = 0.25     # Gini above this = unequal distribution

# Salary benchmarks (annual, in same currency as budget)
PROFESSOR_SALARY = 85000
POSTDOC_SALARY = 45000


def _ratio_status(ratio: float) -> str:
    if ratio <= TARGET_RATIO:
        return "OPTIMAL"
    elif ratio <= AT_RISK_RATIO:
        return "AT-RISK"
    return "CRITICAL"


def _gini(values: list) -> float:
    """Compute Gini coefficient for a list of values (0=perfect equality)."""
    if not values or sum(values) == 0:
        return 0.0
    n = len(values)
    values = sorted(values)
    cumulative = sum((i + 1) * v for i, v in enumerate(values))
    total = sum(values)
    return round((2 * cumulative) / (n * total) - (n + 1) / n, 4)


def validate_and_enrich(raw: dict) -> dict:
    kpi = {}

    # ── Budget ───────────────────────────────
    budget = raw.get("budget", {})
    total_budget = budget.get("total_budget", 0)
    hiring_budget = budget.get("hiring_budget_available", 0)

    prof_capacity = int(hiring_budget // PROFESSOR_SALARY)
    postdoc_capacity = int(hiring_budget // POSTDOC_SALARY)

    per_inst_budget = []
    for inst in budget.get("per_institution", []):
        h_budget = inst.get("hiring_budget", 0)
        per_inst_budget.append({
            **inst,
            "professor_capacity": int(h_budget // PROFESSOR_SALARY),
            "postdoc_capacity": int(h_budget // POSTDOC_SALARY)
        })

    kpi["budget"] = {
        "total_budget": total_budget,
        "hiring_budget_available": hiring_budget,
        "professor_salary_benchmark": PROFESSOR_SALARY,
        "postdoc_salary_benchmark": POSTDOC_SALARY,
        "max_professors_hireable": prof_capacity,
        "max_postdocs_hireable": postdoc_capacity,
        "per_institution": per_inst_budget
    }

    # ── Teaching Staff ────────────────────────
    staff = raw.get("teaching_staff", {})
    total_professors = staff.get("total_professors", 0)

    per_inst_staff = []
    for inst in staff.get("per_institution", []):
        per_inst_staff.append({**inst})

    per_field_staff = []
    for field in staff.get("per_field", []):
        per_field_staff.append({**field})

    kpi["teaching_staff"] = {
        "total_professors": total_professors,
        "per_institution": per_inst_staff,
        "per_field": per_field_staff
    }

    # ── Students ─────────────────────────────
    students = raw.get("students", {})
    total_students = students.get("total_students", 0)

    per_inst_students = []
    for inst in students.get("per_institution", []):
        per_inst_students.append({**inst})

    per_field_students = []
    for field in students.get("per_field", []):
        per_field_students.append({**field})

    kpi["students"] = {
        "total_students": total_students,
        "per_institution": per_inst_students,
        "per_field": per_field_students
    }

    # ── Distribution KPIs ─────────────────────
    # Compute ratios per institution
    inst_ratio_map = {s["institution"]: s["student_count"]
                      for s in per_inst_students}
    inst_prof_map = {p["institution"]: p["professor_count"]
                     for p in per_inst_staff}

    inst_ratios = []
    for inst, students_count in inst_ratio_map.items():
        profs = inst_prof_map.get(inst, 0)
        ratio = round(students_count / profs, 1) if profs > 0 else 999.0
        gap = max(0, int((students_count / TARGET_RATIO) - profs))
        inst_ratios.append({
            "institution": inst,
            "student_count": students_count,
            "professor_count": profs,
            "ratio": ratio,
            "status": _ratio_status(ratio),
            "professors_needed_for_target": gap
        })

    # Compute ratios per field
    field_ratio_map = {s["field"]: s["student_count"]
                       for s in per_field_students}
    field_prof_map = {p["field"]: p["professor_count"]
                      for p in per_field_staff}

    field_ratios = []
    all_fields = set(list(field_ratio_map.keys()) + list(field_prof_map.keys()))
    for field in all_fields:
        s_count = field_ratio_map.get(field, 0)
        p_count = field_prof_map.get(field, 0)
        ratio = round(s_count / p_count, 1) if p_count > 0 else 999.0
        gap = max(0, int((s_count / TARGET_RATIO) - p_count))
        field_ratios.append({
            "field": field,
            "student_count": s_count,
            "professor_count": p_count,
            "ratio": ratio,
            "status": _ratio_status(ratio),
            "professors_needed_for_target": gap
        })

    # Overall ratio
    overall_ratio = round(total_students / total_professors, 1) if total_professors > 0 else 0
    gini = _gini([r["professor_count"] for r in inst_ratios])

    kpi["distribution_kpis"] = {
        "overall_ratio": overall_ratio,
        "overall_status": _ratio_status(overall_ratio),
        "gini_coefficient": gini,
        "equity_status": "UNEQUAL" if gini > GINI_AT_RISK else "EQUITABLE",
        "target_ratio": TARGET_RATIO,
        "critical_threshold": CRITICAL_RATIO,
        "per_institution": inst_ratios,
        "per_field": sorted(field_ratios, key=lambda x: x["ratio"], reverse=True),
        "total_professors_needed": sum(r["professors_needed_for_target"] for r in inst_ratios)
    }

    # ── Metadata ─────────────────────────────
    kpi["_meta"] = {
        "report_date": datetime.now().strftime("%Y-%m-%d %H:%M UTC"),
        "report_id": f"UCAR-EEA-{datetime.now().strftime('%Y%m%d%H%M')}",
        "period": raw.get("period", "Not specified"),
        "generated_by": "UCAR Equitable Employment Agent v1.0"
    }

    return kpi


def build_sample_kpi() -> dict:
    """Returns a realistic sample employment KPI payload for testing."""
    return {
        "period": "Academic Year 2025-2026",
        "budget": {
            "total_budget": 5000000,
            "hiring_budget_available": 380000,
            "per_institution": [
                {"institution": "Institute A", "hiring_budget": 120000},
                {"institution": "Institute B", "hiring_budget": 180000},
                {"institution": "Institute C", "hiring_budget": 80000}
            ]
        },
        "teaching_staff": {
            "total_professors": 58,
            "per_institution": [
                {"institution": "Institute A", "professor_count": 24},
                {"institution": "Institute B", "professor_count": 18},
                {"institution": "Institute C", "professor_count": 16}
            ],
            "per_field": [
                {"field": "Computer Science", "professor_count": 20},
                {"field": "Mathematics", "professor_count": 8},
                {"field": "Chemistry", "professor_count": 14},
                {"field": "Physics", "professor_count": 10},
                {"field": "Biology", "professor_count": 6}
            ]
        },
        "students": {
            "total_students": 1090,
            "per_institution": [
                {"institution": "Institute A", "student_count": 420},
                {"institution": "Institute B", "student_count": 380},
                {"institution": "Institute C", "student_count": 290}
            ],
            "per_field": [
                {"field": "Computer Science", "student_count": 380},
                {"field": "Mathematics", "student_count": 240},
                {"field": "Chemistry", "student_count": 210},
                {"field": "Physics", "student_count": 160},
                {"field": "Biology", "student_count": 100}
            ]
        }
    }


if __name__ == "__main__":
    import json
    enriched = validate_and_enrich(build_sample_kpi())
    print(json.dumps(enriched, indent=2))
