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
import mlflow.sklearn
import numpy as np
import pandas as pd
from fastapi import APIRouter, Body, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from mlflow.tracking import MlflowClient

from ..agents.file_parser import parse_file

router = APIRouter()

# In-memory store for prediction jobs
_jobs: dict[str, dict[str, Any]] = {}

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

TRAINING_DIR = Path(__file__).resolve().parents[2] / "training"
MLFLOW_DIR = TRAINING_DIR / "mlruns"

if sys.platform == "win32":
    mlflow.set_tracking_uri(f"file:///{MLFLOW_DIR.resolve().as_posix()}")
else:
    mlflow.set_tracking_uri(f"file://{MLFLOW_DIR.resolve()}")


def _load_latest_model(model_id: str) -> tuple[Any, list[str]]:
    registered_name = f"maintenance_{model_id}"
    client = MlflowClient()
    versions = client.search_model_versions(f"name='{registered_name}'")
    if not versions:
        raise ValueError(f"No MLflow model found for {registered_name}")

    def version_key(v) -> int:
        try:
            return int(v.version)
        except Exception:
            return 0

    versions_sorted = sorted(versions, key=version_key, reverse=True)
    chosen = versions_sorted[0]

    model_uri = f"models:/{registered_name}/{chosen.version}"
    model = mlflow.sklearn.load_model(model_uri)

    feature_cols: list[str] = []
    try:
        feature_path = mlflow.artifacts.download_artifacts(
            run_id=chosen.run_id,
            artifact_path="metadata/feature_cols.json",
        )
        feature_cols = json.loads(Path(feature_path).read_text(encoding="utf-8"))
    except Exception:
        feature_cols = []

    return model, feature_cols


def _prepare_features(df: pd.DataFrame, feature_cols: list[str]) -> pd.DataFrame:
    if feature_cols:
        data = df.copy()
        for col in feature_cols:
            if col not in data.columns:
                data[col] = np.nan
        data = data[feature_cols]
    else:
        data = df.select_dtypes(include=[np.number])

    if data.empty:
        raise ValueError("No usable numeric features found")

    data = data.fillna(0)
    return data


def _predict(model: Any, data: pd.DataFrame) -> list[float]:
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(data)
        if isinstance(proba, np.ndarray) and proba.ndim == 2 and proba.shape[1] > 1:
            return [float(v) for v in proba[:, 1]]
    preds = model.predict(data)
    return [float(v) for v in preds]


def _load_input_dataframe(file_path: Path) -> pd.DataFrame:
    frames = parse_file(file_path)
    if not frames:
        raise ValueError("Uploaded file contains no usable data")
    return next(iter(frames.values()))


async def _run_prediction(job_id: str, model_id: str) -> None:
    job = _jobs[job_id]
    queue: asyncio.Queue = job["queue"]

    async def push(entry: dict) -> None:
        job["logs"].append(entry)
        try:
            queue.put_nowait(entry)
        except asyncio.QueueFull:
            pass

    await push({"type": "info", "message": "Prediction started", "model_id": model_id})
    await push({"type": "info", "message": "Loading model"})

    try:
        model, feature_cols = await asyncio.get_running_loop().run_in_executor(
            None, lambda: _load_latest_model(model_id)
        )

        await push({"type": "info", "message": "Parsing input file"})
        df = await asyncio.get_running_loop().run_in_executor(
            None, lambda: _load_input_dataframe(Path(job["file_path"]))
        )

        await push({"type": "info", "message": "Preparing features"})
        data = await asyncio.get_running_loop().run_in_executor(
            None, lambda: _prepare_features(df, feature_cols)
        )

        await push({"type": "info", "message": "Running model"})
        preds = await asyncio.get_running_loop().run_in_executor(
            None, lambda: _predict(model, data)
        )

        job["result"] = {
            "predictions": preds,
            "summary": {"count": len(preds), "model_id": model_id},
        }
        job["status"] = "done"
        await push({"type": "done", "message": "Prediction completed"})
    except Exception as exc:
        job["status"] = "error"
        job["result"] = {"error": str(exc)}
        await push({"type": "error", "message": str(exc)})


@router.post("/predict")
async def predict_file(
    file: UploadFile = File(...),
    model_id: str = Form("random_forest"),
    window: str = Form("7"),
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
        "filename": file.filename,
        "file_path": str(file_path),
    }

    with open(file_path, "wb") as handle:
        handle.write(await file.read())

    asyncio.create_task(_run_prediction(job_id, model_id))
    return {"job_id": job_id, "status": "started"}


@router.post("/batch")
async def batch_predict(payload: dict = Body(...)):
    job_id = str(uuid.uuid4())
    model_id = payload.get("model_id", "random_forest")
    rows = payload.get("rows", [])

    try:
        model, feature_cols = _load_latest_model(model_id)
        df = pd.DataFrame(rows)
        data = _prepare_features(df, feature_cols)
        preds = _predict(model, data)
        result = {
            "predictions": preds,
            "summary": {"count": len(preds), "model_id": model_id},
        }
        status = "done"
    except Exception as exc:
        result = {"error": str(exc)}
        status = "error"

    _jobs[job_id] = {
        "status": status,
        "logs": [],
        "result": result,
        "queue": asyncio.Queue(),
    }
    return {"job_id": job_id, "status": status}


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
        # Send existing logs
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
