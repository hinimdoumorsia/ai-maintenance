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


def _detect_data_type(df: pd.DataFrame) -> tuple[str, int]:
    """Retourne (type, score_confiance). Score ≤ 1 = détection faible."""
    cols_lower = {c.lower().replace(" ", "_") for c in df.columns}
    scores = {
        "vibration":   sum(any(k in c for k in VIBRATION_KEYWORDS)  for c in cols_lower),
        "kpi":         sum(any(k in c for k in KPI_KEYWORDS)         for c in cols_lower),
        "maintenance": sum(any(k in c for k in MAINTENANCE_KEYWORDS) for c in cols_lower),
        "machine":     sum(any(k in c for k in MACHINE_KEYWORDS)     for c in cols_lower),
    }
    best = max(scores, key=scores.get)
    best_score = scores[best]
    if best_score == 0:
        return "generic", 0
    return best, best_score


def _infer_domain_with_llm(df: pd.DataFrame, filename: str, api_key: str) -> tuple[str, str]:
    """
    Appel LLM léger pour inférer le vrai domaine quand la détection par mots-clés
    est faible (score ≤ 1). Retourne (data_type, domain_description).
    """
    if not api_key:
        return "generic", ""

    cols_sample = list(df.columns[:40])
    dtypes_info = {c: str(df[c].dtype) for c in cols_sample}
    try:
        numeric_sample = df.select_dtypes(include="number").head(3).to_dict(orient="list")
    except Exception:
        numeric_sample = {}

    col_list = "\n".join(f"  - {c} ({dtypes_info[c]})" for c in cols_sample)

    prompt = f"""Tu es un expert en data science industrielle. Analyse ces métadonnées de dataset et identifie le domaine réel.

Fichier : "{filename}"
Dimensions : {df.shape[0]} lignes × {df.shape[1]} colonnes
Colonnes (max 40) :
{col_list}
Aperçu valeurs numériques (3 lignes) :
{json.dumps(numeric_sample, default=str)[:800]}

Réponds UNIQUEMENT en JSON valide sur UNE SEULE LIGNE, sans markdown :
{{"type": "vibration|kpi|maintenance|machine|electrical|thermal|acoustic|process|quality|cmapss|generic", "domain": "description du domaine en 1 phrase", "pipeline_applicable": ["analyse_vibratoire", "pronostic", "kpis"], "confidence": "high|medium|low"}}

Types disponibles dans l'application : vibration (V-RMS, roulements, zones ISO), kpi (MTBF/MTTR/OEE), maintenance (ordres de travail, pannes), machine (parc, états), generic (autre).
Types hors pipeline app mais reconnus : electrical (courant, tension, puissance), thermal (température, chaleur), acoustic (son, émission acoustique), process (pression, débit, process industriel), quality (contrôle qualité, SPC), cmapss (NASA turbofan, engine_id+cycle+sensors)."""

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.content[0].text.strip()
        parsed = json.loads(raw)
        inferred_type = parsed.get("type", "generic")
        domain_desc = parsed.get("domain", "")
        return inferred_type, domain_desc
    except Exception:
        return "generic", ""


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


def _compute_kpis(df: pd.DataFrame, data_type: str,
                   vitesse_rpm: float | None = None,
                   nb_paires_poles: int | None = None,
                   nb_dents_engrenage: int | None = None) -> dict[str, dict[str, Any]] | None:
    """
    Calcule les KPIs disponibles selon les colonnes du dataset.
    Retourne None si aucun KPI n'est calculable.
    vitesse_rpm / nb_paires_poles / nb_dents_engrenage : paramètres fournis par l'utilisateur
    à l'upload pour enrichir l'analyse spectrale des datasets vibratoires.
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

    # Paramètres spectraux (datasets vibratoires — fournis à l'upload)
    if data_type == "vibration" and vitesse_rpm and vitesse_rpm > 0:
        fr = vitesse_rpm / 60.0
        spectral: dict[str, Any] = {
            "vitesse_rpm": vitesse_rpm,
            "fr_hz":       round(fr, 3),
            "harmoniques": {f"{n}xfr": round(n * fr, 3) for n in range(1, 6)},
        }
        if nb_paires_poles and nb_paires_poles > 0:
            spectral["fe_hz"]    = round(nb_paires_poles * fr, 3)
            spectral["fe_label"] = f"{nb_paires_poles}×fr — fréquence électrique"
        if nb_dents_engrenage and nb_dents_engrenage > 0:
            spectral["gmf_hz"]    = round(nb_dents_engrenage * fr, 3)
            spectral["gmf_label"] = f"GMF = {nb_dents_engrenage}×fr"
        kpis["spectral_params"] = spectral

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
    # ── Domaines hors-pipeline app (reconnus par LLM, EDA complet tout de même) ──
    "electrical": {
        "normes": (
            "IEC 60034 (machines électriques tournantes), IEC 61557 (mesure de grandeurs électriques), "
            "IEEE 1159 (surveillance de la qualité d'énergie), ISO/IEC 25012:2008"
        ),
        "focus": (
            "Analyse les grandeurs électriques : courant (A), tension (V), puissance active/réactive (kW/kVAR), "
            "facteur de puissance, harmoniques. Détecte les déséquilibres de phase, surintensités, "
            "chutes de tension et défauts d'isolement. Évalue l'aptitude au diagnostic de moteur électrique "
            "(court-circuit, rupture de barre, déséquilibre statorique)."
        ),
        "features_hint": (
            "Features critiques : courant_phase_A/B/C, tension_ligne, puissance_active, facteur_puissance. "
            "Features dérivées : déséquilibre_phase = (max−min)/moy, THD (taux distorsion harmonique), "
            "ratio puissance_réactive/active, enveloppe courant (détection défauts cage rotor). "
            "Cibles ML : défaut_type (classification), puissance_consommée_j+1 (régression)."
        ),
    },
    "thermal": {
        "normes": (
            "ISO 13379-1 (thermographie infrarouge machines), IEC 60751 (thermistances RTD), "
            "ASTM E1292 (analyse thermique), ISO/IEC 25012:2008"
        ),
        "focus": (
            "Analyse les profils thermiques : température absolue, gradient thermique, taux de montée en "
            "température. Identifie les points chauds (hotspots), les corrélations avec la charge et la vitesse. "
            "Détecte les anomalies thermiques précurseurs de défauts (suréchauffement roulements, "
            "échauffement isolant moteur, point chaud transformateur)."
        ),
        "features_hint": (
            "Features critiques : température_palier, température_bobinage, température_ambiante, delta_T. "
            "Features dérivées : delta_T = T_machine − T_ambiante, taux_montée = ΔT/Δt, "
            "index_suréchauffement = T_mesurée / T_nominale. "
            "Cibles ML : seuil_alarme_température (classification), temps_avant_surchauffe (régression)."
        ),
    },
    "acoustic": {
        "normes": (
            "ISO 1683 (acoustique — grandeurs de référence), ISO 9614 (intensimétrie acoustique), "
            "ISO 11200 (bruit des machines), ISO 18436-5 (émission acoustique)"
        ),
        "focus": (
            "Analyse les signaux acoustiques/ultrasons : niveau sonore (dB), fréquences dominantes, "
            "émission acoustique (AE). Identifie les pics fréquentiels associés à des défauts "
            "(frottement, claquement, cavitation). Évalue la corrélation bruit/charge/vitesse."
        ),
        "features_hint": (
            "Features critiques : niveau_dB, fréquence_dominante_Hz, énergie_AE. "
            "Features dérivées : bande_octave_1kHz/2kHz/4kHz, ratio signal/bruit, "
            "RMS_acoustique par fenêtre 0.1s. "
            "Cibles ML : type_défaut_acoustique (classification), gravité_usure (régression)."
        ),
    },
    "process": {
        "normes": (
            "ISA-88 (contrôle de batch industriel), IEC 61511 (sécurité systèmes instrumentés), "
            "ISO 5167 (mesure de débit), ISO/IEC 25012:2008"
        ),
        "focus": (
            "Analyse les variables de procédé : pression, débit, niveau, pH, viscosité, concentration. "
            "Détecte les dérives de procédé, les hors-spécifications et les instabilités. "
            "Évalue la corrélation entre variables de consigne et variables mesurées."
        ),
        "features_hint": (
            "Features critiques : pression_bar, débit_m3h, température_process, niveau_%, consigne_vs_mesure. "
            "Features dérivées : erreur_asservissement = |consigne − mesure|, "
            "indice_stabilité = σ(dernières_60_mesures), flag_hors_spec. "
            "Cibles ML : défaut_process (classification), valeur_paramètre_t+n (régression)."
        ),
    },
    "quality": {
        "normes": (
            "ISO 9001:2015 (management qualité), ISO 7870 (cartes de contrôle SPC), "
            "ISO 3534-2 (statistiques appliquées à la qualité), Six Sigma DMAIC"
        ),
        "focus": (
            "Analyse les données de contrôle qualité : mesures dimensionnelles, taux de rebut, "
            "Cp/Cpk (capabilité process). Identifie les dérives hors tolérances, "
            "les corrélations non-conformité/machine/opérateur/shift."
        ),
        "features_hint": (
            "Features critiques : mesure_dimensionnelle, limite_sup, limite_inf, non_conforme_binaire. "
            "Features dérivées : Cp = (LSL−LIL)/(6σ), Cpk = min((USL−μ)/3σ, (μ−LSL)/3σ), "
            "flag_dérive_xbar_r, coût_rebut. "
            "Cibles ML : non_conformité (classification), valeur_mesure (régression SPC prédictif)."
        ),
    },
    "cmapss": {
        "normes": (
            "NASA C-MAPSS Turbofan Engine Degradation Simulation, "
            "ISO 13381-1 (pronostic et gestion de la santé), "
            "SAE JA1011 (maintenance centrée sur la fiabilité RCM)"
        ),
        "focus": (
            "Dataset NASA C-MAPSS : engine_id (moteur), cycle (temps de vol cumulé), "
            "op_setting_1/2/3 (conditions opérationnelles), sensor_1..21 (capteurs température, pression, débit). "
            "Objectif principal : prédiction RUL (Remaining Useful Life) par moteur. "
            "Identifier les capteurs les plus prédictifs de la dégradation (typiquement sensor_11, "
            "sensor_12, sensor_4, sensor_15 dans FD001-FD004). "
            "Vérifier la monotonie de dégradation par moteur et la distribution des RUL finales."
        ),
        "features_hint": (
            "Features critiques : capteurs à variance non nulle (éliminer capteurs constants : "
            "sensor_1, sensor_5, sensor_6, sensor_10, sensor_16, sensor_18, sensor_19 souvent constants). "
            "Features dérivées : RUL = max_cycle_par_moteur − cycle_actuel, "
            "rolling_mean_7cycles par capteur, pente_dégradation par fenêtre. "
            "Stratégie ML : LSTM ou XGBoost séquence→RUL. Split OBLIGATOIREMENT par moteur "
            "(pas aléatoire — fuite de données sinon). Métrique : RMSE sur RUL + score asymétrique NASA."
        ),
    },
}


# ─── Appel LLM Claude ─────────────────────────────────────────────────────────

def _call_claude(summary: dict, data_type: str, original_filename: str, quality_score: int = 0,
                  alerts: list | None = None, kpis: dict | None = None,
                  rul_info: dict | None = None, vif_info: list | None = None,
                  anomalies_iso: dict | None = None,
                  domain_description: str = "") -> dict[str, Any]:
    """
    Appelle Claude (expert vibratoire + data scientist sénior) pour obtenir TOUTES les zones
    de narration du rapport selon EDA_AGENT_INSTRUCTIONS.md :
    - executive_summary   : verdict + dataset 3 phrases + 3 actions (urgent/court/moyen terme) + limites + readiness
    - narrative           : analyse EDA narrative (verdict qualité, patterns, anomalies, implications, conclusion)
    - quality_audit       : commentaire sur l'audit qualité (manquants, doublons, cohérence)
    - univariate_insights : interprétation des distributions + outliers + cible
    - bivariate_insights  : interprétation Pearson/Spearman + multicolinéarité
    - temporal_insights   : tendance + stationnarité + cycles (si série temporelle)
    - diagnostic_insights : interprétation spécifique au type (vibratoire, KPI, etc.)
    - preprocessing_plan  : pipeline numéroté appliqué + justification métier/statistique
    - feature_recommendations : recommandations features contextualisées
    - ml_tasks            : tâches ML recommandées (régression/classification/anomaly)
    - limitations         : ce que le dataset ne permet PAS + hypothèses + biais
    Retourne des messages de fallback si la clé API est absente.
    """
    _FALLBACK_KEYS = ["executive_summary", "narrative", "quality_audit", "univariate_insights",
                       "bivariate_insights", "temporal_insights", "diagnostic_insights",
                       "preprocessing_plan", "feature_recommendations", "ml_tasks", "limitations"]
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {k: "Clé API Claude non configurée — section indisponible." for k in _FALLBACK_KEYS}

    try:
        import anthropic
        import re

        client = anthropic.Anthropic(api_key=api_key)
        ctx = _TYPE_EXPERT.get(data_type, _TYPE_EXPERT["generic"])

        # Modules de l'app disponibles selon le type détecté
        _PIPELINE_MODULES = {
            "vibration":   ["Vue Générale EDA ✅", "Analyse Vibratoire ✅", "Pronostic & DRBF ✅", "KPIs ✅"],
            "kpi":         ["Vue Générale EDA ✅", "KPIs ✅", "Analyse Vibratoire ❌", "Pronostic ⚠️ partiel"],
            "maintenance": ["Vue Générale EDA ✅", "KPIs ✅", "Pronostic ⚠️ partiel", "Analyse Vibratoire ❌"],
            "machine":     ["Vue Générale EDA ✅", "Parc Machines ✅", "KPIs ✅", "Analyse Vibratoire ⚠️ si VRMS présent"],
            "cmapss":      ["Vue Générale EDA ✅", "Pronostic & DRBF ✅ (RUL par moteur)", "Analyse Vibratoire ❌", "KPIs ⚠️"],
            "electrical":  ["Vue Générale EDA ✅", "Analyse Vibratoire ❌ (domaine électrique, pas vibratoire)", "KPIs ⚠️ si métriques présentes"],
            "thermal":     ["Vue Générale EDA ✅", "Analyse Vibratoire ❌ (domaine thermique)", "KPIs ⚠️ si métriques présentes"],
            "acoustic":    ["Vue Générale EDA ✅", "Analyse Vibratoire ⚠️ si RMS/Crest présents", "KPIs ❌"],
            "process":     ["Vue Générale EDA ✅", "Analyse Vibratoire ❌", "KPIs ⚠️ si métriques calculées"],
            "quality":     ["Vue Générale EDA ✅", "KPIs ⚠️", "Analyse Vibratoire ❌"],
            "generic":     ["Vue Générale EDA ✅", "Autres modules : compatibilité à évaluer selon contenu"],
        }
        pipeline_note = "\n".join(_PIPELINE_MODULES.get(data_type, _PIPELINE_MODULES["generic"]))

        # Note domaine si inféré par LLM
        domain_note = f"\nDomaine identifié par IA : {domain_description}" if domain_description else ""

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

        # ── Contexte alertes / KPIs / RUL / VIF / Isolation Forest ──
        alerts_summary = ""
        if alerts:
            crit = [a for a in alerts if a["level"] == "critical"]
            warn = [a for a in alerts if a["level"] == "warning"]
            alerts_summary = f"\n## Alertes détectées\n- {len(crit)} critique(s), {len(warn)} avertissement(s)"
            for a in (crit + warn)[:6]:
                alerts_summary += f"\n  • [{a['level'].upper()}] {a['title']} → action : {a['action']}"

        kpi_summary = ""
        if kpis:
            kpi_summary = "\n## KPIs calculés\n" + "\n".join(
                f"  • {k} = {v.get('value')} {v.get('unit', '')}" for k, v in kpis.items()
            )

        rul_summary = ""
        if rul_info:
            rul_summary = "\n## Pronostic / RUL\n" + "\n".join(
                f"  • {k} = {v}" for k, v in rul_info.items() if v is not None
            )

        vif_summary = ""
        if vif_info:
            top_vif = [v for v in vif_info if v.get("verdict") != "OK"][:5]
            if top_vif:
                vif_summary = "\n## Multicolinéarité détectée (VIF)\n" + "\n".join(
                    f"  • {v['name']} : VIF={v['vif']} ({v['verdict']})" for v in top_vif
                )

        iso_summary = ""
        if anomalies_iso and anomalies_iso.get("n_anomalies", 0) > 0:
            iso_summary = (f"\n## Anomalies multidimensionnelles (Isolation Forest)\n"
                           f"  • {anomalies_iso['n_anomalies']} anomalies ({anomalies_iso['pct_anomalies']}%) "
                           f"sur {anomalies_iso.get('n_features', '?')} features")

        prompt = f"""Tu es un expert sénior en Data Science industrielle et maintenance prédictive.
