"""
AGENT : TrainingAgent (version simplifiée - seulement train et save)
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any

from groq import Groq

from config.settings import (
    GROQ_API_KEY, GROQ_MODEL, GROQ_MAX_TOKENS, GROQ_TEMPERATURE,
)
from tools.registry_simple import TOOL_DEFINITIONS, dispatch_tool

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """Tu es un agent ML expert en maintenance prédictive industrielle.
Tu disposes de 2 tools Python :

1. **train_model**   → entraîne un modèle (Random Forest ou XGBoost) avec/sans outliers, compare les performances, et loggue dans MLflow
2. **save_model**    → enregistre le meilleur modèle dans le MLflow Model Registry

## Règles impératives :
- Appelle TOUJOURS les tools dans cet ordre : train_model → save_model
- Ne saute JAMAIS une étape
- Après chaque tool, analyse le résultat et explique ce que tu as trouvé
- Après train_model, commente le delta de performance baseline vs cleaned
- Termine TOUJOURS par save_model pour persister le meilleur modèle dans MLflow
- Réponds en français sauf pour les noms techniques (accuracy, precision, recall, F1, RMSE…)
- Sois précis et pédagogue dans tes explications
"""


class TrainingAgent:
    def __init__(self, api_key: str | None = None, model: str | None = None, on_log: Any = None):
        key = api_key or GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        if not key:
            raise ValueError("GROQ_API_KEY manquante")
        self.client = Groq(api_key=key)
        self.model = model or GROQ_MODEL
        self.on_log = on_log or (lambda entry: None)
        self.context: dict[str, Any] = {}
        self.history: list[dict] = []
        self.logs: list[dict] = []

    def _emit_log(self, log_type: str, title: str, detail: str):
        import time
        entry = {
            "type": log_type,
            "title": title,
            "detail": detail,
            "time": time.strftime("%H:%M:%S"),
        }
        self.logs.append(entry)
        self.on_log(entry)
        logger.info(f"[agent-log] [{log_type}] {title} | {detail}")

    def _call_groq(self) -> dict:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + self.history,
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
            max_tokens=GROQ_MAX_TOKENS,
            temperature=GROQ_TEMPERATURE,
        )
        return response

    def _process_tool_calls(self, message) -> bool:
        if not getattr(message, "tool_calls", None):
            return False

        self.history.append({
            "role": "assistant",
            "content": message.content or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    }
                }
                for tc in message.tool_calls
            ],
        })

        for tc in message.tool_calls:
            tool_name = tc.function.name
            tool_args = json.loads(tc.function.arguments or "{}")

            self._emit_log(
                log_type="training" if tool_name == "train_model" else "model",
                title=f"Exécution : {tool_name}",
                detail=f"Arguments : {json.dumps(tool_args, ensure_ascii=False)[:120]}",
            )

            result = dispatch_tool(tool_name, tool_args, self.context)

            self._emit_log(
                log_type="training" if tool_name == "train_model" else "model",
                title=f"Résultat : {tool_name}",
                detail=self._summarize_result(tool_name, result),
            )

            self.history.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result, ensure_ascii=False, default=str),
            })

        return True

    @staticmethod
    def _summarize_result(tool_name: str, result: dict) -> str:
        if result.get("status") == "error":
            return f"❌ Erreur : {result.get('error')}"
        if tool_name == "train_model":
            cmp = result.get("comparison", {})
            return f"baseline={cmp.get('baseline_score')} | cleaned={cmp.get('cleaned_score')} | winner={cmp.get('winner')}"
        if tool_name == "save_model":
            return f"run_id={result.get('mlflow_run_id','?')[:8]}... | production={result.get('is_production')}"
        return str(result)[:200]

    def run(self, file_path: str, model_id: str = "random_forest", target_col: str | None = None) -> dict[str, Any]:
        logger.info(f"[TrainingAgent] run() | file={file_path} | model={model_id}")

        import pandas as pd
        
        # Lecture directe du fichier
        suffix = file_path.split(".")[-1].lower()
        if suffix == "csv":
            df = pd.read_csv(file_path)
        elif suffix in ("xlsx", "xls"):
            df = pd.read_excel(file_path)
        else:
            df = pd.read_json(file_path)
        
        feature_cols = [c for c in df.columns if c != target_col]

        self.context = {
            "file_path": file_path,
            "model_id": model_id,
            "target_col": target_col,
            "df": df,
            "feature_cols": feature_cols,
            "train_result": None,
            "best_model": None,
            "save_result": None,
        }
        self.history = []
        self.logs = []

        user_msg = (
            f"Lance l'entraînement sur ce fichier : {file_path}\n"
            f"Modèle : {model_id}\n"
            f"Colonne cible : {target_col}\n"
            f"Colonnes features : {feature_cols}\n"
            f"Exécute dans l'ordre : train_model → save_model"
        )

        self.history.append({"role": "user", "content": user_msg})
        self._emit_log("dataset", "Pipeline démarré", f"Fichier: {file_path} | Modèle: {model_id} | shape: {df.shape}")

        final_answer = ""
        MAX_TURNS = 10

        for turn in range(MAX_TURNS):
            response = self._call_groq()
            message = response.choices[0].message

            if self._process_tool_calls(message):
                continue

            final_answer = message.content or ""
            self.history.append({"role": "assistant", "content": final_answer})
            self._emit_log("explain", "Agent — Analyse finale", final_answer[:300])
            break

        save_result = self.context.get("save_result", {})
        train_result = self.context.get("train_result", {})

        return {
            "status": "ok" if save_result.get("status") == "ok" else "partial",
            "final_answer": final_answer,
            "logs": self.logs,
            "context": {
                "mlflow_run_id": save_result.get("mlflow_run_id"),
                "model_uri": save_result.get("model_uri"),
                "is_production": save_result.get("is_production"),
                "best_run": train_result.get("best_run"),
                "comparison": train_result.get("comparison"),
                "feature_cols": self.context.get("feature_cols", []),
                "target_col": self.context.get("target_col"),
                "shape": list(df.shape),
            },
            "error": None,
        }