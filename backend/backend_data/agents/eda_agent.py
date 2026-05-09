# backend/agents/eda_agent.py
# Agent EDA intelligent — analyse, prétraitement, rapport PDF et détection de type de données.
# Utilise Claude (Anthropic) pour la planification et la narration de l'analyse.

from __future__ import annotations

import base64
import io
import json
import os
import traceback
import warnings
from datetime import datetime
from pathlib import Path
from typing import Any

# Supprimer les UserWarnings répétitifs sur l'inférence de format datetime
warnings.filterwarnings("ignore", message="Could not infer format", category=UserWarning)

import matplotlib
matplotlib.use("Agg")  # backend non-interactif — indispensable hors GUI
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from fpdf import FPDF

from .file_parser import parse_file

# ─── Chemins ──────────────────────────────────────────────────────────────────

BASE_DIR      = Path(__file__).resolve().parent.parent
UPLOAD_DIR    = BASE_DIR / "data" / "uploads"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
PLOTS_DIR     = BASE_DIR / "data" / "plots"
REPORTS_DIR   = BASE_DIR / "data" / "reports"

for d in (UPLOAD_DIR, PROCESSED_DIR, PLOTS_DIR, REPORTS_DIR):
    d.mkdir(parents=True, exist_ok=True)

# ─── Détection du type de données ─────────────────────────────────────────────

VIBRATION_KEYWORDS  = {"vibration", "vrms", "rms", "acceleration", "velocity", "displacement",
                        "fft", "frequency", "rpm", "bearing", "fault", "defect", "sensor",
                        "amplitude", "kurtosis", "crest", "bpfo", "bpfi", "imf", "rul"}
KPI_KEYWORDS        = {"oee", "mtbf", "mttr", "availability", "disponibilite", "trs",
                       "performance", "quality", "uptime", "downtime", "production"}
MAINTENANCE_KEYWORDS = {"maintenance", "failure", "repair", "work_order", "bt", "panne",
                        "intervention", "component", "piece", "remplacement"}
MACHINE_KEYWORDS    = {"machine", "equipment", "asset", "motor", "pump", "compressor",
                       "machine_id", "equipment_id", "id_machine"}


def _detect_data_type(df: pd.DataFrame) -> str:
    cols_lower = {c.lower().replace(" ", "_") for c in df.columns}
    scores = {
        "vibration":   sum(any(k in c for k in VIBRATION_KEYWORDS)  for c in cols_lower),
        "kpi":         sum(any(k in c for k in KPI_KEYWORDS)         for c in cols_lower),
        "maintenance": sum(any(k in c for k in MAINTENANCE_KEYWORDS) for c in cols_lower),
        "machine":     sum(any(k in c for k in MACHINE_KEYWORDS)     for c in cols_lower),
    }
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "generic"


# ─── Calcul du résumé statistique ─────────────────────────────────────────────

def _compute_summary(df: pd.DataFrame) -> dict[str, Any]:
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

    missing = df.isnull().sum()
    missing_pct = (missing / len(df) * 100).round(2)

    summary: dict[str, Any] = {
        "n_rows":       len(df),
        "n_cols":       len(df.columns),
        "n_numeric":    len(num_cols),
        "n_categorical":len(cat_cols),
        "missing_total":int(missing.sum()),
        "missing_pct":  float(missing_pct.mean().round(2)),
        "duplicates":   int(df.duplicated().sum()),
        "columns": [],
    }

    for col in df.columns:
        col_info: dict[str, Any] = {
            "name":       col,
            "dtype":      str(df[col].dtype),
            "missing":    int(df[col].isnull().sum()),
            "missing_pct":round(df[col].isnull().sum() / len(df) * 100, 2),
            "unique":     int(df[col].nunique()),
        }
        if col in num_cols:
            col_info["type"] = "numeric"
            _data = df[col].dropna()
            col_info["mean"] = round(float(_data.mean()), 4) if len(_data) > 0 else None
            col_info["std"]  = round(float(_data.std()),  4) if len(_data) > 0 else None
            col_info["min"]  = round(float(_data.min()),  4) if len(_data) > 0 else None
            col_info["max"]  = round(float(_data.max()),  4) if len(_data) > 0 else None
            if len(_data) > 1:
                _q1, _q3 = float(_data.quantile(0.25)), float(_data.quantile(0.75))
                _iqr = _q3 - _q1
                _outliers = (_data < _q1 - 1.5 * _iqr) | (_data > _q3 + 1.5 * _iqr)
                col_info["q25"]         = round(_q1, 4)
                col_info["q75"]         = round(_q3, 4)
                col_info["n_outliers"]  = int(_outliers.sum())
                col_info["outlier_pct"] = round(float(_outliers.sum() / len(_data) * 100), 1)
                col_info["skewness"]    = round(float(_data.skew()), 3)
                col_info["kurtosis"]    = round(float(_data.kurt()), 3)
        else:
            col_info["type"] = "categorical"
            top_vals = df[col].value_counts().head(5).to_dict()
            col_info["top_values"] = {str(k): int(v) for k, v in top_vals.items()}

        summary["columns"].append(col_info)

    return summary



# ─── Score qualité dataset ────────────────────────────────────────────────────

def _compute_quality_score(summary: dict) -> int:
    """Score de qualité 0-100 selon : valeurs manquantes, doublons, outliers, asymétrie."""
    score = 100
    # Pénalité valeurs manquantes (max -30)
    score -= min(30, summary.get("missing_pct", 0) * 3)
    # Pénalité doublons (max -10)
    dup_pct = summary.get("duplicates", 0) / max(summary.get("n_rows", 1), 1) * 100
    score -= min(10, dup_pct * 2)
    # Pénalité outliers IQR — moyenne des colonnes numériques (max -30)
    num_cols_info = [c for c in summary.get("columns", []) if c.get("type") == "numeric"]
    if num_cols_info:
        avg_outlier_pct = sum(c.get("outlier_pct", 0) for c in num_cols_info) / len(num_cols_info)
        score -= min(30, avg_outlier_pct * 2)
    # Pénalité asymétrie forte (skewness > 2) — max -10
    skews = [abs(c.get("skewness") or 0) for c in num_cols_info]
    if skews:
        high_skew_ratio = sum(1 for s in skews if s > 2) / len(skews)
        score -= min(10, round(high_skew_ratio * 20))
    return max(0, min(100, round(score)))


def _is_applicable(data_type: str, allowed: set[str]) -> bool:
    return data_type in allowed


def _find_col(df: pd.DataFrame, keywords: list[str]) -> str | None:
    cols = list(df.columns)
    low = {c: str(c).lower() for c in cols}
    for c in cols:
        name = low[c]
        if any(k in name for k in keywords):
            return c
    return None


def _series_numeric(df: pd.DataFrame, col: str | None) -> pd.Series | None:
    if not col or col not in df.columns:
        return None
    s = pd.to_numeric(df[col], errors="coerce").dropna()
    return s if len(s) > 0 else None


def _detect_failure_intervals(df: pd.DataFrame) -> pd.Series | None:
    failure_col = _find_col(df, ["failure", "fault", "panne", "defaut", "anomaly", "alarme"])
    if not failure_col:
        return None
    s = df[failure_col]
    # support bool/str/int failure markers
    is_failure = (
        s.astype(str).str.lower().isin({"1", "true", "yes", "y", "failure", "fault", "panne", "defaut", "alerte"})
        | (pd.to_numeric(s, errors="coerce").fillna(0) > 0)
    )
    failure_idx = np.where(is_failure.values)[0]
    if len(failure_idx) < 2:
        return None
    intervals = np.diff(failure_idx)
    if len(intervals) == 0:
        return None
    return pd.Series(intervals)