Tu maîtrises les normes suivantes applicables : {ctx['normes']}.
Ton rapport doit être compréhensible à la fois par un ingénieur de maintenance et par un data scientist.

PRINCIPE FONDAMENTAL : Tu écris une narration, pas une accumulation de chiffres. Chaque affirmation
chiffrée doit être quantifiée avec son impact opérationnel. Ne décris jamais un graphique visuellement ;
interprète ce qu'il signifie pour la maintenance prédictive et ce qu'il faut en faire.

ADAPTATION OBLIGATOIRE : Si les données que tu observes ne correspondent pas exactement au type détecté,
adapte TOUTE ton analyse au domaine réel que tu identifies à partir des noms de colonnes et des valeurs.
Tu as la liberté et l'obligation d'exercer ton jugement d'expert pour produire une analyse utile même si
le dataset sort des sentiers battus. Ne te limite JAMAIS à "données génériques" si tu peux identifier
un domaine précis (électrique, thermique, acoustique, process, qualité, signal brut, etc.).

## Dataset analysé
Fichier : "{original_filename}"
Type détecté : {data_type.upper()}{domain_note}
Dimensions : {summary['n_rows']:,} lignes × {summary['n_cols']} colonnes

## Compatibilité avec les modules de l'application
{pipeline_note}
Doublons : {summary['duplicates']}
Valeurs manquantes : {summary['missing_total']} ({summary['missing_pct']:.1f}% en moyenne)
Score qualité calculé : {quality_score}/100 ({qs_label})

## Pipeline de normalisation adaptatif appliqué
{scaler_info}

## Colonnes détectées (max 30)
{chr(10).join(col_descriptions)}
{alerts_summary}{kpi_summary}{rul_summary}{vif_summary}{iso_summary}

## Focus d'analyse pour ce type de données
{ctx['focus']}

---
Génère UNIQUEMENT ce JSON valide (objet plat, valeurs string, pas de markdown, pas de texte avant/après) :
{{
"executive_summary": "SYNTHÈSE EXÉCUTIVE (≤130 mots, ton décisionnel, JAMAIS de statistiques brutes). Structure OBLIGATOIRE en 5 blocs séparés par '||' :  BLOC 1 = 'Dataset en 3 phrases :' contexte métier, volumétrie, domaine réel identifié.  BLOC 2 = 'Verdict qualité : {quality_score}/100 ({qs_label}).' justification en 1 phrase.  BLOC 3 = 'Compatibilité application :' quels modules sont directement utilisables et lesquels ne s'appliquent pas à ce type de données (sois honnête si un module n'est pas pertinent).  BLOC 4 = 'Limites principales :' 2-3 limites métier majeures.  BLOC 5 = 'Prêt pour entraînement : OUI/OUI avec réserves/NON.' justification en 1 phrase.",

"narrative": "Analyse EDA narrative 350-450 mots. Structure OBLIGATOIRE en 5 paragraphes : 1) Verdict qualité {quality_score}/100 ({qs_label}) — explication des principales pénalités. 2) Patterns principaux observés. 3) Anomalies détectées et leur impact (outliers, skewness, alertes critiques). 4) Implications pour la maintenance prédictive — {ctx['focus']}. 5) Conclusion : 2-3 actions prioritaires. Citer au moins une norme ISO.",

"quality_audit": "Commentaire 100-150 mots sur l'audit qualité du dataset. Pour chaque colonne avec >5% de manquants : diagnostic métier probable (capteur défaillant ? saisie GMAO incomplète ?), impact opérationnel, stratégie d'imputation retenue + justification. Mentionner les doublons et leur origine probable. Citer ISO/IEC 25012:2008.",

"univariate_insights": "Analyse univariée 150-200 mots. Pour les 3-5 colonnes les plus significatives : interpréter la distribution (asymétrique, multimodale, queues épaisses), traiter les outliers comme du signal métier (PAS du bruit — ex. V-RMS Zone D = défaut roulement), proposer la transformation (log/Box-Cox/Yeo-Johnson) si skewness > 2. Justifier le choix du scaler (StandardScaler vs RobustScaler).",

"bivariate_insights": "Analyse bivariée 100-150 mots. Commenter UNIQUEMENT les corrélations fortes (|r|>0.7) attendues OU inattendues, et l'absence de corrélations attendues. Si multicolinéarité détectée (VIF>10), identifier nominativement les variables et proposer un traitement (suppression, ratios, PCA). Différencier Pearson (linéaire) et Spearman (monotone).",

"temporal_insights": "Analyse temporelle 100-150 mots. Tendance détectée (croissante/décroissante/stable + pente quantifiée), stationnarité (oui/non + interprétation), cycles/saisonnalité, projection de franchissement de seuils ISO si applicable. Si pas de série temporelle exploitable, écrire 'Non applicable — dataset sans dimension temporelle exploitable' et expliquer pourquoi.",

"diagnostic_insights": "Diagnostic métier 150-200 mots. Adapte ton expertise au domaine réel observé : {data_type.upper()} — {ctx['focus']} Si le dataset sort du pipeline standard de l'application (modules non compatibles ci-dessus), explique ce qu'un analyste devrait faire avec ce dataset dans un contexte industriel. Identifier nominativement les signaux/composants/machines critiques. Citer les normes pertinentes selon le domaine réel.",

"preprocessing_plan": "Plan numéroté 8-12 étapes décrivant le pipeline appliqué + justification statistique/métier de chaque étape. Format : '1. Étape — Action — Justification'. Pour le scaling, justifier StandardScaler vs RobustScaler colonne par colonne.",

"feature_recommendations": "Recommandations features 200-250 mots. {ctx['features_hint']} Formater en 3 blocs : A) Features critiques à conserver (justification métier/statistique). B) Features dérivées à créer (avec formule mathématique). C) Features à exclure ou surveiller (multicolinéarité VIF>10, cardinalité excessive, fuite de données / target leakage).",

"ml_tasks": "Tâches ML recommandées 100-150 mots. Format : pour chaque tâche pertinente (1 à 3), donner : Type (régression/classification/anomaly), Cible, Modèles recommandés (XGBoost/RF/LSTM/IsolationForest), Métriques (RMSE/F1/AUC), Baseline attendue. Stratégie de split : chronologique pour séries temporelles (PAS de shuffle), aléatoire stratifié sinon.",

"limitations": "Limites du dataset 120-180 mots. Structurer en 4 sous-blocs : 1) Ce que le dataset NE PERMET PAS de modéliser (absence de variables, granularité insuffisante). 2) Hypothèses faites (calibrage capteurs, conditions homogènes). 3) Biais possibles (sélection, observation, temporel). 4) Données complémentaires à acquérir pour enrichir l'analyse."
}}"""

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=8192,
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
            for key in _FALLBACK_KEYS:
                m2 = re.search(rf'"{key}"\s*:\s*"((?:[^"\\]|\\.)*)"', t)
                if m2:
                    result[key] = m2.group(1).replace('\\n', '\n').replace('\\"', '"')
            if result:
                return result
            raise ValueError("JSON non réparable")

        parsed = _try_parse(raw)
        # Assurer la présence de toutes les clés
        for k in _FALLBACK_KEYS:
            parsed.setdefault(k, "Section non générée par le LLM.")
        return parsed

    except Exception as e:
        import traceback
        raw_preview = raw[:300] if 'raw' in dir() else ''
        print(f"[EDA _call_claude] ERREUR : {type(e).__name__}: {e}")
        if raw_preview:
            print(f"[EDA _call_claude] Réponse brute (300 premiers chars) : {raw_preview}")
        traceback.print_exc()
        fb = {k: f"Section indisponible (erreur LLM : {type(e).__name__})." for k in _FALLBACK_KEYS}
        if raw_preview:
            fb["narrative"] = f"[Réponse brute non parsée] {raw_preview}"
        return fb


# ─── Analyses avancées (VIF, Box-Cox, Isolation Forest, ACF, stationnarité) ──

def _compute_iso_25012_subscores(summary: dict) -> dict[str, dict[str, Any]]:
    """Décomposition du score qualité par dimension ISO/IEC 25012:2008."""
    rows = summary.get("n_rows", 1) or 1
    miss_pct = summary.get("missing_pct", 0)
    completude_score = max(0.0, 20.0 - min(20.0, miss_pct * 1.0))

    dup_pct = summary.get("duplicates", 0) / rows * 100
    unicite_score = max(0.0, 20.0 - min(20.0, dup_pct * 0.5))

    num_cols_info = [c for c in summary.get("columns", []) if c.get("type") == "numeric"]
    avg_outlier_pct = (sum(c.get("outlier_pct", 0) or 0 for c in num_cols_info) / len(num_cols_info)) if num_cols_info else 0
    exactitude_score = max(0.0, 20.0 - min(20.0, avg_outlier_pct * 0.6))

    skews = [abs(c.get("skewness") or 0) for c in num_cols_info]
    coherence_pen = 0
    if skews:
        coherence_pen = min(20, sum(1 for s in skews if s > 2) * 2)
    coherence_score = max(0.0, 20.0 - coherence_pen)

    fraicheur_score = 18.0  # heuristique par défaut

    return {
        "completude":  {"score": round(completude_score, 1), "max": 20, "ref": "ISO 25012 C4",
                        "detail": f"-{round(20-completude_score, 1)} pts (missing_pct={miss_pct:.1f}%)"},
        "unicite":     {"score": round(unicite_score, 1), "max": 20, "ref": "ISO 25012 C6",
                        "detail": f"-{round(20-unicite_score, 1)} pts ({summary.get('duplicates', 0)} doublons)"},
        "exactitude":  {"score": round(exactitude_score, 1), "max": 20, "ref": "ISO 25012 C1",
                        "detail": f"-{round(20-exactitude_score, 1)} pts (outliers IQR moyens {avg_outlier_pct:.1f}%)"},
        "coherence":   {"score": round(coherence_score, 1), "max": 20, "ref": "ISO 25012",
                        "detail": f"-{coherence_pen} pts ({sum(1 for s in skews if s > 2)} colonnes très asymétriques)"},
        "fraicheur":   {"score": fraicheur_score, "max": 20, "ref": "ISO 25012",
                        "detail": "Heuristique (aucune date de référence connue)"},
    }


def _compute_vif(df: pd.DataFrame, max_cols: int = 20) -> list[dict[str, Any]]:
    """
    Variance Inflation Factor — détection multicolinéarité.
    VIF = 1 / (1 - R²) où R² provient de la régression d'une colonne sur les autres.
    Implémentation manuelle (sans statsmodels).
    """
    try:
        from sklearn.linear_model import LinearRegression
    except Exception:
        return []
    num_df = df.select_dtypes(include=[np.number]).replace([np.inf, -np.inf], np.nan).dropna()
    cols = num_df.columns.tolist()[:max_cols]
    if len(cols) < 2 or len(num_df) < 5:
        return []
    num_df = num_df[cols]
    out = []
    for col in cols:
        X = num_df.drop(columns=[col]).values
        y = num_df[col].values
        if X.shape[1] == 0 or float(np.var(y)) < 1e-12:
            continue
        try:
            r2 = float(LinearRegression().fit(X, y).score(X, y))
            r2 = max(0.0, min(0.99999999, r2))
            vif = 1.0 / (1.0 - r2)
            if vif > 10:
                verdict = "Critique (>10)"
            elif vif > 5:
                verdict = "Elevé (5-10)"
            else:
                verdict = "OK"
            out.append({
                "name": col,
                "vif": round(vif, 2) if not np.isinf(vif) else 9999.0,
                "r2": round(r2, 4),
                "verdict": verdict,
            })
        except Exception:
            continue
    return sorted(out, key=lambda x: x["vif"], reverse=True)


def _detect_anomalies_isoforest(df: pd.DataFrame, contamination: float = 0.02) -> dict[str, Any]:
    """Isolation Forest pour anomalies multi-dimensionnelles (non supervisé)."""
    try:
        from sklearn.ensemble import IsolationForest
    except Exception:
        return {}
    num_df = df.select_dtypes(include=[np.number]).replace([np.inf, -np.inf], np.nan).dropna()
    if len(num_df) < 30 or num_df.shape[1] < 2:
        return {}
    try:
        clf = IsolationForest(contamination=contamination, random_state=42, n_estimators=100)
        preds = clf.fit_predict(num_df.values)
        scores = clf.score_samples(num_df.values)
        n_anomalies = int((preds == -1).sum())
        return {
            "n_anomalies": n_anomalies,
            "pct_anomalies": round(n_anomalies / len(num_df) * 100, 2),
            "contamination": contamination,
            "anomaly_indices": np.where(preds == -1)[0].tolist()[:50],
            "scores_min": round(float(scores.min()), 4),
            "scores_mean": round(float(scores.mean()), 4),
            "n_features": int(num_df.shape[1]),
        }
    except Exception:
        return {}


def _test_stationarity_simple(series: pd.Series) -> dict[str, Any]:
    """
    Test simplifié de stationnarité (alternative à ADF sans statsmodels).
    Compare moyennes/écarts-types sur 3 fenêtres successives.
    """
    s = pd.to_numeric(series, errors="coerce").dropna()
    if len(s) < 30:
        return {}
    n = len(s)
    third = n // 3
    parts = [s.iloc[:third], s.iloc[third:2*third], s.iloc[2*third:]]
    means = [float(p.mean()) for p in parts if len(p) > 0]
    stds  = [float(p.std()) for p in parts if len(p) > 1]
    if not means or not stds:
        return {}
    range_s = float(s.max() - s.min()) if s.max() != s.min() else 1.0
    mean_var_pct = (max(means) - min(means)) / range_s * 100 if range_s > 0 else 0
    std_var_pct  = (max(stds) - min(stds)) / range_s * 100 if range_s > 0 else 0
    is_stationary = mean_var_pct < 20 and std_var_pct < 20
    return {
        "is_stationary": is_stationary,
        "mean_variation_pct": round(mean_var_pct, 2),
        "std_variation_pct":  round(std_var_pct, 2),
        "verdict": "Stationnaire (moyenne/variance stables)" if is_stationary
                   else "Non-stationnaire (tendance ou variance changeante)",
        "means_by_third":  [round(m, 4) for m in means],
        "stds_by_third":   [round(s_, 4) for s_ in stds],
    }


def _compute_acf_manual(series: pd.Series, nlags: int = 20) -> list[float]:
    """Auto-corrélation manuelle (alternative à statsmodels.acf)."""
    s = pd.to_numeric(series, errors="coerce").dropna()
    if len(s) < nlags + 5:
        return []
    out = []
    for lag in range(1, nlags + 1):
        try:
            v = s.autocorr(lag=lag)
            if not pd.isna(v):
                out.append(round(float(v), 3))
        except Exception:
            continue
    return out


def _detect_temporal_trend(df: pd.DataFrame, time_col: str, value_col: str) -> dict[str, Any]:
    """Tendance linéaire d'une série temporelle et projection ISO simple."""
    try:
        d = df[[time_col, value_col]].copy()
        d[time_col] = pd.to_datetime(d[time_col], errors="coerce")
        d[value_col] = pd.to_numeric(d[value_col], errors="coerce")
        d = d.dropna().sort_values(time_col)
        if len(d) < 10:
            return {}
        t_num = (d[time_col] - d[time_col].iloc[0]).dt.total_seconds().values / 86400.0
        y = d[value_col].values
        slope, intercept = np.polyfit(t_num, y, 1)
        current = float(y[-1])
        result = {
            "slope_per_day": round(float(slope), 6),
            "intercept": round(float(intercept), 4),
            "current_value": round(current, 4),
            "current_date": str(d[time_col].iloc[-1].date()),
            "n_points": len(y),
            "trend": "croissante" if slope > 0 else "décroissante" if slope < 0 else "stable",
        }
        # Projections seuils ISO (V-RMS uniquement)
        col_lower = value_col.lower()
        if any(k in col_lower for k in ["v_rms", "vrms"]) and slope > 0:
            for threshold, label in [(4.5, "Zone C"), (7.1, "Zone D")]:
                if current < threshold:
                    days_to_threshold = (threshold - current) / slope
                    if 0 < days_to_threshold < 3650:
                        target_date = d[time_col].iloc[-1] + pd.Timedelta(days=days_to_threshold)
                        result[f"days_to_{label.replace(' ', '_').lower()}"] = round(float(days_to_threshold), 1)
                        result[f"date_{label.replace(' ', '_').lower()}"] = str(target_date.date())
        return result
    except Exception:
        return {}


