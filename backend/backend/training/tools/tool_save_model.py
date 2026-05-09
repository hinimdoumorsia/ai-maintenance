"""
TOOL : save_model
──────────────────
Enregistre le meilleur modèle dans le MLflow Model Registry.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

import mlflow
import mlflow.sklearn

from config.settings import MLFLOW_TRACKING_URI, MLFLOW_EXPERIMENT, MODELS_DIR

logger = logging.getLogger(__name__)

# On configure le tracking URI une seule fois au niveau module
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)


# ─────────────────────────────────────────────────────────────────────────────
# Tool principal
# ─────────────────────────────────────────────────────────────────────────────

def save_model(
    model,
    model_id:             str,
    metrics:              dict,
    feature_cols:         list[str],
    target_col:           str,
    preprocessing_report: dict,
    run_label:            str   = "best",
    production_threshold: float = 0.80,
) -> dict[str, Any]:
    """
    Enregistre le modèle dans MLflow avec toutes ses métadonnées.
    """
    logger.info(f"[save_model] Sauvegarde {model_id} | run={run_label}")

    try:
        mlflow.set_experiment(MLFLOW_EXPERIMENT)
        registered_name = f"maintenance_{model_id}"
        saved_at        = datetime.utcnow().isoformat()

        with mlflow.start_run(run_name=f"{model_id}__SAVED__{run_label}") as run:
            # Params
            mlflow.log_param("model_id",       model_id)
            mlflow.log_param("run_label",      run_label)
            mlflow.log_param("target_col",     target_col)
            mlflow.log_param("n_features",     len(feature_cols))
            mlflow.log_param("saved_at",       saved_at)

            # Métriques
            for k, v in metrics.items():
                try:
                    mlflow.log_metric(k, float(v))
                except Exception:
                    pass

            # Artefacts JSON
            features_path = MODELS_DIR / "feature_cols.json"
            features_path.write_text(json.dumps(feature_cols, indent=2))
            mlflow.log_artifact(str(features_path), artifact_path="metadata")

            prep_path = MODELS_DIR / "preprocessing_report.json"
            prep_path.write_text(json.dumps(_json_safe(preprocessing_report), indent=2))
            mlflow.log_artifact(str(prep_path), artifact_path="metadata")

            # Modèle
            mlflow.sklearn.log_model(
                sk_model              = model,
                artifact_path         = "model",
                registered_model_name = registered_name,
            )

            run_id    = run.info.run_id
            model_uri = f"runs:/{run_id}/model"

            # Tag production
            primary  = "accuracy" if "accuracy" in metrics else "r2"
            score    = metrics.get(primary, 0)
            is_prod  = bool(score >= production_threshold)

            mlflow.set_tag("is_production",  str(is_prod))
            mlflow.set_tag("primary_metric", primary)
            mlflow.set_tag("score",          str(score))

        logger.info(f"[save_model] ✅ run_id={run_id} | production={is_prod}")

        return {
            "status":          "ok",
            "mlflow_run_id":   run_id,
            "model_uri":       model_uri,
            "registered_name": registered_name,
            "is_production":   is_prod,
            "saved_at":        saved_at,
            "score":           score,
            "error":           None,
        }

    except Exception as exc:
        logger.error(f"[save_model] ❌ {exc}", exc_info=True)
        return {"status": "error", "error": str(exc)}


def _json_safe(obj):
    if isinstance(obj, dict):
        return {k: _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_json_safe(v) for v in obj]
    if hasattr(obj, "tolist"):
        return obj.tolist()
    if hasattr(obj, "item"):
        return obj.item()
    return obj


# ─────────────────────────────────────────────────────────────────────────────
# Définition Groq Tool
# ─────────────────────────────────────────────────────────────────────────────
TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "save_model",
        "description": (
            "Enregistre le modèle ML entraîné dans le MLflow Model Registry avec toutes ses "
            "métadonnées : métriques, features, rapport de preprocessing. "
            "Ajoute le tag 'production' si le score dépasse le seuil configuré."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "run_label": {
                    "type":    "string",
                    "description": "Label du run (ex: 'baseline', 'cleaned', 'best').",
                    "default": "best"
                },
                "production_threshold": {
                    "type":    "number",
                    "description": "Score minimum pour taguer le modèle 'production'.",
                    "default": 0.80
                }
            },
            "required": []
        }
    }
}