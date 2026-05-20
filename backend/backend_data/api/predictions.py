from __future__ import annotations

import asyncio
import csv
import io
import json
import sys
import uuid
from pathlib import Path
from typing import Any, AsyncGenerator

import mlflow
import pandas as pd
from fastapi import APIRouter, Body, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from mlflow.tracking import MlflowClient

from agents.prediction_agent import PredictionAgent

router = APIRouter()

# In-memory store for prediction jobs
_jobs: dict[str, dict[str, Any]] = {}

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

TRAINING_DIR = Path(__file__).resolve().parents[2] / "training"
MLFLOW_DIR = TRAINING_DIR / "mlruns"

# Configure MLflow au niveau module pour les endpoints qui interrogent directement le registry
if sys.platform == "win32":
    mlflow.set_tracking_uri(f"file:///{MLFLOW_DIR.resolve().as_posix()}")
else:
    mlflow.set_tracking_uri(f"file://{MLFLOW_DIR.resolve()}")

REGISTRY_PREFIX = "maintenance_"

# Métadonnées d'affichage pour les model_id connus.
# Si un model_id MLflow ne figure pas ici, on génère un libellé "best effort".
MODEL_METADATA: dict[str, dict[str, str]] = {
    "random_forest": {"name": "Random Forest", "description": "Baseline robuste"},
    "xgboost":       {"name": "XGBoost",       "description": "Gradient Boosting"},
    "lightgbm":      {"name": "LightGBM",      "description": "Boosting rapide"},
    "catboost":      {"name": "CatBoost",      "description": "Catégories natives"},
    "extra_trees":   {"name": "Extra Trees",   "description": "Bagging aléatoire"},
}


def _pretty_label(model_id: str) -> dict[str, str]:
    meta = MODEL_METADATA.get(model_id)
    if meta:
        return meta
    return {
        "name": model_id.replace("_", " ").title(),
        "description": "Modèle MLflow personnalisé",
    }


def _build_agent(on_log) -> PredictionAgent:
    return PredictionAgent(mlflow_dir=MLFLOW_DIR, on_log=on_log)


async def _run_prediction(job_id: str, model_id: str) -> None:
    """Tâche async qui exécute le PredictionAgent et pousse les logs dans la queue SSE."""
    job = _jobs[job_id]
    queue: asyncio.Queue = job["queue"]
    loop = asyncio.get_running_loop()

    def on_log(entry: dict[str, Any]) -> None:
        # Le callback est appelé depuis le thread executor : on schedule la mise en queue
        job["logs"].append(entry)
        try:
            loop.call_soon_threadsafe(queue.put_nowait, entry)
        except RuntimeError:
            # Loop déjà fermé : best-effort, on ignore
            pass

    agent = _build_agent(on_log)

    try:
        window_days = int(job.get("window", "7"))
    except (TypeError, ValueError):
        window_days = 7
    forecast = bool(job.get("forecast", False))
    batch = bool(job.get("batch", True))

    outcome = await loop.run_in_executor(
        None,
        lambda: agent.run(
            Path(job["file_path"]),
            model_id,
            window_days=window_days,
            forecast=forecast,
            batch=batch,
        ),
    )

    job["status"] = outcome["status"]
    job["result"] = outcome["result"]