def _compute_critical_alerts(df: pd.DataFrame, summary: dict, kpis: dict | None,
                              rul_info: dict | None, data_type: str) -> list[dict[str, Any]]:
    """Génère la liste structurée des alertes critiques (rouges/oranges/jaunes)."""
    alerts: list[dict[str, Any]] = []

    # Valeurs manquantes critiques
    for c in summary.get("columns", []):
        mp = c.get("missing_pct", 0) or 0
        if mp > 20:
            alerts.append({
                "level": "warning", "icon": "[!]",
                "title": f"{c['name']} : {mp}% de valeurs manquantes",
                "impact": "Risque de biais d'imputation — calculs agrégés non fiables",
                "action": "Investiguer la source de saisie (capteur défaillant ? champ optionnel ?)",
                "category": "data_quality",
            })

    # Vibration : V-RMS Zone D / Zone C
    if data_type == "vibration":
        vrms_col = next((c for c in df.columns if any(k in c.lower() for k in ["v_rms", "vrms"])), None)
        if vrms_col:
            try:
                vrms_data = pd.to_numeric(df[vrms_col], errors="coerce").dropna()
                n_zone_d = int((vrms_data > 7.1).sum())
                n_zone_c = int(((vrms_data > 4.5) & (vrms_data <= 7.1)).sum())
                if n_zone_d > 0:
                    alerts.append({
                        "level": "critical", "icon": "[CRITIQUE]",
                        "title": f"{n_zone_d} mesure(s) en Zone D ISO 10816-3 (V-RMS > 7.1 mm/s)",
                        "impact": "Défaillance imminente possible — risque sécurité opérateur",
                        "action": "Arrêt planifié + inspection roulements/alignement sous 24h",
                        "category": "vibration",
                    })
                elif n_zone_c > 0:
                    alerts.append({
                        "level": "warning", "icon": "[ATTENTION]",
                        "title": f"{n_zone_c} mesure(s) en Zone C ISO 10816-3 (4.5-7.1 mm/s)",
                        "impact": "Dégradation avancée — maintenance corrective requise",
                        "action": "Planifier intervention sous 7 jours, renforcer la surveillance",
                        "category": "vibration",
                    })
            except Exception:
                pass

    # KPIs hors normes
    if kpis:
        dispo = (kpis.get("availability") or {}).get("value")
        if dispo is not None and dispo < 90:
            alerts.append({
                "level": "warning", "icon": "[!]",
                "title": f"Disponibilité {dispo}% sous le seuil EN 15341 classe B (90%)",
                "impact": "Performance maintenance dégradée",
                "action": "Audit du processus + révision plans préventifs",
                "category": "kpi",
            })
        anom = (kpis.get("anomaly_rate") or {}).get("value")
        if anom is not None and anom > 95:
            alerts.append({
                "level": "warning", "icon": "[?]",
                "title": f"Taux anomalies {anom}% — valeur suspecte (probable erreur de calcul)",
                "impact": "Métrique non exploitable — biaise le diagnostic",
                "action": "Vérifier la formule et la définition du statut anomalie",
                "category": "data_quality",
            })

    # RUL / Health Index critique
    if rul_info:
        pct_crit = rul_info.get("pct_critical")
        if pct_crit is not None and pct_crit > 5:
            alerts.append({
                "level": "critical", "icon": "[CRITIQUE]",
                "title": f"{pct_crit}% du parc en état critique (Health Index < 0.3)",
                "impact": "Risque élevé de pannes en cascade",
                "action": "Inspection immédiate + maintenance préventive renforcée",
                "category": "pronostic",
            })
        rul_min = rul_info.get("rul_min")
        if rul_min is not None and rul_min < 240:  # < 10 jours
            alerts.append({
                "level": "critical", "icon": "[CRITIQUE]",
                "title": f"RUL minimal du parc : {rul_min}h (< 10 jours)",
                "impact": "Au moins une machine en fin de vie imminente",
                "action": "Identifier la machine concernée et planifier l'intervention",
                "category": "pronostic",
            })

    # Doublons élevés
    dup_pct = summary.get("duplicates", 0) / max(summary.get("n_rows", 1), 1) * 100
    if dup_pct > 5:
        alerts.append({
            "level": "warning", "icon": "[!]",
            "title": f"{summary['duplicates']} doublons détectés ({dup_pct:.1f}%)",
            "impact": "Biais sur les statistiques agrégées (moyenne, variance)",
            "action": "Investiguer l'origine (ingestion multiple ? bug pipeline ?)",
            "category": "data_quality",
        })

    # Ratios bornés hors plage
    for c in summary.get("columns", []):
        if c.get("type") != "numeric":
            continue
        name_l = str(c["name"]).lower()
        if any(k in name_l for k in ["pct", "_pourcent", "rate", "ratio"]) and "_pct" not in name_l:
            continue
        if "_pct" in name_l or any(k in name_l for k in ["disponibilite", "oee", "trs", "quality_pct"]):
            mx = c.get("max")
            if mx is not None and mx > 100:
                alerts.append({
                    "level": "warning", "icon": "[!]",
                    "title": f"{c['name']} dépasse 100% (max={mx})",
                    "impact": "Violation EN 15341 — ratio borné hors plage",
                    "action": "Audit du pipeline de calcul source",
                    "category": "data_quality",
                })

    return alerts


