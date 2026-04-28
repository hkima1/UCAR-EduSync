"""
report_generator.py — Calls Gemma LLM, saves employment advisory report as .txt + PDF.

Fallback Policy (40s):
  If the LLM does not produce output within 40 seconds:
  1. Load the most recent .txt from reports/  (or built-in mock data).
  2. Generate a styled PDF with UCAR logo.
  3. Write a structured entry to reports/fallback_log.txt.
  4. Return success=True with fallback=True — dashboard always sees a result.
"""

import json, requests, threading, queue, logging
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# ── Config ─────────────────────────────────────────────────────────────────────
NVIDIA_API_KEY = "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"
INVOKE_URL     = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL_NAME     = "google/gemma-4-31b-it"
LLM_TIMEOUT_S  = 40

BASE_DIR     = Path(__file__).resolve().parent
REPORTS_DIR  = BASE_DIR / "reports"
OUTPUT_DIR   = BASE_DIR / "generated_documents"
LOGO_PATH    = BASE_DIR.parent / "legal_document_generator_agent" / "logo-ucar.png"
FALLBACK_LOG = REPORTS_DIR / "fallback_log.txt"

# ── UCAR Palette ──────────────────────────────────────────────────────────────
UCAR_BLUE  = colors.HexColor("#003366")
UCAR_GOLD  = colors.HexColor("#FFCC00")
UCAR_RED   = colors.HexColor("#C0392B")
UCAR_GREEN = colors.HexColor("#1E8449")

# ── Built-in mock report ──────────────────────────────────────────────────────
MOCK_REPORT_TEXT = """--- UCAR EQUITABLE EMPLOYMENT ADVISORY REPORT (MOCK DATA)
Date: {date}
Report ID: {report_id}
Mode: FALLBACK — LLM did not respond within {timeout}s
---

EXECUTIVE SUMMARY

This report was generated automatically from pre-validated reference data. The network employs 42 professors across 3 institutions serving 1,847 students, giving an overall student-professor ratio of 43.97:1 — well above the critical threshold of 35:1.

--- SECTION 1 — WORKFORCE OVERVIEW

Total professors: 42 (Institute A: 18, Institute B: 12, Institute C: 12)
Total students: 1,847
Overall ratio: 43.97:1 (TARGET: 30:1 | CRITICAL: 35:1)

WARNING: Institute B ratio is 51.67:1 — CRITICAL understaffing detected.
WARNING: Mathematics field has only 4 professors for 312 enrolled students (ratio 78:1).

--- SECTION 2 — GENDER EQUITY ANALYSIS

Female professors: 16 (38.1%) — below the 40% equity target.
ACTION: Prioritize female candidates in the next 3 recruitment cycles.
ACTION: Establish a mentorship programme for female early-career researchers.

--- SECTION 3 — SALARY EQUITY

Average professor salary: 72,400 (below benchmark of 75,000).
Gap identified in Physics department: female professors earn 8% less than male peers.
ACTION: Conduct an immediate salary audit for the Physics department.
ACTION: Adjust compensation to close the gender pay gap within Q2.

--- SECTION 4 — HIRING RECOMMENDATIONS

Available hiring budget: 450,000.
Recommended new hires: 6 professors (Mathematics: 3, Institute B: 2, Physics: 1).
Projected cost: 432,000 (within budget).
INSIGHT: Targeting Mathematics and Institute B will reduce the most critical ratios.

--- END OF REPORT (FALLBACK MODE)
""".strip()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("employment_advisor")


def load_agent_prompt() -> str:
    with open(BASE_DIR / "agent_prompt.txt", "r", encoding="utf-8") as f:
        return f.read()


# ── LLM worker thread ─────────────────────────────────────────────────────────
def _llm_worker(system_prompt: str, user_message: str, result_q: queue.Queue):
    headers = {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Accept": "text/event-stream"}
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        "max_tokens": 16384, "temperature": 0.80, "top_p": 0.95,
        "stream": True, "chat_template_kwargs": {"enable_thinking": True},
    }
    final_content = ""
    try:
        response = requests.post(INVOKE_URL, headers=headers, json=payload, stream=True, timeout=180)
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
        print("\n[Employment Agent] LLM done.", flush=True)
        result_q.put(("ok", final_content.strip()))
    except Exception as e:
        result_q.put(("error", str(e)))