@router.get("/models")
def list_available_models(include_unavailable: bool = False):
    """
    Liste les modèles enregistrés dans le MLflow Model Registry préfixés par
    `maintenance_`.

    - Par défaut, ne retourne **que** les modèles réellement enregistrés dans MLflow.
    - Si `include_unavailable=true`, ajoute aussi les modèles "connus" du système
      mais non encore entraînés (`available: false`). Utilisé par le ModelSelector
      de la page Predictions pour afficher les choix possibles en grisé.
    """
    fallback = [
        {
            "id": model_id,
            **_pretty_label(model_id),
            "registered_name": f"{REGISTRY_PREFIX}{model_id}",
            "available": False,
            "versions": 0,
            "current_version": None,
            "current_stage": None,
            "source": None,
            "last_updated": None,
            "score": None,
            "task": None,
            "metrics": {
                "precision": None,
                "recall": None,
                "f1": None,
                "r2": None,
                "rmse": None,
            },
        }
        for model_id in MODEL_METADATA.keys()
    ]

    client = MlflowClient()
    try:
        registered = client.search_registered_models()
    except Exception as exc:
        return {
            "models": fallback if include_unavailable else [],
            "warning": f"MLflow injoignable : {exc}",
        }

    seen: dict[str, dict[str, Any]] = {}
    for entry in registered:
        full_name = entry.name
        if not full_name.startswith(REGISTRY_PREFIX):
            continue
        model_id = full_name[len(REGISTRY_PREFIX):]
        try:
            versions = client.search_model_versions(f"name='{full_name}'")
        except Exception:
            versions = []

        if not versions:
            continue

        # Tri par numéro de version desc
        def vk(v: Any) -> int:
            try:
                return int(v.version)
            except Exception:
                return 0

        sorted_versions = sorted(versions, key=vk, reverse=True)
        prod = [v for v in versions if (getattr(v, "current_stage", "") or "").lower() == "production"]
        staging = [v for v in versions if (getattr(v, "current_stage", "") or "").lower() == "staging"]

        if prod:
            chosen, source = sorted(prod, key=vk, reverse=True)[0], "production"
        elif staging:
            chosen, source = sorted(staging, key=vk, reverse=True)[0], "staging"
        else:
            chosen, source = sorted_versions[0], "latest"

        # Récupère les vraies métriques depuis le run MLflow
        score: float | None = None
        precision: float | None = None
        recall: float | None = None
        f1: float | None = None
        r2: float | None = None
        rmse: float | None = None
        task: str | None = None
        try:
            run = client.get_run(chosen.run_id)
            run_metrics = (run.data.metrics if run.data and run.data.metrics else {}) or {}
            run_params = (run.data.params if run.data and run.data.params else {}) or {}
            run_tags = (run.data.tags if run.data and run.data.tags else {}) or {}

            task = run_params.get("task")
            for key in ("accuracy", "r2", "score"):
                if key in run_metrics:
                    score = float(run_metrics[key])
                    break
            if score is None and "score" in run_tags:
                try:
                    score = float(run_tags["score"])
                except (TypeError, ValueError):
                    score = None

            if "precision" in run_metrics:
                precision = float(run_metrics["precision"])
            if "recall" in run_metrics:
                recall = float(run_metrics["recall"])
            if "f1" in run_metrics:
                f1 = float(run_metrics["f1"])
            if "r2" in run_metrics:
                r2 = float(run_metrics["r2"])
            if "rmse" in run_metrics:
                rmse = float(run_metrics["rmse"])
        except Exception:
            pass

        seen[model_id] = {
            "id": model_id,
            **_pretty_label(model_id),
            "registered_name": full_name,
            "available": True,
            "versions": len(versions),
            "current_version": str(chosen.version),
            "current_stage": getattr(chosen, "current_stage", None),
            "source": source,
            "last_updated": getattr(chosen, "last_updated_timestamp", None),
            "score": score,
            "task": task,
            "metrics": {
                "precision": precision,
                "recall": recall,
                "f1": f1,
                "r2": r2,
                "rmse": rmse,
            },
        }

    # Mode par défaut : on ne retourne QUE les modèles réellement enregistrés.
    # Avec include_unavailable=True : on ajoute aussi les fallback (non entraînés).
    out: list[dict[str, Any]] = []
    used: set[str] = set()

    if include_unavailable:
        for entry in fallback:
            if entry["id"] in seen:
                out.append(seen[entry["id"]])
                used.add(entry["id"])
            else:
                out.append(entry)
        for model_id, entry in seen.items():
            if model_id not in used:
                out.append(entry)
    else:
        # Ordre stable : suit l'ordre canonique des MODEL_METADATA pour les connus
        for entry in fallback:
            if entry["id"] in seen:
                out.append(seen[entry["id"]])
                used.add(entry["id"])
        # Modèles custom (non listés dans MODEL_METADATA) à la fin
        for model_id, entry in seen.items():
            if model_id not in used:
                out.append(entry)

    return {"models": out}


