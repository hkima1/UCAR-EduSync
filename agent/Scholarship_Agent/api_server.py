"""FastAPI endpoint wrapper for Scholarship_Agent recommender.

Run:
  py -3 -m uvicorn Scholarship_Agent.api_server:app --host 0.0.0.0 --port 8000 --reload

Frontend call example (React):
  POST http://localhost:8000/api/recommendation
  {"student_id":"B-1001"}
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from Scholarship_Agent.test_api import generate_recommendation


class RecommendationRequest(BaseModel):
    student_id: str
    model: str | None = None


app = FastAPI(title="Scholarship Agent API", version="1.0.0")

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


@app.post("/api/recommendation")
def recommendation(payload: RecommendationRequest) -> dict:
    try:
        result = generate_recommendation(
            student_id=payload.student_id,
            model=payload.model,
            db_dir=Path(__file__).resolve().parents[1] / "unification_json_db",
            rapport_dir=Path(__file__).resolve().parent / "rapport",
            prompt_path=Path(__file__).resolve().parent / "prompt.txt",
            out_path=None,
            dry_run=False,
            verbose=False,
        )
        return result
    except SystemExit as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendation: {exc}") from exc
