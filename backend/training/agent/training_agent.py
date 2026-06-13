"""
AGENT : TrainingAgent (version simplifiée - seulement train et save)
"""
from __future__ import annotations

import json
import logging
import os
import sys
from typing import Any

from groq import Groq

from config.settings import (
    GROQ_API_KEY, GROQ_MODEL, GROQ_MAX_TOKENS, GROQ_TEMPERATURE,
)
from tools.registry_simple import TOOL_DEFINITIONS, dispatch_tool

# ─── Fix encodage Windows (cp1252 → utf-8) ────────────────────────────────
# Évite UnicodeEncodeError sur les emojis (❌ ✅ etc.) dans la console Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ─── Logger avec handler UTF-8 ────────────────────────────────────────────
logger = logging.getLogger(__name__)

def _safe_log(msg: str) -> None:
    """Log sans planter sur les caractères Unicode non supportés par la console."""
    try:
        logger.info(msg)
    except UnicodeEncodeError:
        logger.info(msg.encode("ascii", errors="replace").decode("ascii"))


SYSTEM_PROMPT = """Tu es un agent ML expert en maintenance prédictive industrielle.
Tu disposes de 2 tools Python :

1. **train_model**   -> entraine un modele (Random Forest ou XGBoost) avec/sans outliers, compare les performances, et loggue dans MLflow
2. **save_model**    -> enregistre le meilleur modele dans le MLflow Model Registry

## Regles imperatives :
- Appelle TOUJOURS les tools dans cet ordre : train_model -> save_model
- Ne saute JAMAIS une etape
- Apres chaque tool, analyse le resultat et explique ce que tu as trouve
- Apres train_model, commente le delta de performance baseline vs cleaned
- Termine TOUJOURS par save_model pour persister le meilleur modele dans MLflow
- Reponds en francais sauf pour les noms techniques (accuracy, precision, recall, F1, RMSE...)
- Sois precis et pedagogue dans tes explications
- Si train_model retourne une erreur de colonne cible absente, utilise exactement le target_col fourni dans le message utilisateur
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

    def _emit_log(self, log_type: str, title: str, detail: str) -> None:
        import time
        entry = {
            "type":   log_type,
            "title":  title,
            "detail": detail,          # ← COMPLET, jamais tronqué ici
            "time":   time.strftime("%H:%M:%S"),
        }
        self.logs.append(entry)
        self.on_log(entry)
        _safe_log(f"[agent-log] [{log_type}] {title} | {detail}")

    def _call_groq(self) -> dict:
        response = self.client.chat.completions.create(
            model       = self.model,
            messages    = [{"role": "system", "content": SYSTEM_PROMPT}] + self.history,
            tools       = TOOL_DEFINITIONS,
            tool_choice = "auto",
            max_tokens  = GROQ_MAX_TOKENS,
            temperature = GROQ_TEMPERATURE,
        )
        return response

    def _process_tool_calls(self, message) -> bool:
        if not getattr(message, "tool_calls", None):
            return False

        self.history.append({
            "role":    "assistant",
            "content": message.content or "",
            "tool_calls": [
                {
                    "id":   tc.id,
                    "type": "function",
                    "function": {
                        "name":      tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in message.tool_calls
            ],
        })

        for tc in message.tool_calls:
            tool_name = tc.function.name
            tool_args = json.loads(tc.function.arguments or "{}")

            # ── Log COMPLET des arguments (pas de [:120]) ──────────────────
            args_str = json.dumps(tool_args, ensure_ascii=False)
            self._emit_log(
                log_type = "training" if tool_name == "train_model" else "model",
                title    = f"Execution : {tool_name}",
                detail   = f"Arguments : {args_str}",
            )

            # ── Injection du target_col réel dans les args si absent/faux ──
            if tool_name == "train_model":
                real_target = self.context.get("target_col")
                if real_target:
                    tool_args.setdefault("target_col", real_target)
                    # Corriger si l'agent a envoyé le mauvais target
                    if tool_args.get("target_col") != real_target:
                        _safe_log(
                            f"[agent] Correction target_col: "
                            f"'{tool_args['target_col']}' -> '{real_target}'"
                        )
                        tool_args["target_col"] = real_target

            result = dispatch_tool(tool_name, tool_args, self.context)

            # ── Log COMPLET du résultat ─────────────────────────────────────
            self._emit_log(
                log_type = "training" if tool_name == "train_model" else "model",
                title    = f"Resultat : {tool_name}",
                detail   = self._summarize_result(tool_name, result),
            )

            self.history.append({
                "role":        "tool",
                "tool_call_id": tc.id,
                "content":     json.dumps(result, ensure_ascii=False, default=str),
            })

        return True

    @staticmethod
    def _summarize_result(tool_name: str, result: dict) -> str:
        if result.get("status") == "error":
            return f"Erreur : {result.get('error')}"
        if tool_name == "train_model":
            cmp = result.get("comparison", {})
            return (
                f"baseline={cmp.get('baseline_score')} | "
                f"cleaned={cmp.get('cleaned_score')} | "
                f"winner={cmp.get('winner')}"
            )
        if tool_name == "save_model":
            run_id = result.get("mlflow_run_id", "?")
            return (
                f"run_id={run_id[:8]}... | "
                f"production={result.get('is_production')}"
            )
        return str(result)[:500]

    def run(
        self,
        file_path:  str,
        model_id:   str = "random_forest",
        target_col: str | None = None,
    ) -> dict[str, Any]:

        _safe_log(f"[TrainingAgent] run() | file={file_path} | model={model_id}")

        import pandas as pd

        # ── Lecture fichier ────────────────────────────────────────────────
        suffix = file_path.rsplit(".", 1)[-1].lower()
        if suffix == "csv":
            df = pd.read_csv(file_path)
        elif suffix in ("xlsx", "xls"):
            df = pd.read_excel(file_path)
        else:
            df = pd.read_json(file_path)

        # ── Résolution automatique de la colonne cible ──────────────────
        # Si target_col n'est pas dans le df, chercher une correspondance
        # insensible à la casse ou prendre la dernière colonne
        resolved_target = self._resolve_target_col(df, target_col)
        if resolved_target != target_col:
            _safe_log(
                f"[agent] target_col resolu: '{target_col}' -> '{resolved_target}'"
            )

        feature_cols = [c for c in df.columns if c != resolved_target]

        self.context = {
            "file_path":   file_path,
            "model_id":    model_id,
            "target_col":  resolved_target,   # ← toujours le bon nom réel
            "df":          df,
            "feature_cols": feature_cols,
            "train_result": None,
            "best_model":  None,
            "save_result": None,
        }
        self.history = []
        self.logs    = []

        # ── Message utilisateur avec colonnes exactes ──────────────────────
        user_msg = (
            f"Lance l'entrainement sur ce fichier : {file_path}\n"
            f"Modele : {model_id}\n"
            f"Colonne cible : {resolved_target}\n"
            f"Colonnes features disponibles : {feature_cols}\n"
            f"Colonnes exactes du fichier : {list(df.columns)}\n"
            f"Utilise EXACTEMENT '{resolved_target}' comme target_col dans train_model.\n"
            f"Execute dans l'ordre : train_model -> save_model"
        )

        self.history.append({"role": "user", "content": user_msg})
        self._emit_log(
            "dataset",
            "Pipeline demarre",
            f"Fichier: {file_path} | Modele: {model_id} | shape: {df.shape} | "
            f"target: {resolved_target} | features: {len(feature_cols)} colonnes",
        )

        final_answer = ""
        MAX_TURNS    = 10

        for turn in range(MAX_TURNS):
            response = self._call_groq()
            message  = response.choices[0].message

            if self._process_tool_calls(message):
                continue

            final_answer = message.content or ""
            self.history.append({"role": "assistant", "content": final_answer})
            self._emit_log("explain", "Agent - Analyse finale", final_answer)
            break

        save_result  = self.context.get("save_result")  or {}
        train_result = self.context.get("train_result") or {}

        return {
            "status":       "ok" if save_result.get("status") == "ok" else "partial",
            "final_answer": final_answer,
            "logs":         self.logs,
            "context": {
                "mlflow_run_id": save_result.get("mlflow_run_id"),
                "model_uri":     save_result.get("model_uri"),
                "is_production": save_result.get("is_production"),
                "best_run":      train_result.get("best_run"),
                "comparison":    train_result.get("comparison"),
                "feature_cols":  self.context.get("feature_cols", []),
                "target_col":    self.context.get("target_col"),
                "shape":         list(df.shape),
            },
            "error": None,
        }

    @staticmethod
    def _resolve_target_col(df: "pd.DataFrame", target_col: str | None) -> str:
        """
        Résout le nom exact de la colonne cible dans le DataFrame.
        Stratégies (dans l'ordre) :
          1. Correspondance exacte
          2. Correspondance insensible à la casse
          3. Première colonne dont le nom contient target_col (sous-chaîne)
          4. Dernière colonne du DataFrame (fallback)
        """
        if not target_col:
            return df.columns[-1]

        # 1. Exact
        if target_col in df.columns:
            return target_col

        # 2. Case-insensitive
        lower = target_col.lower()
        for col in df.columns:
            if col.lower() == lower:
                return col

        # 3. Substring
        for col in df.columns:
            if lower in col.lower() or col.lower() in lower:
                return col

        # 4. Fallback: dernière colonne
        return df.columns[-1]