def _compute_kpis(df: pd.DataFrame, data_type: str) -> dict[str, dict[str, Any]] | None:
    """
    Calcule les KPIs disponibles selon les colonnes du dataset.
    Retourne None si aucun KPI n'est calculable.
    """
    if not _is_applicable(data_type, {"kpi", "maintenance", "vibration", "machine"}):
        return None

    kpis: dict[str, dict[str, Any]] = {}

    # MTBF
    mtbf_col = _find_col(df, ["mtbf"])
    mtbf_s = _series_numeric(df, mtbf_col)
    if mtbf_s is None:
        intervals = _detect_failure_intervals(df)
        if intervals is not None and len(intervals) > 0:
            mtbf_s = intervals
            mtbf_col = "derived_failure_intervals"
    if mtbf_s is not None and len(mtbf_s) > 0:
        mtbf = float(mtbf_s.mean())
        if mtbf > 0:
            kpis["mtbf"] = {"value": round(mtbf, 4), "unit": "h", "source_col": str(mtbf_col)}

    # MTTR
    mttr_col = _find_col(df, ["mttr", "repair_time", "reparation", "downtime", "duration", "duree"])
    mttr_s = _series_numeric(df, mttr_col)
    if mttr_s is not None and len(mttr_s) > 0:
        mttr = float(mttr_s.mean())
        if mttr >= 0:
            kpis["mttr"] = {"value": round(mttr, 4), "unit": "h", "source_col": str(mttr_col)}

    # MTTF (fallback à MTBF si non réparable)
    mttf_col = _find_col(df, ["mttf", "time_to_failure", "temps_avant_panne"])
    mttf_s = _series_numeric(df, mttf_col)
    if mttf_s is not None and len(mttf_s) > 0:
        mttf = float(mttf_s.mean())
        if mttf > 0:
            kpis["mttf"] = {"value": round(mttf, 4), "unit": "h", "source_col": str(mttf_col)}
    elif "mtbf" in kpis and "mttr" not in kpis:
        kpis["mttf"] = {"value": kpis["mtbf"]["value"], "unit": "h", "source_col": "mtbf_fallback_non_reparable"}

    # Disponibilité = MTBF / (MTBF + MTTR)
    if "mtbf" in kpis and "mttr" in kpis:
        denom = kpis["mtbf"]["value"] + kpis["mttr"]["value"]
        if denom > 0:
            dispo = (kpis["mtbf"]["value"] / denom) * 100
            kpis["availability"] = {"value": round(dispo, 4), "unit": "%", "source_col": "derived_mtbf_mttr"}
    else:
        dispo_col = _find_col(df, ["disponibilite", "availability", "uptime"])
        dispo_s = _series_numeric(df, dispo_col)
        if dispo_s is not None and len(dispo_s) > 0:
            val = float(dispo_s.mean())
            if val <= 1.0:
                val *= 100.0
            kpis["availability"] = {"value": round(val, 4), "unit": "%", "source_col": str(dispo_col)}

    # Lambda = 1 / MTBF
    if "mtbf" in kpis and kpis["mtbf"]["value"] > 0:
        lam = 1.0 / float(kpis["mtbf"]["value"])
        kpis["failure_rate_lambda"] = {"value": round(lam, 6), "unit": "1/h", "source_col": "derived_1_mtbf"}

    # OEE/TRS
    oee_col = _find_col(df, ["oee", "trs"])
    oee_s = _series_numeric(df, oee_col)
    if oee_s is not None and len(oee_s) > 0:
        oee = float(oee_s.mean())
        if oee <= 1.0:
            oee *= 100.0
        kpis["oee"] = {"value": round(oee, 4), "unit": "%", "source_col": str(oee_col)}
    else:
        perf_col = _find_col(df, ["performance", "perf"])
        qual_col = _find_col(df, ["quality", "qualite"])
        perf_s = _series_numeric(df, perf_col)
        qual_s = _series_numeric(df, qual_col)
        if "availability" in kpis and perf_s is not None and qual_s is not None:
            a = float(kpis["availability"]["value"]) / 100.0
            p = float(perf_s.mean())
            q = float(qual_s.mean())
            if p > 1.0:
                p /= 100.0
            if q > 1.0:
                q /= 100.0
            oee = a * p * q * 100.0
            kpis["oee"] = {"value": round(oee, 4), "unit": "%", "source_col": f"derived_{perf_col}_{qual_col}_availability"}

    # Taux anomalies
    status_col = _find_col(df, ["status", "fault", "defaut", "anomaly", "alarme", "state", "etat"])
    if status_col:
        s = df[status_col].astype(str).str.lower().fillna("")
        as_num = pd.to_numeric(df[status_col], errors="coerce")
        is_anomaly = (~s.isin({"0", "normal", "ok", "nominal", "false", "none", ""})) | (as_num.fillna(0) > 0)
        anomaly_pct = float(is_anomaly.mean() * 100.0)
        kpis["anomaly_rate"] = {"value": round(anomaly_pct, 4), "unit": "%", "source_col": str(status_col)}

    return kpis if kpis else None


def _compute_rul(df: pd.DataFrame, data_type: str) -> dict[str, Any] | None:
    """
    Calcule les indicateurs de pronostic (RUL / Health Index).
    Retourne None si rien de pertinent n'est trouvable.
    """
    if not _is_applicable(data_type, {"vibration", "machine", "maintenance"}):
        return None

    out: dict[str, Any] = {}

    rul_col = _find_col(df, ["remaining_useful_life", "rul", "drbf", "duree_vie_restante"])
    rul_s = _series_numeric(df, rul_col)
    if rul_s is not None and len(rul_s) > 0:
        out["rul_mean"] = round(float(rul_s.mean()), 4)
        out["rul_min"] = round(float(rul_s.min()), 4)
        out["rul_max"] = round(float(rul_s.max()), 4)
        out["rul_std"] = round(float(rul_s.std()), 4) if len(rul_s) > 1 else 0.0

    health_col = _find_col(df, ["health_index", "health", "asset_health", "indice_sante"])
    health_s = _series_numeric(df, health_col)
    if health_s is not None and len(health_s) > 0:
        h = health_s.copy()
        if h.max() > 1.0:
            h = h / 100.0
        out["health_index_mean"] = round(float(h.mean()), 4)
        out["health_index_min"] = round(float(h.min()), 4)
        out["pct_critical"] = round(float((h < 0.3).mean() * 100.0), 4)

        # Taux de dégradation = pente health index dans le temps (ou index si temps absent)
        t_col = _detect_time_col(df)
        if t_col and t_col in df.columns:
            ts = pd.to_datetime(df[t_col], errors="coerce")
            tmp = pd.DataFrame({"t": ts, "h": pd.to_numeric(df[health_col], errors="coerce")}).dropna()
            if len(tmp) > 1:
                t_num = (tmp["t"] - tmp["t"].min()).dt.total_seconds() / 3600.0
                h_num = tmp["h"].astype(float)
                if h_num.max() > 1.0:
                    h_num = h_num / 100.0
                try:
                    slope = float(np.polyfit(t_num, h_num, 1)[0])
                    out["degradation_rate"] = round(slope, 6)
                except Exception:
                    pass
        elif len(h) > 1:
            try:
                slope = float(np.polyfit(np.arange(len(h)), h.values, 1)[0])
                out["degradation_rate"] = round(slope, 6)
            except Exception:
                pass

    # Fiabilité R(t) = exp(-lambda * t), si lambda et t dispo
    kpis = _compute_kpis(df, data_type) or {}
    lam = (kpis.get("failure_rate_lambda") or {}).get("value")
    t = out.get("rul_mean")
    if lam is not None and t is not None:
        try:
            out["reliability_rt"] = round(float(np.exp(-float(lam) * float(t))), 6)
        except Exception:
            pass

    return out if out else None


# ─── Contexte expert par type de données (normes ISO + focus + features) ─────

_TYPE_EXPERT: dict[str, dict[str, str]] = {
    "vibration": {
        "normes": (
            "ISO 10816-1/3 (V-RMS sur machines fixes), ISO 20816-1 (machines rotatives flexibles), "
            "ISO 18436-2 (qualification analyste vibratoire CAT II/III), "
            "ISO 13373-1 (surveillance de l'état des machines)"
        ),
        "focus": (
            "Identifie les colonnes vibratoires clés : V-RMS (mm/s), Crest Factor, Kurtosis, "
            "amplitudes BPFO/BPFI/BSF (défauts roulements ISO 18436-3), fréquence fondamentale F₀ (Hz). "
            "Signale explicitement si des machines dépassent les seuils ISO Zone C ou D. "
            "Évalue l'aptitude du dataset au diagnostic de défauts par analyse fréquentielle (FFT)."
        ),
        "features_hint": (
            "Features critiques à conserver : V-RMS, Crest Factor, Kurtosis, amplitudes BPFO/BPFI/BSF. "
            "Features dérivées à créer : taux d'aggravation V-RMS sur fenêtre 7j, "
            "ratio énergie haute-fréquence/basse-fréquence, harmoniques 2×F₀ / 3×F₀, "
            "index spectral d'usure (somme pondérée des amplitudes de défauts). "
            "Features à exclure : colonnes timestamp brutes (extraire year/month/dayofweek), "
            "colonnes redondantes (VRms = V_rms_mm_s)."
        ),
    },
    "kpi": {
        "normes": (
            "ISO 13306:2017 (terminologie maintenance), "
            "EN 15341:2019 (indicateurs de performance maintenance — KPI Level I/II/III), "
            "NF X 60-020 (maintenabilité)"
        ),
        "focus": (
            "Vérifie la cohérence des KPIs : MTBF > 0, MTTR > 0, "
            "disponibilité ∈ [0 %, 100 %], OEE/TRS ∈ [0 %, 100 %]. "
            "Signale les périodes de dégradation (disponibilité < 90 % = alarme EN 15341), "
            "les outliers KPI (pannes exceptionnelles) et la complétude temporelle des séries."
        ),
        "features_hint": (
            "Features critiques : MTBF, MTTR, disponibilité_pct, OEE/TRS. "
            "Features dérivées : MTBF rolling 7j/30j, ratio MTBF/MTTR (indice fiabilité/maintenabilité), "
            "lag j-1/j-7, dummy 'semaine_intervention_planifiée', taux_dégradation_hebdo. "
            "Cible potentielle pour ML : disponibilité_j+7 (régression)."
        ),
    },
    "maintenance": {
        "normes": (
            "ISO 13306:2017 (maintenance préventive / corrective / conditionnelle), "
            "NF E 60-182 (maintenance des systèmes industriels), "
            "ISO 55000:2014 (gestion des actifs)"
        ),
        "focus": (
            "Analyse la distribution des types d'interventions (préventive vs corrective), "
            "la fréquence par machine, les délais de réparation (MTTR). "
            "Identifie les machines chroniques (même défaut répété < 30j — ISO 13306 §6.6), "
            "les pièces à fort taux de remplacement et les pics d'intervention saisonniers."
        ),
        "features_hint": (
            "Features critiques : type_intervention, durée_réparation, machine_id, type_défaut. "
            "Features dérivées : intervalle_pannes_moyen_par_machine, flag_répétition (défaut < 30j), "
            "coût_intervention_cumulé_30j, score_criticité = fréquence_pannes × impact_production. "
            "Cibles potentielles : prochaine_panne (régression RUL) ou type_défaut (classification)."
        ),
    },
    "machine": {
        "normes": (
            "ISO 55000:2014 (gestion des actifs industriels), "
            "ISO 14224:2016 (recueil et échange de données de fiabilité), "
            "ISO 13306:2017 (états de fonctionnement machine)"
        ),
        "focus": (
            "Évalue la santé du parc machines : disponibilité par machine, états de fonctionnement "
            "(marche / arrêt / panne), âge et charge cumulée. "
            "Identifie les machines sous-performantes (disponibilité < seuil atelier) "
            "et les goulots de production selon ISO 14224."
        ),
        "features_hint": (
            "Features critiques : état_machine, puissance_kw, âge_ans, charge_cumulée_heures. "
            "Features dérivées : health_index composite (disponibilité × performance × qualité), "
            "score_vieillissement = âge × intensité_usage, classe_criticité ABC (ISO 14224 §5). "
            "Cible : temps_avant_prochaine_maintenance (régression) ou défaillance_binaire."
        ),
    },
    "generic": {
        "normes": (
            "Bonnes pratiques data science industrielle — ISO/IEC 25012:2008 (qualité des données), "
            "CRISP-DM (Cross-Industry Standard Process for Data Mining)"
        ),
        "focus": (
            "Évalue la qualité globale : cohérence, complétude, unicité (ISO 25012). "
            "Identifie les variables cibles potentielles, les features à fort pouvoir prédictif "
            "et les relations linéaires/non-linéaires entre variables."
        ),
        "features_hint": (
            "Sélection par corrélation Pearson/Spearman (r > 0.7 = redondance à traiter), "
            "importance RandomForest, VIF multicolinéarité (VIF > 10 = problème). "
            "Features dérivées à définir selon le domaine découvert à l'analyse. "
            "Pipeline ML supervisé standard recommandé (train/val/test split stratifié)."
        ),
    },
}


