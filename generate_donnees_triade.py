#!/usr/bin/env python3
"""
Generateur de jeux de donnees pour la page Donnees — triade fonctionnelle :

  1) Analyse vibratoire   -> detected_type = 'vibration'
  2) Pronostic & DRBF     -> detected_type = 'maintenance'
  3) KPIs & Performance  -> detected_type = 'kpi'

IMPORTANT (architecture actuelle) :
  Le backend compte les mots-cles par nom de colonne (_detect_data_type).
  Un seul CSV ne peut donc pas etre simultanement compatible avec les trois
  sous-pages du hook useDatasetForPage (vibration / maintenance / kpi).
  Ce script genere TROIS fichiers en une execution, chacun optimise pour
  une sous-page, avec au moins 1000 lignes chacun.

Usage :
  python generate_donnees_triade.py

Sorties (UTF-8, virgule, index=False) :
  donnees_analyse_vibratoire.csv   (1250 lignes)
  donnees_pronostic_drbf.csv       (1250 lignes)
  donnees_kpi_performance.csv      (1250 lignes)

Dependances : numpy, pandas
"""

from __future__ import annotations

from pathlib import Path
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

SEED = 42
np.random.seed(SEED)

N_MACHINES = 25
N_OBS = 50  # 25 * 50 = 1250 >= 1000


def clamp(a: np.ndarray, lo: float, hi: float) -> np.ndarray:
    return np.clip(a, lo, hi)


def mid(i: int) -> str:
    return f"M{i:02d}"


def zone_from_vrms(v: float) -> str:
    if v <= 2.3:
        return "A"
    if v <= 4.5:
        return "B"
    if v <= 7.1:
        return "C"
    return "D"


def machine_label(i: int) -> str:
    kinds = ["Compresseur", "Pompe", "Moteur", "Ventilateur", "Réducteur"]
    k = kinds[(i - 1) % 5]
    return f"{k} {mid(i)}"


def rpm_for_machine(i: int) -> float:
    bases = [960, 1450, 2950, 740, 480]
    return float(bases[(i - 1) % 5])


def timestamps_for_obs() -> list[str]:
    d0 = datetime(2025, 6, 1, 8, 0, 0)
    return [(d0 + timedelta(hours=6 * k)).isoformat() for k in range(N_OBS)]


# ---------------------------------------------------------------------------
# 1) VIBRATION — colonnes alignees sur GET /datasets/{id}/vibration-analysis
# ---------------------------------------------------------------------------
def generate_analyse_vibratoire() -> pd.DataFrame:
    rows: list[dict] = []
    ts_list = timestamps_for_obs()

    for m in range(1, N_MACHINES + 1):
        degraded = m > 18
        vr_mu, vr_sig = (6.5, 2.0) if degraded else (2.6, 1.1)
        for obs in range(N_OBS):
            vrms = float(clamp(np.random.normal(vr_mu + obs * 0.02, vr_sig), 0.3, 14.0))
            rpm = rpm_for_machine(m) + float(np.random.normal(0, 12))
            f0 = rpm / 60.0
            crest = float(clamp(np.random.normal(3.4, 1.2), 1.0, 11.0))
            kurt = float(clamp(np.random.normal(3.5, 1.8), 1.5, 14.0))
            bpfo = f0 * 2.35 + float(np.random.normal(0, 0.4))
            bpfi = f0 * 5.42 + float(np.random.normal(0, 0.4))
            bsf = f0 * 1.88 + float(np.random.normal(0, 0.25))
            ftf = f0 * 0.42 + float(np.random.normal(0, 0.08))
            bpfo_a = float(max(0, np.random.normal(0.08, 0.05)))
            bpfi_a = float(max(0, np.random.normal(0.07, 0.04)))
            bsf_a = float(max(0, np.random.normal(0.06, 0.04)))
            accel = float(clamp(vrms * np.random.normal(0.9, 0.12), 0.05, 18.0))
            zone = zone_from_vrms(vrms)
            alarm = "alerte" if zone == "D" else "normal"

            rows.append(
                {
                    "timestamp": ts_list[obs],
                    "machine_id": mid(m),
                    "machine_nom": machine_label(m),
                    "v_rms_mm_s": round(vrms, 4),
                    "crest_factor": round(crest, 4),
                    "kurtosis_val": round(kurt, 4),
                    "rpm": round(rpm, 3),
                    "frequence_fondamentale_hz": round(f0, 4),
                    "bpfo_freq_hz": round(bpfo, 4),
                    "bpfi_freq_hz": round(bpfi, 4),
                    "bsf_freq_hz": round(bsf, 4),
                    "ftf_freq_hz": round(ftf, 4),
                    "bpfo_amplitude": round(bpfo_a, 5),
                    "bpfi_amplitude": round(bpfi_a, 5),
                    "bsf_amplitude": round(bsf_a, 5),
                    "acceleration_rms_g": round(accel, 4),
                    "bearing_ref": np.random.choice(["6205", "6206", "6308", "6310", "22218"]),
                    "defect_score": round(float(np.random.uniform(0, 1)), 3),
                    "fft_peak_hz": round(float(f0 * np.random.choice([1, 2, 3])), 3),
                    "zone_iso": zone,
                    "statut_alarme": alarm,
                    "puissance_kw": round(float(clamp(np.random.normal(55, 20), 8, 200)), 2),
                }
            )

    df = pd.DataFrame(rows)
    # Imperfections EDA legeres : manquants sur v_rms
    idx = np.random.choice(df.index, size=int(len(df) * 0.02), replace=False)
    df.loc[idx, "v_rms_mm_s"] = np.nan
    df.loc[idx, "zone_iso"] = np.nan
    idx2 = df["v_rms_mm_s"].notna()
    df.loc[idx2, "zone_iso"] = df.loc[idx2, "v_rms_mm_s"].astype(float).apply(zone_from_vrms)
    return df


