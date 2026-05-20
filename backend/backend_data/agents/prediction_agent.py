"""
PredictionAgent : orchestre une prédiction de maintenance à partir d'un modèle MLflow.

Émet des logs sémantiques (observation / model / analysis / prediction / done / error)
via un callback `on_log`. Produit également des explications structurées consommables
par l'UI (ExplanationsCard).

Pas de dépendance LLM : agent déterministe, autonome. Un mode LLM pourra être branché
plus tard via une sous-classe.
"""
from __future__ import annotations

import json
import logging
import sys
import time
from pathlib import Path
from typing import Any, Callable

import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
from mlflow.tracking import MlflowClient

from agents.file_parser import parse_file

logger = logging.getLogger(__name__)

LogCallback = Callable[[dict[str, Any]], None]


def _configure_mlflow(mlflow_dir: Path) -> None:
    if sys.platform == "win32":
        mlflow.set_tracking_uri(f"file:///{mlflow_dir.resolve().as_posix()}")
    else:
        mlflow.set_tracking_uri(f"file://{mlflow_dir.resolve()}")


class PredictionAgent:
    """Agent de prédiction déterministe (sans LLM)."""

    def __init__(
        self,
        mlflow_dir: Path,
        on_log: LogCallback | None = None,
        anomaly_threshold: float = 0.5,
    ) -> None:
        _configure_mlflow(mlflow_dir)
        self.mlflow_dir = mlflow_dir
        self.on_log: LogCallback = on_log or (lambda _entry: None)
        self.anomaly_threshold = anomaly_threshold
        self.logs: list[dict[str, Any]] = []
        self.explanations: list[dict[str, Any]] = []

    # ── Logging helpers ───────────────────────────────────────────────────
    @staticmethod
    def _now() -> str:
        return time.strftime("%H:%M:%S")

    def _emit(self, type_: str, message: str, **extra: Any) -> None:
        entry: dict[str, Any] = {"type": type_, "message": message, "time": self._now()}
        if extra:
            entry.update(extra)
        self.logs.append(entry)
        try:
            self.on_log(entry)
        except Exception as exc:
            logger.warning("on_log callback failed: %s", exc)

    def _add_explanation(self, type_: str, title: str, content: str) -> None:
        self.explanations.append(
            {"type": type_, "title": title, "content": content, "time": self._now()}
        )

    # ── Model loading ─────────────────────────────────────────────────────
    @staticmethod
    def _version_key(v: Any) -> int:
        try:
            return int(v.version)
        except Exception:
            return 0

    def _load_latest_model(self, model_id: str) -> tuple[Any, list[str], str, str]:
        """
        Charge un modèle depuis MLflow.

        Stratégie de sélection :
        1) Version au stage `Production` si elle existe (standard MLflow)
        2) Version au stage `Staging` à défaut
        3) Sinon, la version la plus récente (numéro le plus haut)

        Retourne (model, feature_cols, version, source) où `source` indique d'où vient
        le modèle ("production", "staging" ou "latest").
        """
        registered_name = f"maintenance_{model_id}"
        client = MlflowClient()
        versions = client.search_model_versions(f"name='{registered_name}'")
        if not versions:
            raise ValueError(
                f"Aucun modèle MLflow enregistré pour '{registered_name}'. "
                "Lance d'abord un entraînement."
            )

        prod = [v for v in versions if (getattr(v, "current_stage", "") or "").lower() == "production"]
        staging = [v for v in versions if (getattr(v, "current_stage", "") or "").lower() == "staging"]

        if prod:
            chosen = sorted(prod, key=self._version_key, reverse=True)[0]
            source = "production"
        elif staging:
            chosen = sorted(staging, key=self._version_key, reverse=True)[0]
            source = "staging"
        else:
            chosen = sorted(versions, key=self._version_key, reverse=True)[0]
            source = "latest"

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

        return model, feature_cols, str(chosen.version), source

    # ── Data prep ─────────────────────────────────────────────────────────
    @staticmethod
    def _load_input_dataframe(file_path: Path) -> pd.DataFrame:
        frames = parse_file(file_path)
        if not frames:
            raise ValueError("Le fichier déposé ne contient aucune donnée exploitable")
        return next(iter(frames.values()))

    @staticmethod
    def _prepare_features(df: pd.DataFrame, feature_cols: list[str]) -> tuple[pd.DataFrame, int]:
        missing_filled = 0
        if feature_cols:
            data = df.copy()
            for col in feature_cols:
                if col not in data.columns:
                    data[col] = np.nan
                    missing_filled += 1
            data = data[feature_cols]
        else:
            data = df.select_dtypes(include=[np.number])

        if data.empty:
            raise ValueError("Aucune feature numérique exploitable trouvée dans le fichier")

        missing_total = int(data.isna().sum().sum())
        data = data.fillna(0)
        return data, missing_total

    # ── Prediction + summary ──────────────────────────────────────────────
    @staticmethod
    def _predict(model: Any, data: pd.DataFrame) -> tuple[list[float], bool]:
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(data)
            if isinstance(proba, np.ndarray) and proba.ndim == 2 and proba.shape[1] > 1:
                return [float(v) for v in proba[:, 1]], True
        preds = model.predict(data)
        return [float(v) for v in preds], False

    def _summarize(self, preds: list[float], is_proba: bool) -> dict[str, Any]:
        if not preds:
            return {"count": 0}
        arr = np.array(preds, dtype=float)
        anomalies = int((arr >= self.anomaly_threshold).sum()) if is_proba else int((arr != 0).sum())
        return {
            "count": int(arr.size),
            "mean": float(arr.mean()),
            "min": float(arr.min()),
            "max": float(arr.max()),
            "p05": float(np.quantile(arr, 0.05)),
            "p95": float(np.quantile(arr, 0.95)),
            "anomalies": anomalies,
            "anomaly_rate": float(anomalies / arr.size),
            "is_proba": is_proba,
        }

    @staticmethod
    def _feature_importance(model: Any, feature_cols: list[str], top_k: int = 5) -> list[dict[str, float]]:
        importances = getattr(model, "feature_importances_", None)
        if importances is None or not feature_cols:
            return []
        pairs = sorted(
            zip(feature_cols, [float(v) for v in importances]),
            key=lambda x: x[1],
            reverse=True,
        )
        return [{"feature": name, "importance": round(score, 4)} for name, score in pairs[:top_k]]

    # ── Main entry point ─────────────────────────────────────────────────
    def run(
        self,
        file_path: Path,
        model_id: str,
        window_days: int = 7,
        forecast: bool = False,
        batch: bool = True,
    ) -> dict[str, Any]:
        """
        Exécute le pipeline de prédiction.

        Paramètres utilisateur (transmis depuis l'UI) :
        - window_days : horizon de prédiction en jours (informatif pour l'instant ;
          sera utilisé quand un vrai forecast temporel sera branché)
        - forecast    : True si l'utilisateur veut une projection temporelle (vs
          inférence ponctuelle). Sans modèle de forecast, on log juste l'intention.
        - batch       : True si l'utilisateur veut traiter tout le fichier en une
          passe (mode par défaut). Conservé pour compat future avec un mode "online".
        """
        self.logs = []
        self.explanations = []

        try:
            # 1) Observation — paramètres utilisateur + chargement du fichier
            self._emit(
                "observation",
                f"Paramètres : fenêtre {window_days}j · forecast={'on' if forecast else 'off'} · batch={'on' if batch else 'off'}",
                window_days=window_days,
                forecast=forecast,
                batch=batch,
            )
            self._add_explanation(
                "observation",
                "Paramètres choisis",
                f"Horizon : {window_days} jours · Forecast : {'activé' if forecast else 'désactivé'} · Batch : {'activé' if batch else 'désactivé'}.",
            )

            self._emit("observation", f"Lecture du fichier {file_path.name}")
            df = self._load_input_dataframe(file_path)
            rows, cols = df.shape
            self._emit(
                "observation",
                f"Fichier chargé : {rows} lignes, {cols} colonnes",
                rows=rows,
                cols=cols,
            )
            self._add_explanation(
                "observation",
                "Données analysées",
                f"{rows} observations sur {cols} colonnes ont été lues depuis « {file_path.name} ».",
            )

            # 2) Model — chargement du modèle MLflow
            self._emit("model", f"Chargement du modèle « {model_id} » depuis MLflow")
            model, feature_cols, version, source = self._load_latest_model(model_id)
            source_label = {
                "production": "stage Production",
                "staging": "stage Staging",
                "latest": "dernière version",
            }.get(source, source)
            self._emit(
                "model",
                f"Modèle {model_id} v{version} chargé depuis le {source_label} ({len(feature_cols)} features)",
                model_id=model_id,
                version=version,
                source=source,
                feature_count=len(feature_cols),
            )
            self._add_explanation(
                "model",
                "Modèle utilisé",
                f"{model_id} (version {version}, {source_label}) — entraîné sur {len(feature_cols)} features.",
            )

            # 3) Analysis — préparation des features
            data, missing = self._prepare_features(df, feature_cols)
            if missing > 0:
                self._emit(
                    "analysis",
                    f"{missing} valeurs manquantes imputées (fillna=0)",
                    missing=missing,
                )
            self._emit(
                "analysis",
                f"Préparation features OK : matrice {data.shape[0]}×{data.shape[1]}",
                shape=list(data.shape),
            )

            # 4) Prediction — inférence
            self._emit("prediction", "Inférence en cours")
            preds, is_proba = self._predict(model, data)
            summary = self._summarize(preds, is_proba)
            kind = "probabilités" if is_proba else "prédictions discrètes"
            self._emit(
                "prediction",
                f"{summary['count']} {kind} générées — anomalies détectées : {summary.get('anomalies', 0)}",
                **summary,
            )
            self._add_explanation(
                "analysis",
                "Analyse des résultats",
                self._build_analysis_text(summary),
            )

            # 5) Feature importance (si dispo)
            importances = self._feature_importance(model, feature_cols)
            if importances:
                top_str = ", ".join(f"{i['feature']} ({i['importance']:.2f})" for i in importances[:3])
                self._emit("analysis", f"Top features : {top_str}", feature_importance=importances)
                self._add_explanation(
                    "analysis",
                    "Variables les plus influentes",
                    "Les variables qui ont le plus pesé dans cette prédiction : " + top_str + ".",
                )

            # 6) Conclusion
            self._add_explanation(
                "prediction",
                "Conclusion",
                self._build_conclusion_text(summary, model_id, version),
            )

            result = {
                "predictions": preds,
                "summary": {
                    **summary,
                    "model_id": model_id,
                    "model_version": version,
                    "model_source": source,
                },
                "explanations": self.explanations,
                "feature_importance": importances,
            }
            self._emit("done", "Prédiction terminée avec succès", summary=result["summary"])
            return {"status": "done", "result": result, "logs": self.logs}

        except Exception as exc:  # noqa: BLE001 — on remonte tout via le stream
            logger.exception("PredictionAgent failed")
            self._emit("error", str(exc))
            return {"status": "error", "result": {"error": str(exc)}, "logs": self.logs}

    # ── Text helpers for explanations ────────────────────────────────────
    @staticmethod
    def _build_analysis_text(summary: dict[str, Any]) -> str:
        if not summary or summary.get("count", 0) == 0:
            return "Aucune prédiction générée."
        if summary.get("is_proba"):
            return (
                f"Probabilité moyenne de défaillance : {summary['mean']:.2%}. "
                f"Plage observée : [{summary['min']:.2%} — {summary['max']:.2%}]. "
                f"{summary['anomalies']} observations dépassent le seuil d'alerte."
            )
        return (
            f"Sur {summary['count']} observations, {summary['anomalies']} prédictions positives "
            f"(taux : {summary['anomaly_rate']:.1%}). "
            f"Valeur moyenne : {summary['mean']:.3f}."
        )

    @staticmethod
    def _build_conclusion_text(summary: dict[str, Any], model_id: str, version: str) -> str:
        if not summary or summary.get("count", 0) == 0:
            return "Aucune prédiction exploitable."
        rate = summary.get("anomaly_rate", 0.0)
        if rate >= 0.3:
            verdict = "⚠️ Risque élevé : maintenance préventive recommandée."
        elif rate >= 0.1:
            verdict = "Risque modéré : surveillance renforcée conseillée."
        else:
            verdict = "Risque faible : fonctionnement nominal attendu."
        return f"{verdict} (modèle {model_id} v{version}, {summary['count']} prédictions)"
