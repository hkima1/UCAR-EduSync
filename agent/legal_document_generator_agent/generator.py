"""
generator.py
-------------
Legal Document Generator Agent
Generates a PDF legal certification for a student, adds a QR code,
and updates the student's unified JSON profile.
"""

import os
import json
import uuid
import requests
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

BASE_DIR = Path(__file__).resolve().parent
UNIFIED_DB_DIR = BASE_DIR.parent / "unification_json_db"
OUTPUT_DIR = BASE_DIR / "generated_documents"
QR_DIR = BASE_DIR / "qr_codes"
LOGO_PATH = BASE_DIR / "logo-ucar.png"

# UCAR Color Palette
UCAR_BLUE = colors.HexColor("#003366")
UCAR_GOLD = colors.HexColor("#FFCC00")
UCAR_GREY = colors.HexColor("#F2F2F2")


def setup_directories():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    QR_DIR.mkdir(parents=True, exist_ok=True)


def load_student_profile(student_id: str):
    """Finds and loads a student's JSON profile from the unified DB."""
    student_id_norm = student_id.lower().strip()
    for filepath in UNIFIED_DB_DIR.glob("*.json"):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                if str(data.get("student_id", "")).lower() == student_id_norm:
                    return filepath, data
        except Exception:
            continue
    return None, None


def save_student_profile(filepath: Path, data: dict):
    """Saves the updated student profile."""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)


def generate_qr_code(student_id: str, unique_hash: str) -> Path:
    """Generates a QR code linking to a verification URL via external API."""
    setup_directories()
    qr_data = f"UCAR-VERIFY:{student_id}:{unique_hash}"
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data={qr_data}"
    
    qr_path = QR_DIR / f"{student_id}_qr.png"
    
    # Download the QR code image
    try:
        response = requests.get(qr_url, stream=True)
        response.raise_for_status()
        with open(qr_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
    except Exception as e:
        print(f"Failed to generate QR code via API: {e}")
        # Create an empty file as fallback to avoid crashing reportlab
        with open(qr_path, 'wb') as f:
            f.write(b'')
            
    return qr_path


def build_pdf(student: dict, qr_path: Path, output_filename: str) -> Path:
    """Generates the PDF certification document."""
    setup_directories()
    pdf_path = OUTPUT_DIR / output_filename
    
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        textColor=UCAR_BLUE,
        spaceAfter=30
    )
    
    subtitle_style = ParagraphStyle(
        "SubtitleStyle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=UCAR_GOLD,
        alignment=1, # Center
        spaceAfter=20
    )
    
    normal_style = ParagraphStyle(
        "NormalStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        spaceAfter=14
    )

    story = []

    # 1. Logo
    if LOGO_PATH.exists():
        im = RLImage(str(LOGO_PATH), width=2*inch, height=1*inch)
        story.append(im)
        story.append(Spacer(1, 0.2*inch))
    else:
        # Placeholder if logo is missing
        story.append(Paragraph("<b>[UCAR LOGO]</b>", normal_style))
        story.append(Spacer(1, 0.2*inch))

    # 2. Title
    story.append(Paragraph("OFFICIAL LEGAL CERTIFICATION", title_style))
    story.append(Paragraph("University Consortium for Academic Resources (UCAR)", subtitle_style))
    story.append(Spacer(1, 0.5*inch))

    # 3. Body Text
    date_str = datetime.now().strftime("%B %d, %Y")
    body_text = f"""
    This document serves as an official legal certification verifying the academic standing of the following individual. 
    It is certified that the student listed below is actively registered and recognized by the UCAR network as of {date_str}.
    """
    story.append(Paragraph(body_text, normal_style))
    story.append(Spacer(1, 0.2*inch))

    # 4. Student Details Table
    student_data = [
        ["Student ID", student.get("student_id", "N/A")],
        ["Full Name", f"{student.get('first_name', '')} {student.get('last_name', '')}"],
        ["Date of Birth", student.get("date_of_birth", "N/A")],
        ["Institution", student.get("institution", "N/A")],
        ["Academic Program", student.get("program", "N/A")],
        ["Enrollment Year", str(student.get("enrollment_year", "N/A"))]
    ]

    t = Table(student_data, colWidths=[2*inch, 4*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), UCAR_BLUE),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (1, -1), UCAR_GREY),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(t)
    story.append(Spacer(1, 0.8*inch))

    # 5. Signatures and QR Code
    story.append(Paragraph("This document is electronically verified. Scan the QR code below for authenticity.", normal_style))
    story.append(Spacer(1, 0.2*inch))

    qr_img = RLImage(str(qr_path), width=1.5*inch, height=1.5*inch)
    
    # Signature block
    sig_data = [
        [qr_img, "_________________________\nAuthorized Signature\nUCAR Administration"]
    ]
    sig_table = Table(sig_data, colWidths=[3*inch, 3*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM')
    ]))
    
    story.append(sig_table)

    doc.build(story)
    return pdf_path


def process_legal_document(student_id: str) -> dict:
    """
    Main function to generate the document:
    1. Loads student.
    2. Checks criteria.
    3. Generates QR & PDF.
    4. Updates JSON.
    """
    filepath, student = load_student_profile(student_id)
    if not student:
        return {"success": False, "error": f"Student '{student_id}' not found."}

    # Criterion check (Example: must have an institution and program)
    if not student.get("institution") or not student.get("program"):
        return {"success": False, "error": "Student does not meet criteria: Missing institution or program."}

    # Generate Unique Hash and QR Code
    unique_hash = str(uuid.uuid4())
    qr_path = generate_qr_code(student_id, unique_hash)

    # Update Student Profile with reference to the legal certification
    cert_record = {
        "certification_id": unique_hash,
        "issued_on": datetime.now().isoformat() + "Z",
        "document_type": "Legal Certification",
        "qr_code_path": str(qr_path)
    }

    if "legal_certifications" not in student:
        student["legal_certifications"] = []
    
    student["legal_certifications"].append(cert_record)
    save_student_profile(filepath, student)

    # Generate PDF
    pdf_filename = f"UCAR_LegalCert_{student_id}_{unique_hash[:8]}.pdf"
    pdf_path = build_pdf(student, qr_path, pdf_filename)

    return {
        "success": True,
        "student_id": student_id,
        "certification_id": unique_hash,
        "pdf_path": str(pdf_path),
        "qr_path": str(qr_path),
        "message": "Legal document generated successfully."
    }


if __name__ == "__main__":
    # Test execution
    res = process_legal_document("B-1002")
    print(json.dumps(res, indent=2))
