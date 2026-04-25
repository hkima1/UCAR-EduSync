"""Convert PDFs in rapport/ into page images.

Default behavior:
  - Reads all *.pdf files in ./rapport
  - Writes PNG pages to ./rapport/images/<pdf_stem>/page_###.png

Usage:
  py -3 pdf_to_images.py
  py -3 pdf_to_images.py --dpi 200
  py -3 pdf_to_images.py --input-dir rapport --output-dir rapport/images --overwrite

Dependencies (recommended):
  pip install pymupdf pillow

Notes (Windows-friendly):
  - Uses PyMuPDF (fitz) so you do NOT need Poppler.
"""

from __future__ import annotations

import argparse
from pathlib import Path


def _require_deps():
    try:
        import fitz  # PyMuPDF
        from PIL import Image  # noqa: F401

        return fitz
    except Exception as exc:  # pragma: no cover
        raise SystemExit(
            "Missing dependency. Install with: pip install pymupdf pillow"
        ) from exc


def _dpi_to_matrix(dpi: int):
    # PDF default is 72 dpi.
    scale = dpi / 72.0
    return scale


def convert_pdf_to_images(
    pdf_path: Path,
    output_dir: Path,
    *,
    dpi: int = 200,
    fmt: str = "png",
    overwrite: bool = False,
):
    fitz = _require_deps()

    if fmt.lower() not in {"png", "jpg", "jpeg"}:
        raise SystemExit("--format must be one of: png, jpg")

    fmt_norm = "jpg" if fmt.lower() in {"jpg", "jpeg"} else "png"
    output_dir.mkdir(parents=True, exist_ok=True)

    scale = _dpi_to_matrix(dpi)
    mat = fitz.Matrix(scale, scale)

    with fitz.open(str(pdf_path)) as doc:
        for page_index in range(doc.page_count):
            page = doc.load_page(page_index)
            pix = page.get_pixmap(matrix=mat, alpha=False)

            out_name = f"page_{page_index + 1:03d}.{fmt_norm}"
            out_path = output_dir / out_name

            if out_path.exists() and not overwrite:
                continue

            # PyMuPDF can write the image directly.
            pix.save(str(out_path))


def main():
    parser = argparse.ArgumentParser(description="Convert PDFs to page images")
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "rapport",
        help="Folder containing PDF files (default: ./rapport)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "rapport" / "images",
        help="Output base folder (default: ./rapport/images)",
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=200,
        help="Render DPI (default: 200)",
    )
    parser.add_argument(
        "--format",
        dest="fmt",
        default="png",
        help="Output format: png or jpg (default: png)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing images",
    )

    args = parser.parse_args()

    input_dir: Path = args.input_dir
    output_base: Path = args.output_dir

    if not input_dir.exists():
        raise SystemExit(f"Input dir not found: {input_dir}")

    pdfs = sorted(input_dir.glob("*.pdf"))
    if not pdfs:
        raise SystemExit(f"No PDF files found in: {input_dir}")

    converted = 0
    for pdf in pdfs:
        out_dir = output_base / pdf.stem
        convert_pdf_to_images(
            pdf,
            out_dir,
            dpi=args.dpi,
            fmt=args.fmt,
            overwrite=args.overwrite,
        )
        converted += 1

    print(f"Converted {converted} PDF(s) to images under: {output_base}")


if __name__ == "__main__":
    main()
