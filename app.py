from __future__ import annotations 

import importlib.util
import os
import sys
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from werkzeug.serving import run_simple

try:
    from flask_cors import CORS
except Exception:  # pragma: no cover
    CORS = None


ROOT_DIR = Path(__file__).resolve().parent
AGENT_DIR = ROOT_DIR / "agent"

# Ensure top-level agent packages like Research_Agent are importable.
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))


def _load_module(module_name: str, file_path: Path) -> Any:
    """Load a Python module directly from a file path."""
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to create module spec for {file_path}")

    module = importlib.util.module_from_spec(spec)

    # Some agent files import local siblings (e.g., "from generator import ...").
    module_dir = str(file_path.parent)
    if module_dir not in sys.path:
        sys.path.insert(0, module_dir)

    spec.loader.exec_module(module)
    return module


def _safe_import(module_name: str, file_path: Path) -> tuple[Any | None, str | None]:
    try:
        return _load_module(module_name, file_path), None
    except Exception as exc:
        return None, str(exc)


app = Flask(__name__)
if CORS:
    CORS(app)


# ---- Load agent modules ----------------------------------------------------
academic_mod, academic_err = _safe_import(
    "academic_advisor_api", AGENT_DIR / "academic_advisor_agent" / "api.py"
)
strategic_mod, strategic_err = _safe_import(
    "strategic_advisor_api", AGENT_DIR / "strategic_advisor_agent" / "api.py"
)
employment_mod, employment_err = _safe_import(
    "equitable_employment_api", AGENT_DIR / "equitable_employment_agent" / "api.py"
)
legal_mod, legal_err = _safe_import(
    "legal_document_api", AGENT_DIR / "legal_document_generator_agent" / "api.py"
)
environment_mod, environment_err = _safe_import(
    "environmental_advisor_api", AGENT_DIR / "environemental_advisor_agent.py" / "api.py"
)

scholarship_mod, scholarship_err = _safe_import(
    "scholarship_api_server", AGENT_DIR / "Scholarship_Agent" / "api_server.py"
)
research_mod, research_err = _safe_import(
    "research_api_server", AGENT_DIR / "Research_Agent" / "api_server.py"
)


def _agent_status(ok: bool, mount: str, error: str | None) -> dict[str, Any]:
    return {
        "available": ok,
        "mount": mount,
        "error": error,
    }


@app.get("/")
def root() -> Any:
    return jsonify(
        {
            "service": "UCAR Unified Agents Backend",
            "status": "ok",
            "mounted_agents": {
                "academic_advisor": _agent_status(
                    academic_mod is not None,
                    "/agents/academic",
                    academic_err,
                ),
                "strategic_advisor": _agent_status(
                    strategic_mod is not None,
                    "/agents/strategic",
                    strategic_err,
                ),
                "equitable_employment": _agent_status(
                    employment_mod is not None,
                    "/agents/employment",
                    employment_err,
                ),
                "legal_document_generator": _agent_status(
                    legal_mod is not None,
                    "/agents/legal",
                    legal_err,
                ),
                "environmental_advisor": _agent_status(
                    environment_mod is not None,
                    "/agents/environment",
                    environment_err,
                ),
                "scholarship": _agent_status(
                    scholarship_mod is not None,
                    "/agents/scholarship",
                    scholarship_err,
                ),
                "research": _agent_status(
                    research_mod is not None,
                    "/agents/research",
                    research_err,
                ),
            },
        }
    )


@app.get("/health")
def health() -> Any:
    agents = {
        "academic": academic_mod is not None,
        "strategic": strategic_mod is not None,
        "employment": employment_mod is not None,
        "legal": legal_mod is not None,
        "environment": environment_mod is not None,
        "scholarship": scholarship_mod is not None,
        "research": research_mod is not None,
    }
    return jsonify(
        {
            "status": "ok",
            "agents_loaded": agents,
            "loaded_count": sum(1 for ok in agents.values() if ok),
            "total_agents": len(agents),
        }
    )