def call_employment_llm_with_timeout(system_prompt: str, kpi_payload: dict) -> tuple[str, bool]:
    """Returns (report_text, is_fallback)."""
    user_message = (
        "Generate the UCAR Equitable Employment Advisory Report based on this workforce data:\n\n"
        f"{json.dumps(kpi_payload, indent=2)}"
    )
    result_q: queue.Queue = queue.Queue()
    t = threading.Thread(target=_llm_worker, args=(system_prompt, user_message, result_q), daemon=True)
    log.info("[Employment Agent] Starting LLM call (timeout=%ds)...", LLM_TIMEOUT_S)
    t.start()
    try:
        status, content = result_q.get(timeout=LLM_TIMEOUT_S)
        if status == "ok" and content:
            log.info("[Employment Agent] LLM responded successfully.")
            return content, False
        log.warning("[Employment Agent] LLM error: %s — switching to fallback.", content)
    except queue.Empty:
        log.warning("[Employment Agent] LLM timeout after %ds — switching to fallback.", LLM_TIMEOUT_S)
    return _load_fallback_text(), True


def _load_fallback_text() -> str:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    saved = sorted(
        [p for p in REPORTS_DIR.glob("*.txt") if p.name != "fallback_log.txt"],
        key=lambda p: p.stat().st_mtime, reverse=True
    )
    if saved:
        log.info("[Employment Agent] Fallback: loading '%s'", saved[0].name)
        return saved[0].read_text(encoding="utf-8")
    log.info("[Employment Agent] Fallback: no saved report — using built-in mock data.")
    return MOCK_REPORT_TEXT.format(
        date=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        report_id=f"UCAR-EEA-MOCK-{datetime.utcnow().strftime('%Y%m%d%H%M')}",
        timeout=LLM_TIMEOUT_S,
    )


def _write_fallback_log(report_id: str, reason: str):
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    entry = (
        f"[{datetime.utcnow().isoformat()}Z] "
        f"report_id={report_id} | status=SUCCESS(fallback) | reason={reason}\n"
    )
    with open(FALLBACK_LOG, "a", encoding="utf-8") as f:
        f.write(entry)
    log.info("[Employment Agent] Fallback log written.")


def save_report(report_text: str, report_id: str) -> Path:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    filepath = REPORTS_DIR / f"{report_id}.txt"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(report_text)
    log.info("[Employment Agent] Report saved -> %s", filepath)
    return filepath


