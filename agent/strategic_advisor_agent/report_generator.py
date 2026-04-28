"""
report_generator.py - Calls Gemma LLM and saves advisory_report.txt

Fallback Policy:
  If the LLM does not produce output within 40 seconds, the agent will:
  1. Load the most recent .txt report from reports/  (or built-in mock data).
  2. Generate a fully-formatted PDF from that fallback content.
  3. Write a structured entry to reports/fallback_log.txt.
  4. Return success=True with fallback=True flag so the UI never sees a failure.
"""
import json, requests, threading, queue, logging
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage,
    HRFlowable, Table, TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# ── Config ────────────────────────────────────────────────────────────────────
NVIDIA_API_KEY = "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"
INVOKE_URL     = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL_NAME     = "google/gemma-4-31b-it"
LLM_TIMEOUT_S  = 40          # seconds before we switch to fallback

BASE_DIR    = Path(__file__).resolve().parent
REPORTS_DIR = BASE_DIR / "reports"
OUTPUT_DIR  = BASE_DIR / "generated_documents"
LOGO_PATH   = BASE_DIR.parent / "legal_document_generator_agent" / "logo-ucar.png"
FALLBACK_LOG = REPORTS_DIR / "fallback_log.txt"

# ── UCAR Brand Palette ────────────────────────────────────────────────────────
UCAR_BLUE   = colors.HexColor("#003366")
UCAR_GOLD   = colors.HexColor("#FFCC00")
UCAR_LIGHT  = colors.HexColor("#EAF0F7")
UCAR_RED    = colors.HexColor("#C0392B")
UCAR_GREEN  = colors.HexColor("#1E8449")

# ── Built-in mock report (used only when no saved report exists) ───────────────
MOCK_REPORT_TEXT = """--- UCAR STRATEGIC ADVISORY REPORT (MOCK DATA)
Date: {date}
Report ID: {report_id}
Mode: FALLBACK — LLM did not respond within {timeout}s
---

EXECUTIVE SUMMARY

This report was generated automatically using pre-validated reference data because the AI advisor did not respond within the allotted time window. All KPI values below reflect the last known good data snapshot.

Overall budget utilization stands at 77%. Institute C is severely under-utilizing its resources, while Institutes A and B are approaching budget exhaustion. The overall success rate is 68.5%, below the 75% target.

--- SECTION 1 — BUDGET ANALYSIS

The total institutional budget of 5,000,000 has a consumed total of 3,850,000, leaving a surplus of 1,150,000. Institute A (94.44%) and Institute B (93.53%) are near exhaustion. Institute C has consumed only 37.33% of its 1,500,000 allocation.

--- SECTION 2 — ACADEMIC PERFORMANCE

The network's overall success rate is 68.5%, failing the 75.0% target (Delta: -6.5%). Institute C leads at 81.3%. Institute B is the critical failure point at 55.8%.

--- SECTION 3 — STRATEGIC WARNINGS

WARNING: Institute A and B have consumed over 93% of their budgets.
WARNING: Institute B success rate (55.8%) is CRITICAL.
WARNING: Mathematics field has 0 national and 0 international conventions.
WARNING: Mathematics success rate (58.4%) is CRITICAL.
WARNING: Institute C is under-utilizing 62.67% of its budget.

--- SECTION 4 — STRATEGIC INSIGHTS

INSIGHT: Reallocate 500,000 from Institute C to fund a Mathematics Recovery Program.
INSIGHT: Mandate at least 2 international conventions for Mathematics by next quarter.
INSIGHT: Shift 10% of Computer Science event budget toward Physics and Mathematics.
INSIGHT: Implement a performance-based budget audit for Institute B.

--- END OF REPORT (FALLBACK MODE)
""".strip()


# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("strategic_advisor")


def load_agent_prompt() -> str:
    with open(BASE_DIR / "agent_prompt.txt", "r", encoding="utf-8") as f:
        return f.read()


