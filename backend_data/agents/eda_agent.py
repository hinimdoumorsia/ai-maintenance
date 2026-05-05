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
            col_info["mean"] = round(float(df[col].mean()), 4) if df[col].notna().any() else None
            col_info["std"]  = round(float(df[col].std()),  4) if df[col].notna().any() else None
            col_info["min"]  = round(float(df[col].min()),  4) if df[col].notna().any() else None
            col_info["max"]  = round(float(df[col].max()),  4) if df[col].notna().any() else None
        else:
            col_info["type"] = "categorical"
            top_vals = df[col].value_counts().head(5).to_dict()
            col_info["top_values"] = {str(k): int(v) for k, v in top_vals.items()}

        summary["columns"].append(col_info)

    return summary


# ─── Appel LLM Claude ─────────────────────────────────────────────────────────

def _call_claude(summary: dict, data_type: str, original_filename: str) -> dict[str, str]:
    """
    Appelle Claude pour obtenir :
    - Un plan de prétraitement (preprocessing_plan)
    - Une narration EDA (narrative)
    - Des recommandations de features (feature_recommendations)
    Retourne des chaînes vides si la clé API est absente.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {
            "preprocessing_plan":      "Clé API Claude non configurée - analyse heuristique appliquée.",
            "narrative":               "Analyse automatique sans LLM.",
            "feature_recommendations": "Configurer ANTHROPIC_API_KEY pour les recommandations IA.",
        }

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)

        col_descriptions = []
        for c in summary["columns"][:30]:  # limite contexte
            desc = f"- {c['name']} ({c['type']}, {c['missing_pct']}% manquant"
            if c["type"] == "numeric":
                desc += f", min={c.get('min')}, max={c.get('max')}, moy={c.get('mean')}"
            else:
                desc += f", {c['unique']} valeurs uniques"
            desc += ")"
            col_descriptions.append(desc)

        prompt = f"""Tu es un expert en Data Science spécialisé en maintenance prédictive industrielle.
Un utilisateur a uploadé le dataset "{original_filename}".
Type détecté : {data_type}
Dimensions : {summary['n_rows']} lignes × {summary['n_cols']} colonnes
Doublons : {summary['duplicates']}
Valeurs manquantes totales : {summary['missing_total']} ({summary['missing_pct']}% en moyenne)

Colonnes détectées :
{chr(10).join(col_descriptions)}