# ---- Scholarship wrapper (FastAPI -> Flask) -------------------------------
@app.post("/agents/scholarship/api/recommendation")
def scholarship_recommendation() -> Any:
    if scholarship_mod is None:
        return jsonify({"error": "Scholarship agent unavailable", "detail": scholarship_err}), 503

    body = request.get_json(force=True, silent=True) or {}
    student_id = body.get("student_id")
    model = body.get("model")

    if not student_id:
        return jsonify({"error": "student_id is required"}), 400

    try:
        result = scholarship_mod.generate_recommendation(
            student_id=student_id,
            model=model,
            db_dir=Path(scholarship_mod.__file__).resolve().parents[1] / "unification_json_db",
            rapport_dir=Path(scholarship_mod.__file__).resolve().parent / "rapport",
            prompt_path=Path(scholarship_mod.__file__).resolve().parent / "prompt.txt",
            out_path=None,
            dry_run=False,
            verbose=False,
        )
        return jsonify(result)
    except SystemExit as exc:
        return jsonify({"error": str(exc)}), 400
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": f"Failed to generate recommendation: {exc}"}), 500


@app.get("/agents/scholarship/health")
def scholarship_health() -> Any:
    if scholarship_mod is None:
        return jsonify({"status": "error", "detail": scholarship_err}), 503
    return jsonify({"status": "ok", "agent": "Scholarship Agent"})


# ---- Research wrapper (FastAPI -> Flask) ----------------------------------
@app.post("/agents/research/api/research/author")
def research_author() -> Any:
    if research_mod is None:
        return jsonify({"error": "Research agent unavailable", "detail": research_err}), 503

    body = request.get_json(force=True, silent=True) or {}
    author_name = body.get("author_name")
    if not author_name:
        return jsonify({"error": "author_name is required"}), 400

    author_index = int(body.get("author_index", 0))
    author_results_limit = int(body.get("author_results_limit", 5))
    works_per_page = int(body.get("works_per_page", 25))
    works_max_pages = int(body.get("works_max_pages", 1))
    all_authors = bool(body.get("all_authors", True))

    try:
        out_path = (
            Path(research_mod.__file__).resolve().parent
            / "output"
            / f"{str(author_name).strip().replace(' ', '_')}_api.json"
        )
        result = research_mod.search_author_and_publications(
            author_name=author_name,
            author_index=author_index,
            author_results_limit=author_results_limit,
            works_per_page=works_per_page,
            works_max_pages=works_max_pages,
            all_authors=all_authors,
            out_path=out_path,
        )
        return jsonify(result)
    except SystemExit as exc:
        return jsonify({"error": str(exc)}), 400
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": f"Failed to analyze author: {exc}"}), 500


@app.get("/agents/research/health")
def research_health() -> Any:
    if research_mod is None:
        return jsonify({"status": "error", "detail": research_err}), 503
    return jsonify({"status": "ok", "agent": "Research Agent"})


# ---- Mount existing Flask agent apps --------------------------------------
mounts: dict[str, Any] = {}

def mount_flask_app(path: str, mod: Any):
    if mod is not None and hasattr(mod, "app"):
        if CORS:
            CORS(mod.app)
        mounts[path] = mod.app

mount_flask_app("/agents/academic", academic_mod)
mount_flask_app("/agents/strategic", strategic_mod)
mount_flask_app("/agents/employment", employment_mod)
mount_flask_app("/agents/legal", legal_mod)
mount_flask_app("/agents/environment", environment_mod)


# Export a unified WSGI application.
application = DispatcherMiddleware(app, mounts)


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5050"))

    print("Starting UCAR Unified Agents Backend...")
    print(f"Host: {host}  Port: {port}")
    print("\nMounted Flask agents:")
    for path in sorted(mounts):
        print(f"  {path}")

    print("\nFlask wrapper routes:")
    print("  /health")
    print("  /agents/scholarship/health")
    print("  /agents/scholarship/api/recommendation")
    print("  /agents/research/health")
    print("  /agents/research/api/research/author")

    run_simple(hostname=host, port=port, application=application, use_debugger=True, use_reloader=True)
