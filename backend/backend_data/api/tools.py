from __future__ import annotations

import io
import sys
from urllib.parse import quote
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from agents.eda_agent import _compute_quality_score, _compute_summary
from agents.file_parser import parse_file
from db.database import db_session, rows_to_list

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
TRAINING_DIR = BASE_DIR.parent / "training"
MLFLOW_DIR = TRAINING_DIR / "mlruns"


def _period_to_days(period: str) -> int | None:
    period = (period or "").lower()
    if "aujourd" in period:
        return 1
    if "7" in period:
        return 7
    if "30" in period:
        return 30
    if "3" in period and "mois" in period:
        return 90
    return None


def _latest_upload() -> Path | None:
    if not UPLOAD_DIR.exists():
        return None
    files = [p for p in UPLOAD_DIR.iterdir() if p.is_file()]
    if not files:
        return None
    return max(files, key=lambda p: p.stat().st_mtime)


def _fetch_recent_measurements(limit: int = 1000) -> pd.DataFrame:
    with db_session() as conn:
        rows = conn.execute(
            "SELECT * FROM mesure_globale ORDER BY timestamp_mesure DESC LIMIT ?",
            (limit,),
        ).fetchall()
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame(rows_to_list(rows))


def _quality_metrics(df: pd.DataFrame) -> list[dict[str, Any]]:
    summary = _compute_summary(df)
    quality = _compute_quality_score(summary)
    missing_pct = summary.get("missing_pct", 0.0)
    dup_pct = (summary.get("duplicates", 0) / max(summary.get("n_rows", 1), 1)) * 100.0

    num_cols = [c for c in summary.get("columns", []) if c.get("type") == "numeric"]
    if num_cols:
        avg_outlier = sum(c.get("outlier_pct", 0) for c in num_cols) / len(num_cols)
    else:
        avg_outlier = 0.0

    def status_for(score: float) -> str:
        if score >= 90:
            return "good"
        if score >= 75:
            return "warning"
        return "critical"

    completeness = max(0.0, 100.0 - float(missing_pct))
    duplicates = max(0.0, 100.0 - float(dup_pct))
    outliers = max(0.0, 100.0 - float(avg_outlier))

    return [
        {
            "name": "Complétude des données",
            "value": round(completeness, 2),
            "status": status_for(completeness),
            "detail": f"{missing_pct:.2f}% de valeurs manquantes",
        },
        {
            "name": "Doublons détectés",
            "value": round(duplicates, 2),
            "status": status_for(duplicates),
            "detail": f"{dup_pct:.2f}% de lignes dupliquées",
        },
        {
            "name": "Valeurs aberrantes",
            "value": round(outliers, 2),
            "status": status_for(outliers),
            "detail": f"{avg_outlier:.2f}% d'outliers en moyenne",
        },
        {
            "name": "Score qualité global",
            "value": quality,
            "status": status_for(float(quality)),
            "detail": "Score global calculé par l'agent EDA",
        },
    ]


@router.get("/diagnostic")
def run_diagnostic():
    checks: list[dict[str, Any]] = []

    # 1. Connexion base de données
    machine_count = sensor_count = alert_count = 0
    try:
        with db_session() as conn:
            conn.execute("SELECT 1")
            machine_count = conn.execute("SELECT COUNT(*) AS c FROM machine").fetchone()[0]
            sensor_count = conn.execute(
                "SELECT COUNT(*) AS c FROM capteur WHERE statut = 'actif'"
            ).fetchone()[0]
            alert_count = conn.execute(
                "SELECT COUNT(*) AS c FROM alerte WHERE timestamp_alerte >= datetime('now', '-7 days')"
            ).fetchone()[0]
        checks.append({
            "id": "db",
            "name": "Connexion base de données",
            "description": "Vérifie la connexion à la base SQLite principale",
            "status": "pass",
            "detail": "Connexion OK",
        })
    except Exception as exc:
        checks.append({
            "id": "db",
            "name": "Connexion base de données",
            "description": "Vérifie la connexion à la base SQLite principale",
            "status": "fail",
            "detail": str(exc),
        })
        return {"status": "done", "checks": checks}

    # 2. Machines référencées
    checks.append({
        "id": "machines",
        "name": "Machines référencées",
        "description": "Catalogue des machines disponibles",
        "status": "pass" if machine_count > 0 else "warning",
        "detail": f"{machine_count} machine(s) dans le catalogue",
    })

    # 3. Capteurs actifs
    checks.append({
        "id": "sensors",
        "name": "Capteurs actifs",
        "description": "Capteurs IoT au statut 'actif'",
        "status": "pass" if sensor_count > 0 else "warning",
        "detail": f"{sensor_count} capteur(s) actif(s)",
    })

    # 4. Alertes récentes (informatif, pas une erreur)
    checks.append({
        "id": "alerts",
        "name": "Alertes des 7 derniers jours",
        "description": "Volume d'alertes récentes (informatif)",
        "status": "pass",
        "detail": f"{alert_count} alerte(s) sur 7 jours",
    })

    # 5. Registre MLflow
    try:
        import mlflow
        from mlflow.tracking import MlflowClient

        if sys.platform == "win32":
            mlflow.set_tracking_uri(f"file:///{MLFLOW_DIR.resolve().as_posix()}")
        else:
            mlflow.set_tracking_uri(f"file://{MLFLOW_DIR.resolve()}")

        client = MlflowClient()
        registered = client.search_registered_models()
        registered_count = sum(1 for r in registered if r.name.startswith("maintenance_"))
        if registered_count > 0:
            checks.append({
                "id": "mlflow",
                "name": "Registre MLflow",
                "description": "Modèles enregistrés disponibles pour les prédictions",
                "status": "pass",
                "detail": f"{registered_count} modèle(s) enregistré(s)",
            })
        else:
            checks.append({
                "id": "mlflow",
                "name": "Registre MLflow",
                "description": "Modèles enregistrés disponibles pour les prédictions",
                "status": "warning",
                "detail": "Aucun modèle enregistré — lance un entraînement",
            })
    except Exception as exc:
        checks.append({
            "id": "mlflow",
            "name": "Registre MLflow",
            "description": "Modèles enregistrés disponibles pour les prédictions",
            "status": "fail",
            "detail": f"MLflow inaccessible : {exc}",
        })

    # 6. Répertoire d'uploads
    upload_count = 0
    if UPLOAD_DIR.exists():
        try:
            upload_count = sum(1 for _ in UPLOAD_DIR.iterdir() if _.is_file())
        except OSError:
            pass
    checks.append({
        "id": "uploads",
        "name": "Répertoire d'uploads",
        "description": "Fichiers déposés par les utilisateurs",
        "status": "pass" if UPLOAD_DIR.exists() else "warning",
        "detail": f"{upload_count} fichier(s) dans {UPLOAD_DIR.name}/" if UPLOAD_DIR.exists() else "Répertoire absent",
    })

    return {"status": "done", "checks": checks}


