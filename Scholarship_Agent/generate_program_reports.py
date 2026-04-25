"""Generate program-based student PDF reports from unification_json_db.

Creates one PDF per program with:
  - Summary (counts, institutions, enrollment years)
  - A simple table of students

Default programs:
  - Civil Engineering
  - Physics

Usage:
  py -3 generate_program_reports.py
  py -3 generate_program_reports.py --program "Civil Engineering" --program Physics

Output:
  Scholarship_Agent/rapport/Program_Report_<program>.pdf

Dependencies:
  pip install reportlab
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable


def _require_reportlab():
    try:
        from reportlab.lib.pagesizes import A4  # noqa: F401
        from reportlab.pdfgen import canvas  # noqa: F401
    except Exception as exc:  # pragma: no cover
        raise SystemExit(
            "Missing dependency: reportlab. Install it with: pip install reportlab"
        ) from exc


def _safe_filename(name: str) -> str:
    name = name.strip().replace("/", "-").replace("\\", "-")
    name = re.sub(r"\s+", "_", name)
    name = re.sub(r"[^A-Za-z0-9_\-]+", "", name)
    return name or "report"


def _wrap_text(text: str, max_chars: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        paragraph = paragraph.rstrip()
        if not paragraph:
            lines.append("")
            continue

        words = paragraph.split()
        current: list[str] = []
        current_len = 0
        for w in words:
            add_len = len(w) if not current else len(w) + 1
            if current_len + add_len <= max_chars:
                current.append(w)
                current_len += add_len
            else:
                lines.append(" ".join(current))
                current = [w]
                current_len = len(w)
        if current:
            lines.append(" ".join(current))
    return lines


def _read_json(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _iter_students(db_dir: Path) -> Iterable[dict[str, Any]]:
    for p in sorted(db_dir.glob("*.json")):
        obj = _read_json(p)
        if isinstance(obj, dict) and obj.get("student_id"):
            yield obj


def _draw_program_report(
    out_path: Path,
    *,
    program: str,
    students: list[dict[str, Any]],
    generated_from: Path,
):
    _require_reportlab()
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    out_path.parent.mkdir(parents=True, exist_ok=True)

    c = canvas.Canvas(str(out_path), pagesize=A4)
    width, height = A4

    left = 50
    right = width - 50
    top = height - 55
    bottom = 55

    def header(page_num: int):
        c.setFont("Helvetica-Bold", 16)
        c.drawString(left, top, f"Program Report — {program}")
        c.setFont("Helvetica", 10)
        c.drawString(left, top - 18, f"Source: {generated_from}")
        c.setFont("Helvetica", 9)
        c.drawRightString(right, top, f"Page {page_num}")
        c.line(left, top - 26, right, top - 26)

    def footer():
        c.setFont("Helvetica", 8)
        c.line(left, bottom + 18, right, bottom + 18)
        ts = datetime.now().isoformat(timespec="seconds")
        c.drawString(left, bottom + 6, f"Generated {ts} • UCAR-EduSync")

    page_num = 1
    header(page_num)

    y = top - 46

    # Summary
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left, y, "Summary")
    y -= 18

    institutions = Counter((s.get("institution") or "Unknown") for s in students)
    years = Counter(int(s["enrollment_year"]) for s in students if isinstance(s.get("enrollment_year"), int))

    summary_lines = [
        f"Total students: {len(students)}",
        f"Institutions: {', '.join([f'{k} ({v})' for k, v in institutions.most_common(5)]) or 'N/A'}",
        f"Enrollment years: {', '.join([f'{k} ({v})' for k, v in sorted(years.items())]) or 'N/A'}",
    ]

    c.setFont("Helvetica", 10)
    for line in summary_lines:
        for l in _wrap_text(line, 100):
            c.drawString(left, y, l)
            y -= 13
    y -= 8

    # Table header
    c.setFont("Helvetica-Bold", 11)
    c.drawString(left, y, "Students")
    y -= 16

    columns = [
        ("ID", 70),
        ("Name", 170),
        ("Institution", 140),
        ("Year", 45),
        ("Email", 0),
    ]

    def draw_table_header(cur_y: float) -> float:
        c.setFont("Helvetica-Bold", 9)
        x = left
        for label, w in columns:
            c.drawString(x, cur_y, label)
            if w:
                x += w
            else:
                x = x + (right - x)
        c.setFont("Helvetica", 9)
        c.line(left, cur_y - 3, right, cur_y - 3)
        return cur_y - 14

    y = draw_table_header(y)

    def new_page():
        nonlocal page_num, y
        footer()
        c.showPage()
        page_num += 1
        header(page_num)
        y = top - 46
        c.setFont("Helvetica-Bold", 11)
        c.drawString(left, y, "Students (continued)")
        y -= 16
        y = draw_table_header(y)

    # Rows
    for s in sorted(
        students,
        key=lambda r: (str(r.get("institution") or ""), str(r.get("last_name") or ""), str(r.get("first_name") or "")),
    ):
        if y < bottom + 30:
            new_page()

        sid = str(s.get("student_id") or "")
        name = (f"{s.get('first_name') or ''} {s.get('last_name') or ''}").strip() or "Unknown"
        inst = str(s.get("institution") or "Unknown")
        year = s.get("enrollment_year")
        year_s = str(year) if year is not None else ""
        email = str(s.get("email") or "")

        # keep each row single-line, truncate if needed
        def trunc(val: str, max_len: int) -> str:
            return val if len(val) <= max_len else (val[: max_len - 1] + "…")

        x = left
        c.drawString(x, y, trunc(sid, 10))
        x += columns[0][1]
        c.drawString(x, y, trunc(name, 26))
        x += columns[1][1]
        c.drawString(x, y, trunc(inst, 20))
        x += columns[2][1]
        c.drawString(x, y, trunc(year_s, 6))
        x += columns[3][1]
        c.drawString(x, y, trunc(email, 38))

        y -= 12

    footer()
    c.save()


def main():
    parser = argparse.ArgumentParser(description="Generate program PDF reports")
    parser.add_argument(
        "--program",
        action="append",
        default=None,
        help="Program name to generate (repeatable). Defaults: Civil Engineering, Physics",
    )
    parser.add_argument(
        "--db-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "unification_json_db",
        help="Directory containing unified student JSON files",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "rapport",
        help="Output directory for generated PDFs (default: Scholarship_Agent/rapport)",
    )

    args = parser.parse_args()

    programs = args.program or ["Civil Engineering", "Physics"]
    db_dir: Path = args.db_dir
    out_dir: Path = args.out_dir

    if not db_dir.exists():
        raise SystemExit(f"DB dir not found: {db_dir}")

    all_students = list(_iter_students(db_dir))
    if not all_students:
        raise SystemExit(f"No student JSON records found in: {db_dir}")

    generated = 0
    for program in programs:
        program_norm = program.strip().lower()
        program_students = [
            s for s in all_students if str(s.get("program") or "").strip().lower() == program_norm
        ]

        out_name = f"Program_Report_{_safe_filename(program)}.pdf"
        out_path = out_dir / out_name
        _draw_program_report(
            out_path,
            program=program.strip(),
            students=program_students,
            generated_from=db_dir,
        )
        generated += 1

    print(f"Generated {generated} report(s) into: {out_dir}")


if __name__ == "__main__":
    main()
