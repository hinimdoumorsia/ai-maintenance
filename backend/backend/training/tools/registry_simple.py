from __future__ import annotations

import logging
from typing import Any

import pandas as pd

from tools.tool_train_model import train_model, TOOL_DEFINITION as DEF_TRAIN
from tools.tool_save_model import save_model, TOOL_DEFINITION as DEF_SAVE

logger = logging.getLogger(__name__)

TOOL_DEFINITIONS: list[dict] = [DEF_TRAIN, DEF_SAVE]


def dispatch_tool(tool_name: str, tool_args: dict[str, Any] | None, context: dict[str, Any]) -> dict[str, Any]:
    if tool_args is None:
        tool_args = {}

    if tool_name == "train_model":
        df = context.get("df")
        if df is None:
            return {"status": "error", "error": "DataFrame non chargé"}

        target_col = tool_args.get("target_col", context.get("target_col"))
        model_id = tool_args.get("model_id", context.get("model_id", "random_forest"))
        feature_cols = tool_args.get("feature_cols", context.get("feature_cols"))

        if not target_col:
            return {"status": "error", "error": "Colonne cible non spécifiée"}

        result = train_model(df, target_col, model_id, feature_cols)
        if result["status"] == "ok":
            context["train_result"] = result
            context["best_model"] = result["best_model"]
            context["model_id"] = model_id
        return _serializable({k: v for k, v in result.items() if k != "best_model"})

    elif tool_name == "save_model":
        model = context.get("best_model")
        train_result = context.get("train_result")
        if model is None or train_result is None:
            return {"status": "error", "error": "Appelez d'abord train_model"}

        best_run = train_result["best_run"]
        metrics = train_result[best_run]["metrics"]

        result = save_model(
            model=model,
            model_id=context.get("model_id", "random_forest"),
            metrics=metrics,
            feature_cols=context.get("feature_cols", []),
            target_col=context.get("target_col", "target"),
            preprocessing_report={},
            run_label=tool_args.get("run_label", best_run),
            production_threshold=tool_args.get("production_threshold", 0.80),
        )
        context["save_result"] = result
        return _serializable(result)

    else:
        return {"status": "error", "error": f"Tool inconnu : {tool_name}"}


def _serializable(obj):
    if isinstance(obj, dict):
        return {k: _serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serializable(v) for v in obj]
    if isinstance(obj, pd.DataFrame):
        return f"<DataFrame shape={obj.shape}>"
    if hasattr(obj, "predict"):
        return "<sklearn_model>"
    if hasattr(obj, "item"):
        return obj.item()
    if hasattr(obj, "tolist"):
        return obj.tolist()
    return obj