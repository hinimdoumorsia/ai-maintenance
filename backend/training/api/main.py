"""
API FastAPI — connecteur Frontend ↔ Agent
────────────────────────────────────────
Endpoints :
  POST /upload          → upload fichier + lancement pipeline
  GET  /logs/{job_id}   → SSE streaming des logs en temps réel
  GET  /results/{job_id} → résultats du pipeline
  GET  /health          → santé de l'API
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# ─── Import de l'agent ────────────────────────────────────────────────────────
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agent.training_agent import TrainingAgent

_TRAINING_ROOT = Path(__file__).resolve().parent.parent
_LOG_DIR = _TRAINING_ROOT / "logs"
_LOG_DIR.mkdir(parents=True, exist_ok=True)

# ─── Config ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers= [
        logging.StreamHandler(),
        logging.FileHandler(str(_LOG_DIR / "api.log")),
    ]
)
logger = logging.getLogger(__name__)

UPLOAD_DIR = _TRAINING_ROOT / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# ─── Store en mémoire (jobs) ──────────────────────────────────────────────────
jobs: dict[str, dict] = {}      # job_id → {status, logs, result, queue}

# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title   = "AI Maintenance — Training API",
    version = "1.0.0",
    docs_url= "/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "training-agent-api"}


@app.post("/upload")
async def upload_and_train(
    file:       UploadFile = File(...),
    model_id:   str        = Form("random_forest"),
    target_col: str        = Form(""),
    groq_api_key: str      = Form(""),
):
    """
    Upload le fichier et lance le pipeline d'entraînement dans une tâche asynchrone.
    Retourne immédiatement un job_id pour suivre les logs via SSE.
    """
    # Sauvegarder le fichier
    job_id    = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{job_id}_{file.filename}"

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    logger.info(f"[/upload] job={job_id} | file={file_path} | model={model_id}")

    # Initialiser le job
    queue: asyncio.Queue = asyncio.Queue()
    jobs[job_id] = {
        "status":    "running",
        "logs":      [],
        "result":    None,
        "queue":     queue,
        "file_path": str(file_path),
        "model_id":  model_id,
        "created_at": datetime.utcnow().isoformat(),
    }

    # Lancer le pipeline en background
    asyncio.create_task(
        _run_pipeline(
            job_id      = job_id,
            file_path   = str(file_path),
            model_id    = model_id,
            target_col  = target_col or None,
            groq_api_key= groq_api_key or os.getenv("GROQ_API_KEY", ""),
        )
    )

    return {"job_id": job_id, "status": "started"}


async def _run_pipeline(
    job_id:      str,
    file_path:   str,
    model_id:    str,
    target_col:  str | None,
    groq_api_key:str,
):
    """Exécute le pipeline agent dans le thread event loop."""
    job   = jobs[job_id]
    queue = job["queue"]

    def on_log(entry: dict):
        """Callback appelé par l'agent pour chaque log."""
        job["logs"].append(entry)
        try:
            queue.put_nowait(entry)
        except asyncio.QueueFull:
            pass

    try:
        agent = TrainingAgent(
            api_key = groq_api_key,
            on_log  = on_log,
        )
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: agent.run(
                file_path  = file_path,
                model_id   = model_id,
                target_col = target_col,
            )
        )
        job["status"] = "done"
        job["result"] = result
        queue.put_nowait({"type": "done", "title": "Pipeline terminé", "detail": "", "time": ""})

    except Exception as exc:
        logger.error(f"[pipeline] ❌ job={job_id} | {exc}", exc_info=True)
        job["status"] = "error"
        job["result"] = {"status": "error", "error": str(exc)}
        queue.put_nowait({"type": "error", "title": "Erreur", "detail": str(exc), "time": ""})


@app.get("/logs/{job_id}")
async def stream_logs(job_id: str):
    """
    SSE — stream les logs du pipeline en temps réel.
    Le frontend s'abonne à cet endpoint pour recevoir les journaux de l'agent.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job introuvable")

    async def event_generator() -> AsyncGenerator[str, None]:
        job   = jobs[job_id]
        queue = job["queue"]

        # Envoyer les logs déjà en mémoire
        for entry in job["logs"]:
            yield f"data: {json.dumps(entry, ensure_ascii=False)}\n\n"

        # Streamer les nouveaux logs
        while True:
            try:
                entry = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield f"data: {json.dumps(entry, ensure_ascii=False)}\n\n"
                if entry.get("type") in ("done", "error"):
                    break
            except asyncio.TimeoutError:
                yield "data: {\"type\":\"ping\"}\n\n"  # keepalive
                if job["status"] in ("done", "error"):
                    break

    return StreamingResponse(
        event_generator(),
        media_type = "text/event-stream",
        headers    = {
            "Cache-Control":    "no-cache",
            "X-Accel-Buffering":"no",
        }
    )


@app.get("/results/{job_id}")
def get_results(job_id: str):
    """Retourne les résultats complets du pipeline."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job introuvable")
    job = jobs[job_id]
    return {
        "job_id":  job_id,
        "status":  job["status"],
        "result":  job["result"],
        "n_logs":  len(job["logs"]),
    }


@app.get("/jobs")
def list_jobs():
    """Liste tous les jobs en mémoire."""
    return [
        {
            "job_id": jid,
            "status": j["status"],
            "model_id": j.get("model_id"),
            "created_at": j.get("created_at"),
        }
        for jid, j in jobs.items()
    ]


# ─── Lancement ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")