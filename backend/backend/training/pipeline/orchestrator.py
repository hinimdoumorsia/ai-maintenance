from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import pandas as pd

from tools.tool_train_model import train_model
from tools.tool_save_model import save_model

logger = logging.getLogger(__name__)


def run_pipeline(
    file_path:   str,
    target_col:  str,
    model_id:    str = "random_forest",
    verbose:     bool = True,
) -> dict[str, Any]:
    def log(msg): 
        if verbose: 
            logger.info(msg)
            print(msg)

    log(f"\n{'='*60}")
    log(f"  PIPELINE — {Path(file_path).name} | modèle={model_id}")
    log(f"{'='*60}")

    # Lecture directe
    log("\n[1/2] Lecture des données...")
    suffix = Path(file_path).suffix.lower()
    if suffix == ".csv":
        df = pd.read_csv(file_path)
    elif suffix in (".xlsx", ".xls"):
        df = pd.read_excel(file_path)
    else:
        df = pd.read_json(file_path)
    
    log(f"      ✅ Shape: {df.shape}")
    
    if target_col not in df.columns:
        return {"status": "error", "step": "validate", "error": f"Colonne cible '{target_col}' absente"}
    
    # Entraînement
    log("\n[2/2] Entraînement...")
    feature_cols = [c for c in df.columns if c != target_col]
    train_result = train_model(df, target_col, model_id, feature_cols)
    if train_result["status"] != "ok":
        return {"status": "error", "step": "train", "error": train_result["error"]}

    best_run = train_result["best_run"]
    best_metrics = train_result[best_run]["metrics"]

    # Sauvegarde MLflow
    save_result = save_model(
        model                = train_result["best_model"],
        model_id             = model_id,
        metrics              = best_metrics,
        feature_cols         = feature_cols,
        target_col           = target_col,
        preprocessing_report = {},
        run_label            = best_run,
    )
    if save_result["status"] != "ok":
        return {"status": "error", "step": "save", "error": save_result["error"]}

    log(f"      ✅ Modèle enregistré - run_id: {save_result['mlflow_run_id']}")

    return {
        "status": "ok",
        "train": {k: v for k, v in train_result.items() if k != "best_model"},
        "save": save_result,
        "feature_cols": feature_cols,
        "target_col": target_col,
    }