"""Streaming (event-stream) RAG recommender.

Uses the same streaming approach as your CONNECTED test, but:
  - Loads student profile from ../unification_json_db
  - Loads local opportunity PDFs from ../Scholarship_Agent/rapport
  - Uses ../Scholarship_Agent/prompt.txt
  - Streams the model output and saves it as JSON

Run:
  $env:NVIDIA_API_KEY="..."
  py -3 sementic_embeding_model\\test_api.py --student-id B-1001
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import requests


def _require_fitz():
    try:
        import fitz  # PyMuPDF

        return fitz
    except Exception as exc:  # pragma: no cover
        raise SystemExit("Missing dependency. Install with: pip install pymupdf") from exc


def _load_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _find_student_record(student_id: str, db_dir: Path) -> dict[str, Any]:
    student_id_norm = student_id.strip().lower()

    direct = db_dir / f"{student_id_norm}.json"
    if direct.exists():
        obj = _load_json(direct)
        if str(obj.get("student_id", "")).strip().lower() == student_id_norm:
            return obj

    for p in sorted(db_dir.glob("*.json")):
        try:
            obj = _load_json(p)
        except Exception:
            continue
        if str(obj.get("student_id", "")).strip().lower() == student_id_norm:
            return obj

    raise SystemExit(f"Student not found in {db_dir}: {student_id}")


def _extract_pdf_text(pdf_path: Path, *, max_chars: int = 8000) -> str:
    fitz = _require_fitz()
    with fitz.open(str(pdf_path)) as doc:
        parts: list[str] = []
        for i in range(doc.page_count):
            page = doc.load_page(i)
            txt = (page.get_text() or "").strip()
            if txt:
                parts.append(f"--- PAGE {i + 1} ---\n{txt}\n")
            if sum(len(p) for p in parts) >= max_chars:
                break

    joined = "\n".join(parts).strip()
    if len(joined) > max_chars:
        joined = joined[: max_chars - 1] + "…"
    return joined


def _load_opportunity_docs(rapport_dir: Path) -> list[dict[str, str]]:
    pdfs = sorted(rapport_dir.glob("*.pdf"))
    docs: list[dict[str, str]] = []
    for pdf in pdfs:
        name = pdf.name
        if name.startswith("Program_Report_"):
            continue
        try:
            text = _extract_pdf_text(pdf)
        except Exception:
            text = ""
        docs.append({"filename": name, "title": pdf.stem.replace("_", " "), "text": text})
    return docs


def _extract_first_json_object(text: str) -> dict[str, Any]:
    start = text.find("{")
    if start < 0:
        raise ValueError("No JSON object start found")

    depth = 0
    in_str = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_str = False
            continue
        else:
            if ch == '"':
                in_str = True
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    snippet = text[start : i + 1]
                    return json.loads(snippet)

    raise ValueError("Unterminated JSON object")


def main() -> int:
    # Force UTF-8 output on Windows
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    parser = argparse.ArgumentParser(description="Streaming RAG recommender → JSON")
    parser.add_argument("--student-id", required=True, help="Student ID (e.g., B-1001)")
    parser.add_argument(
        "--api-key",
        default=None,
        help="NVIDIA API key (optional; otherwise uses env var NVIDIA_API_KEY)",
    )
    parser.add_argument(
        "--model",
        default="google/gemma-4-31b-it",
        help="NVIDIA model name (default: google/gemma-4-31b-it)",
    )
    parser.add_argument(
        "--db-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "unification_json_db",
        help="Unified student DB directory (default: ../unification_json_db)",
    )
    parser.add_argument(
        "--rapport-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "Scholarship_Agent" / "rapport",
        help="Rapport directory containing PDFs (default: ../Scholarship_Agent/rapport)",
    )
    parser.add_argument(
        "--prompt",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "Scholarship_Agent" / "prompt.txt",
        help="Prompt file path (default: ../Scholarship_Agent/prompt.txt)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output JSON path (default: ../Scholarship_Agent/rapport/recommendations/<id>.json)",
    )
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        raise SystemExit("Missing NVIDIA API key. Provide --api-key or set env var NVIDIA_API_KEY")

    invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "text/event-stream",
        "Content-Type": "application/json",
    }

    student = _find_student_record(args.student_id, args.db_dir)
    docs = _load_opportunity_docs(args.rapport_dir)

    base_prompt = _load_text(args.prompt).strip()
    system_prompt = base_prompt + "\n\n" + (
        "You MUST reply with ONLY valid JSON (no markdown, no extra text).\n"
        "Return this exact schema:\n"
        "{\n"
        "  \"student_id\": \"...\",\n"
        "  \"student_profile\": { ... },\n"
        "  \"recommended_programs\": [\n"
        "    {\n"
        "      \"category\": \"PFE|Summer Internship|Research Opportunity|Academic Exchange|Scholarship Program|Other\",\n"
        "      \"document\": \"<filename>.pdf\",\n"
        "      \"title\": \"...\",\n"
        "      \"match_score\": 0.0,\n"
        "      \"reason\": \"...\"\n"
        "    }\n"
        "  ],\n"
        "  \"best_match\": { ... } ,\n"
        "  \"notes\": []\n"
        "}\n"
        "Rules: match_score must be between 0 and 1. If no document matches, recommended_programs can be empty and best_match can be null."
    )

    docs_blob = []
    for d in docs:
        docs_blob.append(
            f"### DOCUMENT: {d['filename']}\nTITLE: {d['title']}\nCONTENT:\n{d['text']}\n"
        )

    user_content = (
        "Student profile (JSON):\n"
        + json.dumps(student, ensure_ascii=False, indent=2)
        + "\n\n"
        + "Opportunity documents (PDF text extracts):\n"
        + "\n".join(docs_blob)
    )

    payload: dict[str, Any] = {
        "model": args.model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        "max_tokens": 1400,
        "temperature": 0.1,
        "stream": True,
        "chat_template_kwargs": {"enable_thinking": True},
    }

    print(f"Calling {args.model} (streaming) ...", flush=True)

    response = requests.post(invoke_url, headers=headers, json=payload, stream=True, timeout=180)
    response.raise_for_status()

    output = ""
    for line in response.iter_lines():
        if not line:
            continue
        decoded = line.decode("utf-8", errors="ignore")
        if not decoded.startswith("data:"):
            continue
        data_str = decoded[5:].strip()
        if data_str == "[DONE]":
            break
        try:
            data = json.loads(data_str)
        except json.JSONDecodeError:
            continue

        choices = data.get("choices", [])
        if not choices:
            continue
        delta = choices[0].get("delta", {})
        reasoning = delta.get("reasoning_content")
        if reasoning:
            # Print reasoning as it streams (optional).
            print(reasoning, end="", flush=True)
        content = delta.get("content")
        if content:
            output += content
            print(content, end="", flush=True)

    # Parse model JSON and save
    try:
        out_obj = json.loads(output)
    except Exception:
        out_obj = _extract_first_json_object(output)

    out_path: Path
    if args.out is not None:
        out_path = args.out
    else:
        out_path = args.rapport_dir / "recommendations" / f"{args.student_id}.json"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_obj.setdefault("student_id", args.student_id)
    out_obj.setdefault("generated_at", datetime.now().isoformat(timespec="seconds"))
    out_path.write_text(json.dumps(out_obj, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n\nSaved JSON recommendation to: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