Fournis une réponse JSON avec exactement ces 3 clés :
{{
  "preprocessing_plan": "Liste numérotée des étapes de prétraitement recommandées...",
  "narrative": "Analyse EDA narrative (300-400 mots) : qualité des données, patterns, anomalies, insights...",
  "feature_recommendations": "Recommandations pour la sélection de features en fonction du type de données ({data_type}) et des cas d'usage de maintenance prédictive..."
}}
Réponds uniquement avec le JSON valide, sans markdown."""

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text.strip()

        def _try_parse(text: str):
            # Strip markdown wrapper
            t = text
            m = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', t)
            if m: t = m.group(1)
            try: return json.loads(t)
            except: pass
            # Fix common JSON issues
            for repair in [
                t,  # original
                t.replace('\n', '\\n'),  # unescaped newlines in string values
                re.sub(r'(?<!\\)"([^"]*?)\n', r'"\1\\n', t),  # newline inside string
            ]:
                try: return json.loads(repair)
                except: pass
            # Extract fields individually with regex
            result = {}
            for key in ["preprocessing_plan", "narrative", "feature_recommendations"]:
                m = re.search(rf'"{key}"\s*:\s*"((?:[^"\\]|\\.)*)"', t)
                if m:
                    result[key] = m.group(1).replace('\\n', '\n').replace('\\"', '"')
            if result:
                return result
            raise ValueError(f"JSON non réparable à la position 0")

        import re
        return _try_parse(raw)

    except Exception as e:
        raw_preview = raw[:200] if 'raw' in dir() else ''
        return {
            "preprocessing_plan":      f"Analyse automatique (LLM JSON invalide).",
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
    for col in num_cols_all:
        if str(col) in onehot_set:
            continue
        vals = df[col].dropna()
        if len(vals) < 2: continue
        m, s = float(vals.mean()), float(vals.std())
        if s > 0:
            df[col] = (df[col] - m) / s
            standardization[col] = {"mean": round(m, 4), "std": round(s, 4)}
    if standardization:
        pipeline["steps"].append({"step": 6, "type": "standardization", "columns": standardization})
        errors.append(f"  * StandardScaler appliqué sur {len(standardization)} colonnes numériques")

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


def _generate_pdf(
    dataset_id: int,
    filename: str,
    summary: dict,
    llm_result: dict,
    plots: list[dict],
    encoding_maps: dict,
    data_type: str,
) -> Path:
    report_path = REPORTS_DIR / f"eda_report_{dataset_id}.pdf"
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # ── Titre
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(249, 115, 22)
    pdf.cell(0, 12, "Rapport EDA - AI Maintenance", new_x="LMARGIN", new_y="NEXT", align="C")

    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 7, _S(f"Fichier : {filename}"), new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.cell(0, 7, _S(f"Genere le : {datetime.now().strftime('%Y-%m-%d %H:%M')} | Type : {data_type}"),
             new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(5)

    # ── Resume statistique
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 9, "1. Resume du dataset", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(55, 65, 81)
    stats = [
        ("Lignes",                  summary["n_rows"]),
        ("Colonnes",                summary["n_cols"]),
        ("Variables numeriques",    summary["n_numeric"]),
        ("Variables categorielles", summary["n_categorical"]),
        ("Valeurs manquantes",      f"{summary['missing_total']} ({summary['missing_pct']}%)"),
        ("Doublons",                summary["duplicates"]),
    ]
    for label, val in stats:
        pdf.cell(80, 7, _S(f"  {label} :"), border=0)
        pdf.cell(0, 7, _S(val), new_x="LMARGIN", new_y="NEXT")

    # ── Narration LLM
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 9, "2. Analyse EDA", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(55, 65, 81)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 6, _S(llm_result.get("narrative", "-")))

    # ── Plan de pretraitement
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 9, "3. Plan de pretraitement applique", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(55, 65, 81)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 6, _S(llm_result.get("preprocessing_plan", "-")))

    # ── Encodages
    if encoding_maps:
        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(17, 24, 39)
        pdf.cell(0, 9, "4. Correspondances d'encodage", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(55, 65, 81)
        for col, info in encoding_maps.items():
            pdf.cell(0, 6, _S(f"  Colonne [{col}] (label encoding) :"), new_x="LMARGIN", new_y="NEXT")
            mapping_str = " | ".join(f"{k}->{v}" for k, v in list(info["mapping"].items())[:15])
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 5, _S(f"    {mapping_str}"))

    # ── Recommandations features
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 9, "5. Recommandations features", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(55, 65, 81)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 6, _S(llm_result.get("feature_recommendations", "-")))

    # ── Graphiques
    for plot in plots:
        try:
            pdf.add_page()
            pdf.set_font("Helvetica", "B", 12)
            pdf.set_text_color(17, 24, 39)
            pdf.cell(0, 9, _S(plot["title"]), new_x="LMARGIN", new_y="NEXT")
            pdf.image(plot["path"], w=pdf.w - 30)
        except Exception:
            pass

    # ── Detail des colonnes
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 9, "6. Detail des colonnes", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(55, 65, 81)
    for col_info in summary["columns"]:
        line = f"* {col_info['name']} ({col_info['type']}) - {col_info['missing_pct']}% manquant, {col_info['unique']} uniques"
        if col_info["type"] == "numeric":
            line += f" | min={col_info.get('min')}, max={col_info.get('max')}, moy={col_info.get('mean')}"
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 5, _S(line))

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

def run_eda(dataset_id: int, file_path: str, update_db_callback) -> None:
    """
    Lance l'analyse EDA complète pour un dataset.
    update_db_callback(dataset_id, status, **kwargs) est appelé pour mettre à jour la BD.
    """
    try:
        update_db_callback(dataset_id, "processing")

        path = Path(file_path)
        frames = parse_file(path)

        all_results = []
        for frame_name, df in frames.items():
            summary     = _compute_summary(df)
            data_type   = _detect_data_type(df)
            llm_result  = _call_claude(summary, data_type, frame_name)
            plots       = _generate_plots(df, dataset_id)
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

            # Rapport PDF
            report_path = _generate_pdf(
                dataset_id, frame_name, summary, llm_result, plots, enc_maps, data_type
            )

            plots_serializable = [{"title": p["title"], "path": p["path"], "b64": p["b64"]} for p in plots]

            all_results.append({
                "frame_name":    frame_name,
                "summary":       summary,
                "data_type":     data_type,
                "llm_result":    llm_result,
                "plots":         plots_serializable,
                "encoding_maps": enc_maps,
                "processed_path":str(proc_path),
                "report_path":   str(report_path),
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

        # INGESTION DASHBOARD : insérer mesures + KPIs dans la BD
        _ingest_dashboard(df_proc, data_type, dataset_id)

    except Exception as e:
        update_db_callback(dataset_id, "error", error_message=traceback.format_exc()[:2000])
        raise