@router.post("/models/{model_id}/promote")
def promote_model(model_id: str, version: str | None = None, stage: str = "Production"):
    """
    Transitionne une version d'un modèle MLflow vers le stage demandé.

    - `model_id` : identifiant court (ex: `random_forest`)
    - `version`  : numéro de version. Si omis, prend la version la plus haute.
    - `stage`    : `Production`, `Staging`, `Archived`, ou `None`.

    Les autres versions précédemment dans le même stage sont automatiquement archivées
    (`archive_existing_versions=True`) — comportement standard MLflow pour ne garder
    qu'une seule version "Production" à la fois.
    """
    allowed_stages = {"Production", "Staging", "Archived", "None"}
    if stage not in allowed_stages:
        raise HTTPException(
            status_code=400,
            detail=f"Stage invalide. Valeurs autorisées : {sorted(allowed_stages)}",
        )

    registered_name = f"{REGISTRY_PREFIX}{model_id}"
    client = MlflowClient()
    try:
        versions = client.search_model_versions(f"name='{registered_name}'")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"MLflow injoignable : {exc}")

    if not versions:
        raise HTTPException(
            status_code=404,
            detail=f"Aucun modèle MLflow enregistré pour '{registered_name}'.",
        )

    if version is None:
        def vk(v: Any) -> int:
            try:
                return int(v.version)
            except Exception:
                return 0

        version = str(sorted(versions, key=vk, reverse=True)[0].version)
    else:
        if not any(str(v.version) == version for v in versions):
            raise HTTPException(
                status_code=404,
                detail=f"Version {version} introuvable pour {registered_name}.",
            )

    try:
        client.transition_model_version_stage(
            name=registered_name,
            version=version,
            stage=stage,
            archive_existing_versions=(stage == "Production"),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transition échouée : {exc}")

    return {
        "status": "ok",
        "model_id": model_id,
        "registered_name": registered_name,
        "version": version,
        "stage": stage,
    }


@router.post("/predict")
async def predict_file(
    file: UploadFile = File(...),
    model_id: str = Form("random_forest"),
    window: str = Form("7"),
    forecast: str = Form("false"),
    batch: str = Form("false"),
):
    job_id = str(uuid.uuid4())
    queue: asyncio.Queue = asyncio.Queue()
    file_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
    _jobs[job_id] = {
        "status": "running",
        "logs": [],
        "result": None,
        "queue": queue,
        "model_id": model_id,
        "window": window,
        "forecast": forecast.lower() == "true",
        "batch": batch.lower() == "true",
        "filename": file.filename,
        "file_path": str(file_path),
    }

    with open(file_path, "wb") as handle:
        handle.write(await file.read())

    asyncio.create_task(_run_prediction(job_id, model_id))
    return {"job_id": job_id, "status": "started"}


@router.post("/batch")
async def batch_predict(payload: dict = Body(...)):
    """Inférence synchrone à partir d'un payload JSON {model_id, rows}."""
    job_id = str(uuid.uuid4())
    model_id = payload.get("model_id", "random_forest")
    rows = payload.get("rows", [])

    tmp_path = UPLOAD_DIR / f"{job_id}_batch.csv"
    pd.DataFrame(rows).to_csv(tmp_path, index=False)

    agent = _build_agent(on_log=None)
    outcome = agent.run(tmp_path, model_id)
    try:
        tmp_path.unlink(missing_ok=True)
    except OSError:
        pass

    _jobs[job_id] = {
        "status": outcome["status"],
        "logs": outcome["logs"],
        "result": outcome["result"],
        "queue": asyncio.Queue(),
    }
    return {"job_id": job_id, "status": outcome["status"]}


@router.get("/results/{job_id}")
def get_results(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job_id": job_id, "status": job["status"], "result": job["result"]}


@router.get("/stream")
async def stream_predictions(job_id: str | None = None):
    if job_id is None:
        raise HTTPException(status_code=400, detail="job_id is required")
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator() -> AsyncGenerator[str, None]:
        # Send existing logs first (replay)
        for entry in job["logs"]:
            yield f"data: {json.dumps(entry)}\n\n"

        queue: asyncio.Queue = job["queue"]
        while True:
            try:
                entry = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield f"data: {json.dumps(entry)}\n\n"
                if entry.get("type") in ("done", "error"):
                    break
            except asyncio.TimeoutError:
                yield "data: {\"type\":\"ping\"}\n\n"
                if job.get("status") in ("done", "error"):
                    break

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/export")
def export_predictions(job_id: str, format: str = "csv"):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    result = job.get("result") or {}
    predictions = result.get("predictions") or []

    fmt = (format or "csv").lower()
    if fmt in ("csv", "excel", "xlsx"):
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["index", "prediction"])
        for i, p in enumerate(predictions):
            writer.writerow([i, p])
        data = output.getvalue().encode("utf-8")
        ext = "csv" if fmt == "csv" else "xlsx"
        headers = {
            "Content-Disposition": f"attachment; filename=predictions_{job_id}.{ext}"
        }
        return StreamingResponse(iter([data]), media_type="text/csv", headers=headers)

    if fmt == "pdf":
        text = "Predictions\n" + "\n".join(str(p) for p in predictions)
        data = text.encode("utf-8")
        headers = {
            "Content-Disposition": f"attachment; filename=predictions_{job_id}.pdf"
        }
        return StreamingResponse(iter([data]), media_type="application/pdf", headers=headers)

    raise HTTPException(status_code=400, detail="Unsupported format")