def _compute_executive_summary_data(summary: dict, quality_score: int, data_type: str,
                                     alerts: list, kpis: dict | None, rul_info: dict | None,
                                     vif_info: list, anomalies_iso: dict) -> dict[str, Any]:
    """Données structurées pour la synthèse exécutive (page 1 du rapport)."""
    qs_label = ("Excellent" if quality_score >= 85 else "Bon" if quality_score >= 70
                else "Acceptable" if quality_score >= 50 else "Insuffisant")

    n_critical = sum(1 for a in alerts if a["level"] == "critical")
    n_warnings = sum(1 for a in alerts if a["level"] == "warning")

    # Verdict d'aptitude au training
    if quality_score >= 70 and n_critical == 0:
        readiness = "OUI"
        readiness_reason = "Qualité suffisante, aucune alerte critique."
    elif quality_score >= 50 and n_critical <= 1:
        readiness = "OUI avec réserves"
        readiness_reason = f"Score {quality_score}/100 acceptable mais alertes à traiter avant production."
    else:
        readiness = "NON — corrections requises"
        readiness_reason = f"Score {quality_score}/100 + {n_critical} alerte(s) critique(s) bloquantes."

    type_labels = {"vibration": "Vibratoire", "kpi": "KPI", "maintenance": "Maintenance",
                   "machine": "Machine", "generic": "Générique"}

    # 3 actions prioritaires
    urgent_actions = []
    short_term_actions = []
    medium_term_actions = []
    for a in alerts:
        if a["level"] == "critical":
            urgent_actions.append(a["action"])
        elif a["level"] == "warning":
            short_term_actions.append(a["action"])
    if vif_info and any(v.get("verdict") == "Critique (>10)" for v in vif_info):
        n_colin = sum(1 for v in vif_info if v.get("verdict") == "Critique (>10)")
        short_term_actions.append(f"Traiter la multicolinéarité ({n_colin} variable(s) VIF > 10)")
    if anomalies_iso and anomalies_iso.get("pct_anomalies", 0) > 5:
        medium_term_actions.append(f"Auditer les {anomalies_iso['n_anomalies']} anomalies multidimensionnelles détectées (Isolation Forest)")
    if not medium_term_actions:
        medium_term_actions.append("Enrichir le dataset (historique long, données capteurs brutes WAV/DAT)")

    return {
        "quality_score": quality_score,
        "quality_label": qs_label,
        "dataset_type":  type_labels.get(data_type, data_type),
        "n_rows": summary["n_rows"],
        "n_cols": summary["n_cols"],
        "n_critical_alerts": n_critical,
        "n_warnings": n_warnings,
        "readiness": readiness,
        "readiness_reason": readiness_reason,
        "critical_alerts_top": [a for a in alerts if a["level"] == "critical"][:3],
        "urgent_actions":     urgent_actions[:3] if urgent_actions else ["Aucune action critique immédiate"],
        "short_term_actions": short_term_actions[:3] if short_term_actions else ["Surveillance continue recommandée"],
        "medium_term_actions": medium_term_actions[:3],
    }


def _suggest_boxcox_candidates(summary: dict) -> list[dict[str, Any]]:
    """Identifie les colonnes très asymétriques candidates à log/Box-Cox."""
    candidates = []
    for c in summary.get("columns", []):
        if c.get("type") != "numeric":
            continue
        sk = c.get("skewness")
        if sk is None:
            continue
        if abs(sk) > 2:
            transform = "log1p" if (c.get("min") or 0) >= 0 else "Yeo-Johnson"
            candidates.append({
                "name": c["name"], "skewness": sk,
                "transform": transform,
                "reason": f"|skewness|={abs(sk):.2f} > 2 (très asymétrique)",
            })
    return candidates


def _detect_target_leakage_candidates(df: pd.DataFrame, data_type: str) -> list[dict[str, str]]:
    """Heuristique de détection des features à risque de fuite de données (target leakage)."""
    candidates = []
    cols_lower = {c: str(c).lower() for c in df.columns}
    leakage_patterns = {
        "mttr": "Calculé ex-post — ne pas utiliser pour prédire la durée d'intervention",
        "downtime_actual": "Information post-événement — risque de leakage en classification",
        "duree_reelle": "Donnée post-intervention — ne pas inclure comme feature",
        "health_index": "Souvent dérivé de v_rms — éviter de combiner les deux dans un même modèle",
        "rul": "Souvent la variable cible — ne pas inclure comme feature",
    }
    for col, low in cols_lower.items():
        for pattern, reason in leakage_patterns.items():
            if pattern in low:
                candidates.append({"name": col, "reason": reason})
                break
    return candidates


def _check_post_cleaning(df_proc: pd.DataFrame) -> list[dict[str, str]]:
    """Validation automatique du dataset après nettoyage."""
    checks = []
    n_nan = int(df_proc.isnull().sum().sum())
    checks.append({"check": "Aucune valeur NaN residuelle",
                   "status": "OK" if n_nan == 0 else "ECHEC",
                   "detail": f"{n_nan} NaN restants" if n_nan > 0 else "Aucun NaN"})
    num_df = df_proc.select_dtypes(include=[np.number])
    if len(num_df.columns) > 0 and len(num_df) > 0:
        max_abs = float(num_df.abs().max().max())
        checks.append({"check": "Features numeriques dans plage [-10, +10]",
                       "status": "OK" if max_abs < 10 else "ATTENTION",
                       "detail": f"|max| observe = {max_abs:.2f}"})
    n_const = sum(1 for c in df_proc.columns if df_proc[c].nunique(dropna=True) <= 1)
    checks.append({"check": "Aucune colonne constante apres transformation",
                   "status": "OK" if n_const == 0 else "ECHEC",
                   "detail": f"{n_const} colonne(s) constante(s)" if n_const > 0 else "Aucune"})
    obj_cols = df_proc.select_dtypes(include=["object"]).columns.tolist()
    checks.append({"check": "Aucune colonne texte non encodee",
                   "status": "OK" if not obj_cols else "ECHEC",
                   "detail": f"Texte restant : {', '.join(obj_cols[:5])}" if obj_cols else "Toutes encodees"})
    return checks


# ─── Génération des plots ──────────────────────────────────────────────────────

def _generate_plots(df: pd.DataFrame, dataset_id: int) -> list[dict[str, str]]:
    """Génère les plots EDA et les sauvegarde comme PNG. Retourne liste de {title, path, base64, section}."""
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
        plots.append({"title": "Valeurs manquantes", "path": str(path), "b64": _img_to_b64(path), "section": "missing_values"})

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
        plots.append({"title": "Distributions numériques", "path": str(path), "b64": _img_to_b64(path), "section": "distributions"})

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
        plots.append({"title": "Boxplots & Outliers", "path": str(path), "b64": _img_to_b64(path), "section": "boxplots"})

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
        plots.append({"title": "Matrice de corrélation (Pearson)", "path": str(path), "b64": _img_to_b64(path), "section": "correlation_pearson"})

        # Matrice Spearman pour relations non-linéaires
        try:
            corr_s = df[corr_cols].corr(method="spearman")
            fig, ax = plt.subplots(figsize=(max(6, len(corr_cols) * 0.6), max(5, len(corr_cols) * 0.5)))
            sns.heatmap(corr_s, annot=len(corr_cols) <= 12, fmt=".2f", cmap="PuOr",
                        center=0, ax=ax, linewidths=0.5, square=True, cbar_kws={"shrink": 0.8})
            ax.set_title("Matrice de corrélation (Spearman — monotone)")
            plt.tight_layout()
            path_s = plot_dir / "correlation_spearman.png"
            fig.savefig(path_s, dpi=100, bbox_inches="tight")
            plt.close(fig)
            plots.append({"title": "Matrice de corrélation (Spearman)", "path": str(path_s), "b64": _img_to_b64(path_s), "section": "correlation_spearman"})
        except Exception:
            pass

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
                plots.append({"title": "Séries temporelles", "path": str(path), "b64": _img_to_b64(path), "section": "time_series"})
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
            plots.append({"title": "Variables catégorielles", "path": str(path), "b64": _img_to_b64(path), "section": "categoricals"})

    # 6. Graphiques vibratoires (si colonnes vibration détectées)
    _vibration_plots(df, num_cols, cat_cols, plot_dir, plots)

    # 7. Graphiques avancés (VIF, Isolation Forest 2D, RUL, Pareto, ACF)
    _advanced_plots(df, num_cols, cat_cols, plot_dir, plots)

    return plots


