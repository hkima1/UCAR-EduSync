"""RAG-style student → opportunity recommender.

This script:
  1) Loads a student profile from ../unification_json_db (by student_id)
  2) Loads local opportunity PDFs from ./rapport
  3) Sends the prompt + context to NVIDIA chat/completions
  4) Saves the model's JSON response to a .json file

Prereqs:
  - Set env var NVIDIA_API_KEY
  - pip install requests pymupdf

Example:
  py -3 Scholarship_Agent\\test_api.py --student-id B-1001
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


# Structured NVIDIA configuration (same style as your sample script).
NVIDIA_CONFIG: dict[str, Any] = {
    "api_key": "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",
    "invoke_url": "https://integrate.api.nvidia.com/v1/chat/completions",
    "model": "google/gemma-4-31b-it",
    "temperature": 0.1,
    "max_tokens": 1200,
    "stream": True,
    "chat_template_kwargs": {"enable_thinking": True},
    "timeout": 240,
}

HIGH_MATCH_THRESHOLD = 0.80


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
    direct = db_dir / f"{student_id.strip().lower()}.json"
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


def _extract_last_valid_json_object(text: str) -> dict[str, Any]:
    """Return the last valid JSON object found in free-form model output."""
    starts = [i for i, ch in enumerate(text) if ch == "{"]
    if not starts:
        raise ValueError("No JSON object start found")

    valid: dict[str, Any] | None = None
    for start in starts:
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
            if ch == '"':
                in_str = True
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    snippet = text[start : i + 1]
                    try:
                        candidate = json.loads(snippet)
                    except Exception:
                        break
                    if isinstance(candidate, dict):
                        valid = candidate
                    break

    if valid is None:
        raise ValueError("No valid JSON object found")
    return valid


def _call_nvidia_chat_streaming(*, config: dict[str, Any], api_key: str, messages: list[dict[str, str]]) -> str:
    url = str(config["invoke_url"])
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "text/event-stream",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "model": config["model"],
        "messages": messages,
        "max_tokens": config["max_tokens"],
        "temperature": config["temperature"],
        "stream": config["stream"],
        "chat_template_kwargs": config["chat_template_kwargs"],
    }
    response = requests.post(url, headers=headers, json=payload, stream=True, timeout=config["timeout"])
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
            print(reasoning, end="", flush=True)
        content = delta.get("content")
        if content:
            output += content
            print(content, end="", flush=True)

    return output.strip()


def _normalize_high_matches(out_obj: dict[str, Any], threshold: float = HIGH_MATCH_THRESHOLD) -> dict[str, Any]:
    recs = out_obj.get("recommended_programs")
    if not isinstance(recs, list):
        out_obj["recommended_programs"] = []
        out_obj["best_match"] = None
        return out_obj

    high_only: list[dict[str, Any]] = []
    for item in recs:
        if not isinstance(item, dict):
            continue
        score = item.get("match_score")
        try:
            score_val = float(score)
        except Exception:
            continue
        if score_val >= threshold:
            item["match_score"] = score_val
            high_only.append(item)

    high_only.sort(key=lambda x: float(x.get("match_score", 0.0)), reverse=True)
    out_obj["recommended_programs"] = high_only
    out_obj["best_match"] = high_only[0] if high_only else None
    return out_obj


def generate_recommendation(
    *,
    student_id: str,
    model: str | None = None,
    api_key: str | None = None,
    db_dir: Path | None = None,
    rapport_dir: Path | None = None,
    prompt_path: Path | None = None,
    out_path: Path | None = None,
    dry_run: bool = False,
    verbose: bool = True,
) -> dict[str, Any]:
    """Generate recommendation JSON for one student.

    Returns a JSON-serializable dict and writes to out_path when provided.
    """
    nvidia_cfg = dict(NVIDIA_CONFIG)
    if model:
        nvidia_cfg["model"] = model

    resolved_db_dir = db_dir or (Path(__file__).resolve().parents[1] / "unification_json_db")
    resolved_rapport_dir = rapport_dir or (Path(__file__).resolve().parent / "rapport")
    resolved_prompt = prompt_path or (Path(__file__).resolve().parent / "prompt.txt")

    student = _find_student_record(student_id, resolved_db_dir)
    docs = _load_opportunity_docs(resolved_rapport_dir)
    system_prompt = _load_text(resolved_prompt).strip() + "\n\n" + (
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

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    if dry_run:
        return {
            "student_id": student_id,
            "system_prompt": system_prompt,
            "user_content": user_content,
            "dry_run": True,
        }

    resolved_api_key = api_key or nvidia_cfg.get("api_key") or os.environ.get("NVIDIA_API_KEY")
    if not resolved_api_key:
        raise SystemExit("Missing NVIDIA API key. Provide --api-key, set NVIDIA_CONFIG['api_key'], or set env NVIDIA_API_KEY")

    if verbose:
        print(f"Calling {nvidia_cfg['model']} with NVIDIA streaming config...", flush=True)

    content = _call_nvidia_chat_streaming(config=nvidia_cfg, api_key=resolved_api_key, messages=messages)
    try:
        out_obj = json.loads(content)
    except Exception:
        out_obj = _extract_last_valid_json_object(content)

    out_obj = _normalize_high_matches(out_obj)
    out_obj.setdefault("student_id", student_id)
    out_obj.setdefault("generated_at", datetime.now().isoformat(timespec="seconds"))

    final_out = out_path or (resolved_rapport_dir / "recommendations" / f"{student_id}.json")
    final_out.parent.mkdir(parents=True, exist_ok=True)
    final_out.write_text(json.dumps(out_obj, ensure_ascii=False, indent=2), encoding="utf-8")

    if verbose:
        print(f"\nSaved JSON recommendation to: {final_out}")

    return out_obj


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    parser = argparse.ArgumentParser(
        description="Recommend opportunities for a student using local PDFs as RAG context",
    )
    parser.add_argument("--student-id", required=True, help="Student ID (e.g., B-1001)")
    parser.add_argument(
        "--api-key",
        default=None,
        help="NVIDIA API key (optional; otherwise uses NVIDIA_CONFIG['api_key'] then env NVIDIA_API_KEY)",
    )
    parser.add_argument(
        "--model",
        default=NVIDIA_CONFIG["model"],
        help="NVIDIA model name",
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
        default=Path(__file__).resolve().parent / "rapport",
        help="Rapport directory containing PDFs (default: ./rapport)",
    )
    parser.add_argument(
        "--prompt",
        type=Path,
        default=Path(__file__).resolve().parent / "prompt.txt",
        help="Prompt file path (default: ./prompt.txt)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output JSON file path (default: ./rapport/recommendations/<id>.json)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not call the API; just print the composed prompt context",
    )
    args = parser.parse_args()

    out_obj = generate_recommendation(
        student_id=args.student_id,
        model=args.model,
        api_key=args.api_key,
        db_dir=args.db_dir,
        rapport_dir=args.rapport_dir,
        prompt_path=args.prompt,
        out_path=args.out,
        dry_run=args.dry_run,
        verbose=True,
    )

    if args.dry_run:
        print(out_obj["system_prompt"])
        print("\n---\n")
        print(out_obj["user_content"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