# ---------------------------------------------------------------------------
# 2) MAINTENANCE / PRONOSTIC — pas de sous-chaine 'rul' dans les noms
#    (rul est un mot-cle vibration dans eda_agent)
# ---------------------------------------------------------------------------
def generate_pronostic_drbf() -> pd.DataFrame:
    rows: list[dict] = []
    ts_list = timestamps_for_obs()

    for m in range(1, N_MACHINES + 1):
        degraded = m > 15
        hi0 = np.random.uniform(0.25, 0.45) if degraded else np.random.uniform(0.72, 0.95)
        for obs in range(N_OBS):
            hi = float(clamp(np.array([hi0 - obs * 0.003 + np.random.normal(0, 0.015)]), 0.05, 0.99)[0])
            drbf_days = int(clamp(np.array([hi * 120 + np.random.normal(0, 8)]), 1, 200)[0])
            vrms = float(clamp(np.random.normal(3.0 + (1.0 - hi) * 8, 1.2), 0.2, 14.0))
            fail_ct = int(np.random.poisson(0.4 if hi > 0.5 else 1.2))
            panne = 1 if fail_ct > 0 else 0
            rep_h = 0.0 if panne == 0 else float(clamp(np.random.normal(5.0, 2.0), 0.5, 36.0))

            rows.append(
                {
                    "timestamp": ts_list[obs],
                    "machine_id": mid(m),
                    "machine_nom": machine_label(m),
                    "health_index": round(hi, 4),
                    "drbf_jours": drbf_days,
                    "v_rms_mm_s": round(vrms, 4),
                    "failure_count_30j": fail_ct,
                    "panne_detectee": panne,
                    "intervention_type": np.random.choice(["Préventive", "Corrective", "Conditionnelle", "Aucune"], p=[0.35, 0.25, 0.25, 0.15]),
                    "repair_duration_h": round(rep_h, 3),
                    "work_order_id": f"WO-{m:02d}-{obs:04d}",
                    "bt_reference": f"BT-{m:02d}-{obs % 10}",
                    "component_affected": np.random.choice(["Palier DE", "Accouplement", "Roulement NDE", "—"]),
                    "piece_code": f"P-{np.random.randint(1000, 9999)}",
                    "remplacement_prevu": np.random.choice([0, 1], p=[0.85, 0.15]),
                    "maintenance_plan_version": f"v{np.random.randint(1, 5)}",
                }
            )

    df = pd.DataFrame(rows)
    idx = np.random.choice(df.index, size=int(len(df) * 0.015), replace=False)
    df.loc[idx, "repair_duration_h"] = np.nan
    return df