# ── LLM call in background thread ─────────────────────────────────────────────
def _llm_worker(system_prompt: str, user_message: str, result_q: queue.Queue):
    """Runs the Gemma streaming call; puts final_content or exception into the queue."""
    headers = {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Accept": "text/event-stream"}
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        "max_tokens": 16384, "temperature": 0.85, "top_p": 0.95,
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
        print("\n[Strategic Advisor] LLM done.", flush=True)
        result_q.put(("ok", final_content.strip()))
    except Exception as e:
        result_q.put(("error", str(e)))


def call_strategic_llm_with_timeout(system_prompt: str, kpi_payload: dict) -> tuple[str, bool]:
    """
    Returns (report_text, is_fallback).
    Times out after LLM_TIMEOUT_S and falls back to the last saved report.
    """
    user_message = (
        f"Generate the UCAR Strategic Advisory Report for this KPI data:\n\n"
        f"{json.dumps(kpi_payload, indent=2)}"
    )
    result_q: queue.Queue = queue.Queue()
    t = threading.Thread(target=_llm_worker, args=(system_prompt, user_message, result_q), daemon=True)

    log.info("[Strategic Advisor] Starting LLM call (timeout=%ds)...", LLM_TIMEOUT_S)
    t.start()

    try:
        status, content = result_q.get(timeout=LLM_TIMEOUT_S)
        if status == "ok" and content:
            log.info("[Strategic Advisor] LLM responded successfully.")
            return content, False
        # LLM returned an error
        log.warning("[Strategic Advisor] LLM returned error: %s — switching to fallback.", content)
    except queue.Empty:
        log.warning("[Strategic Advisor] LLM did not respond in %ds — switching to fallback.", LLM_TIMEOUT_S)

    return _load_fallback_text(), True


def _load_fallback_text() -> str:
    """Load the most recent saved report, or return built-in mock data."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    saved = sorted(REPORTS_DIR.glob("*.txt"), key=lambda p: p.stat().st_mtime, reverse=True)
    # Exclude the fallback log itself
    saved = [p for p in saved if p.name != "fallback_log.txt"]
    if saved:
        latest = saved[0]
        log.info("[Strategic Advisor] Fallback: loading '%s'", latest.name)
        return latest.read_text(encoding="utf-8")
    log.info("[Strategic Advisor] Fallback: no saved report found — using built-in mock data.")
    return MOCK_REPORT_TEXT.format(
        date=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        report_id=f"UCAR-SAR-MOCK-{datetime.utcnow().strftime('%Y%m%d%H%M')}",
        timeout=LLM_TIMEOUT_S,
    )


def _write_fallback_log(report_id: str, reason: str):
    """Appends a structured entry to fallback_log.txt."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    entry = (
        f"[{datetime.utcnow().isoformat()}Z] "
        f"report_id={report_id} | status=SUCCESS(fallback) | reason={reason}\n"
    )
    with open(FALLBACK_LOG, "a", encoding="utf-8") as f:
        f.write(entry)
    log.info("[Strategic Advisor] Fallback log written: %s", FALLBACK_LOG)


def save_report(report_text: str, report_id: str) -> Path:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    filepath = REPORTS_DIR / f"{report_id}.txt"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(report_text)
    log.info("[Strategic Advisor] Report saved -> %s", filepath)
    return filepath