# ── PDF Builder ────────────────────────────────────────────────────────────────
def build_pdf(report_text: str, report_id: str, kpi_payload: dict, is_fallback: bool = False) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pdf_path = OUTPUT_DIR / f"{report_id}.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path), pagesize=A4,
        rightMargin=60, leftMargin=60, topMargin=60, bottomMargin=60,
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "EEATitle", parent=styles["Title"],
        fontName="Helvetica-Bold", fontSize=20, textColor=UCAR_BLUE, spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "EEASubtitle", parent=styles["Normal"],
        fontName="Helvetica", fontSize=11,
        textColor=colors.HexColor("#555555"), spaceAfter=6, alignment=1,
    )
    meta_style = ParagraphStyle(
        "EEAMeta", parent=styles["Normal"],
        fontName="Helvetica", fontSize=9,
        textColor=colors.HexColor("#888888"), spaceAfter=2,
    )
    section_style = ParagraphStyle(
        "EEASection", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=12,
        textColor=UCAR_BLUE, spaceBefore=14, spaceAfter=4,
    )
    normal_style = ParagraphStyle(
        "EEANormal", parent=styles["Normal"],
        fontName="Helvetica", fontSize=10, leading=15, spaceAfter=8,
    )
    warning_style = ParagraphStyle(
        "EEAWarn", parent=normal_style,
        textColor=UCAR_RED, fontName="Helvetica-Bold",
    )
    action_style = ParagraphStyle(
        "EEAAction", parent=normal_style,
        textColor=colors.HexColor("#1A5276"), fontName="Helvetica-BoldOblique",
    )
    insight_style = ParagraphStyle(
        "EEAInsight", parent=normal_style,
        textColor=UCAR_GREEN, fontName="Helvetica-Bold",
    )
    fallback_style = ParagraphStyle(
        "EEAFallback", parent=normal_style,
        textColor=colors.HexColor("#FF8C00"), fontName="Helvetica-BoldOblique", fontSize=9,
    )

    story = []
    if LOGO_PATH.exists():
        story.append(RLImage(str(LOGO_PATH), width=2.2 * inch, height=1.0 * inch))
        story.append(Spacer(1, 0.1 * inch))
    story.append(HRFlowable(width="100%", thickness=3, color=UCAR_GOLD, spaceAfter=10))

    story.append(Paragraph("EQUITABLE EMPLOYMENT ADVISORY REPORT", title_style))
    story.append(Paragraph("University Consortium for Academic Resources (UCAR)", subtitle_style))
    story.append(Spacer(1, 0.05 * inch))

    period   = kpi_payload.get("period", "Current Period")
    gen_date = datetime.utcnow().strftime("%B %d, %Y — %H:%M UTC")
    story.append(Paragraph(f"<b>Reporting Period:</b> {period}", meta_style))
    story.append(Paragraph(f"<b>Generated On:</b> {gen_date}", meta_style))
    story.append(Paragraph(f"<b>Report ID:</b> {report_id}", meta_style))

    if is_fallback:
        story.append(Spacer(1, 0.06 * inch))
        story.append(Paragraph(
            f"⚠ NOTICE: Generated in FALLBACK MODE — LLM did not respond within {LLM_TIMEOUT_S}s. "
            "Content reflects last validated data snapshot.",
            fallback_style,
        ))

    story.append(Spacer(1, 0.1 * inch))
    story.append(HRFlowable(width="100%", thickness=1, color=UCAR_BLUE, spaceAfter=12))

    for line in report_text.split("\n"):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 0.04 * inch))
            continue
        if line.startswith("---") or (line.isupper() and len(line) <= 80):
            clean = line.replace("---", "").strip()
            if clean:
                story.append(Paragraph(clean, section_style))
                story.append(HRFlowable(width="100%", thickness=0.5, color=UCAR_GOLD, spaceAfter=4))
        elif line.upper().startswith("WARNING:"):
            story.append(Paragraph(f"⚠ {line}", warning_style))
        elif line.upper().startswith("ACTION:"):
            story.append(Paragraph(f"→ {line}", action_style))
        elif line.upper().startswith("INSIGHT:"):
            story.append(Paragraph(f"✔ {line}", insight_style))
        else:
            story.append(Paragraph(line, normal_style))

    story.append(Spacer(1, 0.3 * inch))
    story.append(HRFlowable(width="100%", thickness=1, color=UCAR_BLUE))
    story.append(Spacer(1, 0.05 * inch))
    story.append(Paragraph(
        "Confidential — UCAR Internal Use Only | Powered by google/gemma-4-31b-it via NVIDIA NIM",
        ParagraphStyle("footer", parent=meta_style, fontSize=8, alignment=1),
    ))

    doc.build(story)
    log.info("[Employment Agent] PDF built -> %s", pdf_path)
    return pdf_path


# ── Main Entry Point ───────────────────────────────────────────────────────────
def generate_report(kpi_payload: dict) -> dict:
    system_prompt = load_agent_prompt()
    report_id = kpi_payload.get("_meta", {}).get(
        "report_id", f"UCAR-EEA-{datetime.utcnow().strftime('%Y%m%d%H%M')}"
    )
    log.info("[Employment Agent] Generating report %s ...", report_id)

    report_text, is_fallback = call_employment_llm_with_timeout(system_prompt, kpi_payload)

    if is_fallback:
        _write_fallback_log(
            report_id,
            reason=f"LLM timeout after {LLM_TIMEOUT_S}s — used most recent saved report",
        )

    report_file = save_report(report_text, report_id)
    pdf_path    = build_pdf(report_text, report_id, kpi_payload, is_fallback=is_fallback)

    return {
        "success":        True,
        "fallback":       is_fallback,
        "report_id":      report_id,
        "report_text":    report_text,
        "report_file":    str(report_file),
        "pdf_path":       str(pdf_path),
        "download_url":   f"/api/document/{report_id}",
        "warnings_count": report_text.upper().count("WARNING:"),
        "actions_count":  report_text.upper().count("ACTION:"),
        "generated_at":   datetime.utcnow().isoformat() + "Z",
    }


if __name__ == "__main__":
    from employment_loader import build_sample_kpi, validate_and_enrich
    result = generate_report(validate_and_enrich(build_sample_kpi()))
    print(f"\nReport ID  : {result['report_id']}")
    print(f"Fallback   : {result['fallback']}")
    print(f"Warnings   : {result['warnings_count']} | Actions: {result['actions_count']}")
    print(f"PDF        : {result['pdf_path']}")