# ─── Appel LLM Claude ─────────────────────────────────────────────────────────

def _call_claude(summary: dict, data_type: str, original_filename: str, quality_score: int = 0) -> dict[str, str]:
    """
    Appelle Claude (expert vibratoire + data scientist sénior) pour obtenir :
    - preprocessing_plan  : pipeline numéroté appliqué + justification métier/statistique
    - narrative           : analyse EDA narrative avec références ISO et score qualité
    - feature_recommendations : recommandations features contextualisées par type de données
    Retourne des messages de fallback si la clé API est absente.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {
            "preprocessing_plan":      "Clé API Claude non configurée — analyse heuristique appliquée.",
            "narrative":               "Analyse automatique sans LLM.",
            "feature_recommendations": "Configurer ANTHROPIC_API_KEY pour les recommandations IA.",
        }

    try:
        import anthropic
        import re

        client = anthropic.Anthropic(api_key=api_key)
        ctx = _TYPE_EXPERT.get(data_type, _TYPE_EXPERT["generic"])

        # ── Descriptions colonnes enrichies avec outliers + skewness ──
        col_descriptions = []
        for c in summary["columns"][:30]:
            desc = f"- {c['name']} ({c['type']}, {c['missing_pct']}% manquant"
            if c["type"] == "numeric":
                desc += f", min={c.get('min')}, moy={c.get('mean')}, max={c.get('max')}"
                if c.get("outlier_pct") is not None:
                    pct = c["outlier_pct"]
                    flag = " ⚠ FORT" if pct > 20 else " ⚑ élevé" if pct > 10 else ""
                    desc += f", outliers IQR={pct}%{flag}"
                if c.get("skewness") is not None:
                    sk = c["skewness"]
                    skflag = " ⚠ très asymétrique" if abs(sk) > 2 else " légèrement asymétrique" if abs(sk) > 1 else ""
                    desc += f", skewness={sk:+.2f}{skflag}"
            else:
                desc += f", {c['unique']} valeurs uniques"
            desc += ")"
            col_descriptions.append(desc)

        # ── Résumé du choix de scaler (adaptatif IQR) ──
        num_info = [c for c in summary["columns"] if c.get("type") == "numeric" and c.get("outlier_pct") is not None]
        robust_cols = [c["name"] for c in num_info if c.get("outlier_pct", 0) > 10]
        std_cols    = [c["name"] for c in num_info if c.get("outlier_pct", 0) <= 10]
        high_skew   = [c["name"] for c in num_info if abs(c.get("skewness") or 0) > 2]

        scaler_lines: list[str] = []
        if robust_cols:
            sample = ", ".join(robust_cols[:6]) + ("…" if len(robust_cols) > 6 else "")
            scaler_lines.append(
                f"  • RobustScaler — (x−médiane)/IQR → {len(robust_cols)} colonne(s) [>10% outliers IQR] : {sample}"
            )
        if std_cols:
            scaler_lines.append(f"  • StandardScaler — (x−μ)/σ → {len(std_cols)} colonne(s)")
        if high_skew:
            sample = ", ".join(high_skew[:6]) + ("…" if len(high_skew) > 6 else "")
            scaler_lines.append(
                f"  • Colonnes très asymétriques (|skewness|>2) : {sample} → log-transform ou Box-Cox recommandé"
            )
        scaler_info = "\n".join(scaler_lines) if scaler_lines else "  • Aucune colonne numérique analysée"

        qs_label = ("Excellent" if quality_score >= 85 else "Bon" if quality_score >= 70
                    else "Acceptable" if quality_score >= 50 else "Insuffisant")

        prompt = f"""Tu es un expert sénior en Data Science industrielle et maintenance prédictive.
Tu maîtrises les normes suivantes applicables à ce dataset : {ctx['normes']}.
Ton rapport doit être compréhensible à la fois par un analyste en vibrations et par un data scientist.

## Dataset analysé
Fichier : "{original_filename}"
Type détecté : {data_type.upper()}
Dimensions : {summary['n_rows']:,} lignes × {summary['n_cols']} colonnes
Doublons : {summary['duplicates']}
Valeurs manquantes : {summary['missing_total']} ({summary['missing_pct']:.1f}% en moyenne)
Score qualité calculé : {quality_score}/100 ({qs_label})

## Pipeline de normalisation adaptatif appliqué
{scaler_info}

## Colonnes détectées (max 30)
{chr(10).join(col_descriptions)}

## Focus d'analyse requis pour ce type de données
{ctx['focus']}

