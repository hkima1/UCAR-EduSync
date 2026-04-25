"""FastAPI endpoint for Research_Agent OpenAlex analysis.

Run:
    py -3 -m uvicorn Research_Agent.api_server:app --host 0.0.0.0 --port 8001 --reload

Frontend call example (React):
    POST http://localhost:8001/api/research/author
    {
        "author_name": "Mohamed Hkima",
        "all_authors": true,
        "author_results_limit": 5,
        "works_per_page": 50,
        "works_max_pages": 2
    }
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from Research_Agent.test_api import search_author_and_publications


class AuthorRequest(BaseModel):
    author_name: str = Field(..., min_length=1)
    author_index: int = Field(default=0, ge=0)
    author_results_limit: int = Field(default=5, ge=1, le=25)
    works_per_page: int = Field(default=25, ge=1, le=200)
    works_max_pages: int = Field(default=1, ge=1, le=20)
    all_authors: bool = True


app = FastAPI(title="Research Agent API", version="1.0.0")

# Allow local React apps; tighten in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/research/author")
def analyze_author(payload: AuthorRequest) -> dict:
    try:
        out_path = (
            Path(__file__).resolve().parent
            / "output"
            / f"{payload.author_name.strip().replace(' ', '_')}_api.json"
        )
        return search_author_and_publications(
            author_name=payload.author_name,
            author_index=payload.author_index,
            author_results_limit=payload.author_results_limit,
            works_per_page=payload.works_per_page,
            works_max_pages=payload.works_max_pages,
            all_authors=payload.all_authors,
            out_path=out_path,
        )
    except SystemExit as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to analyze author: {exc}") from exc