# ---------------------------------------------------------------------------
# 3) KPI — eviter 'machine_id' (mot-cle machine) pour maximiser le score kpi
# ---------------------------------------------------------------------------
def generate_kpi_performance() -> pd.DataFrame:
    rows: list[dict] = []
    ateliers = ["AT1", "AT2", "AT3", "AT4", "AT5"]
    ts_list = timestamps_for_obs()

    for m in range(1, N_MACHINES + 1):
        at = ateliers[(m - 1) % 5]
        for obs in range(N_OBS):
            mtbf = float(clamp(np.random.normal(320, 90), 80, 900))
            mttr = float(clamp(np.random.normal(4.5, 1.5), 0.6, 28.0))
            dispo = round(100.0 * mtbf / (mtbf + mttr), 2)
            oee = round(float(clamp(dispo * np.random.uniform(0.78, 0.92) / 100 * 100, 40, 98)), 1)
            trs = round(oee + np.random.normal(0, 1.5), 1)
            rows.append(
                {
                    "timestamp": ts_list[obs],
                    "atelier": at,
                    "asset_code": f"A-{m:03d}-{obs:02d}",
                    "mtbf_heures": round(mtbf, 2),
                    "mttr_heures": round(mttr, 2),
                    "disponibilite_pct": dispo,
                    "oee_pct": oee,
                    "trs_pct": trs,
                    "quality_pct": round(float(np.random.uniform(92, 99.5)), 1),
                    "performance_pct": round(float(np.random.uniform(85, 98)), 1),
                    "uptime_h": round(float(np.random.uniform(120, 720)), 1),
                    "downtime_h": round(float(np.random.uniform(2, 48)), 1),
                    "production_units": int(np.random.randint(800, 12000)),
                    "availability_target_pct": 94.0,
                }
            )

    df = pd.DataFrame(rows)
    idx = np.random.choice(df.index, size=int(len(df) * 0.02), replace=False)
    df.loc[idx, "mtbf_heures"] = np.nan
    return df


def report(name: str, df: pd.DataFrame) -> None:
    print(f"\n{name}")
    print(f"  lignes: {len(df)}  colonnes: {len(df.columns)}")
    print(f"  manquants: {int(df.isnull().sum().sum())}")


def infer_scores(df: pd.DataFrame) -> dict[str, int]:
    """Meme logique que eda_agent._detect_data_type (scores bruts)."""
    vib = {"vibration", "vrms", "rms", "acceleration", "velocity", "displacement", "fft", "frequency", "rpm", "bearing", "fault", "defect", "sensor", "amplitude", "kurtosis", "crest", "bpfo", "bpfi", "imf", "rul"}
    kpi = {"oee", "mtbf", "mttr", "availability", "disponibilite", "trs", "performance", "quality", "uptime", "downtime", "production"}
    maint = {"maintenance", "failure", "repair", "work_order", "bt", "panne", "intervention", "component", "piece", "remplacement"}
    mach = {"machine", "equipment", "asset", "motor", "pump", "compressor", "machine_id", "equipment_id", "id_machine"}
    cols = {str(c).lower().replace(" ", "_") for c in df.columns}
    return {
        "vibration": sum(any(k in c for k in vib) for c in cols),
        "kpi": sum(any(k in c for k in kpi) for c in cols),
        "maintenance": sum(any(k in c for k in maint) for c in cols),
        "machine": sum(any(k in c for k in mach) for c in cols),
    }


if __name__ == "__main__":
    out = Path(".")
    f1 = out / "donnees_analyse_vibratoire.csv"
    f2 = out / "donnees_pronostic_drbf.csv"
    f3 = out / "donnees_kpi_performance.csv"

    d1 = generate_analyse_vibratoire()
    d2 = generate_pronostic_drbf()
    d3 = generate_kpi_performance()

    d1.to_csv(f1, index=False, encoding="utf-8")
    d2.to_csv(f2, index=False, encoding="utf-8")
    d3.to_csv(f3, index=False, encoding="utf-8")

    report(str(f1), d1)
    print(f"  scores mots-cles (attendu vibration max): {infer_scores(d1)}")
    report(str(f2), d2)
    print(f"  scores mots-cles (attendu maintenance max): {infer_scores(d2)}")
    report(str(f3), d3)
    print(f"  scores mots-cles (attendu kpi max): {infer_scores(d3)}")

    print("\n[OK] 3 fichiers generes (>= 1000 lignes chacun).")
    print("     Uploader chaque CSV separement pour la sous-page correspondante.")