@router.post("/export")
def export_data(payload: dict, request: Request):
    fmt = (payload.get("format") or "csv").lower()
    period = payload.get("period", "7 derniers jours")
    base_url = str(request.base_url).rstrip("/")
    return {
        "status": "ok",
        "format": fmt,
        "period": period,
        "download_url": f"{base_url}/api/tools/download?format={quote(fmt)}&period={quote(period)}",
    }


@router.get("/download")
def download_export(format: str = "csv", period: str = "7 derniers jours"):
    fmt = (format or "csv").lower()
    days = _period_to_days(period)

    with db_session() as conn:
        if days is None:
            rows = conn.execute(
                "SELECT * FROM mesure_globale ORDER BY timestamp_mesure DESC LIMIT 2000"
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM mesure_globale WHERE timestamp_mesure >= datetime('now', ?) "
                "ORDER BY timestamp_mesure DESC",
                (f"-{days} days",),
            ).fetchall()

    df = pd.DataFrame(rows_to_list(rows)) if rows else pd.DataFrame()
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available for export")

    filename = f"outils_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

    if fmt == "csv":
        data = df.to_csv(index=False).encode("utf-8")
        headers = {"Content-Disposition": f"attachment; filename={filename}.csv"}
        return StreamingResponse(iter([data]), media_type="text/csv", headers=headers)

    if fmt == "json":
        data = df.to_json(orient="records", force_ascii=False).encode("utf-8")
        headers = {"Content-Disposition": f"attachment; filename={filename}.json"}
        return StreamingResponse(iter([data]), media_type="application/json", headers=headers)

    if fmt in ("excel", "xlsx"):
        output = io.BytesIO()
        df.to_excel(output, index=False)
        output.seek(0)
        headers = {"Content-Disposition": f"attachment; filename={filename}.xlsx"}
        return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)

    if fmt == "parquet":
        try:
            output = io.BytesIO()
            df.to_parquet(output, index=False)
            output.seek(0)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Parquet export unavailable: {exc}")
        headers = {"Content-Disposition": f"attachment; filename={filename}.parquet"}
        return StreamingResponse(output, media_type="application/octet-stream", headers=headers)

    raise HTTPException(status_code=400, detail="Unsupported format")


@router.get("/logs")
def get_system_logs():
    with db_session() as conn:
        rows = conn.execute(
            "SELECT id_alerte, timestamp_alerte, niveau, type_alerte, message "
            "FROM alerte ORDER BY timestamp_alerte DESC LIMIT 50"
        ).fetchall()
    logs = []
    for row in rows_to_list(rows):
        logs.append(
            {
                "id": f"alert-{row['id_alerte']}",
                "timestamp": row.get("timestamp_alerte"),
                "level": str(row.get("niveau", "info")).upper(),
                "source": row.get("type_alerte", "alerte"),
                "message": row.get("message") or "",
            }
        )
    return {"logs": logs}


@router.get("/data-quality")
def data_quality():
    latest = _latest_upload()
    df = pd.DataFrame()

    if latest:
        try:
            frames = parse_file(latest)
            df = next(iter(frames.values())) if frames else pd.DataFrame()
        except Exception:
            df = pd.DataFrame()

    if df.empty:
        df = _fetch_recent_measurements()

    if df.empty:
        return {"metrics": []}

    metrics = _quality_metrics(df)
    return {"metrics": metrics}
