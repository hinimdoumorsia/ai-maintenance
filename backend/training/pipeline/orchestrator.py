"""
Pipeline ML — 100 % dynamique (aucune colonne en dur)
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import pandas as pd

from tools.tool_train_model import train_model
from tools.tool_save_model import save_model

logger = logging.getLogger(__name__)


# ─── Colonnes à exclure automatiquement (identifiants, dates, etc.) ────────
_EXCLUDE_PATTERNS = (
    "id", "index", "uuid", "timestamp", "date", "time",
    "created_at", "updated_at", "row_number",
)


def _infer_feature_cols(df: pd.DataFrame, target_col: str) -> list[str]:
    """
    Retourne toutes les colonnes utilisables comme features :
    - Exclut la colonne cible
    - Exclut les colonnes purement textuelles (object avec cardinalité trop haute)
    - Exclut les colonnes dont le nom ressemble à un identifiant
    """
    candidates = []
    for col in df.columns:
        if col == target_col:
            continue
        # Exclure les patterns d'identifiants
        if any(pat in col.lower() for pat in _EXCLUDE_PATTERNS):
            logger.info(f"[pipeline] Colonne ignorée (pattern id/date) : {col}")
            continue
        # Exclure les colonnes textuelles à haute cardinalité
        if df[col].dtype == object:
            n_unique = df[col].nunique()
            if n_unique > min(50, len(df) * 0.5):
                logger.info(f"[pipeline] Colonne ignorée (texte haute cardinalité) : {col} ({n_unique} valeurs uniques)")
                continue
        candidates.append(col)
    return candidates


def _load_file(file_path: str) -> pd.DataFrame:
    """Charge n'importe quel CSV / Excel / JSON."""
    suffix = Path(file_path).suffix.lower()
    if suffix == ".csv":
        # Essayer plusieurs séparateurs
        for sep in (",", ";", "\t", "|"):
            try:
                df = pd.read_csv(file_path, sep=sep)
                if df.shape[1] > 1:
                    return df
            except Exception:
                continue
        return pd.read_csv(file_path)          # fallback
    elif suffix in (".xlsx", ".xls"):
        return pd.read_excel(file_path)
    elif suffix == ".json":
        return pd.read_json(file_path)
    else:
        raise ValueError(f"Format non supporté : {suffix}")


def run_pipeline(
    file_path:   str,
    target_col:  str,
    model_id:    str = "random_forest",
    verbose:     bool = True,
) -> dict[str, Any]:

    def log(msg: str):
        if verbose:
            logger.info(msg)
            print(msg)

    log(f"\n{'='*60}")
    log(f"  PIPELINE — {Path(file_path).name} | modèle={model_id}")
    log(f"{'='*60}")

    # ── 1. Lecture ──────────────────────────────────────────────────────────
    log("\n[1/3] Lecture des données…")
    try:
        df = _load_file(file_path)
    except Exception as exc:
        return {"status": "error", "step": "load", "error": str(exc)}

    log(f"      ✅ Shape : {df.shape}  |  colonnes : {list(df.columns)}")

    # ── 2. Validation colonne cible ─────────────────────────────────────────
    if target_col not in df.columns:
        available = ", ".join(df.columns.tolist())
        return {
            "status": "error",
            "step":   "validate",
            "error":  f"Colonne cible '{target_col}' absente. Colonnes disponibles : {available}",
        }

    # ── 3. Inférence dynamique des features ─────────────────────────────────
    log("\n[2/3] Sélection dynamique des features…")
    feature_cols = _infer_feature_cols(df, target_col)

    if not feature_cols:
        return {
            "status": "error",
            "step":   "validate",
            "error":  "Aucune colonne feature valide trouvée dans le dataset.",
        }

    log(f"      ✅ Features retenues ({len(feature_cols)}) : {feature_cols}")
    log(f"      🎯 Cible : {target_col}")

    # ── 4. Entraînement ─────────────────────────────────────────────────────
    log("\n[3/3] Entraînement…")
    train_result = train_model(df, target_col, model_id, feature_cols)
    if train_result.get("status") != "ok":
        return {"status": "error", "step": "train", "error": train_result.get("error")}

    best_run     = train_result["best_run"]
    best_metrics = train_result[best_run]["metrics"]

    # ── 5. Sauvegarde MLflow ────────────────────────────────────────────────
    save_result = save_model(
        model                = train_result["best_model"],
        model_id             = model_id,
        metrics              = best_metrics,
        feature_cols         = feature_cols,
        target_col           = target_col,
        preprocessing_report = {},
        run_label            = best_run,
    )
    if save_result.get("status") != "ok":
        return {"status": "error", "step": "save", "error": save_result.get("error")}

    log(f"      ✅ Modèle enregistré — run_id : {save_result['mlflow_run_id']}")
    log(f"\n{'='*60}\n  PIPELINE TERMINÉ\n{'='*60}\n")

    return {
        "status":       "ok",
        "train":        {k: v for k, v in train_result.items() if k != "best_model"},
        "save":         save_result,
        "feature_cols": feature_cols,
        "target_col":   target_col,
        "shape":        list(df.shape),
    }