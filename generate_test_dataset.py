#!/usr/bin/env python3
"""
Generateur de dataset de test complet pour la page Donnees.
Usage : python generate_test_dataset.py
Sortie : maintenance_complete_test.csv (1200 lignes)
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 42
np.random.seed(SEED)

N_MACHINES = 12
OBS_PER_MACHINE = 100
TOTAL_ROWS = N_MACHINES * OBS_PER_MACHINE


def clamp(values: np.ndarray, vmin: float, vmax: float) -> np.ndarray:
    return np.clip(values, vmin, vmax)


def machine_code(i: int) -> str:
    return f"M{i:02d}"


def machine_meta(mid: str) -> dict[str, str]:
    mnum = int(mid[1:])
    if 1 <= mnum <= 3:
        return {"atelier": "AT1", "type_machine": "pompe_centrifuge", "localisation": "Bâtiment_A"}
    if 4 <= mnum <= 6:
        return {"atelier": "AT2", "type_machine": "compresseur", "localisation": "Bâtiment_B"}
    if 7 <= mnum <= 9:
        return {"atelier": "AT3", "type_machine": "moteur_electrique", "localisation": "Bâtiment_C"}
    return {"atelier": "AT4", "type_machine": "ventilateur", "localisation": "Bâtiment_D"}


def iso_zone(vrms: float | None) -> str | float:
    if vrms is None or (isinstance(vrms, float) and np.isnan(vrms)):
        return np.nan
    if vrms <= 2.3:
        return "A"
    if vrms <= 4.5:
        return "B"
    if vrms <= 7.1:
        return "C"
    return "D"


def vis_class(vrms: float | None) -> str | float:
    if vrms is None or (isinstance(vrms, float) and np.isnan(vrms)):
        return np.nan
    if vrms <= 2.3:
        return "NORMAL"
    if vrms <= 4.5:
        return "ATTENTION"
    if vrms <= 7.1:
        return "CRITIQUE"
    return "URGENCE"


def base_rpm(type_machine: str) -> float:
    return {
        "pompe_centrifuge": 1450.0,
        "compresseur": 960.0,
        "moteur_electrique": 2950.0,
        "ventilateur": 740.0,
    }[type_machine]


def weighted_choice(options: list[str], probs: list[float], size: int) -> np.ndarray:
    return np.random.choice(options, size=size, p=probs)


def generate_dataset() -> pd.DataFrame:
    # 100 timestamps regulierement repartis entre 2024-01-01 et 2024-06-30
    ts_machine = pd.date_range(
        start="2024-01-01 00:00:00",
        end="2024-06-30 23:59:59",
        periods=OBS_PER_MACHINE,
    )

    rows: list[dict] = []

    defect_values = [
        "Aucun",
        "Desalignement",
        "Desequilibre",
        "Defaut_roulement_BPFO",
        "Defaut_roulement_BPFI",
        "Usure_engrenage",
    ]
    defect_probs = [0.70, 0.10, 0.08, 0.06, 0.04, 0.02]

    intervention_values = ["Preventive", "Corrective", "Conditionnelle"]
    intervention_probs = [0.50, 0.35, 0.15]

    sensor_type_values = ["accelerometre", "capteur_vibration", "thermocouple"]
    sensor_type_probs = [0.40, 0.35, 0.25]

    capteur_status_values = ["actif", "maintenance", "inactif", "defaillant"]
    capteur_status_probs = [0.80, 0.12, 0.05, 0.03]

    age_base = {
        "AT1": 2.5,
        "AT2": 5.1,
        "AT3": 3.8,
        "AT4": 8.2,
    }

    for m in range(1, N_MACHINES + 1):
        mid = machine_code(m)
        meta = machine_meta(mid)
        degraded = m >= 10

        defects = weighted_choice(defect_values, defect_probs, OBS_PER_MACHINE)
        interventions = weighted_choice(intervention_values, intervention_probs, OBS_PER_MACHINE)
        capteur_types = weighted_choice(sensor_type_values, sensor_type_probs, OBS_PER_MACHINE)
        capteur_status = weighted_choice(capteur_status_values, capteur_status_probs, OBS_PER_MACHINE)

        # Statut machine conditionnel au type de defaut
        statut = []
        for d in defects:
            if d == "Aucun":
                statut.append(np.random.choice(["en_marche", "arret", "panne"], p=[0.92, 0.07, 0.01]))
            else:
                statut.append(np.random.choice(["en_marche", "arret", "panne"], p=[0.55, 0.27, 0.18]))

        # Vibrations
        v_mu = 6.5 if degraded else 2.8
        v_sigma = 1.8
        v_rms = np.random.lognormal(mean=np.log(v_mu), sigma=0.35, size=OBS_PER_MACHINE)
        v_rms = clamp(v_rms, 0.1, 15.0)
        if degraded:
            v_rms = np.maximum(v_rms, 4.6)

        acceleration_g = clamp(v_rms * np.random.normal(1.2, 0.15, OBS_PER_MACHINE), 0, 20)

        crest = clamp(np.random.normal(3.5, 1.8, OBS_PER_MACHINE), 1, 12)
        kurt = clamp(np.random.normal(3.2, 2.1, OBS_PER_MACHINE), 1.5, 15)
        for i, d in enumerate(defects):
            if "roulement" in d.lower():
                crest[i] *= 1.8
                kurt[i] += np.random.normal(4, 1)
        crest = np.maximum(crest, 1.0)
        kurt = clamp(kurt, 1.5, 15.0)

        rpm = base_rpm(meta["type_machine"]) + np.random.normal(0, 20, OBS_PER_MACHINE)
        rpm = np.maximum(rpm, 100)
        freq0 = rpm / 60.0 + np.random.normal(0, 0.1, OBS_PER_MACHINE)
        bpfo = rpm / 60.0 * 2.3 + np.random.normal(0, 0.5, OBS_PER_MACHINE)
        bpfi = rpm / 60.0 * 5.4 + np.random.normal(0, 0.5, OBS_PER_MACHINE)
        bsf = rpm / 60.0 * 1.9 + np.random.normal(0, 0.3, OBS_PER_MACHINE)

        amp1x = clamp(np.random.normal(1.2, 0.4, OBS_PER_MACHINE), 0, 5)
        amp2x = clamp(np.random.normal(0.6, 0.3, OBS_PER_MACHINE), 0, 3)
        amp3x = clamp(np.random.normal(0.3, 0.2, OBS_PER_MACHINE), 0, 2)

        # Process / thermique
        temp_mu = 85 if degraded else 68
        temperature = clamp(np.random.normal(temp_mu, 12, OBS_PER_MACHINE), 20, 120)
        pression = clamp(np.random.normal(4.5, 0.8, OBS_PER_MACHINE), 0, 10)
        puissance = clamp(np.random.normal(45, 15, OBS_PER_MACHINE), 5, 150)
        courant = puissance / (math.sqrt(3) * 0.4 * 0.9) + np.random.normal(0, 2, OBS_PER_MACHINE)
        courant = np.maximum(courant, 0.1)

        # Sante / pronostic
        health = np.zeros(OBS_PER_MACHINE)
        for cycle in range(OBS_PER_MACHINE):
            if degraded:
                h = max(0.6 - cycle * 0.004 + np.random.normal(0, 0.03), 0.1)
                h = min(h, 0.39)  # contrainte explicite: M10-M12 < 0.4
            else:
                h = max(0.95 - cycle * 0.003 + np.random.normal(0, 0.02), 0.3)
            health[cycle] = h

        rul = health * 2000 + np.random.normal(0, 100, OBS_PER_MACHINE)
        rul = np.round(clamp(rul, 0, 5000)).astype(int)

        age = age_base[meta["atelier"]] + np.random.normal(0, 0.1, OBS_PER_MACHINE)
        age = np.maximum(age, 0.1)
        heures_cum = age * 8760 * 0.75

        # KPIs
        mtbf_mu = 140 if degraded else 312
        mtbf = clamp(np.random.normal(mtbf_mu, 85, OBS_PER_MACHINE), 50, 800)
        mttr = clamp(np.random.normal(4.2, 1.8, OBS_PER_MACHINE), 0.5, 24)
        mttf = np.maximum(mtbf * 1.15 + np.random.normal(0, 10, OBS_PER_MACHINE), 1.0)
        dispo = (mtbf / (mtbf + mttr)) * 100
        oee = dispo * np.random.normal(0.92, 0.05, OBS_PER_MACHINE) * np.random.normal(0.97, 0.02, OBS_PER_MACHINE)
        oee = np.round(clamp(oee, 40, 99), 1)
        taux_def = np.round(1.0 / mtbf, 6)
        duree_rep = clamp(np.random.normal(3.8, 2.1, OBS_PER_MACHINE), 0.5, 48)

        batterie = np.random.randint(15, 101, size=OBS_PER_MACHINE)
        # 5% batteries faibles
        low_idx = np.random.choice(np.arange(OBS_PER_MACHINE), size=max(1, int(OBS_PER_MACHINE * 0.05)), replace=False)
        batterie[low_idx] = np.random.randint(5, 20, size=len(low_idx))

        signal_q = np.round(clamp(np.random.normal(94, 8, OBS_PER_MACHINE), 60, 100)).astype(int)

        for i in range(OBS_PER_MACHINE):
            vr = float(v_rms[i])
            rows.append(
                {
                    "timestamp": ts_machine[i].isoformat(),
                    "machine_id": mid,
                    "atelier": meta["atelier"],
                    "type_machine": meta["type_machine"],
                    "localisation": meta["localisation"],
                    "statut_machine": statut[i],
                    "capteur_id": f"S{m:02d}_{np.random.randint(1, 4)}",
                    "type_capteur": capteur_types[i],
                    "classification_vis": vis_class(vr),
                    "zone_iso": iso_zone(vr),
                    "type_defaut": defects[i],
                    "type_intervention": interventions[i],
                    "v_rms_mm_s": round(vr, 4),
                    "acceleration_g": round(float(acceleration_g[i]), 4),
                    "crest_factor": round(float(crest[i]), 4),
                    "kurtosis_val": round(float(kurt[i]), 4),
                    "rpm": round(float(rpm[i]), 3),
                    "bpfo_hz": round(float(bpfo[i]), 4),
                    "bpfi_hz": round(float(bpfi[i]), 4),
                    "bsf_hz": round(float(bsf[i]), 4),
                    "frequence_fondamentale_hz": round(float(freq0[i]), 4),
                    "amplitude_1x_mm_s": round(float(amp1x[i]), 4),
                    "amplitude_2x_mm_s": round(float(amp2x[i]), 4),
                    "amplitude_3x_mm_s": round(float(amp3x[i]), 4),
                    "temperature_c": round(float(temperature[i]), 4),
                    "pression_bar": round(float(pression[i]), 4),
                    "puissance_kw": round(float(puissance[i]), 4),
                    "courant_a": round(float(courant[i]), 4),
                    "health_index": round(float(health[i]), 4),
                    "rul": int(rul[i]),
                    "age_ans": round(float(age[i]), 4),
                    "heures_cumulees": round(float(heures_cum[i]), 2),
                    "mtbf": round(float(mtbf[i]), 4),
                    "mttr": round(float(mttr[i]), 4),
                    "mttf": round(float(mttf[i]), 4),
                    "disponibilite_pct": round(float(dispo[i]), 2),
                    "oee_pct": round(float(oee[i]), 1),
                    "taux_defaillance": float(taux_def[i]),
                    "duree_reparation_h": round(float(duree_rep[i]), 4),
                    "batterie_pct": int(batterie[i]),
                    "statut_capteur": capteur_status[i],
                    "signal_qualite_pct": int(signal_q[i]),
                    "version_schema": "v2.1",
                }
            )

    df = pd.DataFrame(rows)

    # Ajustement statistique global statut_machine ~85/10/5 avec coherence defaut
    # (Sans casser les lignes avec defaut explicite)
    target_counts = {"en_marche": int(TOTAL_ROWS * 0.85), "arret": int(TOTAL_ROWS * 0.10), "panne": TOTAL_ROWS - int(TOTAL_ROWS * 0.85) - int(TOTAL_ROWS * 0.10)}
    current_counts = df["statut_machine"].value_counts().to_dict()
    deficit_panne = target_counts["panne"] - current_counts.get("panne", 0)
    if deficit_panne > 0:
        candidates = df.index[df["type_defaut"] != "Aucun"].tolist()
        if candidates:
            promote_idx = np.random.choice(candidates, size=min(deficit_panne, len(candidates)), replace=False)
            df.loc[promote_idx, "statut_machine"] = "panne"

    # 15 doublons exacts (remplacement de 15 lignes, pour garder 1200 lignes)
    replace_targets = np.random.choice(df.index, size=15, replace=False)
    for t in replace_targets:
        mid = df.loc[t, "machine_id"]
        same_machine_idx = df.index[(df["machine_id"] == mid) & (df.index != t)].to_numpy()
        src = int(np.random.choice(same_machine_idx, size=1)[0])
        df.loc[t] = df.loc[src]

    # Outliers crest_factor: 40 lignes entre 10 et 15 sur machines degradees
    degraded_idx = df.index[df["machine_id"].isin(["M10", "M11", "M12"])].to_numpy()
    crest_out_idx = np.random.choice(degraded_idx, size=40, replace=False)
    df.loc[crest_out_idx, "crest_factor"] = np.round(np.random.uniform(10, 15, size=40), 4)

    # Temperature aberrante: 20 lignes > 110C
    hot_idx = np.random.choice(df.index, size=20, replace=False)
    df.loc[hot_idx, "temperature_c"] = np.round(np.random.uniform(111, 120, size=20), 4)

    # 3% de manquants sur colonnes cibles
    miss_cols = ["v_rms_mm_s", "temperature_c", "health_index", "mtbf", "kurtosis_val"]
    for c in miss_cols:
        n_missing = int(TOTAL_ROWS * 0.03)
        miss_idx = np.random.choice(df.index, size=n_missing, replace=False)
        df.loc[miss_idx, c] = np.nan

    # Recalcul derivations depuis v_rms si v_rms disponible
    df["zone_iso"] = df["v_rms_mm_s"].apply(iso_zone)
    df["classification_vis"] = df["v_rms_mm_s"].apply(vis_class)

    # Recalcul indicateurs lies a mtbf/mttr avec protection division par zero
    safe_mtbf = pd.to_numeric(df["mtbf"], errors="coerce")
    safe_mttr = pd.to_numeric(df["mttr"], errors="coerce")
    denom = safe_mtbf + safe_mttr
    dispo_new = np.where((safe_mtbf > 0) & (safe_mttr > 0) & (denom > 0), (safe_mtbf / denom) * 100, np.nan)
    df["disponibilite_pct"] = np.round(dispo_new, 2)
    df["taux_defaillance"] = np.where(safe_mtbf > 0, np.round(1.0 / safe_mtbf, 6), np.nan)

    # Recoherence degradees (M10-M12)
    degraded_mask = df["machine_id"].isin(["M10", "M11", "M12"])
    df.loc[degraded_mask & df["v_rms_mm_s"].notna(), "v_rms_mm_s"] = np.maximum(
        df.loc[degraded_mask & df["v_rms_mm_s"].notna(), "v_rms_mm_s"].astype(float),
        4.6,
    )
    df.loc[degraded_mask & df["health_index"].notna(), "health_index"] = np.minimum(
        df.loc[degraded_mask & df["health_index"].notna(), "health_index"].astype(float),
        0.39,
    )
    df["zone_iso"] = df["v_rms_mm_s"].apply(iso_zone)
    df["classification_vis"] = df["v_rms_mm_s"].apply(vis_class)

    # RUL positif
    df["rul"] = np.maximum(pd.to_numeric(df["rul"], errors="coerce").fillna(0).astype(int), 0)

    # Ordre stable des lignes
    df = df.reset_index(drop=True)

    # Garantir exactement 15 doublons exacts
    target_dups = 15
    current_dups = int(df.duplicated().sum())
    tries = 0
    while current_dups < target_dups and tries < 200:
        tries += 1
        t = int(np.random.choice(df.index, size=1)[0])
        mid = df.loc[t, "machine_id"]
        candidates = df.index[(df["machine_id"] == mid) & (df.index != t)].to_numpy()
        if len(candidates) == 0:
            continue
        s = int(np.random.choice(candidates, size=1)[0])
        df.loc[t] = df.loc[s]
        current_dups = int(df.duplicated().sum())

    return df


if __name__ == "__main__":
    df = generate_dataset()
    out = Path("maintenance_complete_test.csv")
    df.to_csv(out, index=False, encoding="utf-8")

    print(f"[OK] Dataset genere : {out}")
    print(f"  Lignes : {len(df)}")
    print(f"  Colonnes : {len(df.columns)}")
    print("  Types détectés :")
    print(f"    - Vibratoire : {(df['v_rms_mm_s'].notna()).sum()} mesures")
    print(f"    - Zones ISO  : {df['zone_iso'].value_counts(dropna=False).to_dict()}")
    print(f"    - VIS classif: {df['classification_vis'].value_counts(dropna=False).to_dict()}")
    print(f"    - Health Index moyen : {pd.to_numeric(df['health_index'], errors='coerce').mean():.3f}")
    print(f"    - RUL moyen  : {pd.to_numeric(df['rul'], errors='coerce').mean():.0f} h")
    print(f"    - MTBF moyen : {pd.to_numeric(df['mtbf'], errors='coerce').mean():.0f} h")
    print(f"  Valeurs manquantes : {int(df.isnull().sum().sum())}")
    print(f"  Doublons : {int(df.duplicated().sum())}")
    print(f"  Colonnes constantes : {[c for c in df.columns if df[c].nunique(dropna=False) == 1]}")
