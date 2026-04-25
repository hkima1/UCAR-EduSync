"""OpenAlex author search + publications fetcher.

This script:
    1) Accepts an author name via --author-name
    2) Searches OpenAlex authors endpoint
    3) Retrieves publications for the best (or selected) author result
    4) Prints and saves structured JSON output

Example:
    py -3 Research_Agent\\test_api.py --author-name "Albert Einstein"
"""

from __future__ import annotations

import argparse
import collections
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import requests


OPENALEX_BASE_URL = "https://api.openalex.org"


def _safe_name_for_file(name: str) -> str:
    cleaned = "_".join(name.strip().split())
    return "".join(ch for ch in cleaned if ch.isalnum() or ch in {"_", "-"}) or "author"


def _request_json(url: str, *, params: dict[str, Any], timeout: int = 60) -> dict[str, Any]:
    resp = requests.get(url, params=params, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def _search_authors(author_name: str, *, per_page: int = 5) -> list[dict[str, Any]]:
    url = f"{OPENALEX_BASE_URL}/authors"
    data = _request_json(url, params={"search": author_name, "per-page": per_page})
    return data.get("results", []) if isinstance(data, dict) else []


def _get_author_works(author_id: str, *, per_page: int = 25, max_pages: int = 1) -> list[dict[str, Any]]:
    """Fetch works for an author using OpenAlex works filter.

    author_id should be a full OpenAlex id, e.g. https://openalex.org/A123...
    """
    all_works: list[dict[str, Any]] = []
    url = f"{OPENALEX_BASE_URL}/works"

    for page in range(1, max_pages + 1):
        data = _request_json(
            url,
            params={
                "filter": f"author.id:{author_id}",
                "per-page": per_page,
                "page": page,
                "sort": "publication_year:desc",
            },
        )
        items = data.get("results", []) if isinstance(data, dict) else []
        if not items:
            break
        all_works.extend(items)
    return all_works


def _compact_author(author: dict[str, Any]) -> dict[str, Any]:
    affiliation = None
    affiliations = author.get("affiliations")
    if isinstance(affiliations, list) and affiliations:
        inst = affiliations[0].get("institution", {})
        if isinstance(inst, dict):
            affiliation = inst.get("display_name")

    return {
        "id": author.get("id"),
        "display_name": author.get("display_name"),
        "orcid": author.get("orcid"),
        "works_count": author.get("works_count"),
        "cited_by_count": author.get("cited_by_count"),
        "last_known_institution": affiliation,
    }


def _compact_work(work: dict[str, Any]) -> dict[str, Any]:
    primary_location = work.get("primary_location") if isinstance(work.get("primary_location"), dict) else {}
    source = primary_location.get("source") if isinstance(primary_location.get("source"), dict) else {}
    return {
        "id": work.get("id"),
        "title": work.get("display_name"),
        "publication_year": work.get("publication_year"),
        "publication_date": work.get("publication_date"),
        "type": work.get("type"),
        "doi": work.get("doi"),
        "cited_by_count": work.get("cited_by_count"),
        "source": source.get("display_name"),
        "openalex_url": work.get("id"),
    }


def _summarize_publications(publications: list[dict[str, Any]]) -> dict[str, Any]:
    by_year: dict[str, int] = {}
    by_type_counter: collections.Counter[str] = collections.Counter()
    by_source_counter: collections.Counter[str] = collections.Counter()

    for p in publications:
        year = p.get("publication_year")
        if year is not None:
            by_year[str(year)] = by_year.get(str(year), 0) + 1

        ptype = p.get("type")
        if isinstance(ptype, str) and ptype:
            by_type_counter[ptype] += 1

        source = p.get("source")
        if isinstance(source, str) and source:
            by_source_counter[source] += 1

    return {
        "total_publications": len(publications),
        "by_year": dict(sorted(by_year.items(), key=lambda kv: kv[0], reverse=True)),
        "by_type": dict(by_type_counter.most_common()),
        "top_sources": [{"source": k, "count": v} for k, v in by_source_counter.most_common(10)],
    }


def search_author_and_publications(
    *,
    author_name: str,
    author_index: int = 0,
    author_results_limit: int = 5,
    works_per_page: int = 25,
    works_max_pages: int = 1,
    all_authors: bool = True,
    out_path: Path | None = None,
) -> dict[str, Any]:
    authors = _search_authors(author_name, per_page=author_results_limit)

    if not authors:
        result = {
            "query_author_name": author_name,
            "generated_at": datetime.now().isoformat(timespec="seconds"),
            "authors_found": [],
            "selected_author": None,
            "publications": [],
            "author_analyses": [],
            "publications_all": [],
            "summary": _summarize_publications([]),
            "notes": ["No author found in OpenAlex for this search query."],
        }
        final_out = out_path or (Path(__file__).resolve().parent / "output" / f"{_safe_name_for_file(author_name)}.json")
        final_out.parent.mkdir(parents=True, exist_ok=True)
        final_out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        return result

    if author_index < 0 or author_index >= len(authors):
        raise SystemExit(f"author-index out of range. Got {author_index}, but found {len(authors)} author result(s).")

    selected = authors[author_index]
    selected_author_id = selected.get("id")
    if not selected_author_id:
        raise SystemExit("Selected author has no OpenAlex id.")

    # Fetch works for either selected author only, or all returned author matches.
    author_inputs = authors if all_authors else [selected]
    author_analyses: list[dict[str, Any]] = []
    merged_publications: list[dict[str, Any]] = []
    seen_work_ids: set[str] = set()

    for author in author_inputs:
        author_id = author.get("id")
        if not author_id:
            continue
        works_raw = _get_author_works(
            str(author_id),
            per_page=works_per_page,
            max_pages=works_max_pages,
        )
        compact_works = [_compact_work(w) for w in works_raw]
        author_analyses.append(
            {
                "author": _compact_author(author),
                "publications": compact_works,
                "summary": _summarize_publications(compact_works),
            }
        )

        for cw in compact_works:
            wid = cw.get("id")
            if isinstance(wid, str) and wid:
                if wid in seen_work_ids:
                    continue
                seen_work_ids.add(wid)
            merged_publications.append(cw)

    # Backward-compatible key: publications (selected author when selected-only, else all merged)
    selected_publications: list[dict[str, Any]] = []
    for item in author_analyses:
        a = item.get("author", {})
        if isinstance(a, dict) and a.get("id") == selected_author_id:
            selected_publications = item.get("publications", []) if isinstance(item.get("publications"), list) else []
            break

    primary_publications = merged_publications if all_authors else selected_publications

    result = {
        "query_author_name": author_name,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "analysis_scope": "all_returned_authors" if all_authors else "selected_author_only",
        "authors_found": [_compact_author(a) for a in authors],
        "selected_author": _compact_author(selected),
        "publications": primary_publications,
        "author_analyses": author_analyses,
        "publications_all": merged_publications,
        "summary": _summarize_publications(merged_publications),
        "notes": [],
    }

    final_out = out_path or (Path(__file__).resolve().parent / "output" / f"{_safe_name_for_file(author_name)}.json")
    final_out.parent.mkdir(parents=True, exist_ok=True)
    final_out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    parser = argparse.ArgumentParser(
        description="Search OpenAlex author and return associated publications",
    )
    parser.add_argument("--author-name", required=True, help="Author name to search in OpenAlex")
    parser.add_argument(
        "--author-index",
        type=int,
        default=0,
        help="Which author result to select from search results (default: 0 = top result)",
    )
    parser.add_argument(
        "--author-results-limit",
        type=int,
        default=5,
        help="Max number of author matches to fetch from OpenAlex (default: 5)",
    )
    parser.add_argument(
        "--works-per-page",
        type=int,
        default=25,
        help="Number of publications per page (default: 25)",
    )
    parser.add_argument(
        "--works-max-pages",
        type=int,
        default=1,
        help="How many pages of publications to retrieve (default: 1)",
    )
    scope_group = parser.add_mutually_exclusive_group()
    scope_group.add_argument(
        "--all-authors",
        action="store_true",
        default=True,
        help="Analyze publications for all returned author matches (default: enabled)",
    )
    scope_group.add_argument(
        "--selected-only",
        action="store_true",
        help="Analyze only the selected author (--author-index)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output JSON file path (default: ./output/<author_name>.json)",
    )
    args = parser.parse_args()

    out_obj = search_author_and_publications(
        author_name=args.author_name,
        author_index=args.author_index,
        author_results_limit=args.author_results_limit,
        works_per_page=args.works_per_page,
        works_max_pages=args.works_max_pages,
        all_authors=(not args.selected_only),
        out_path=args.out,
    )

    print(json.dumps(out_obj, ensure_ascii=False, indent=2))
    print(
        f"\nSaved JSON to: {args.out if args.out else (Path(__file__).resolve().parent / 'output' / f'{_safe_name_for_file(args.author_name)}.json')}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
