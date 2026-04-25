"""Generate internship / research / PFE proposal PDFs into Scholarship_Agent/rapport.

Usage:
  python generate_reports.py

This script is intentionally dependency-light; it uses reportlab for PDF generation.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable, List, Tuple


def _require_reportlab():
    try:
        from reportlab.lib.pagesizes import A4  # noqa: F401
        from reportlab.pdfgen import canvas  # noqa: F401
    except Exception as exc:  # pragma: no cover
        raise SystemExit(
            "Missing dependency: reportlab. Install it with: pip install reportlab"
        ) from exc


def _wrap_text(text: str, max_chars: int) -> List[str]:
    """Very small word-wrapping helper (character-based)."""
    lines: List[str] = []
    for paragraph in text.split("\n"):
        paragraph = paragraph.rstrip()
        if not paragraph:
            lines.append("")
            continue

        words = paragraph.split()
        current: List[str] = []
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


def _draw_document(
    out_path: Path,
    *,
    title: str,
    subtitle: str,
    sections: List[Tuple[str, str]],
    pages_target: int | None = None,
    meta: dict | None = None,
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
        c.drawString(left, top, title)
        c.setFont("Helvetica", 11)
        c.drawString(left, top - 18, subtitle)

        c.setFont("Helvetica", 9)
        c.drawRightString(right, top, f"Page {page_num}")
        c.line(left, top - 26, right, top - 26)

    def footer():
        c.setFont("Helvetica", 8)
        c.line(left, bottom + 18, right, bottom + 18)
        c.drawString(left, bottom + 6, "UCAR-EduSync • Generated report")

    page_num = 1
    header(page_num)

    y = top - 46
    c.setFont("Helvetica", 10)

    if meta:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(left, y, "Quick Info")
        y -= 16
        c.setFont("Helvetica", 10)
        for k, v in meta.items():
            for line in _wrap_text(f"• {k}: {v}", 95):
                if y < bottom + 32:
                    footer()
                    c.showPage()
                    page_num += 1
                    header(page_num)
                    y = top - 46
                    c.setFont("Helvetica", 10)
                c.drawString(left, y, line)
                y -= 13
        y -= 8

    for sec_title, sec_body in sections:
        c.setFont("Helvetica-Bold", 11)
        for line in _wrap_text(sec_title, 90):
            if y < bottom + 32:
                footer()
                c.showPage()
                page_num += 1
                header(page_num)
                y = top - 46
            c.drawString(left, y, line)
            y -= 15

        c.setFont("Helvetica", 10)
        for line in _wrap_text(sec_body, 100):
            if y < bottom + 32:
                footer()
                c.showPage()
                page_num += 1
                header(page_num)
                y = top - 46
                c.setFont("Helvetica", 10)
            c.drawString(left, y, line)
            y -= 13

        y -= 10

    # Ensure minimum number of pages if requested (e.g., 3 pages).
    if pages_target is not None:
        while page_num < pages_target:
            footer()
            c.showPage()
            page_num += 1
            header(page_num)
            y = top - 46
            c.setFont("Helvetica", 10)
            filler = (
                "Notes / Appendix\n"
                "\n"
                "This page is reserved for references, diagrams, risk register updates, "
                "and supervisor feedback.\n"
            )
            for line in _wrap_text(filler, 100):
                if y < bottom + 32:
                    break
                c.drawString(left, y, line)
                y -= 13

    footer()
    c.save()


def main():
    base_dir = Path(__file__).resolve().parent
    out_dir = base_dir / "rapport"

    # 1) PFE book proposal (security) — force 3 pages
    _draw_document(
        out_dir / "PFE_Book_Proposal_Cybersecurity.pdf",
        title="PFE Book Proposal — Cybersecurity",
        subtitle="Security field • 3-page proposition",
        pages_target=3,
        meta={
            "Candidate": "[Your Name]",
            "Institution": "[Your University / School]",
            "Supervisor": "[Supervisor Name]",
            "Period": "[Start Date] → [End Date]",
            "Keywords": "Zero Trust, IAM, SIEM, Threat Modeling, Secure SDLC",
        },
        sections=[
            (
                "1. Context & Motivation",
                "Organizations increasingly rely on cloud services, APIs, and distributed "
                "workflows. This expands the attack surface and raises the need for "
                "consistent identity, access, and monitoring controls. The proposed PFE "
                "focuses on designing a practical security blueprint and a prototype "
                "implementation aligned with modern best practices.",
            ),
            (
                "2. Problem Statement",
                "How can we define and validate a security architecture for a small-to-medium "
                "information system that (a) limits lateral movement, (b) detects suspicious "
                "activity quickly, and (c) supports secure development and operational practices "
                "without excessive cost or complexity?",
            ),
            (
                "3. Objectives",
                "• Produce a security requirements baseline (assets, threats, compliance needs).\n"
                "• Define target architecture (network segmentation, identity, logging, backups).\n"
                "• Build a minimal prototype demonstrating core controls (e.g., IAM policies, audit logs).\n"
                "• Evaluate using clear metrics (MTTD/MTTR proxies, coverage of top threats, usability).",
            ),
            (
                "4. Scope",
                "In scope: threat modeling, security architecture, IAM, logging/SIEM concepts, secure CI/CD "
                "controls, basic incident response playbooks. Out of scope: full enterprise SOC operations, "
                "advanced malware analysis, and large-scale production deployment.",
            ),
            (
                "5. Methodology",
                "1) Asset inventory and data classification. 2) Threat modeling (STRIDE) and risk ranking. "
                "3) Architecture design (Zero Trust principles). 4) Prototype implementation. 5) Testing "
                "(misconfig scenarios, least-privilege checks). 6) Documentation and final defense.",
            ),
            (
                "6. Deliverables",
                "• PFE book (state of the art + design + implementation).\n"
                "• Architecture diagrams and security policies.\n"
                "• Prototype code/configuration.\n"
                "• Evaluation report and recommendations.",
            ),
            (
                "7. Timeline (Example)",
                "Weeks 1–2: requirements + threat model. Weeks 3–5: architecture + design validation. "
                "Weeks 6–8: prototype and security checks. Weeks 9–10: report writing + final review.",
            ),
        ],
    )

    # 2) Summer internship — AI
    _draw_document(
        out_dir / "Summer_Internship_AI_Proposal.pdf",
        title="Summer Internship Proposal — Artificial Intelligence",
        subtitle="AI internship (data + model + evaluation)",
        meta={
            "Candidate": "[Your Name]",
            "Host Organization": "[Company / Lab]",
            "Duration": "8–12 weeks",
            "Focus": "Applied ML / NLP / Computer Vision (choose one)",
        },
        sections=[
            (
                "1. Internship Goal",
                "Deliver an end-to-end AI proof of concept: dataset preparation, model training, evaluation, "
                "and a small demo showing the business/academic value.",
            ),
            (
                "2. Proposed Topic Options",
                "Option A (NLP): document classification + information extraction.\n"
                "Option B (CV): defect detection / object recognition with lightweight deployment.\n"
                "Option C (Tabular ML): prediction + explainability for decision support.",
            ),
            (
                "3. Technical Plan",
                "• Data ingestion and cleaning; define labels and leakage checks.\n"
                "• Baseline model (classical ML) then improved model (transformer/CNN/GBM).\n"
                "• Evaluation protocol: train/validation split, metrics, error analysis.\n"
                "• Packaging: notebook + simple API or demo UI.",
            ),
            (
                "4. Deliverables",
                "• Clean dataset pipeline + documentation.\n"
                "• Trained model(s) + reproducible training code.\n"
                "• Report: results, limitations, next steps.\n"
                "• Demo (script/API) showing inference on new samples.",
            ),
            (
                "5. Risks & Mitigation",
                "Risk: insufficient data quality/quantity. Mitigation: data augmentation, weak supervision, "
                "or simplifying the target. Risk: overfitting. Mitigation: cross-validation, regularization, "
                "and robust evaluation.",
            ),
        ],
    )

    # 3) Research internship — Mechanics (1)
    _draw_document(
        out_dir / "Research_Internship_Mechanics_1.pdf",
        title="Research Internship Proposal — Mechanics (1)",
        subtitle="Solid mechanics / materials — experimental + modeling",
        meta={
            "Candidate": "[Your Name]",
            "Lab": "[Research Lab]",
            "Duration": "3–6 months",
            "Theme": "Mechanical characterization of materials",
        },
        sections=[
            (
                "1. Research Question",
                "How do processing parameters and microstructure influence elastic/plastic behavior under "
                "uniaxial loading, and can a simplified constitutive model fit the observed response?",
            ),
            (
                "2. Approach",
                "• Literature review on the selected material system and test standards.\n"
                "• Design of experiments: sample preparation, tensile tests, repeatability.\n"
                "• Data processing: stress–strain curves, yield point, hardening parameters.\n"
                "• Model fitting: choose a basic constitutive model and estimate parameters.",
            ),
            (
                "3. Deliverables",
                "• Dataset of tests + plots.\n"
                "• Parameterized model + fitting notebook/scripts.\n"
                "• Research report and discussion of limitations.",
            ),
        ],
    )

    # 4) Research internship — Mechanics (2)
    _draw_document(
        out_dir / "Research_Internship_Mechanics_2.pdf",
        title="Research Internship Proposal — Mechanics (2)",
        subtitle="Dynamics / vibrations — analysis + simulation",
        meta={
            "Candidate": "[Your Name]",
            "Lab": "[Research Lab]",
            "Duration": "3–6 months",
            "Theme": "Vibration analysis and control",
        },
        sections=[
            (
                "1. Research Question",
                "Can we detect and classify structural anomalies (e.g., looseness, cracks, imbalance) "
                "from vibration signatures using a physics-informed workflow combining simulation and "
                "signal processing?",
            ),
            (
                "2. Methodology",
                "• Acquire or simulate vibration data (simple beam/rotor model).\n"
                "• Extract features: FFT peaks, envelopes, time–frequency representations.\n"
                "• Compare baseline vs faulty conditions; validate repeatability.\n"
                "• Optional: train a lightweight classifier for fault identification.",
            ),
            (
                "3. Deliverables",
                "• Simulation model + dataset.\n"
                "• Feature extraction pipeline.\n"
                "• Final report with recommendations for future work.",
            ),
        ],
    )

    print(f"Generated 4 PDFs in: {out_dir}")


if __name__ == "__main__":
    main()