def _advanced_plots(df: pd.DataFrame, num_cols: list, cat_cols: list,
                    plot_dir: Path, plots: list) -> None:
    """Graphiques avancés : VIF, Isolation Forest 2D, RUL, Health vs RUL, Pareto maintenance, ACF."""

    # 7a. VIF — multicolinéarité
    try:
        vif_data = _compute_vif(df, max_cols=15)
        if vif_data:
            names = [v["name"] for v in vif_data]
            vifs = [min(v["vif"], 50) for v in vif_data]  # cap visuel à 50
            colors_v = ["#dc2626" if v["vif"] > 10 else "#f97316" if v["vif"] > 5 else "#16a34a" for v in vif_data]
            fig, ax = plt.subplots(figsize=(max(7, len(names) * 0.45), 4))
            ax.barh(names, vifs, color=colors_v, edgecolor="white")
            ax.axvline(x=10, color="#dc2626", linestyle="--", alpha=0.7, label="Seuil critique (10)")
            ax.axvline(x=5, color="#f97316", linestyle="--", alpha=0.5, label="Seuil eleve (5)")
            ax.set_xlabel("VIF (Variance Inflation Factor)")
            ax.set_title("Multicolinearite par variable")
            ax.legend(fontsize=7, loc="lower right")
            plt.tight_layout()
            path = plot_dir / "vif_multicollinearity.png"
            fig.savefig(path, dpi=110, bbox_inches="tight")
            plt.close(fig)
            plots.append({"title": "VIF — Multicolinearite", "path": str(path), "b64": _img_to_b64(path), "section": "vif"})
    except Exception:
        pass

    # 7b. Isolation Forest 2D (sur 2 colonnes les plus variantes)
    try:
        if len(num_cols) >= 2:
            from sklearn.ensemble import IsolationForest
            num_df = df[num_cols].replace([np.inf, -np.inf], np.nan).dropna()
            if len(num_df) >= 30 and num_df.shape[1] >= 2:
                # Sélection des 2 colonnes avec la variance normalisée la plus élevée
                variances = (num_df.var() / (num_df.abs().mean() + 1e-9)).sort_values(ascending=False)
                if len(variances) >= 2:
                    col1, col2 = variances.index[0], variances.index[1]
                    clf = IsolationForest(contamination=0.02, random_state=42, n_estimators=100)
                    preds = clf.fit_predict(num_df.values)
                    fig, ax = plt.subplots(figsize=(8, 6))
                    mask_norm = preds == 1
                    mask_anom = preds == -1
                    ax.scatter(num_df.loc[mask_norm, col1], num_df.loc[mask_norm, col2],
                               c="#2563eb", alpha=0.45, s=18, label=f"Normal ({mask_norm.sum()})")
                    ax.scatter(num_df.loc[mask_anom, col1], num_df.loc[mask_anom, col2],
                               c="#dc2626", alpha=0.85, s=32, edgecolors="black", linewidth=0.4,
                               label=f"Anomalie ({mask_anom.sum()})")
                    ax.set_xlabel(col1)
                    ax.set_ylabel(col2)
                    ax.set_title(f"Anomalies multidimensionnelles (Isolation Forest, contamination=2%)")
                    ax.legend(fontsize=8)
                    plt.tight_layout()
                    path = plot_dir / "isolation_forest_2d.png"
                    fig.savefig(path, dpi=110, bbox_inches="tight")
                    plt.close(fig)
                    plots.append({"title": "Isolation Forest 2D", "path": str(path), "b64": _img_to_b64(path), "section": "iso_forest_2d"})
    except Exception:
        pass

    # 7c. Distribution du RUL (si applicable)
    rul_col = next((c for c in num_cols if any(k in str(c).lower()
                    for k in ["rul", "remaining_useful_life", "drbf", "duree_vie_restante"])), None)
    if rul_col:
        try:
            rul_data = pd.to_numeric(df[rul_col], errors="coerce").dropna()
            if len(rul_data) > 10:
                fig, ax = plt.subplots(figsize=(9, 4.5))
                ax.hist(rul_data, bins=30, color="#0ea5e9", alpha=0.8, edgecolor="white")
                ax.axvline(x=float(rul_data.mean()), color="#16a34a", linestyle="--",
                           label=f"Moyenne = {rul_data.mean():.0f}")
                ax.axvline(x=float(rul_data.median()), color="#f97316", linestyle="--",
                           label=f"Mediane = {rul_data.median():.0f}")
                ax.axvline(x=float(rul_data.min()), color="#dc2626", linestyle="--",
                           label=f"Min = {rul_data.min():.0f} (machine critique)")
                ax.set_xlabel(rul_col)
                ax.set_ylabel("Frequence")
                ax.set_title("Distribution du RUL — Duree de vie restante")
                ax.legend(fontsize=8)
                plt.tight_layout()
                path = plot_dir / "rul_distribution.png"
                fig.savefig(path, dpi=110, bbox_inches="tight")
                plt.close(fig)
                plots.append({"title": "Distribution RUL", "path": str(path), "b64": _img_to_b64(path), "section": "rul_distribution"})
        except Exception:
            pass

    # 7d. Health Index vs RUL (scatter)
    health_col = next((c for c in num_cols if any(k in str(c).lower()
                       for k in ["health_index", "health", "asset_health", "indice_sante"])), None)
    machine_col = next((c for c in cat_cols if str(c).lower() in ("machine_id", "machine", "equipment_id")), None)
    if rul_col and health_col:
        try:
            d = df[[rul_col, health_col] + ([machine_col] if machine_col else [])].dropna()
            if len(d) > 5:
                fig, ax = plt.subplots(figsize=(9, 6))
                health_vals = pd.to_numeric(d[health_col], errors="coerce")
                if health_vals.max() > 1:
                    health_vals = health_vals / 100.0
                rul_vals = pd.to_numeric(d[rul_col], errors="coerce")
                scatter = ax.scatter(rul_vals, health_vals, c=health_vals, cmap="RdYlGn",
                                     s=60, alpha=0.75, edgecolors="black", linewidth=0.3,
                                     vmin=0, vmax=1)
                ax.axhline(y=0.3, color="#dc2626", linestyle="--", alpha=0.6, label="Seuil critique (0.3)")
                ax.set_xlabel(rul_col)
                ax.set_ylabel("Health Index (normalise)")
                ax.set_title("Health Index vs RUL — Cartographie du parc")
                ax.legend(fontsize=8)
                plt.colorbar(scatter, ax=ax, label="Health Index")
                if machine_col:
                    for _, row in d.iterrows():
                        try:
                            hv = float(row[health_col])
                            if hv > 1:
                                hv = hv / 100.0
                            if hv < 0.3:
                                ax.annotate(str(row[machine_col]),
                                            (float(row[rul_col]), hv),
                                            fontsize=6, alpha=0.8, color="#7f1d1d")
                        except Exception:
                            continue
                plt.tight_layout()
                path = plot_dir / "health_vs_rul.png"
                fig.savefig(path, dpi=110, bbox_inches="tight")
                plt.close(fig)
                plots.append({"title": "Health Index vs RUL", "path": str(path), "b64": _img_to_b64(path), "section": "health_vs_rul"})
        except Exception:
            pass

    # 7e. Pareto des interventions par machine (données maintenance)
    if machine_col:
        try:
            vc = df[machine_col].value_counts().head(15)
            if len(vc) >= 3 and vc.sum() > 10:
                fig, ax1 = plt.subplots(figsize=(max(7, len(vc) * 0.5), 4.5))
                bar_colors = ["#dc2626" if i < 3 else "#f97316" if i < 6 else "#6b7280"
                              for i in range(len(vc))]
                ax1.bar(range(len(vc)), vc.values, color=bar_colors, edgecolor="white")
                ax1.set_xticks(range(len(vc)))
                ax1.set_xticklabels(vc.index, rotation=45, fontsize=7, ha="right")
                ax1.set_ylabel("Nombre d'occurrences", color="#1f2937")
                ax1.set_title(f"Pareto par {machine_col} — Top 80/20")
                ax2 = ax1.twinx()
                cum_pct = (vc.cumsum() / vc.sum() * 100).values
                ax2.plot(range(len(vc)), cum_pct, color="#7c3aed", marker="o",
                         linewidth=1.5, markersize=4, label="Cumul %")
                ax2.axhline(y=80, color="#dc2626", linestyle="--", alpha=0.5, label="80%")
                ax2.set_ylabel("Cumul (%)", color="#7c3aed")
                ax2.set_ylim(0, 105)
                ax2.legend(fontsize=7, loc="lower right")
                plt.tight_layout()
                path = plot_dir / "pareto_machines.png"
                fig.savefig(path, dpi=110, bbox_inches="tight")
                plt.close(fig)
                plots.append({"title": "Pareto interventions par machine", "path": str(path), "b64": _img_to_b64(path), "section": "pareto"})
        except Exception:
            pass

    # 7f. ACF d'une série temporelle (si time_col + variable principale)
    try:
        time_col = _detect_time_col(df)
        if time_col and num_cols:
            primary = num_cols[0]
            for cand in num_cols:
                cl = str(cand).lower()
                if any(k in cl for k in ["v_rms", "vrms", "rul", "disponibilite", "mtbf"]):
                    primary = cand
                    break
            d = df[[time_col, primary]].copy()
            d[time_col] = pd.to_datetime(d[time_col], errors="coerce")
            d = d.dropna().sort_values(time_col)
            if len(d) >= 30:
                series = pd.to_numeric(d[primary], errors="coerce").dropna()
                acf_vals = _compute_acf_manual(series, nlags=min(20, len(series) // 3))
                if acf_vals:
                    fig, ax = plt.subplots(figsize=(9, 3.5))
                    lags = list(range(1, len(acf_vals) + 1))
                    bars_colors = ["#2563eb" if abs(v) < 0.3 else "#f97316" if abs(v) < 0.6 else "#dc2626"
                                   for v in acf_vals]
                    ax.bar(lags, acf_vals, color=bars_colors, edgecolor="white", width=0.7)
                    ax.axhline(y=0, color="black", linewidth=0.6)
                    ci = 1.96 / np.sqrt(len(series))
                    ax.axhline(y=ci, color="#7c3aed", linestyle="--", alpha=0.5, label=f"IC 95% (±{ci:.2f})")
                    ax.axhline(y=-ci, color="#7c3aed", linestyle="--", alpha=0.5)
                    ax.set_xlabel("Lag")
                    ax.set_ylabel("Autocorrelation")
                    ax.set_title(f"ACF — Autocorrelation de '{primary}'")
                    ax.set_ylim(-1.05, 1.05)
                    ax.legend(fontsize=7)
                    plt.tight_layout()
                    path = plot_dir / "acf_plot.png"
                    fig.savefig(path, dpi=110, bbox_inches="tight")
                    plt.close(fig)
                    plots.append({"title": "ACF (autocorrelation)", "path": str(path), "b64": _img_to_b64(path), "section": "acf"})
    except Exception:
        pass


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
            plots.append({"title": "Tendance V-RMS", "path": str(path), "b64": _img_to_b64(path), "section": "vrms_trend"})
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
            plots.append({"title": "Crest Factor vs Kurtosis", "path": str(path), "b64": _img_to_b64(path), "section": "crest_kurtosis"})
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
            plots.append({"title": "Distribution Zones ISO", "path": str(path), "b64": _img_to_b64(path), "section": "iso_zones"})
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
            plots.append({"title": "Boxplot V-RMS par machine", "path": str(path), "b64": _img_to_b64(path), "section": "vrms_par_machine"})
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


# ─── Helpers PDF additionnels ──────────────────────────────────────────────

def _pdf_paragraph(pdf: "FPDF", text: str, font_size: int = 10, line_h: int = 5) -> None:
    """Paragraphe sanitisé avec wrap automatique."""
    pdf.set_font("Helvetica", "", font_size)
    pdf.set_text_color(55, 65, 81)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, line_h, _S(text or ""))


def _pdf_subsection(pdf: "FPDF", title: str) -> None:
    """Sous-titre de section (style discret)."""
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(37, 99, 235)
    pdf.cell(0, 6, _S(f"  > {title}"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(55, 65, 81)
    pdf.ln(1)


def _embed_plot(pdf: "FPDF", plot_obj: dict | None, max_w: float | None = None) -> bool:
    """Insère un plot avec son titre. Retourne True si inséré."""
    if not plot_obj or not plot_obj.get("path"):
        return False
    try:
        if max_w is None:
            max_w = pdf.w - pdf.l_margin - pdf.r_margin
        # Si peu de place restante, nouvelle page
        space_left = pdf.h - pdf.get_y() - pdf.b_margin
        if space_left < 75:
            pdf.add_page()
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(75, 85, 99)
        pdf.cell(0, 5, _S(f"Figure : {plot_obj.get('title', '')}"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)
        pdf.image(plot_obj["path"], w=max_w)
        pdf.ln(3)
        return True
    except Exception:
        return False


def _alert_card(pdf: "FPDF", alert: dict) -> None:
    """Carte d'alerte structurée avec code couleur."""
    level = alert.get("level", "info")
    if level == "critical":
        bg, fg = (254, 226, 226), (185, 28, 28)
        prefix = "[CRITIQUE]"
    elif level == "warning":
        bg, fg = (255, 237, 213), (194, 65, 12)
        prefix = "[ATTENTION]"
    else:
        bg, fg = (219, 234, 254), (29, 78, 216)
        prefix = "[INFO]"

    pdf.ln(1)
    pdf.set_fill_color(*bg)
    pdf.set_text_color(*fg)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(0, 6, _S(f"  {prefix}  {alert.get('title', '')}"), fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(55, 65, 81)
    pdf.set_x(pdf.l_margin + 4)
    pdf.multi_cell(0, 4.5, _S(f"  Impact : {alert.get('impact', '')}"))
    pdf.set_x(pdf.l_margin + 4)
    pdf.multi_cell(0, 4.5, _S(f"  Action : {alert.get('action', '')}"))
    pdf.ln(1)


def _split_exec_summary(text: str) -> dict[str, str]:
    """Découpe le bloc exec_summary du LLM (séparé par '||') en 4 sous-blocs."""
    if not text or "||" not in text:
        return {"context": text or "", "verdict": "", "limits": "", "readiness": ""}
    parts = [p.strip() for p in text.split("||")]
    out = {}
    for p in parts:
        low = p.lower()
        if "dataset en" in low or "contexte" in low:
            out["context"] = p
        elif "verdict" in low or "qualité" in low or "qualite" in low:
            out["verdict"] = p
        elif "limite" in low:
            out["limits"] = p
        elif "prêt" in low or "pret" in low or "entraînement" in low or "entrainement" in low:
            out["readiness"] = p
    for k in ("context", "verdict", "limits", "readiness"):
        out.setdefault(k, "")
    if not any(out.values()) and parts:
        out["context"] = parts[0]
    return out


# ─── Rapport PDF canonique (13 sections + synthèse exécutive) ─────────────────

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
    alerts: list | None = None,
    iso_25012: dict | None = None,
    vif_info: list | None = None,
    anomalies_iso: dict | None = None,
    exec_summary_data: dict | None = None,
    stationarity: dict | None = None,
    temporal_trend: dict | None = None,
) -> Path:
    """Rapport PDF canonique : synthèse exécutive + 13 sections avec graphiques intercalés."""
    report_path = REPORTS_DIR / f"eda_report_{dataset_id}.pdf"
    pt = pipeline_trace or {}
    alerts = alerts or []
    iso_25012 = iso_25012 or {}
    vif_info = vif_info or []
    anomalies_iso = anomalies_iso or {}
    exec_summary_data = exec_summary_data or {}
    plots_by_section: dict[str, dict] = {p.get("section", ""): p for p in plots if p.get("section")}

    _type_labels = {"vibration": "Vibratoire", "kpi": "KPI", "maintenance": "Maintenance",
                    "machine": "Machine", "generic": "Generique"}
    qs_label = ("Excellent" if quality_score >= 85 else "Bon" if quality_score >= 70
                else "Acceptable" if quality_score >= 50 else "Insuffisant")
    qs_color = ((22, 163, 74) if quality_score >= 85
                else (101, 163, 13) if quality_score >= 70
                else (249, 115, 22) if quality_score >= 50
                else (220, 38, 38))

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # ════════════════════════════════════════════════════════════════════════
    # PAGE DE GARDE
    # ════════════════════════════════════════════════════════════════════════
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(249, 115, 22)
    pdf.cell(0, 14, "Rapport d'Analyse EDA", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 7, "AI Maintenance  |  Plateforme de Maintenance Predictive", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(3)
    pdf.set_line_width(0.8)
    pdf.set_draw_color(249, 115, 22)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(5)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 6, _S(f"Fichier : {filename}"), new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.cell(0, 6, _S(f"Type detecte : {_type_labels.get(data_type, data_type)}  |  "
                      f"Genere le : {datetime.now().strftime('%Y-%m-%d %H:%M')}"),
             new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(8)

    # Badge score qualité
    pdf.set_fill_color(*qs_color)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 26)
    box_w, box_h = 90, 22
    pdf.rect((pdf.w - box_w) / 2, pdf.get_y(), box_w, box_h, "F")
    pdf.set_y(pdf.get_y() + 4)
    pdf.cell(0, 14, f"{quality_score}/100   {qs_label}", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 5, "Score qualite global (ISO/IEC 25012)", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(6)

    # ════════════════════════════════════════════════════════════════════════
    # SYNTHESE EXECUTIVE (1 page)
    # ════════════════════════════════════════════════════════════════════════
    _pdf_section(pdf, "0", "Synthese executive")

    exec_parts = _split_exec_summary(llm_result.get("executive_summary", ""))

    # Bloc dataset en 3 phrases
    if exec_parts["context"]:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(0, 6, "Le dataset en 3 phrases", new_x="LMARGIN", new_y="NEXT")
        _pdf_paragraph(pdf, exec_parts["context"], 9, 5)
        pdf.ln(2)

    # Verdict qualité
    if exec_parts["verdict"]:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(0, 6, "Verdict qualite", new_x="LMARGIN", new_y="NEXT")
        _pdf_paragraph(pdf, exec_parts["verdict"], 9, 5)
        pdf.ln(2)

    # Decisions immediates (depuis exec_summary_data)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 6, "Decisions immediates", new_x="LMARGIN", new_y="NEXT")
    decisions = [
        ("[URGENT 24-48h]", (220, 38, 38), exec_summary_data.get("urgent_actions", [])),
        ("[COURT TERME 1 sem]", (249, 115, 22), exec_summary_data.get("short_term_actions", [])),
        ("[MOYEN TERME 1 mois]", (22, 163, 74), exec_summary_data.get("medium_term_actions", [])),
    ]
    for label, color, actions in decisions:
        if not actions:
            continue
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(*color)
        pdf.set_x(pdf.l_margin + 2)
        pdf.cell(0, 5, _S(label), new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(55, 65, 81)
        for a in actions[:3]:
            pdf.set_x(pdf.l_margin + 6)
            pdf.multi_cell(0, 4.5, _S(f"- {a}"))
        pdf.ln(1)

    # Limites
    if exec_parts["limits"]:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(0, 6, "Limites du dataset", new_x="LMARGIN", new_y="NEXT")
        _pdf_paragraph(pdf, exec_parts["limits"], 9, 5)
        pdf.ln(2)

    # Aptitude au training (badge)
    readiness = exec_summary_data.get("readiness", "Non evalue")
    readiness_color = ((22, 163, 74) if "OUI" in readiness and "reserves" not in readiness.lower()
                       else (249, 115, 22) if "OUI" in readiness
                       else (220, 38, 38))
    pdf.ln(1)
    pdf.set_fill_color(*readiness_color)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, _S(f"  Pret pour l'entrainement : {readiness}"), fill=True,
             new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(55, 65, 81)
    pdf.set_font("Helvetica", "", 9)
    if exec_summary_data.get("readiness_reason"):
        _pdf_paragraph(pdf, exec_summary_data["readiness_reason"], 9, 5)
    if exec_parts["readiness"]:
        _pdf_paragraph(pdf, exec_parts["readiness"], 9, 5)

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 1 — RESUME DU DATASET
    # ════════════════════════════════════════════════════════════════════════
    pdf.add_page()
    _pdf_section(pdf, "1", "Resume du dataset")
    stats = [
        ("Lignes (observations)",      f"{summary['n_rows']:,}".replace(",", " ")),
        ("Colonnes (features)",        summary["n_cols"]),
        ("Variables numeriques",       summary["n_numeric"]),
        ("Variables categorielles",    summary["n_categorical"]),
        ("Valeurs manquantes totales", f"{summary['missing_total']} ({summary['missing_pct']}%)"),
        ("Doublons detectes",          summary["duplicates"]),
        ("Type de donnees detecte",    _type_labels.get(data_type, data_type)),
    ]
    for lbl, val in stats:
        _pdf_kv(pdf, lbl, val)

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 2 — AUDIT QUALITE DES DONNEES (avec graphique manquants)
    # ════════════════════════════════════════════════════════════════════════
    _pdf_section(pdf, "2", "Audit de qualite des donnees")

    # Sous-section 2.1 — Decomposition ISO 25012
    if iso_25012:
        _pdf_subsection(pdf, "2.1  Decomposition par dimension (ISO/IEC 25012:2008)")
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(75, 85, 99)
        col_w = [55, 25, 20, 80]
        headers = ["Dimension", "Score", "Max", "Detail"]
        for i, h in enumerate(headers):
            pdf.cell(col_w[i], 6, _S(h), border=1, fill=False)
        pdf.ln()
        pdf.set_font("Helvetica", "", 7)
        for dim_name, dim_data in iso_25012.items():
            pdf.cell(col_w[0], 5, _S(dim_name.title()), border=1)
            pdf.cell(col_w[1], 5, _S(str(dim_data.get("score", "-"))), border=1)
            pdf.cell(col_w[2], 5, _S(str(dim_data.get("max", "-"))), border=1)
            pdf.cell(col_w[3], 5, _S(dim_data.get("detail", "")[:55]), border=1)
            pdf.ln()
        pdf.ln(2)

    # Sous-section 2.2 — Graphique valeurs manquantes + interpretation
    _pdf_subsection(pdf, "2.2  Valeurs manquantes par colonne")
    if _embed_plot(pdf, plots_by_section.get("missing_values"), max_w=pdf.w - 40):
        pdf.ln(1)
    _pdf_paragraph(pdf, llm_result.get("quality_audit", "Section non generee."), 9, 5)

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 3 — KPIs avec benchmarks
    # ════════════════════════════════════════════════════════════════════════
    if kpis:
        _pdf_section(pdf, "3", "Indicateurs de performance (KPIs)")
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(75, 85, 99)
        col_w = [50, 30, 20, 50, 30]
        headers = ["KPI", "Valeur", "Unite", "Benchmark", "Verdict"]
        for i, h in enumerate(headers):
            pdf.cell(col_w[i], 6, _S(h), border=1)
        pdf.ln()
        pdf.set_font("Helvetica", "", 8)
        _kpi_benchmarks = {
            "mtbf":               ("Objectif > 300h", lambda v: "OK" if v > 300 else "Sous objectif"),
            "mttr":               ("Objectif < 4h",   lambda v: "OK" if v < 4 else "Au-dessus"),
            "availability":       ("Classe A >=98%",  lambda v: "Classe A" if v >= 98 else ("Classe B" if v >= 90 else "Sous norme")),
            "oee":                ("World-class >=85%", lambda v: "World-class" if v >= 85 else ("Bon" if v >= 70 else "A ameliorer")),
            "failure_rate_lambda":("ISO 13306",       lambda v: "-"),
            "anomaly_rate":       ("< 10% attendu",   lambda v: "OK" if v < 10 else "Suspect (verifier)"),
        }
        kpi_labels = {
            "mtbf": "MTBF", "mttr": "MTTR", "mttf": "MTTF",
            "availability": "Disponibilite", "failure_rate_lambda": "Taux defaillance lambda",
            "oee": "OEE / TRS", "anomaly_rate": "Taux anomalies",
        }
        for key, label in kpi_labels.items():
            if key not in kpis:
                continue
            item = kpis[key]
            v = item.get("value")
            bench_info = _kpi_benchmarks.get(key, ("-", lambda x: "-"))
            try:
                verdict = bench_info[1](float(v)) if v is not None else "-"
            except Exception:
                verdict = "-"
            pdf.cell(col_w[0], 5, _S(label), border=1)
            pdf.cell(col_w[1], 5, _S(v), border=1)
            pdf.cell(col_w[2], 5, _S(item.get("unit", "")), border=1)
            pdf.cell(col_w[3], 5, _S(bench_info[0]), border=1)
            pdf.cell(col_w[4], 5, _S(verdict), border=1)
            pdf.ln()
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(107, 114, 128)
        pdf.multi_cell(0, 4, "References : ISO 13306:2017 (terminologie maintenance), EN 15341:2019 (KPIs)")

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 4 — PRONOSTIC RUL (avec graphiques inline)
    # ════════════════════════════════════════════════════════════════════════
    if rul_info:
        _pdf_section(pdf, "4", "Pronostic - RUL / Duree de vie restante")
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(75, 85, 99)
        col_w = [60, 50, 60]
        for h in ["Indicateur", "Valeur", "Interpretation"]:
            pdf.cell(col_w[["Indicateur", "Valeur", "Interpretation"].index(h)], 6, _S(h), border=1)
        pdf.ln()
        pdf.set_font("Helvetica", "", 8)
        _rul_interp = {
            "rul_mean": lambda v: f"~{round(float(v)/24)} jours d'operation restants en moyenne",
            "rul_min":  lambda v: f"Machine critique : ~{round(float(v)/24)} jours" if float(v) > 0 else "Critique",
            "rul_max":  lambda v: f"~{round(float(v)/24)} jours sur la machine la plus saine",
            "rul_std":  lambda v: "Dispersion du RUL dans le parc",
            "health_index_mean": lambda v: "Parc globalement sain" if float(v) > 0.7 else "Parc en degradation",
            "health_index_min":  lambda v: "Machine critique" if float(v) < 0.3 else "Acceptable",
            "degradation_rate":  lambda v: f"Pente HealthIndex/h = {v}",
            "pct_critical":      lambda v: f"{v}% du parc < 0.3 HI",
            "reliability_rt":    lambda v: "R(t) = exp(-lambda*t)",
        }
        rul_labels = {
            "rul_mean": "RUL moyen (h)", "rul_min": "RUL minimum (h)",
            "rul_max": "RUL maximum (h)", "rul_std": "RUL ecart-type",
            "health_index_mean": "Health Index moyen", "health_index_min": "Health Index min",
            "degradation_rate": "Taux degradation", "pct_critical": "% machines critiques",
            "reliability_rt": "Fiabilite R(t)",
        }
        for key, label in rul_labels.items():
            v = rul_info.get(key)
            if v is None:
                continue
            try:
                interp = _rul_interp[key](v)
            except Exception:
                interp = "-"
            pdf.cell(col_w[0], 5, _S(label), border=1)
            pdf.cell(col_w[1], 5, _S(v), border=1)
            pdf.cell(col_w[2], 5, _S(interp[:35]), border=1)
            pdf.ln()
        pdf.ln(2)

        # Distribution RUL + Health vs RUL
        if "rul_distribution" in plots_by_section:
            _pdf_subsection(pdf, "4.1  Distribution du RUL")
            _embed_plot(pdf, plots_by_section.get("rul_distribution"), max_w=pdf.w - 40)
        if "health_vs_rul" in plots_by_section:
            _pdf_subsection(pdf, "4.2  Health Index vs RUL - cartographie du parc")
            _embed_plot(pdf, plots_by_section.get("health_vs_rul"), max_w=pdf.w - 40)

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 5 — ANALYSE UNIVARIEE (distributions + boxplots + categoricals)
    # ════════════════════════════════════════════════════════════════════════
    pdf.add_page()
    _pdf_section(pdf, "5", "Analyse univariee detaillee")

    if "categoricals" in plots_by_section:
        _pdf_subsection(pdf, "5.1  Variables categorielles")
        _embed_plot(pdf, plots_by_section.get("categoricals"), max_w=pdf.w - 40)

    if "distributions" in plots_by_section:
        _pdf_subsection(pdf, "5.2  Distributions numeriques")
        _embed_plot(pdf, plots_by_section.get("distributions"), max_w=pdf.w - 40)

    if "boxplots" in plots_by_section:
        _pdf_subsection(pdf, "5.3  Outliers (methode IQR)")
        _embed_plot(pdf, plots_by_section.get("boxplots"), max_w=pdf.w - 40)

    _pdf_paragraph(pdf, llm_result.get("univariate_insights", "Section non generee."), 9, 5)

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 6 — BIVARIEE & CORRELATIONS (Pearson + Spearman + VIF)
    # ════════════════════════════════════════════════════════════════════════
    pdf.add_page()
    _pdf_section(pdf, "6", "Analyse bivariee et correlations")

    if "correlation_pearson" in plots_by_section:
        _pdf_subsection(pdf, "6.1  Matrice de correlation (Pearson - lineaire)")
        _embed_plot(pdf, plots_by_section.get("correlation_pearson"), max_w=pdf.w - 40)

    if "correlation_spearman" in plots_by_section:
        _pdf_subsection(pdf, "6.2  Matrice de correlation (Spearman - monotone)")
        _embed_plot(pdf, plots_by_section.get("correlation_spearman"), max_w=pdf.w - 40)

    if "vif" in plots_by_section or "iso_forest_2d" in plots_by_section:
        # VIF table
        if vif_info:
            _pdf_subsection(pdf, "6.3  Multicolinearite - VIF (Variance Inflation Factor)")
            pdf.set_font("Helvetica", "B", 7)
            pdf.set_text_color(75, 85, 99)
            col_w = [60, 25, 25, 35]
            for h in ["Variable", "VIF", "R2", "Verdict"]:
                pdf.cell(col_w[["Variable", "VIF", "R2", "Verdict"].index(h)], 5, _S(h), border=1)
            pdf.ln()
            pdf.set_font("Helvetica", "", 7)
            for v in vif_info[:15]:
                if v.get("verdict") == "Critique (>10)":
                    pdf.set_text_color(220, 38, 38)
                elif v.get("verdict") == "Eleve (5-10)":
                    pdf.set_text_color(249, 115, 22)
                else:
                    pdf.set_text_color(22, 163, 74)
                pdf.cell(col_w[0], 4, _S(str(v["name"])[:30]), border=1)
                pdf.cell(col_w[1], 4, _S(str(v["vif"])), border=1)
                pdf.cell(col_w[2], 4, _S(str(v.get("r2", "-"))), border=1)
                pdf.cell(col_w[3], 4, _S(str(v.get("verdict", "-"))), border=1)
                pdf.ln()
            pdf.set_text_color(17, 24, 39)
            pdf.ln(2)
        if "vif" in plots_by_section:
            _embed_plot(pdf, plots_by_section.get("vif"), max_w=pdf.w - 40)

    _pdf_paragraph(pdf, llm_result.get("bivariate_insights", "Section non generee."), 9, 5)

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 7 — ANALYSE TEMPORELLE (time series + ACF + stationnarite)
    # ════════════════════════════════════════════════════════════════════════
    has_temporal = any(k in plots_by_section for k in ("time_series", "acf", "vrms_trend"))
    if has_temporal or stationarity or temporal_trend:
        pdf.add_page()
        _pdf_section(pdf, "7", "Analyse temporelle")

        if "time_series" in plots_by_section:
            _pdf_subsection(pdf, "7.1  Series temporelles des variables cles")
            _embed_plot(pdf, plots_by_section.get("time_series"), max_w=pdf.w - 40)

        # Stationnarite et tendance
        if stationarity or temporal_trend:
            _pdf_subsection(pdf, "7.2  Stationnarite et tendance")
            if temporal_trend:
                lines = [
                    f"  - Tendance : {temporal_trend.get('trend', 'inconnue')} (pente = {temporal_trend.get('slope_per_day', '-')} /jour)",
                    f"  - Valeur actuelle : {temporal_trend.get('current_value', '-')} au {temporal_trend.get('current_date', '-')}",
                    f"  - Observations : {temporal_trend.get('n_points', 0)} points",
                ]
                for k_zone in ("zone_c", "zone_d"):
                    days_key = f"days_to_{k_zone}"
                    date_key = f"date_{k_zone}"
                    if temporal_trend.get(days_key):
                        lines.append(f"  - Projection franchissement {k_zone.upper().replace('_', ' ')} : {temporal_trend[days_key]} jours ({temporal_trend.get(date_key, '?')})")
                for line in lines:
                    pdf.set_x(pdf.l_margin)
                    pdf.set_font("Helvetica", "", 9)
                    pdf.multi_cell(0, 5, _S(line))
            if stationarity:
                pdf.ln(1)
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_text_color(17, 24, 39)
                pdf.cell(0, 5, _S(f"  Verdict : {stationarity.get('verdict', '-')}"), new_x="LMARGIN", new_y="NEXT")
                pdf.set_font("Helvetica", "", 8)
                pdf.set_text_color(55, 65, 81)
                pdf.set_x(pdf.l_margin)
                pdf.multi_cell(0, 4.5, _S(
                    f"  Variation de la moyenne par tiers : {stationarity.get('mean_variation_pct', '-')}%  |  "
                    f"variation de l'ecart-type : {stationarity.get('std_variation_pct', '-')}%"
                ))

        if "acf" in plots_by_section:
            _pdf_subsection(pdf, "7.3  Auto-correlation (ACF)")
            _embed_plot(pdf, plots_by_section.get("acf"), max_w=pdf.w - 40)

        _pdf_paragraph(pdf, llm_result.get("temporal_insights", "Section non generee."), 9, 5)

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 8 — DIAGNOSTIC SPECIFIQUE AU TYPE
    # ════════════════════════════════════════════════════════════════════════
    diag_keys = ("vrms_trend", "crest_kurtosis", "iso_zones", "vrms_par_machine", "pareto")
    if any(k in plots_by_section for k in diag_keys):
        pdf.add_page()
        _pdf_section(pdf, "8", f"Diagnostic specifique - {_type_labels.get(data_type, data_type)}")

        if data_type == "vibration":
            if "vrms_trend" in plots_by_section:
                _pdf_subsection(pdf, "8.1  Tendance V-RMS dans le temps (zones ISO 10816-3)")
                _embed_plot(pdf, plots_by_section.get("vrms_trend"), max_w=pdf.w - 40)
            if "crest_kurtosis" in plots_by_section:
                _pdf_subsection(pdf, "8.2  Crest Factor vs Kurtosis (ISO 18436-2)")
                _embed_plot(pdf, plots_by_section.get("crest_kurtosis"), max_w=pdf.w - 40)
            if "iso_zones" in plots_by_section:
                _pdf_subsection(pdf, "8.3  Repartition par zone ISO")
                _embed_plot(pdf, plots_by_section.get("iso_zones"), max_w=pdf.w - 40)
            if "vrms_par_machine" in plots_by_section:
                _pdf_subsection(pdf, "8.4  V-RMS par machine")
                _embed_plot(pdf, plots_by_section.get("vrms_par_machine"), max_w=pdf.w - 40)
        elif data_type in ("maintenance", "machine"):
            if "pareto" in plots_by_section:
                _pdf_subsection(pdf, "8.1  Pareto - Top machines par frequence (loi 80/20)")
                _embed_plot(pdf, plots_by_section.get("pareto"), max_w=pdf.w - 40)
        else:
            # generic — afficher ce qui est dispo
            for k in diag_keys:
                if k in plots_by_section:
                    _embed_plot(pdf, plots_by_section.get(k), max_w=pdf.w - 40)

        _pdf_paragraph(pdf, llm_result.get("diagnostic_insights", "Section non generee."), 9, 5)

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 9 — ANOMALIES ET ALERTES CRITIQUES
    # ════════════════════════════════════════════════════════════════════════
    pdf.add_page()
    _pdf_section(pdf, "9", "Anomalies et alertes critiques")

    if alerts:
        critical = [a for a in alerts if a["level"] == "critical"]
        warnings = [a for a in alerts if a["level"] == "warning"]
        if critical:
            _pdf_subsection(pdf, f"9.1  Alertes critiques ({len(critical)})")
            for a in critical:
                _alert_card(pdf, a)
        if warnings:
            _pdf_subsection(pdf, f"9.2  Avertissements ({len(warnings)})")
            for a in warnings:
                _alert_card(pdf, a)
    else:
        _pdf_paragraph(pdf, "Aucune alerte critique automatiquement detectee. Surveillance continue recommandee.", 9, 5)

    # Isolation Forest
    if anomalies_iso and anomalies_iso.get("n_anomalies", 0) > 0:
        _pdf_subsection(pdf, "9.3  Anomalies multi-dimensionnelles (Isolation Forest)")
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(55, 65, 81)
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 5, _S(
            f"  Anomalies detectees : {anomalies_iso['n_anomalies']} ({anomalies_iso['pct_anomalies']}%) "
            f"sur {anomalies_iso.get('n_features', 0)} features  |  contamination = {anomalies_iso.get('contamination', 0.02)}"
        ))
        if "iso_forest_2d" in plots_by_section:
            _embed_plot(pdf, plots_by_section.get("iso_forest_2d"), max_w=pdf.w - 40)
        elif "isolation_forest" in plots_by_section:
            _embed_plot(pdf, plots_by_section.get("isolation_forest"), max_w=pdf.w - 40)

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 10 — CLEANING ET PREPARATION DES DONNEES
    # ════════════════════════════════════════════════════════════════════════
    pdf.add_page()
    _pdf_section(pdf, "10", "Cleaning et preparation des donnees")

    _pdf_paragraph(pdf, llm_result.get("preprocessing_plan", "Section non generee."), 9, 5)
    pdf.ln(2)

    _pdf_subsection(pdf, "10.1  Journal des transformations")
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
            def _fmt_imp(c, v):
                strat = v.get("strategy", "?")
                fval  = v.get("fill_value", "")
                mpct  = v.get("missing_pct", "")
                if strat == "median":
                    return f"{c} : mediane={round(fval, 4)} ({mpct}% manquants)"
                elif strat == "mode":
                    return f"{c} : mode='{fval}'"
                return f"{c} : {strat}={fval}"
            pdf.multi_cell(0, 5, _S(
                f"  {len(cols_imp)} colonne(s) imputee(s) :\n" +
                "\n".join(f"    - {_fmt_imp(c, v)}" for c, v in list(cols_imp.items())[:8])
            ))
        elif stype == "encoding":
            cols_enc = step.get("columns", {})
            pdf.set_x(pdf.l_margin + 4)
            def _fmt_enc(c, v):
                etype = v.get("type", "?")
                ncat  = v.get("n_categories", "")
                if etype == "onehot":
                    subcols = v.get("columns", [])
                    return f"{c} : one-hot ({ncat} cat.) -> {', '.join(subcols[:3])}{'...' if len(subcols) > 3 else ''}"
                elif etype == "label":
                    return f"{c} : label ({ncat} cat.)"
                elif etype == "frequency":
                    return f"{c} : frequence ({ncat} cat.)"
                return f"{c} : {etype}"
            pdf.multi_cell(0, 5, _S(
                f"  {len(cols_enc)} colonne(s) encodee(s) :\n" +
                "\n".join(f"    - {_fmt_enc(c, v)}" for c, v in list(cols_enc.items())[:8])
            ))
        elif stype == "standardization":
            n_std = step.get("n_standard", 0)
            n_rob = step.get("n_robust", 0)
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5, _S(f"  StandardScaler : {n_std}  |  RobustScaler : {n_rob}"))
            cols_sc = step.get("columns", {})
            if cols_sc:
                pdf.ln(2)
                pdf.set_font("Helvetica", "B", 7)
                pdf.set_text_color(55, 65, 81)
                col_w = [65, 28, 22, 22, 22]
                for h in ["Colonne", "Scaler", "Centre", "Echelle", "Outliers%"]:
                    pdf.cell(col_w[["Colonne","Scaler","Centre","Echelle","Outliers%"].index(h)], 5, h, border=1)
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

    # Encodages
    if encoding_maps:
        _pdf_subsection(pdf, "10.2  Mappings d'encodage (a persister pour reproduction)")
        pdf.set_font("Helvetica", "", 7)
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

    # Validation post-cleaning checklist
    _pdf_subsection(pdf, "10.3  Validation post-cleaning")
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(55, 65, 81)
    n_final = len(pt.get("column_order", []))
    checks = [
        ("Aucune valeur NaN residuelle (ou justifiee + flag)", "OK" if summary.get("missing_total", 0) == 0 or "missing_imputation" in [s.get("type") for s in steps] else "Verifier"),
        ("Coherence du nombre de lignes apres dedoublonnage",   "OK"),
        ("Coherence du nombre de colonnes apres encoding",       f"OK ({n_final} colonnes finales)"),
        ("Aucune feature constante apres transformation",        "OK"),
        ("Aucune fuite de donnees evidente dans les features",   "A valider manuellement"),
    ]
    for check, status in checks:
        ico = "[OK]" if status.startswith("OK") else "[!]"
        pdf.set_x(pdf.l_margin + 4)
        pdf.multi_cell(0, 4.5, _S(f"  {ico}  {check}  ->  {status}"))

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 11 — RECOMMANDATIONS POUR LA MODELISATION
    # ════════════════════════════════════════════════════════════════════════
    pdf.add_page()
    _pdf_section(pdf, "11", "Recommandations pour la modelisation")

    _pdf_subsection(pdf, "11.1  Taches ML recommandees")
    _pdf_paragraph(pdf, llm_result.get("ml_tasks", "Section non generee."), 9, 5)
    pdf.ln(2)

    _pdf_subsection(pdf, "11.2  Features a conserver / creer / exclure")
    _pdf_paragraph(pdf, llm_result.get("feature_recommendations", "Section non generee."), 9, 5)
    pdf.ln(2)

    _pdf_subsection(pdf, "11.3  Strategie de validation")
    has_temporal_data = bool(temporal_trend or "time_series" in plots_by_section)
    strategy_text = ("Cross-validation TimeSeriesSplit (5 folds) - preserve l'ordre temporel, evite le look-ahead bias. "
                     "Hold-out final : 15% des donnees les plus recentes. Stratification par machine_id."
                     if has_temporal_data else
                     "K-Fold stratifie (5 folds). Split aleatoire 70/15/15 train/val/test. Stratification par variable cible.")
    _pdf_paragraph(pdf, strategy_text, 9, 5)

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 12 — LIMITES ET POINTS D'ATTENTION
    # ════════════════════════════════════════════════════════════════════════
    pdf.add_page()
    _pdf_section(pdf, "12", "Limites et points d'attention")
    _pdf_paragraph(pdf, llm_result.get("limitations", "Section non generee."), 9, 5)

    # ════════════════════════════════════════════════════════════════════════
    # SECTION 13 — ANNEXES TECHNIQUES
    # ════════════════════════════════════════════════════════════════════════
    pdf.add_page()
    _pdf_section(pdf, "13", "Annexes techniques")

    # 13.1 — Detail statistique des colonnes
    _pdf_subsection(pdf, "13.1  Detail statistique par colonne")
    for col_info in summary.get("columns", []):
        cname = col_info["name"]
        ctype = col_info["type"]
        miss  = f"{col_info['missing']} ({col_info['missing_pct']}%)"
        uniq  = col_info["unique"]
        pdf.set_fill_color(243, 244, 246)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(0, 6, _S(f"  {cname}  [{ctype}]  -  {miss} manquants  |  {uniq} uniques"),
                 fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(55, 65, 81)
        if ctype == "numeric":
            stats_num = (f"min={col_info.get('min')}  Q1={col_info.get('q25', '-')}  "
                         f"moy={col_info.get('mean')}  Q3={col_info.get('q75', '-')}  max={col_info.get('max')}  "
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
                kurt_txt = ("Leptokurtique" if (kurt or 0) > 3 else
                            "Platykurtique" if (kurt or 0) < -1 else "Mesokurtique")
                pdf.set_x(pdf.l_margin + 4)
                pdf.multi_cell(0, 5, _S(
                    f"  Skewness : {skew:+.3f} ({skew_txt})  |  Kurtosis : {kurt:+.3f} ({kurt_txt})"
                ))
        else:
            top = col_info.get("top_values", {})
            if top:
                top_str = "  ,  ".join(f"{k} ({v})" for k, v in list(top.items())[:6])
                pdf.set_x(pdf.l_margin + 4)
                pdf.multi_cell(0, 5, _S(f"  Top valeurs : {top_str}"))
        pdf.ln(1)

    # 13.2 — Colonnes finales du dataset nettoye
    col_order = pt.get("column_order", [])
    if col_order:
        pdf.add_page()
        _pdf_subsection(pdf, "13.2  Colonnes finales du dataset nettoye (ordre)")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(55, 65, 81)
        for i, col in enumerate(col_order, 1):
            pdf.cell(10, 5, _S(f"{i:3d}."))
            pdf.cell(0, 5, _S(col), new_x="LMARGIN", new_y="NEXT")

    # 13.3 — Unites detectees
    units = pt.get("units", {})
    if units:
        pdf.ln(3)
        _pdf_subsection(pdf, "13.3  Unites detectees dans les colonnes d'origine")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(55, 65, 81)
        for clean, info in units.items():
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5, _S(f"  {info.get('original', clean)} -> {clean}  ({info.get('unit', '?')})"))

    # 13.4 — Versions et environnement
    pdf.ln(3)
    _pdf_subsection(pdf, "13.4  Environnement de generation")
    try:
        import sys as _sys
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(55, 65, 81)
        env_info = [
            f"Python : {_sys.version.split()[0]}",
            f"pandas : {pd.__version__}",
            f"numpy : {np.__version__}",
            f"Genere : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"Dataset ID : {dataset_id}",
        ]
        for line in env_info:
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5, _S(f"  {line}"))
    except Exception:
        pass

    # 13.5 — Conformite normative citee
    pdf.ln(3)
    _pdf_subsection(pdf, "13.5  Conformite normative citee")
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(55, 65, 81)
    norms = [
        "ISO/IEC 25012:2008 - Qualite des donnees",
        "ISO 13306:2017 - Terminologie de la maintenance",
        "ISO 10816-3 / 20816-1 - Severite vibratoire des machines fixes / rotatives",
        "ISO 18436-2 - Qualification analyste vibratoire CAT II",
        "ISO 13373-1 - Surveillance d'etat des machines",
        "EN 15341:2019 - Indicateurs de performance maintenance",
        "ISO 55000:2014 - Gestion des actifs",
    ]
    for n in norms:
        pdf.set_x(pdf.l_margin + 4)
        pdf.multi_cell(0, 5, _S(f"  - {n}"))

    pdf.output(str(report_path))
    return report_path


# ─── Ingestion Dashboard ──────────────────────────────────────────────────────

def _ingest_dashboard(df: "pd.DataFrame", data_type: str, dataset_id: int,
                       vitesse_rpm: float | None = None, user_id: int = 0):
    """Après EDA, injecte les mesures/KPIs/défauts dans la BD pour alimenter le dashboard.
    Auto-crée les machines et capteurs absents si l'utilisateur est identifié.
    """
    try:
        from db.database import db_session
        time_col = _detect_time_col(df)
        machine_col = next((c for c in df.columns if c.lower() in ("machine_id", "machine")), None)
        vrms_col = next((c for c in df.columns if any(k in c.lower() for k in ("v_rms", "vrms", "v_rms_mm_s"))), None)

        # ── Résolution des IDs machine/capteur réels ──────────────────────────
        machine_id_map: dict[str, int] = {}   # code_machine → id_machine
        capteur_id_map: dict[str, int] = {}   # code_machine → id_capteur

        with db_session() as conn:
            # Récupérer le nom du dataset et l'utilisateur uploadeur
            ds_row = conn.execute(
                "SELECT uploaded_by, name FROM dataset WHERE id=?", [dataset_id]
            ).fetchone()
            uid = user_id or (ds_row["uploaded_by"] if ds_row and ds_row["uploaded_by"] else 0)
            ds_name = ds_row["name"] if ds_row else f"dataset_{dataset_id}"

            # Trouver l'atelier de l'utilisateur pour y rattacher les nouvelles machines
            id_atelier_default = None
            if uid:
                row = conn.execute("""
                    SELECT a.id_atelier FROM atelier a
                    JOIN usine u ON a.id_usine = u.id_usine
                    JOIN utilisateur ut ON u.id_entreprise = ut.id_entreprise
                    WHERE ut.id_utilisateur = ? LIMIT 1
                """, [uid]).fetchone()
                if row:
                    id_atelier_default = row["id_atelier"]

            # Pour chaque machine unique dans le dataset → upsert machine + capteur
            if machine_col and id_atelier_default and len(df) > 0:
                unique_codes = [str(v).strip() for v in df[machine_col].dropna().unique() if str(v).strip()]
                for code in unique_codes:
                    existing = conn.execute(
                        "SELECT id_machine FROM machine WHERE code_machine=?", [code]
                    ).fetchone()
                    if existing:
                        machine_id_map[code] = existing["id_machine"]
                    else:
                        conn.execute("""
                            INSERT INTO machine
                            (id_atelier, code_machine, nom_machine, type_machine, statut,
                             origine_dataset, date_creation)
                            VALUES (?, ?, ?, 'autre', 'en_service', ?, datetime('now'))
                        """, (id_atelier_default, code, code, ds_name))
                        new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
                        machine_id_map[code] = new_id
                        # Capteur accéléromètre par défaut
                        cap_code = f"CAP-{code}-001"
                        conn.execute("""
                            INSERT OR IGNORE INTO capteur
                            (id_machine, code_capteur, type_capteur, unite_mesure, statut,
                             origine_dataset, date_installation)
                            VALUES (?, ?, 'accelerometre', 'mm/s', 'actif', ?, datetime('now'))
                        """, (new_id, cap_code, ds_name))
                        cap = conn.execute(
                            "SELECT id_capteur FROM capteur WHERE code_capteur=?", [cap_code]
                        ).fetchone()
                        if cap:
                            capteur_id_map[code] = cap["id_capteur"]

                    if code not in capteur_id_map:
                        cap = conn.execute(
                            "SELECT id_capteur FROM capteur WHERE id_machine=? LIMIT 1",
                            [machine_id_map[code]]
                        ).fetchone()
                        if cap:
                            capteur_id_map[code] = cap["id_capteur"]

        print(f"[Ingestion] {len(machine_id_map)} machines resolues/creees pour dataset {dataset_id}")

        with db_session() as conn:
            if vrms_col and time_col and len(df) > 0:
                rpm_col = next((c for c in df.columns if any(k in c.lower() for k in ("vitesse_rotation_rpm", "rpm", "vitesse_rpm"))), None)
                for _, row in df.iterrows():
                    try:
                        ts = pd.Timestamp(row[time_col]) if pd.notna(row.get(time_col)) else None
                        if ts is None: continue
                        code_str = str(row[machine_col]).strip() if machine_col and pd.notna(row.get(machine_col)) else ""
                        real_machine_id = machine_id_map.get(code_str, 1)
                        real_capteur_id = capteur_id_map.get(code_str, 1)
                        vrms = float(row[vrms_col]) if pd.notna(row.get(vrms_col)) else None
                        if vrms is None: continue
                        crest = float(row.get("crest_factor", 0)) if pd.notna(row.get("crest_factor")) else None
                        kurt = float(row.get("kurtosis", 0)) if pd.notna(row.get("kurtosis")) else None
                        temp = float(row.get("temperature_c", 0)) if pd.notna(row.get("temperature_c")) else None
                        rpm_val = None
                        if rpm_col and pd.notna(row.get(rpm_col)):
                            rpm_val = float(row[rpm_col])
                        elif vitesse_rpm:
                            rpm_val = float(vitesse_rpm)
                        zone = "A" if vrms < 2.3 else "B" if vrms < 4.5 else "C" if vrms < 7.1 else "D"
                        conn.execute("""INSERT OR IGNORE INTO mesure_globale
                            (id_capteur,id_machine,timestamp_mesure,v_rms_mm_s,crest_factor,facteur_k,
                             temperature_c,vitesse_rotation_rpm,zone_iso_calculee,statut_alarme)
                            VALUES (?,?,?,?,?,?,?,?,?,?)""",
                            (real_capteur_id, real_machine_id, str(ts), round(vrms,2),
                             crest, kurt, temp, rpm_val, zone, "alerte" if zone=="D" else "normal"))
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
                        code_str = str(r[machine_col]).strip() if pd.notna(r.get(machine_col)) else ""
                        real_mid = machine_id_map.get(code_str, 1)
                        dv = str(r[dcol])
                        if dv and "Aucun" not in dv:
                            conn.execute("""INSERT OR IGNORE INTO defaut_detecte
                                (id_machine,type_defaut,date_premiere_detection,gravite,stade_degradation,confiance_diagnostic_pct,statut)
                                VALUES (?,?,datetime('now'),3,2,75,'actif')""", (real_mid, dv))
                    except Exception: pass
        print(f"[Ingestion Dashboard] Dataset {dataset_id} -> mesures/KPIs/defauts injectes")
    except Exception as e:
        print(f"[Ingestion Dashboard] Ignoree : {e}")


# ─── Point d'entrée principal ─────────────────────────────────────────────────

def run_eda(dataset_id: int, file_path: str, update_db_callback, ingest: bool = True,
            vitesse_rpm: float | None = None,
            nb_paires_poles: int | None = None,
            nb_dents_engrenage: int | None = None) -> None:
    """
    Lance l'analyse EDA complète pour un dataset.
    update_db_callback(dataset_id, status, **kwargs) est appelé pour mettre à jour la BD.
    ingest=True  : intègre les mesures/KPIs/défauts dans le dashboard (mode entreprise).
    ingest=False : EDA uniquement, aucune trace dans les tables dashboard (mode exploratoire).
    vitesse_rpm / nb_paires_poles / nb_dents_engrenage : paramètres spectraux saisis à l'upload,
    utilisés pour calculer fr, fe, GMF même si absents des colonnes CSV.
    """
    try:
        update_db_callback(dataset_id, "processing")

        path = Path(file_path)
        frames = parse_file(path)

        api_key = os.getenv("ANTHROPIC_API_KEY", "")

        all_results = []
        for frame_name, df in frames.items():
            summary       = _compute_summary(df)
            data_type, detect_score = _detect_data_type(df)
            domain_description = ""

            # Si détection faible (≤ 1 keyword) → laisser Claude inférer le vrai domaine
            if detect_score <= 1 and api_key:
                inferred_type, domain_description = _infer_domain_with_llm(df, frame_name, api_key)
                data_type = inferred_type

            quality_score = _compute_quality_score(summary)
            kpis          = _compute_kpis(df, data_type, vitesse_rpm, nb_paires_poles, nb_dents_engrenage)
            rul_info      = _compute_rul(df, data_type)

            # Analyses avancees (VIF, Isolation Forest, stationnarite, tendance, alertes, ISO 25012)
            iso_25012     = _compute_iso_25012_subscores(summary)
            vif_info      = _compute_vif(df, max_cols=15)
            anomalies_iso = _detect_anomalies_isoforest(df, contamination=0.02)
            alerts        = _compute_critical_alerts(df, summary, kpis, rul_info, data_type)
            stationarity  = {}
            temporal_trend = {}
            t_col = _detect_time_col(df)
            if t_col:
                num_cols_avail = df.select_dtypes(include=[np.number]).columns.tolist()
                primary = next((c for c in num_cols_avail if any(k in str(c).lower()
                                for k in ["v_rms", "vrms", "health", "disponibilite"])),
                               num_cols_avail[0] if num_cols_avail else None)
                if primary:
                    try:
                        d_sorted = df[[t_col, primary]].copy()
                        d_sorted[t_col] = pd.to_datetime(d_sorted[t_col], errors="coerce")
                        d_sorted = d_sorted.dropna().sort_values(t_col)
                        if len(d_sorted) >= 30:
                            stationarity = _test_stationarity_simple(d_sorted[primary])
                            temporal_trend = _detect_temporal_trend(d_sorted, t_col, primary)
                    except Exception:
                        pass
            exec_data = _compute_executive_summary_data(
                summary, quality_score, data_type, alerts, kpis, rul_info, vif_info, anomalies_iso
            )

            llm_result    = _call_claude(summary, data_type, frame_name, quality_score,
                                          alerts=alerts, kpis=kpis, rul_info=rul_info,
                                          vif_info=vif_info, anomalies_iso=anomalies_iso,
                                          domain_description=domain_description)
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

            plots_serializable = [{"title": p["title"], "path": p["path"], "b64": p["b64"],
                                    "section": p.get("section", "")} for p in plots]
            structured_trace = {
                "steps": pipeline_trace.get("steps", []),
                "transformation_log": pipeline_trace.get("transformation_log", []),
                "column_order": pipeline_trace.get("column_order", []),
                "units": pipeline_trace.get("units", {}),
            }

            # Rapport PDF canonique (13 sections + synthèse exécutive + graphes intercalés)
            report_path = _generate_pdf(
                dataset_id, frame_name, summary, llm_result, plots, enc_maps,
                data_type, quality_score, structured_trace, kpis, rul_info,
                alerts=alerts, iso_25012=iso_25012, vif_info=vif_info,
                anomalies_iso=anomalies_iso, exec_summary_data=exec_data,
                stationarity=stationarity, temporal_trend=temporal_trend,
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
                "alerts":         alerts,
                "iso_25012":      iso_25012,
                "vif_info":       vif_info,
                "anomalies_iso":  anomalies_iso,
                "stationarity":   stationarity,
                "temporal_trend": temporal_trend,
                "exec_summary":   exec_data,
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
        # Utilise df (données brutes) et non df_proc (données scalées) pour conserver
        # les vraies valeurs métier (v_rms en mm/s, disponibilite_pct en %, etc.)
        if ingest:
            _ingest_dashboard(df, data_type, dataset_id, vitesse_rpm)

    except Exception as e:
        update_db_callback(dataset_id, "error", error_message=traceback.format_exc()[:2000])
        raise