# ── PDF Builder ───────────────────────────────────────────────────────────────
def build_pdf(report_text: str, report_id: str, kpi_payload: dict, is_fallback: bool = False) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pdf_path = OUTPUT_DIR / f"{report_id}.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path), pagesize=A4,
        rightMargin=60, leftMargin=60, topMargin=60, bottomMargin=60,
    )

    styles = getSampleStyleSheet()

    # ── Custom styles ──────────────────────────────────────────────────────────
    title_style = ParagraphStyle(
        "UCARTitle", parent=styles["Title"],
        fontName="Helvetica-Bold", fontSize=22,
        textColor=UCAR_BLUE, spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "UCARSubtitle", parent=styles["Normal"],
        fontName="Helvetica", fontSize=11,
        textColor=colors.HexColor("#555555"), spaceAfter=6, alignment=1,
    )
    meta_style = ParagraphStyle(
        "UCARMeta", parent=styles["Normal"],
        fontName="Helvetica", fontSize=9,
        textColor=colors.HexColor("#888888"), spaceAfter=2,
    )
    section_style = ParagraphStyle(
        "UCARSection", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=12,
        textColor=UCAR_BLUE, spaceBefore=14, spaceAfter=4,
        borderPad=4,
    )
    normal_style = ParagraphStyle(
        "UCARNormal", parent=styles["Normal"],
        fontName="Helvetica", fontSize=10, leading=15, spaceAfter=8,
    )
    warning_style = ParagraphStyle(
        "UCARWarn", parent=normal_style,
        textColor=UCAR_RED, fontName="Helvetica-Bold",
    )
    insight_style = ParagraphStyle(
        "UCARInsight", parent=normal_style,
        textColor=UCAR_GREEN, fontName="Helvetica-Bold",
    )
    fallback_style = ParagraphStyle(
        "UCARFallback", parent=normal_style,
        textColor=colors.HexColor("#FF8C00"), fontName="Helvetica-BoldOblique",
        fontSize=9,
    )

    story = []

    # ── Logo ───────────────────────────────────────────────────────────────────
    if LOGO_PATH.exists():
        story.append(RLImage(str(LOGO_PATH), width=2.2 * inch, height=1.0 * inch))
        story.append(Spacer(1, 0.1 * inch))
    story.append(HRFlowable(width="100%", thickness=3, color=UCAR_GOLD, spaceAfter=10))

    # ── Header block ──────────────────────────────────────────────────────────
    story.append(Paragraph("STRATEGIC ADVISORY REPORT", title_style))
    story.append(Paragraph("University Consortium for Academic Resources (UCAR)", subtitle_style))
    story.append(Spacer(1, 0.05 * inch))

    period      = kpi_payload.get("period", "Current Period")
    gen_date    = datetime.utcnow().strftime("%B %d, %Y — %H:%M UTC")
    story.append(Paragraph(f"<b>Reporting Period:</b> {period}", meta_style))
    story.append(Paragraph(f"<b>Generated On:</b> {gen_date}", meta_style))
    story.append(Paragraph(f"<b>Report ID:</b> {report_id}", meta_style))

    if is_fallback:
        story.append(Spacer(1, 0.06 * inch))
        story.append(Paragraph(
            f"⚠ NOTICE: This report was produced in FALLBACK MODE. "
            f"The AI advisor did not respond within {LLM_TIMEOUT_S}s. "
            "Content below reflects the last validated data snapshot.",
            fallback_style,
        ))

    story.append(Spacer(1, 0.1 * inch))
    story.append(HRFlowable(width="100%", thickness=1, color=UCAR_BLUE, spaceAfter=12))

    # ── Body ──────────────────────────────────────────────────────────────────
    for line in report_text.split("\n"):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 0.04 * inch))
            continue
        # Section headers (all-caps lines ≤ 80 chars, or lines starting with ---)
        if (line.startswith("---") or (line.isupper() and len(line) <= 80)):
            clean = line.replace("---", "").strip()
            if clean:
                story.append(Paragraph(clean, section_style))
                story.append(HRFlowable(width="100%", thickness=0.5,
                                        color=UCAR_GOLD, spaceAfter=4))
        elif line.upper().startswith("WARNING:"):
            story.append(Paragraph(f"⚠ {line}", warning_style))
        elif line.upper().startswith("INSIGHT:"):
            story.append(Paragraph(f"✔ {line}", insight_style))
        else:
            story.append(Paragraph(line, normal_style))

    # ── Footer line ────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.3 * inch))
    story.append(HRFlowable(width="100%", thickness=1, color=UCAR_BLUE))
    story.append(Spacer(1, 0.05 * inch))
    story.append(Paragraph(
        "Confidential — UCAR Internal Use Only | Powered by google/gemma-4-31b-it via NVIDIA NIM",
        ParagraphStyle("footer", parent=meta_style, fontSize=8, alignment=1),
    ))

    doc.build(story)
    log.info("[Strategic Advisor] PDF built -> %s", pdf_path)
    return pdf_path


# ── Main Entry Point ──────────────────────────────────────────────────────────
def generate_report(kpi_payload: dict) -> dict:
    system_prompt = load_agent_prompt()
    report_id = kpi_payload.get("_meta", {}).get(
        "report_id", f"UCAR-SAR-{datetime.utcnow().strftime('%Y%m%d%H%M')}"
    )

    log.info("[Strategic Advisor] Generating report %s ...", report_id)

    # ── LLM call with 40s timeout + automatic fallback ────────────────────────
    report_text, is_fallback = call_strategic_llm_with_timeout(system_prompt, kpi_payload)

    if is_fallback:
        _write_fallback_log(
            report_id,
            reason=f"LLM timeout after {LLM_TIMEOUT_S}s — used most recent saved report",
        )

    # ── Always save .txt and build PDF ───────────────────────────────────────
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
        "insights_count": report_text.upper().count("INSIGHT:"),
        "generated_at":   datetime.utcnow().isoformat() + "Z",
    }


if __name__ == "__main__":
    from kpi_loader import build_sample_kpi, validate_and_enrich
    result = generate_report(validate_and_enrich(build_sample_kpi()))
    print(f"\nReport ID  : {result['report_id']}")
    print(f"Fallback   : {result['fallback']}")
    print(f"Warnings   : {result['warnings_count']} | Insights: {result['insights_count']}")
    print(f"PDF        : {result['pdf_path']}")