---
Génère UNIQUEMENT ce JSON valide (sans markdown, sans texte avant/après) :
{{"preprocessing_plan": "Plan numéroté 8-12 étapes décrivant exactement le pipeline appliqué et sa justification (nettoyage doublons → colonnes constantes → parsing datetime → imputation médiane/mode → encodage catégorielles → normalisation en justifiant le choix StandardScaler/RobustScaler colonne par colonne → traitement asymétrie → colonnes finales). Ton : précis, technique, justifié par critères statistiques ou normatifs.", "narrative": "Analyse EDA narrative 350-450 mots. Structure OBLIGATOIRE : 1) Verdict qualité {quality_score}/100 ({qs_label}) avec explication des principales pénalités. 2) Patterns principaux observés dans les données. 3) Anomalies détectées (outliers, skewness élevé, colonnes problématiques) et leur impact. 4) Implications pour la maintenance prédictive — {ctx['focus']}. 5) Conclusion : les 2-3 actions prioritaires recommandées. Citer au moins une norme ISO applicable.", "feature_recommendations": "{ctx['features_hint']} Formater en 3 blocs numérotés : A) Features critiques à conserver (justification métier/statistique), B) Features dérivées à créer (formule ou logique), C) Features à exclure ou surveiller (multicolinéarité, cardinalité excessive, bruit)."}}"""

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text.strip()

        def _try_parse(text: str):
            t = text
            m = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', t)
            if m:
                t = m.group(1)
            try:
                return json.loads(t)
            except Exception:
                pass
            for repair in [t, t.replace('\n', '\\n'), re.sub(r'(?<!\\)"([^"]*?)\n', r'"\1\\n', t)]:
                try:
                    return json.loads(repair)
                except Exception:
                    pass
            result = {}
            for key in ["preprocessing_plan", "narrative", "feature_recommendations"]:
                m2 = re.search(rf'"{key}"\s*:\s*"((?:[^"\\]|\\.)*)"', t)
                if m2:
                    result[key] = m2.group(1).replace('\\n', '\n').replace('\\"', '"')
            if result:
                return result
            raise ValueError("JSON non réparable")

        return _try_parse(raw)

    except Exception as e:
        raw_preview = raw[:200] if 'raw' in dir() else ''
        return {
            "preprocessing_plan":      "Analyse automatique (LLM JSON invalide).",
            "narrative":               raw_preview or "Analyse automatique (LLM indisponible).",
            "feature_recommendations": "Non disponible.",
        }


# ─── Génération des plots ──────────────────────────────────────────────────────

def _generate_plots(df: pd.DataFrame, dataset_id: int) -> list[dict[str, str]]:
    """Génère les plots EDA et les sauvegarde comme PNG. Retourne liste de {title, path, base64}."""
    plots = []
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
    plot_dir = PLOTS_DIR / str(dataset_id)
    plot_dir.mkdir(parents=True, exist_ok=True)

    sns.set_theme(style="whitegrid", palette="muted")

    # 1. Valeurs manquantes
    if df.isnull().sum().sum() > 0:
        missing_counts = df.isnull().sum().sort_values(ascending=False)
        missing_pct    = (missing_counts / len(df) * 100).round(2)
        missing_df     = pd.DataFrame({"count": missing_counts, "pct": missing_pct})
        missing_df     = missing_df[missing_df["count"] > 0]

        fig, ax = plt.subplots(figsize=(max(8, len(missing_df)*0.5 + 2), 4))
        ax.barh(missing_df.index, missing_df["pct"], color="#f97316")
        ax.set_xlabel("% valeurs manquantes")
        ax.set_title("Valeurs manquantes par colonne")
        plt.tight_layout()
        path = plot_dir / "missing_values.png"
        fig.savefig(path, dpi=100, bbox_inches="tight")
        plt.close(fig)
        plots.append({"title": "Valeurs manquantes", "path": str(path), "b64": _img_to_b64(path)})

    # 2. Distributions numériques (max 12 colonnes)
    if num_cols:
        cols_to_plot = num_cols[:12]
        ncols = min(3, len(cols_to_plot))
        nrows = (len(cols_to_plot) + ncols - 1) // ncols
        fig, axes = plt.subplots(nrows, ncols, figsize=(ncols * 4, nrows * 3))
        axes_flat = np.array(axes).flatten() if nrows * ncols > 1 else [axes]
        for i, col in enumerate(cols_to_plot):
            ax = axes_flat[i]
            data = df[col].dropna()
            ax.hist(data, bins=30, color="#2563eb", alpha=0.75, edgecolor="white")
            ax.set_title(col, fontsize=9)
            ax.set_xlabel("")
        for j in range(len(cols_to_plot), len(axes_flat)):
            axes_flat[j].set_visible(False)
        fig.suptitle("Distributions des variables numériques", fontsize=11, y=1.01)
        plt.tight_layout()
        path = plot_dir / "distributions.png"
        fig.savefig(path, dpi=100, bbox_inches="tight")
        plt.close(fig)
        plots.append({"title": "Distributions numériques", "path": str(path), "b64": _img_to_b64(path)})

    # 2b. Boxplots (outliers IQR visibles)
    if num_cols:
        cols_bp = num_cols[:12]
        ncols_bp = min(4, len(cols_bp))
        nrows_bp = (len(cols_bp) + ncols_bp - 1) // ncols_bp
        fig, axes = plt.subplots(nrows_bp, ncols_bp, figsize=(ncols_bp * 3.5, nrows_bp * 3))
        axes_flat = np.array(axes).flatten() if nrows_bp * ncols_bp > 1 else [axes]
        for i, col in enumerate(cols_bp):
            ax = axes_flat[i]
            ax.boxplot(df[col].dropna(), vert=True, patch_artist=True,
                       boxprops=dict(facecolor='#dbeafe', color='#2563eb'),
                       medianprops=dict(color='#f97316', linewidth=2.5),
                       flierprops=dict(marker='o', markerfacecolor='#dc2626', alpha=0.5, markersize=3),
                       whiskerprops=dict(color='#6b7280'), capprops=dict(color='#6b7280'))
            ax.set_title(col, fontsize=8)
            ax.set_xticks([])
        for j in range(len(cols_bp), len(axes_flat)):
            axes_flat[j].set_visible(False)
        fig.suptitle("Boxplots — Visualisation des outliers (méthode IQR)", fontsize=10)
        plt.tight_layout()
        path = plot_dir / "boxplots.png"
        fig.savefig(path, dpi=100, bbox_inches="tight")
        plt.close(fig)
        plots.append({"title": "Boxplots & Outliers", "path": str(path), "b64": _img_to_b64(path)})

    # 3. Matrice de corrélation (si ≥ 2 colonnes numériques)
    if len(num_cols) >= 2:
        corr_cols = num_cols[:20]  # limite pour lisibilité
        corr = df[corr_cols].corr()
        fig, ax = plt.subplots(figsize=(max(6, len(corr_cols) * 0.6), max(5, len(corr_cols) * 0.5)))
        sns.heatmap(corr, annot=len(corr_cols) <= 12, fmt=".2f", cmap="RdYlGn",
                    center=0, ax=ax, linewidths=0.5, square=True, cbar_kws={"shrink": 0.8})
        ax.set_title("Matrice de corrélation")
        plt.tight_layout()
        path = plot_dir / "correlation.png"
        fig.savefig(path, dpi=100, bbox_inches="tight")
        plt.close(fig)
        plots.append({"title": "Matrice de corrélation", "path": str(path), "b64": _img_to_b64(path)})

    # 4. Séries temporelles (si colonne timestamp/date détectée)
    time_col = _detect_time_col(df)
    if time_col and num_cols:
        try:
            df_ts = df.copy()
            df_ts[time_col] = pd.to_datetime(df_ts[time_col], errors="coerce")
            df_ts = df_ts.dropna(subset=[time_col]).sort_values(time_col)
            plot_cols = [c for c in num_cols if c != time_col][:3]
            if plot_cols:
                fig, axes = plt.subplots(len(plot_cols), 1, figsize=(10, 3 * len(plot_cols)), sharex=True)
                if len(plot_cols) == 1:
                    axes = [axes]
                for ax, col in zip(axes, plot_cols):
                    ax.plot(df_ts[time_col], df_ts[col], linewidth=0.8, color="#f97316")
                    ax.set_ylabel(col, fontsize=8)
                    ax.grid(True, alpha=0.4)
                axes[-1].set_xlabel(time_col)
                fig.suptitle("Séries temporelles", fontsize=11)
                plt.tight_layout()
                path = plot_dir / "time_series.png"
                fig.savefig(path, dpi=100, bbox_inches="tight")
                plt.close(fig)
                plots.append({"title": "Séries temporelles", "path": str(path), "b64": _img_to_b64(path)})
        except Exception:
            pass

    # 5. Top variables catégorielles
    if cat_cols:
        top_cats = [c for c in cat_cols if df[c].nunique() <= 20][:4]
        if top_cats:
            fig, axes = plt.subplots(1, len(top_cats), figsize=(4 * len(top_cats), 4))
            if len(top_cats) == 1:
                axes = [axes]
            for ax, col in zip(axes, top_cats):
                vc = df[col].value_counts().head(10)
                vc.plot(kind="bar", ax=ax, color="#8b5cf6", edgecolor="white")
                ax.set_title(col, fontsize=9)
                ax.set_xlabel("")
                ax.tick_params(axis="x", rotation=45, labelsize=7)
            fig.suptitle("Variables catégorielles", fontsize=11)
            plt.tight_layout()
            path = plot_dir / "categoricals.png"
            fig.savefig(path, dpi=100, bbox_inches="tight")
            plt.close(fig)
            plots.append({"title": "Variables catégorielles", "path": str(path), "b64": _img_to_b64(path)})

    # 6. Graphiques vibratoires (si colonnes vibration détectées)
    _vibration_plots(df, num_cols, cat_cols, plot_dir, plots)

    return plots


def _vibration_plots(df: pd.DataFrame, num_cols: list, cat_cols: list, plot_dir: Path, plots: list):
    """Génère les graphiques spécialisés analyse vibratoire."""
    vib_cols = [c for c in num_cols if any(k in c.lower() for k in ["v_rms", "vrms", "v_rms_mm_s", "velocity_rms", "vitesse_rms"])]
    crest_col = next((c for c in num_cols if "crest" in c.lower() or "facteur_crete" in c.lower()), None)
    kurt_col = next((c for c in num_cols if "kurtosis" in c.lower() or "kurt" in c.lower()), None)
    machine_col = next((c for c in cat_cols if c.lower() in ("machine_id", "machine", "equipment_id")), None)
    time_col = _detect_time_col(df)

    if not vib_cols:
        return

    vrms_col = vib_cols[0]

    # 6a. Tendance V-RMS dans le temps
    if time_col and vrms_col:
        try:
            df_t = df.copy()
            df_t[time_col] = pd.to_datetime(df_t[time_col], errors="coerce")
            df_t = df_t.dropna(subset=[time_col]).sort_values(time_col)
            fig, ax = plt.subplots(figsize=(12, 5))
            ax.plot(df_t[time_col], df_t[vrms_col], linewidth=1.2, color="#2563eb")
            # Lignes ISO
            for label, y, color in [("Zone B (2.3)", 2.3, "#eab308"), ("Zone C (4.5)", 4.5, "#f97316"), ("Zone D (7.1)", 7.1, "#dc2626")]:
                ax.axhline(y=y, linestyle="--", color=color, alpha=0.6, linewidth=0.8)
                ax.text(df_t[time_col].iloc[0], y + 0.1, label, fontsize=7, color=color)
            ax.set_title(f"Tendance {vrms_col} dans le temps")
            ax.set_xlabel("")
            ax.set_ylabel("mm/s")
            ax.fill_between(df_t[time_col], 0, 2.3, color="#16a34a", alpha=0.05)
            ax.fill_between(df_t[time_col], 2.3, 4.5, color="#eab308", alpha=0.05)
            ax.fill_between(df_t[time_col], 4.5, 7.1, color="#f97316", alpha=0.05)
            ax.fill_between(df_t[time_col], 7.1, df_t[vrms_col].max()*1.1, color="#dc2626", alpha=0.08)
            plt.tight_layout()
            path = plot_dir / "vib_vrms_trend.png"
            fig.savefig(path, dpi=120, bbox_inches="tight")
            plt.close(fig)
            plots.append({"title": "Tendance V-RMS", "path": str(path), "b64": _img_to_b64(path)})
        except Exception:
            pass

    # 6b. Crest Factor vs Kurtosis
    if crest_col and kurt_col:
        try:
            data = df[[crest_col, kurt_col]].dropna()
            fig, ax = plt.subplots(figsize=(8, 6))
            sc = ax.scatter(data[crest_col], data[kurt_col], c="#7c3aed", alpha=0.5, s=30, edgecolors="white")
            # Zones de diagnostic
            ax.axhline(y=3, color="#eab308", linestyle="--", alpha=0.7, label="Kurtosis=3 (alerte)")
            ax.axhline(y=8, color="#dc2626", linestyle="--", alpha=0.7, label="Kurtosis=8 (critique)")
            ax.axvline(x=5, color="#f97316", linestyle="--", alpha=0.7, label="CF=5 (critique)")
            ax.fill_between([0, 10], 3, 8, color="#eab308", alpha=0.05)
            ax.fill_between([0, 10], 8, 15, color="#dc2626", alpha=0.08)
            ax.set_xlabel("Crest Factor")
            ax.set_ylabel("Kurtosis")
            ax.set_title("Crest Factor vs Kurtosis — Diagnostic roulements")
            ax.legend(fontsize=8)
            plt.tight_layout()
            path = plot_dir / "vib_crest_kurtosis.png"
            fig.savefig(path, dpi=120, bbox_inches="tight")
            plt.close(fig)
            plots.append({"title": "Crest Factor vs Kurtosis", "path": str(path), "b64": _img_to_b64(path)})
        except Exception:
            pass

    # 6c. Distribution des zones ISO
    zone_cols = [c for c in cat_cols if "zone" in c.lower() or "iso" in c.lower()]
    zone_col = zone_cols[0] if zone_cols else None
    if zone_col and df[zone_col].nunique() <= 6:
        try:
            vc = df[zone_col].value_counts()
            colors = {"A": "#16a34a", "B": "#eab308", "C": "#f97316", "D": "#dc2626"}
            bar_colors = [colors.get(str(k).upper(), "#6b7280") for k in vc.index]
            fig, ax = plt.subplots(figsize=(6, 5))
            ax.pie(vc.values, labels=vc.index, autopct="%1.1f%%", colors=bar_colors,
                   startangle=90, wedgeprops={"edgecolor": "white", "linewidth": 1.5})
            ax.set_title("Répartition des mesures par Zone ISO")
            plt.tight_layout()
            path = plot_dir / "vib_zone_distribution.png"
            fig.savefig(path, dpi=120, bbox_inches="tight")
            plt.close(fig)
            plots.append({"title": "Distribution Zones ISO", "path": str(path), "b64": _img_to_b64(path)})
        except Exception:
            pass

    # 6d. Boxplot V-RMS par machine
    if machine_col and vrms_col and df[machine_col].nunique() <= 20:
        try:
            fig, ax = plt.subplots(figsize=(max(6, df[machine_col].nunique() * 0.8), 5))
            df.boxplot(column=vrms_col, by=machine_col, ax=ax, grid=False)
            # Lignes ISO
            for y, color in [(2.3, "#16a34a"), (4.5, "#eab308"), (7.1, "#dc2626")]:
                ax.axhline(y=y, linestyle="--", color=color, alpha=0.6, linewidth=0.8)
            ax.set_title(f"V-RMS par machine")
            ax.set_xlabel("")
            ax.set_ylabel("mm/s")
            fig.suptitle("")
            plt.tight_layout()
            path = plot_dir / "vib_boxplot_par_machine.png"
            fig.savefig(path, dpi=120, bbox_inches="tight")
            plt.close(fig)
            plots.append({"title": "Boxplot V-RMS par machine", "path": str(path), "b64": _img_to_b64(path)})
        except Exception:
            pass


def _detect_time_col(df: pd.DataFrame) -> str | None:
    keywords = {"time", "date", "timestamp", "datetime", "horodatage", "heure"}
    for col in df.columns:
        if any(k in col.lower() for k in keywords):
            return col
    for col in df.select_dtypes(include=["object"]).columns:
        sample = df[col].dropna().head(5)
        if sample.empty:
            continue
        try:
            parsed = pd.to_datetime(sample, errors="coerce", utc=False)
            if parsed.notna().all():
                return col
        except Exception:
            continue
    return None


def _img_to_b64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("utf-8")


# ─── Prétraitement ────────────────────────────────────────────────────────────

def _detect_units(col_name: str) -> tuple[str, str | None]:
    """Extract column name without unit suffix. Returns (clean_name, unit_or_None)."""
    known = {"_mm_s": "mm/s", "_g": "g", "_c": "°C", "_bar": "bar", "_a": "A",
             "_kw": "kW", "_rpm": "rpm", "_hz": "Hz", "_pct": "%", "_euros": "€",
             "_heures": "h", "_jours": "j", "_mm": "mm", "_um": "μm", "_m_s2": "m/s²"}
    for suffix, unit in known.items():
        if col_name.endswith(suffix):
            return col_name[:-len(suffix)], unit
    return col_name, None


def _preprocess(df: pd.DataFrame) -> tuple[pd.DataFrame, dict, dict]:
    """
    Prétraitement complet niveau data scientist :
    - Détection et strip des unités
    - Drop duplicates, colonnes constantes
    - Imputation intelligente (médiane/mode/flag)
    - Encodage automatique : one-hot (≤10 cat), label (10–25), frequency (>25)
    - StandardScaler (z-score) pour toutes les colonnes numériques
    Retourne (df_clean, pipeline_trace, encoding_maps).
    """
    df = df.copy()
    errors = []
    pipeline = {"steps": [], "column_order": [], "units": {}, "fitted_on_rows": len(df)}
    encoding_maps = {}

    # Step 0: Detect and strip units
    units = {}
    for col in df.columns:
        clean_name, unit = _detect_units(str(col))
        if unit:
            units[clean_name] = {"original": str(col), "unit": unit}
    pipeline["units"] = units

    # Step 1: Drop duplicates
    before = len(df)
    df = df.drop_duplicates()
    pipeline["steps"].append({"step": 1, "type": "drop_duplicates", "rows_removed": before - len(df)})
    errors.append(f"  * {before - len(df)} lignes dupliquées supprimées")

    # Step 2: Drop constant and all-null columns
    dropped = []
    for col in df.columns:
        if df[col].isnull().all():
            dropped.append(col)
            df = df.drop(columns=[col])
        elif df[col].nunique(dropna=True) <= 1:
            dropped.append(col)
            df = df.drop(columns=[col])
    if dropped:
        pipeline["steps"].append({"step": 2, "type": "drop_constant_columns", "columns_removed": dropped})
        errors.append(f"  * Colonnes constantes/vides supprimées : {', '.join(dropped)}")

    # Step 3: Parse datetime columns
    date_cols_parsed = []
    for col in df.select_dtypes(include=["object"]).columns:
        sample = df[col].dropna().head(5)
        if sample.empty: continue
        try:
            if pd.to_datetime(sample, errors="coerce").notna().all():
                df[col] = pd.to_datetime(df[col], errors="coerce")
                date_cols_parsed.append(col)
        except Exception: pass
    if date_cols_parsed:
        pipeline["steps"].append({"step": 3, "type": "datetime_parsing", "columns": date_cols_parsed})
        errors.append(f"  * Colonnes datetime parsées : {', '.join(date_cols_parsed)}")

    num_cols = df.select_dtypes(include=[np.number]).columns
    cat_cols = df.select_dtypes(exclude=[np.number, "datetime64"]).columns

    # Step 4: Missing value imputation with flags
    imputation = {}
    for col in num_cols:
        if df[col].isnull().sum() > 0:
            missing_pct = df[col].isnull().sum() / len(df) * 100
            fill_val = df[col].median() if not pd.isna(df[col].median()) else 0
            df[col] = df[col].fillna(fill_val)
            imputation[col] = {"strategy": "median", "fill_value": float(fill_val), "missing_pct": round(missing_pct, 1)}
            if missing_pct > 5:
                flag_col = f"{col}_missing_flag"
                df[flag_col] = (df[col].isnull()).astype(int)
                errors.append(f"  * {col} : {missing_pct:.1f}% manquants → médiane {fill_val:.1f} + flag binary")
            else:
                errors.append(f"  * {col} : {missing_pct:.1f}% manquants → médiane {fill_val:.1f}")
    for col in cat_cols:
        if df[col].isnull().sum() > 0:
            mode_val = df[col].mode()
            fill_val = mode_val.iloc[0] if not mode_val.empty else "inconnu"
            df[col] = df[col].fillna(fill_val)
            imputation[col] = {"strategy": "mode", "fill_value": fill_val}
            errors.append(f"  * {col} : remplie par mode '{fill_val}'")
    if imputation:
        pipeline["steps"].append({"step": 4, "type": "missing_imputation", "columns": imputation})

    # Step 5: Smart encoding (one-hot ≤10, label 10-25, frequency >25)
    encoding = {}
    cols_to_drop = []
    for col in cat_cols:
        n = df[col].nunique()
        if n > 100:
            errors.append(f"  * {col} : trop de categories ({n}) → colonne conservée en original, exclue du ML")
            continue
        if n <= 10:
            dummies = pd.get_dummies(df[col], prefix=col, drop_first=True)
            df = pd.concat([df, dummies], axis=1)
            encoding[col] = {"type": "onehot", "n_categories": n, "drop_first": True,
                             "columns": list(dummies.columns)}
            errors.append(f"  * {col} : {n} catégories → one-hot ({len(dummies.columns)} colonnes)")
            cols_to_drop.append(col)
        elif n <= 25:
            categories = sorted(df[col].dropna().unique().tolist())
            enc_map = {v: i for i, v in enumerate(categories)}
            df[col] = df[col].map(enc_map)
            encoding[col] = {"type": "label", "mapping": enc_map, "n_categories": n}
            encoding_maps[col] = {"type": "label", "mapping": enc_map}
            errors.append(f"  * {col} : {n} catégories → label encoding")
        else:
            freq = df[col].value_counts(normalize=True)
            df[col] = df[col].map(freq)
            encoding[col] = {"type": "frequency", "n_categories": n}
            errors.append(f"  * {col} : {n} catégories → frequency encoding")

    # Drop original categorical columns that were encoded
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)
        errors.append(f"  * Colonnes originales supprimées après encodage : {', '.join(cols_to_drop)}")

    # Drop datetime columns (already parsed, not needed for ML)
    date_cols = df.select_dtypes(include=["datetime64"]).columns.tolist()
    if date_cols:
        df = df.drop(columns=date_cols)
        errors.append(f"  * Colonnes datetime supprimées : {', '.join(date_cols)}")
    if encoding:
        pipeline["steps"].append({"step": 5, "type": "encoding", "columns": encoding})

    # Step 6: StandardScaler (z-score) for truly numeric columns (skip one-hot bools)
    num_cols_all = df.select_dtypes(include=[np.number]).columns
    # Identify one-hot columns: values only 0 and 1 with boolean-like distribution
    onehot_set = set()
    if encoding:
        for col, info in encoding.items():
            if info.get("type") == "onehot":
                for c in info.get("columns", []):
                    onehot_set.add(c)
    standardization = {}
    n_robust = 0
    for col in num_cols_all:
        if str(col) in onehot_set:
            continue
        vals = df[col].dropna()
        if len(vals) < 2: continue
        m, s = float(vals.mean()), float(vals.std())
        # Détection outliers IQR pour choix du scaler (§9 pipeline_ultime_dataset)
        _q1, _q3 = float(vals.quantile(0.25)), float(vals.quantile(0.75))
        _iqr = _q3 - _q1
        _n_out = int(((vals < _q1 - 1.5 * _iqr) | (vals > _q3 + 1.5 * _iqr)).sum())
        _outlier_pct = round(_n_out / len(vals) * 100, 1)
        if _outlier_pct > 10 and _iqr > 0:
            # RobustScaler : (x − médiane) / IQR — résistant aux outliers
            _med = float(vals.median())
            df[col] = (df[col] - _med) / _iqr
            standardization[col] = {"center": round(_med, 4), "scale": round(_iqr, 4),
                                    "scaler": "RobustScaler", "outlier_pct": _outlier_pct}
            errors.append(f"  * {col} : {_outlier_pct}% outliers → RobustScaler (médiane={round(_med,3)}, IQR={round(_iqr,3)})")
            n_robust += 1
        elif s > 0:
            df[col] = (df[col] - m) / s
            standardization[col] = {"center": round(m, 4), "scale": round(s, 4),
                                    "scaler": "StandardScaler", "outlier_pct": _outlier_pct}
            errors.append(f"  * {col} : StandardScaler (μ={round(m,3)}, σ={round(s,3)}, {_outlier_pct}% outliers)")
    if standardization:
        pipeline["steps"].append({"step": 6, "type": "standardization", "columns": standardization,
                                  "n_robust": n_robust, "n_standard": len(standardization) - n_robust})
        errors.append(f"  * Scaling appliqué : {len(standardization)-n_robust}×StandardScaler + {n_robust}×RobustScaler")

    # Step 7: Final cleanup — convert bools to int, drop remaining objects
    for col in df.columns:
        if df[col].dtype == bool:
            df[col] = df[col].astype(int)
    remaining_obj = df.select_dtypes(include=["object"]).columns.tolist()
    if remaining_obj:
        df = df.drop(columns=remaining_obj)
        errors.append(f"  * Colonnes texte restantes supprimées : {', '.join(remaining_obj)}")

    pipeline["column_order"] = list(df.columns)
    pipeline["transformation_log"] = errors

    return df, pipeline, encoding_maps


# ─── Rapport PDF ──────────────────────────────────────────────────────────────

def _sanitize(text: str) -> str:
    """Remplace les caractères Unicode hors latin-1 pour compatibilité fpdf2."""
    replacements = {
        '\u2014': '-',   # em dash —
        '\u2013': '-',   # en dash –
        '\u2018': "'",   # left single quote '
        '\u2019': "'",   # right single quote '
        '\u201c': '"',   # left double quote "
        '\u201d': '"',   # right double quote "
        '\u2022': '*',   # bullet •
        '\u2026': '...', # ellipsis …
        '\u2192': '->',  # arrow →
        '\u00a0': ' ',   # non-breaking space
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    # Eliminer tout caractere hors Latin-1 (non renderisable avec Helvetica)
    return text.encode('latin-1', errors='replace').decode('latin-1')


def _S(v) -> str:
    """Sanitize + cast str pour fpdf2."""
    return _sanitize(str(v)) if v is not None else ""


def _pdf_section(pdf: "FPDF", number: str, title: str) -> None:
    """Entête de section numérotée avec ligne séparatrice."""
    pdf.ln(5)
    pdf.set_draw_color(249, 115, 22)
    pdf.set_fill_color(255, 247, 237)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(180, 83, 9)
    pdf.cell(0, 9, _S(f"  {number}.  {title}"), new_x="LMARGIN", new_y="NEXT", fill=True)
    pdf.set_text_color(55, 65, 81)
    pdf.set_font("Helvetica", "", 10)
    pdf.ln(2)


def _pdf_kv(pdf: "FPDF", label: str, value: str, label_w: int = 80) -> None:
    """Ligne clé / valeur alignée."""
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(75, 85, 99)
    pdf.cell(label_w, 6, _S(f"  {label}"), border=0)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 6, _S(str(value)), new_x="LMARGIN", new_y="NEXT")


def _generate_pdf(
    dataset_id: int,
    filename: str,
    summary: dict,
    llm_result: dict,
    plots: list[dict],
    encoding_maps: dict,
    data_type: str,
    quality_score: int = 0,
    pipeline_trace: dict | None = None,
    kpis: dict | None = None,
    rul_info: dict | None = None,
) -> Path:
    report_path = REPORTS_DIR / f"eda_report_{dataset_id}.pdf"
    pt = pipeline_trace or {}
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # ══ PAGE DE GARDE ═════════════════════════════════════════════════════════
    pdf.set_fill_color(249, 115, 22)
    pdf.set_draw_color(249, 115, 22)

    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(249, 115, 22)
    pdf.cell(0, 14, "Rapport d'Analyse EDA", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 8, "AI Maintenance  |  Atlas Industries Maroc", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(4)
    pdf.set_line_width(0.8)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(6)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 6, _S(f"Fichier : {filename}"), new_x="LMARGIN", new_y="NEXT", align="C")
    _type_labels = {"vibration": "Vibratoire", "kpi": "KPI", "maintenance": "Maintenance",
                    "machine": "Machine", "generic": "Generique"}
    pdf.cell(0, 6, _S(f"Type detecte : {_type_labels.get(data_type, data_type)}  |  "
                      f"Genere le : {datetime.now().strftime('%Y-%m-%d %H:%M')}"),
             new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(10)

    # ── Score qualité — badge central
    qs_color = (22, 163, 74) if quality_score >= 85 else (101, 163, 13) if quality_score >= 70 \
               else (249, 115, 22) if quality_score >= 50 else (220, 38, 38)
    qs_label  = ("Excellent" if quality_score >= 85 else "Bon" if quality_score >= 70
                 else "Acceptable" if quality_score >= 50 else "Insuffisant")
    pdf.set_fill_color(*qs_color)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 28)
    # Rectangle centré
    box_w, box_h = 80, 22
    pdf.rect((pdf.w - box_w) / 2, pdf.get_y(), box_w, box_h, "F")
    pdf.set_y(pdf.get_y() + 4)
    pdf.cell(0, 14, f"{quality_score}/100  {qs_label}", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(4)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 5, "Score de qualite du dataset (0=mauvais, 100=parfait)", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(8)

    # ══ 1. RESUME STATISTIQUE ══════════════════════════════════════════════════
    _pdf_section(pdf, "1", "Resume du dataset")
    stats = [
        ("Lignes (observations)",    f"{summary['n_rows']:,}".replace(",", " ")),
        ("Colonnes (features)",       summary["n_cols"]),
        ("Variables numeriques",      summary["n_numeric"]),
        ("Variables categorielles",   summary["n_categorical"]),
        ("Valeurs manquantes totales", f"{summary['missing_total']} ({summary['missing_pct']}%)"),
        ("Doublons detectes",          summary["duplicates"]),
        ("Type de donnees detecte",    _type_labels.get(data_type, data_type)),
    ]
    for lbl, val in stats:
        _pdf_kv(pdf, lbl, val)

    # ══ 2. SCORE DE QUALITE — DETAIL DES CRITERES ═════════════════════════════
    _pdf_section(pdf, "2", "Score de qualite des donnees")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(55, 65, 81)
    criteria = [
        ("Penalite valeurs manquantes",
         f"-{min(30, round(summary['missing_pct'] * 0.6))} pts si missing_pct={summary['missing_pct']}%"),
        ("Penalite doublons",
         f"-{min(15, round(summary['duplicates'] / max(summary['n_rows'], 1) * 100 * 0.3))} pts si {summary['duplicates']} doublons"),
        ("Penalite outliers moyens",
         "Calculee sur moyenne des outlier_pct par colonne numerique"),
        ("Penalite colonnes tres asymetriques (|skew|>2)",
         "2 pts / colonne asymetrique"),
        ("Score final",
         f"{quality_score}/100  ->  {qs_label}"),
    ]
    for lbl, detail in criteria:
        pdf.set_x(pdf.l_margin + 4)
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(75, 85, 99)
        pdf.cell(80, 5, _S(f"  {lbl} :"))
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(0, 5, _S(detail), new_x="LMARGIN", new_y="NEXT")

    # ══ 3. INDICATEURS KPI ═════════════════════════════════════════════════════
    if kpis:
        _pdf_section(pdf, "3", "Indicateurs de Performance (KPIs)")
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(55, 65, 81)
        headers = ["Indicateur", "Valeur", "Unite"]
        col_w = [80, 40, 25]
        for i, h in enumerate(headers):
            pdf.cell(col_w[i], 6, _S(h), border=1)
        pdf.ln()
        pdf.set_font("Helvetica", "", 8)
        kpi_order = [
            ("mtbf", "MTBF"), ("mttr", "MTTR"), ("mttf", "MTTF"),
            ("availability", "Disponibilite"), ("failure_rate_lambda", "Taux defaillance λ"),
            ("oee", "OEE / TRS"), ("anomaly_rate", "Taux anomalies"),
        ]
        for key, label in kpi_order:
            if key not in kpis:
                continue
            item = kpis[key]
            pdf.cell(col_w[0], 5, _S(label), border=1)
            pdf.cell(col_w[1], 5, _S(item.get("value")), border=1)
            pdf.cell(col_w[2], 5, _S(item.get("unit", "")), border=1)
            pdf.ln()
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(107, 114, 128)
        pdf.multi_cell(0, 4, "References: ISO 13306:2017, EN 15341:2019")

    # ══ 4. PRONOSTIC RUL ═══════════════════════════════════════════════════════
    if rul_info:
        _pdf_section(pdf, "4", "Pronostic — RUL / Duree de Vie Restante")
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(55, 65, 81)
        headers = ["Indicateur", "Valeur"]
        col_w = [90, 45]
        for i, h in enumerate(headers):
            pdf.cell(col_w[i], 6, _S(h), border=1)
        pdf.ln()
        pdf.set_font("Helvetica", "", 8)
        rul_rows = [
            ("RUL moyen", rul_info.get("rul_mean")),
            ("RUL min", rul_info.get("rul_min")),
            ("RUL max", rul_info.get("rul_max")),
            ("RUL ecart-type", rul_info.get("rul_std")),
            ("Health Index moyen", rul_info.get("health_index_mean")),
            ("Health Index min", rul_info.get("health_index_min")),
            ("Taux degradation", rul_info.get("degradation_rate")),
            ("% machines critiques", rul_info.get("pct_critical")),
            ("Fiabilite R(t)", rul_info.get("reliability_rt")),
        ]
        for lbl, val in rul_rows:
            if val is None:
                continue
            pdf.cell(col_w[0], 5, _S(lbl), border=1)
            pdf.cell(col_w[1], 5, _S(val), border=1)
            pdf.ln()
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(107, 114, 128)
        pdf.multi_cell(0, 4, "Methodes: DRBF, modele exponentiel de fiabilite (R(t)=exp(-lambda*t))")

    # ══ 5. ANALYSE EDA (NARRATION IA) ══════════════════════════════════════════
    _pdf_section(pdf, "5", "Analyse EDA — Narration IA")
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 6, _S(llm_result.get("narrative", "Non disponible.")))

    # ══ 6. DETAIL DES COLONNES (ENRICHI) ═══════════════════════════════════════
    pdf.add_page()
    _pdf_section(pdf, "6", "Detail des colonnes")

    for col_info in summary.get("columns", []):
        cname = col_info["name"]
        ctype = col_info["type"]
        miss  = f"{col_info['missing']} ({col_info['missing_pct']}%)"
        uniq  = col_info["unique"]

        # Entete colonne
        pdf.set_fill_color(243, 244, 246)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(0, 6, _S(f"  {cname}  [{ctype}]  —  {miss} manquants  |  {uniq} uniques"),
                 fill=True, new_x="LMARGIN", new_y="NEXT")

        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(55, 65, 81)
        if ctype == "numeric":
            stats_num = (f"min={col_info.get('min')}  Q1={col_info.get('q25', '—')}  "
                         f"moy={col_info.get('mean')}  Q3={col_info.get('q75', '—')}  max={col_info.get('max')}  "
                         f"std={col_info.get('std')}")
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5, _S(f"  Stats : {stats_num}"))

            n_out = col_info.get("n_outliers")
            out_pct = col_info.get("outlier_pct")
            if n_out is not None:
                out_label = "  ** ATTENTION **" if (out_pct or 0) > 10 else ""
                pdf.set_x(pdf.l_margin + 4)
                pdf.multi_cell(0, 5, _S(
                    f"  Outliers IQR : {n_out} valeurs ({out_pct}%){out_label}"
                    f"  ->  Scaler : {'RobustScaler' if (out_pct or 0) > 10 else 'StandardScaler'}"
                ))

            skew = col_info.get("skewness")
            kurt = col_info.get("kurtosis")
            if skew is not None:
                skew_txt = ("Tres asymetrique" if abs(skew) > 2 else
                            "Moderement asymetrique" if abs(skew) > 1 else "Symetrique")
                kurt_txt = (f"Leptokurtique (queues epaisses)" if (kurt or 0) > 3 else
                            f"Platykurtique" if (kurt or 0) < -1 else "Mesokurtique (normale)")
                pdf.set_x(pdf.l_margin + 4)
                pdf.multi_cell(0, 5, _S(
                    f"  Asymetrie (skewness) : {skew:+.3f}  ->  {skew_txt}  |  "
                    f"Kurtosis : {kurt:+.3f}  ->  {kurt_txt}"
                ))
        else:
            top = col_info.get("top_values", {})
            if top:
                top_str = "  ,  ".join(f"{k} ({v})" for k, v in list(top.items())[:6])
                pdf.set_x(pdf.l_margin + 4)
                pdf.multi_cell(0, 5, _S(f"  Top valeurs : {top_str}"))
        pdf.ln(1)

    # ══ 7. PIPELINE DE PRETRAITEMENT ═══════════════════════════════════════════
    pdf.add_page()
    _pdf_section(pdf, "7", "Pipeline de pretraitement applique")

    steps = pt.get("steps", [])
    _step_labels = {
        "drop_duplicates":       "Suppression des doublons",
        "drop_constant_columns": "Elimination colonnes constantes",
        "datetime_parsing":      "Parsing colonnes datetime",
        "missing_imputation":    "Imputation valeurs manquantes",
        "encoding":              "Encodage variables categorielles",
        "standardization":       "Normalisation / Scaling adaptatif",
    }
    for step in steps:
        stype  = step.get("type", "")
        slabel = _step_labels.get(stype, stype)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(37, 99, 235)
        pdf.cell(0, 6, _S(f"  Etape {step.get('step', '')} : {slabel}"), new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(55, 65, 81)

        if stype == "drop_duplicates":
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5, _S(f"  Lignes supprimees : {step.get('rows_removed', 0)}"))
        elif stype == "drop_constant_columns":
            cols_rm = step.get("columns_removed", [])
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5, _S(f"  Colonnes supprimees ({len(cols_rm)}) : {', '.join(cols_rm[:10])}"))
        elif stype == "datetime_parsing":
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5, _S(f"  Colonnes traitees : {', '.join(step.get('columns', [])[:8])}"))
        elif stype == "missing_imputation":
            cols_imp = step.get("columns", {})
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5, _S(
                f"  {len(cols_imp)} colonne(s) imputees : " +
                "  |  ".join(f"{c} ({v})" for c, v in list(cols_imp.items())[:8])
            ))
        elif stype == "encoding":
            cols_enc = step.get("columns", {})
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5, _S(
                f"  {len(cols_enc)} colonne(s) encodee(s) : " +
                "  |  ".join(f"{c} ({v})" for c, v in list(cols_enc.items())[:8])
            ))
        elif stype == "standardization":
            n_std = step.get("n_standard", 0)
            n_rob = step.get("n_robust", 0)
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5, _S(f"  StandardScaler : {n_std}  |  RobustScaler : {n_rob}"))
            # Table des scalers
            cols_sc = step.get("columns", {})
            if cols_sc:
                pdf.ln(2)
                pdf.set_font("Helvetica", "B", 7)
                pdf.set_text_color(55, 65, 81)
                col_w = [65, 28, 22, 22, 22]
                headers = ["Colonne", "Scaler", "Centre", "Echelle", "Outliers%"]
                for i, h in enumerate(headers):
                    pdf.cell(col_w[i], 5, h, border=1)
                pdf.ln()
                pdf.set_font("Helvetica", "", 7)
                for cname, cinfo in list(cols_sc.items())[:20]:
                    scaler_type = cinfo.get("scaler", "StandardScaler")
                    if scaler_type == "RobustScaler":
                        pdf.set_text_color(220, 38, 38)
                    else:
                        pdf.set_text_color(22, 163, 74)
                    pdf.cell(col_w[0], 4, _S(cname[:28]), border=1)
                    pdf.set_text_color(17, 24, 39)
                    pdf.cell(col_w[1], 4, _S("Robust" if scaler_type == "RobustScaler" else "Standard"), border=1)
                    pdf.cell(col_w[2], 4, _S(str(cinfo.get("center", ""))), border=1)
                    pdf.cell(col_w[3], 4, _S(str(cinfo.get("scale", ""))), border=1)
                    pct = cinfo.get("outlier_pct", "")
                    if pct != "" and float(pct) > 10:
                        pdf.set_text_color(220, 38, 38)
                    pdf.cell(col_w[4], 4, _S(f"{pct}%"), border=1)
                    pdf.set_text_color(17, 24, 39)
                    pdf.ln()
                pdf.ln(2)
        pdf.ln(1)

    # ── Journal de transformation
    logs = pt.get("transformation_log", [])
    if logs:
        pdf.ln(3)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(0, 6, "Journal de transformation :", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Courier", "", 7)
        pdf.set_text_color(55, 65, 81)
        for log in logs[:60]:
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 4, _S(log))

    # ══ 8. ENCODAGES ══════════════════════════════════════════════════════════
    if encoding_maps:
        pdf.add_page()
        _pdf_section(pdf, "8", "Correspondances d'encodage")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(55, 65, 81)
        for col, info in encoding_maps.items():
            pdf.set_font("Helvetica", "B", 8)
            pdf.set_text_color(124, 58, 237)
            pdf.cell(0, 5, _S(f"  {col}  [{info.get('type', 'label')}]"), new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 7)
            pdf.set_text_color(55, 65, 81)
            mapping_str = "  |  ".join(f'"{k}" -> {v}' for k, v in list(info["mapping"].items())[:20])
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 4, _S(mapping_str))
            if len(info["mapping"]) > 20:
                pdf.set_x(pdf.l_margin + 4)
                pdf.multi_cell(0, 4, _S(f"  ... +{len(info['mapping']) - 20} autres valeurs"))
            pdf.ln(1)

    # ══ 9. RECOMMANDATIONS IA ══════════════════════════════════════════════════
    pdf.add_page()
    _pdf_section(pdf, "9", "Plan de pretraitement — Analyse IA")
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 6, _S(llm_result.get("preprocessing_plan", "Non disponible.")))
    pdf.ln(5)
    _pdf_section(pdf, "10", "Recommandations pour la selection de features")
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 6, _S(llm_result.get("feature_recommendations", "Non disponible.")))

    # ══ 11. GRAPHIQUES ══════════════════════════════════════════════════════════
    for plot in plots:
        try:
            pdf.add_page()
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(17, 24, 39)
            pdf.cell(0, 8, _S(plot["title"]), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)
            pdf.image(plot["path"], w=pdf.w - 30)
        except Exception:
            pass

    # ══ 12. COLONNES FINALES APRES PRETRAITEMENT ════════════════════════════════
    col_order = pt.get("column_order", [])
    if col_order:
        pdf.add_page()
        _pdf_section(pdf, "12", "Colonnes du dataset nettoye (ordre final)")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(55, 65, 81)
        for i, col in enumerate(col_order, 1):
            pdf.cell(10, 5, _S(f"{i:3d}."))
            pdf.cell(0, 5, _S(col), new_x="LMARGIN", new_y="NEXT")

    units = pt.get("units", {})
    if units:
        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(0, 6, "Unites detectees dans les colonnes d'origine :", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(55, 65, 81)
        for clean, info in units.items():
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5, _S(f"  {info.get('original', clean)} -> {clean}  ({info.get('unit', '?')})"))

    pdf.output(str(report_path))
    return report_path


# ─── Ingestion Dashboard ──────────────────────────────────────────────────────

def _ingest_dashboard(df: "pd.DataFrame", data_type: str, dataset_id: int):
    """Après EDA, injecte les mesures/KPIs/défauts dans la BD pour alimenter le dashboard."""
    try:
        from db.database import db_session
        time_col = _detect_time_col(df)
        machine_col = next((c for c in df.columns if c.lower() in ("machine_id", "machine")), None)
        vrms_col = next((c for c in df.columns if any(k in c.lower() for k in ("v_rms", "vrms", "v_rms_mm_s"))), None)

        with db_session() as conn:
            if vrms_col and time_col and len(df) > 0:
                for _, row in df.iterrows():
                    try:
                        ts = pd.Timestamp(row[time_col]) if pd.notna(row.get(time_col)) else None
                        if ts is None: continue
                        mid = int(row[machine_col].replace("M","")) if machine_col and pd.notna(row.get(machine_col)) else 1
                        vrms = float(row[vrms_col]) if pd.notna(row.get(vrms_col)) else None
                        if vrms is None: continue
                        crest = float(row.get("crest_factor", 0)) if pd.notna(row.get("crest_factor")) else None
                        kurt = float(row.get("kurtosis", 0)) if pd.notna(row.get("kurtosis")) else None
                        temp = float(row.get("temperature_c", 0)) if pd.notna(row.get("temperature_c")) else None
                        zone = "A" if vrms < 2.3 else "B" if vrms < 4.5 else "C" if vrms < 7.1 else "D"
                        conn.execute("""INSERT OR IGNORE INTO mesure_globale
                            (id_capteur,id_machine,timestamp_mesure,v_rms_mm_s,crest_factor,facteur_k,temperature_c,zone_iso_calculee,statut_alarme)
                            VALUES (1,?,?,?,?,?,?,?,?)""",
                            (mid, str(ts), round(vrms,2), crest, kurt, temp, zone, "alerte" if zone=="D" else "normal"))
                    except Exception: continue

            kpi_cols = [c for c in df.columns if any(k in c.lower() for k in ("mtbf","mttr","disponibilite","oee","trs"))]
            if kpi_cols and time_col and len(df) > 0:
                try:
                    dc = df.copy()
                    dc["_date"] = pd.to_datetime(dc[time_col], errors="coerce").dt.strftime("%Y-%m-%d")
                    for dt, grp in dc.groupby("_date"):
                        m = {c: round(grp[c].mean(),1) for c in kpi_cols if c in grp.columns}
                        conn.execute("""INSERT OR IGNORE INTO kpi_journalier
                            (date_kpi,mtbf_heures,mttr_heures,disponibilite_pct,trs_oee_pct)
                            VALUES (?,?,?,?,?)""",
                            (str(dt), m.get("mtbf_heures",480), m.get("mttr_heures",4.0),
                             m.get("disponibilite_pct",94), m.get("oee_pct",m.get("trs_pct",78))))
                except Exception: pass

            dcol = next((c for c in df.columns if "defaut" in c.lower() or "fault" in c.lower()), None)
            if dcol and machine_col and len(df) > 0:
                for _, r in df[[machine_col, dcol]].drop_duplicates().iterrows():
                    try:
                        md = int(r[machine_col].replace("M","")) if pd.notna(r.get(machine_col)) else 1
                        dv = str(r[dcol])
                        if dv and "Aucun" not in dv:
                            conn.execute("""INSERT OR IGNORE INTO defaut_detecte
                                (id_machine,type_defaut,date_premiere_detection,gravite,stade_degradation,confiance_diagnostic_pct,statut)
                                VALUES (?,?,datetime('now'),3,2,75,'actif')""", (md, dv))
                    except Exception: pass
        print(f"[Ingestion Dashboard] Dataset {dataset_id} -> mesures/KPIs/defauts injectes")
    except Exception as e:
        print(f"[Ingestion Dashboard] Ignoree : {e}")


# ─── Point d'entrée principal ─────────────────────────────────────────────────

def run_eda(dataset_id: int, file_path: str, update_db_callback, ingest: bool = True) -> None:
    """
    Lance l'analyse EDA complète pour un dataset.
    update_db_callback(dataset_id, status, **kwargs) est appelé pour mettre à jour la BD.
    ingest=True  : intègre les mesures/KPIs/défauts dans le dashboard (mode entreprise).
    ingest=False : EDA uniquement, aucune trace dans les tables dashboard (mode exploratoire).
    """
    try:
        update_db_callback(dataset_id, "processing")

        path = Path(file_path)
        frames = parse_file(path)

        all_results = []
        for frame_name, df in frames.items():
            summary       = _compute_summary(df)
            data_type     = _detect_data_type(df)
            quality_score = _compute_quality_score(summary)
            kpis          = _compute_kpis(df, data_type)
            rul_info      = _compute_rul(df, data_type)
            llm_result    = _call_claude(summary, data_type, frame_name, quality_score)
            plots         = _generate_plots(df, dataset_id)
            df_proc, pipeline_trace, enc_maps = _preprocess(df)

            # Sauvegarde fichier traité
            proc_filename = f"dataset_{dataset_id}_{Path(frame_name).stem}_processed.csv"
            proc_path     = PROCESSED_DIR / proc_filename
            df_proc.to_csv(proc_path, index=False)

            # Sauvegarde pipeline trace (JSON)
            pipeline_path = PROCESSED_DIR / f"preprocessing_{dataset_id}_{Path(frame_name).stem}.json"
            with open(pipeline_path, "w", encoding="utf-8") as f:
                json.dump(pipeline_trace, f, ensure_ascii=False, default=str, indent=2)

            # Génération explication .txt
            txt_path = PROCESSED_DIR / f"preprocessing_{dataset_id}_{Path(frame_name).stem}.txt"
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(f"RAPPORT DE PRETRAITEMENT — {frame_name}\n")
                f.write(f"Dataset ID : {dataset_id}\n")
                f.write(f"Lignes traitées : {len(df_proc)}\n")
                f.write(f"Colonnes finales : {len(df_proc.columns)}\n")
                f.write("=" * 60 + "\n\n")
                for log in pipeline_trace.get("transformation_log", []):
                    f.write(log + "\n")
                f.write("\n" + "=" * 60 + "\n")
                f.write("COLONNES FINALES DU DATASET NETTOYE :\n")
                for i, col in enumerate(pipeline_trace.get("column_order", []), 1):
                    f.write(f"  {i:3d}. {col}\n")
                if pipeline_trace.get("units"):
                    f.write("\nUNITES DETECTEES DANS LES COLONNES D'ORIGINE :\n")
                    for clean, info in pipeline_trace["units"].items():
                        f.write(f"  {info['original']} → {clean} ({info['unit']})\n")

            plots_serializable = [{"title": p["title"], "path": p["path"], "b64": p["b64"]} for p in plots]
            structured_trace = {
                "steps": pipeline_trace.get("steps", []),
                "transformation_log": pipeline_trace.get("transformation_log", []),
                "column_order": pipeline_trace.get("column_order", []),
                "units": pipeline_trace.get("units", {}),
            }

            # Rapport PDF enrichi
            report_path = _generate_pdf(
                dataset_id, frame_name, summary, llm_result, plots, enc_maps,
                data_type, quality_score, structured_trace, kpis, rul_info
            )

            all_results.append({
                "frame_name":     frame_name,
                "summary":        summary,
                "data_type":      data_type,
                "quality_score":  quality_score,
                "llm_result":     llm_result,
                "kpis":           kpis,
                "rul_info":       rul_info,
                "plots":          plots_serializable,
                "pipeline_trace": structured_trace,
                "encoding_maps":  enc_maps,
                "processed_path": str(proc_path),
                "report_path":    str(report_path),
            })

        # Utilise le premier frame comme résultat principal
        main = all_results[0]
        update_db_callback(
            dataset_id,
            "processed",
            n_rows=main["summary"]["n_rows"],
            n_cols=main["summary"]["n_cols"],
            detected_type=main["data_type"],
            processed_path=main["processed_path"],
            eda_report_path=main["report_path"],
            eda_results=json.dumps(all_results, ensure_ascii=False, default=str),
        )

        # INGESTION DASHBOARD : insérer mesures + KPIs dans la BD (mode entreprise uniquement)
        if ingest:
            _ingest_dashboard(df_proc, data_type, dataset_id)

    except Exception as e:
        update_db_callback(dataset_id, "error", error_message=traceback.format_exc()[:2000])
        raise
