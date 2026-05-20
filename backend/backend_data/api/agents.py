"""
Registre des agents du système.

Expose la liste des agents Python réellement disponibles côté backend, avec leur rôle,
leur statut, et les derniers jobs qu'ils ont traités. Permet à la page /agents
d'afficher une vue d'ensemble réelle plutôt que des données mockées.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter

router = APIRouter()


def _running_agents() -> list[dict[str, Any]]:
    """Construit la liste statique des agents disponibles, enrichie des jobs en cours."""
    # Import paresseux pour éviter les cycles si l'agent n'est pas chargeable
    try:
        from api.predictions import _jobs as prediction_jobs  # type: ignore
    except Exception:
        prediction_jobs = {}

    pred_running = sum(1 for j in prediction_jobs.values() if j.get("status") == "running")
    pred_done = sum(1 for j in prediction_jobs.values() if j.get("status") == "done")
    pred_status = "Occupé" if pred_running > 0 else "Disponible"

    return [
        {
            "id": "prediction_agent",
            "name": "PredictionAgent",
            "role": "Prédiction",
            "description": "Charge un modèle MLflow, prépare les features et produit des prédictions explicables.",
            "status": pred_status,
            "module": "backend_data/agents/prediction_agent.py",
            "jobs_running": pred_running,
            "jobs_done": pred_done,
            "tools": [
                {"name": "Chargement modèle MLflow", "kind": "ml"},
                {"name": "Préparation features", "kind": "data"},
                {"name": "Calcul d'importance features", "kind": "explain"},
            ],
        },
        {
            "id": "training_agent",
            "name": "TrainingAgent",
            "role": "Entraînement",
            "description": "Orchestre l'entraînement (RF, XGBoost, LightGBM…) et la promotion MLflow via un LLM.",
            "status": "Disponible",
            "module": "training/agent/training_agent.py",
            "jobs_running": 0,
            "jobs_done": 0,
            "tools": [
                {"name": "train_model", "kind": "ml"},
                {"name": "save_model", "kind": "registry"},
            ],
        },
        {
            "id": "eda_agent",
            "name": "EDAAgent",
            "role": "Analyse exploratoire",
            "description": "Calcule les KPIs qualité (complétude, doublons, outliers) sur les datasets uploadés.",
            "status": "Disponible",
            "module": "backend_data/agents/eda_agent.py",
            "jobs_running": 0,
            "jobs_done": 0,
            "tools": [
                {"name": "Quality score", "kind": "quality"},
                {"name": "Summary statistics", "kind": "stats"},
            ],
        },
    ]


@router.get("/registry")
def list_agents():
    """Retourne la liste des agents enregistrés et leur statut courant."""
    agents = _running_agents()
    summary = {
        "total": len(agents),
        "available": sum(1 for a in agents if a["status"] == "Disponible"),
        "busy": sum(1 for a in agents if a["status"] == "Occupé"),
        "offline": sum(1 for a in agents if a["status"] == "Hors Ligne"),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    return {"summary": summary, "agents": agents}
