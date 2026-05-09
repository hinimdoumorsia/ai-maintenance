#!/usr/bin/env python3
"""
Generateur de 3 datasets de test pour les sous-pages :
  Parc Machines, Capteurs IoT, Classification VIS
de l'application AI Maintenance.

Usage :
  python generate_parc_vis_capteurs.py

Sorties :
  parc_machines_dataset.csv      (420 lignes, detected_type='machine')
  capteurs_iot_dataset.csv       (420 lignes, detected_type='generic')
  classification_vis_dataset.csv (420 lignes, detected_type='maintenance')

Dependances : numpy, pandas
"""

from __future__ import annotations

from pathlib import Path
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

SEED = 42
np.random.seed(SEED)
N_MACHINES = 20
N_OBS_PER_MACHINE = 21


def clamp(arr: np.ndarray, vmin: float, vmax: float) -> np.ndarray:
    return np.clip(arr, vmin, vmax)


def machine_id(i: int) -> str:
    return f"M{i:02d}"


def machine_type_for(i: int) -> str:
    # 4 machines par type
    if 1 <= i <= 4:
        return "Compresseur"
    if 5 <= i <= 8:
        return "Pompe"
    if 9 <= i <= 12:
        return "Moteur"
    if 13 <= i <= 16:
        return "Ventilateur"
    return "Réducteur"


def machine_name_for(i: int) -> str:
    t = machine_type_for(i)
    if t == "Compresseur":
        return f"Compresseur C-{i}"
    if t == "Pompe":
        return f"Pompe P-{i}"
    if t == "Moteur":
        return f"Moteur M-{i}"
    if t == "Ventilateur":
        return f"Ventilateur V-{i}"
    return f"Réducteur R-{i}"


def atelier_for(i: int) -> str:
    if 1 <= i <= 4:
        return "AT1"
    if 5 <= i <= 8:
        return "AT2"
    if 9 <= i <= 12:
        return "AT3"
    if 13 <= i <= 16:
        return "AT4"
    return "AT5"


def localisation_for(atelier: str) -> str:
    return {
        "AT1": "Bâtiment_A",
        "AT2": "Bâtiment_B",
        "AT3": "Bâtiment_C",
        "AT4": "Bâtiment_D",
        "AT5": "Bâtiment_D",
    }[atelier]


def classe_iso_for(t: str) -> str:
    return {
        "Compresseur": "III",
        "Pompe": "II",
        "Moteur": "II",
        "Ventilateur": "I",
        "Réducteur": "IV",
    }[t]


def rpm_base_for(t: str) -> float:
    return {
        "Compresseur": 960.0,
        "Pompe": 1450.0,
        "Moteur": 2950.0,
        "Ventilateur": 740.0,
        "Réducteur": 480.0,
    }[t]


def zone_iso_from_vrms(v: float | None) -> str | float:
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return np.nan
    if v <= 2.3:
        return "A"
    if v <= 4.5:
        return "B"
    if v <= 7.1:
        return "C"
    return "D"


def generate_timestamps(start: str, end: str, periods: int) -> list[str]:
    dts = pd.date_range(start=start, end=end, periods=periods)
    return [d.isoformat() for d in dts]


def maybe_inject_duplicates(df: pd.DataFrame, n_dup: int) -> pd.DataFrame:
    # Remplace n lignes par copie de lignes existantes pour garder taille stable
    targets = np.random.choice(df.index, size=n_dup, replace=False)
    for t in targets:
        s = int(np.random.choice(df.index[df.index != t], size=1)[0])
        df.loc[t] = df.loc[s]
    return df


def enforce_duplicate_count(df: pd.DataFrame, target: int) -> pd.DataFrame:
    tries = 0
    while int(df.duplicated().sum()) < target and tries < 500:
        tries += 1
        t = int(np.random.choice(df.index, size=1)[0])
        s = int(np.random.choice(df.index[df.index != t], size=1)[0])
        df.loc[t] = df.loc[s]
    return df


def generate_parc_machines() -> pd.DataFrame:
    rows: list[dict] = []
    times = generate_timestamps("2025-07-01", "2026-04-30", N_OBS_PER_MACHINE)

    status_values = ["Actif", "En maintenance", "En alarme", "Arrêt"]
    status_probs = [0.65, 0.15, 0.12, 0.08]
    fabricants = ["Siemens", "ABB", "SKF", "NSK", "Timken"]
    criticite_vals = ["A", "B", "C"]
    criticite_probs = [0.30, 0.50, 0.20]

    for i in range(1, N_MACHINES + 1):
        mid = machine_id(i)
        mname = machine_name_for(i)
        mtype = machine_type_for(i)
        atelier = atelier_for(i)
        loc = localisation_for(atelier)
        classe = classe_iso_for(mtype)
        degraded = i >= 15

        # Base machine-level
        if degraded:
            age_jours_base = np.random.uniform(2200, 3650)
        else:
            age_jours_base = np.random.uniform(90, 2500)

        nb_capteurs_rng = {
            "Compresseur": (6, 8),
            "Pompe": (4, 6),
            "Moteur": (3, 5),
            "Ventilateur": (2, 4),
            "Réducteur": (4, 6),
        }[mtype]
        nb_capteurs_base = int(np.random.randint(nb_capteurs_rng[0], nb_capteurs_rng[1] + 1))
        fabricant = np.random.choice(fabricants)
        criticite = np.random.choice(criticite_vals, p=criticite_probs)

        inspection_base = datetime(2025, 1, 1) + timedelta(days=int(np.random.randint(0, 485)))
        prochaine_base = inspection_base + timedelta(days=int(np.random.randint(30, 366)))

        vrms = np.random.normal(6.8, 2.1, N_OBS_PER_MACHINE) if degraded else np.random.normal(2.5, 1.2, N_OBS_PER_MACHINE)
        vrms = clamp(vrms, 0.3, 12.0)

        rpm = rpm_base_for(mtype) + np.random.normal(0, 20, N_OBS_PER_MACHINE)
        puissance = clamp(np.random.normal(45, 18, N_OBS_PER_MACHINE), 5, 200)
        temp_mu = 88 if degraded else 65
        temperature = clamp(np.random.normal(temp_mu, 15 if not degraded else 12, N_OBS_PER_MACHINE), 20, 120)

        for k in range(N_OBS_PER_MACHINE):
            age_jours = max(90, age_jours_base + np.random.normal(0, 30))
            heures_cum = clamp(np.array([age_jours * 18.2 + np.random.normal(0, 100)]), 0, 80000)[0]
            rows.append(
                {
                    "machine_id": mid,
                    "machine_nom": mname,
                    "equipment_type": mtype,
                    "atelier": atelier,
                    "localisation": loc,
                    "statut_machine": np.random.choice(status_values, p=status_probs),
                    "classe_iso": classe,
                    "age_jours": round(float(age_jours), 1),
                    "age_ans": round(float(age_jours / 365.25), 1),
                    "nb_capteurs": nb_capteurs_base,
                    "v_rms_mm_s": round(float(vrms[k]), 4),
                    "zone_iso": zone_iso_from_vrms(float(vrms[k])),
                    "rpm": round(float(rpm[k]), 3),
                    "puissance_kw": round(float(puissance[k]), 4),
                    "temperature_c": round(float(temperature[k]), 4),
                    "heures_cumulees": round(float(heures_cum), 2),
                    "derniere_inspection": inspection_base.date().isoformat(),
                    "prochaine_maintenance": prochaine_base.date().isoformat(),
                    "criticite_abc": criticite,
                    "fabricant": fabricant,
                    "timestamp": times[k],
                    "asset_schema_version": "v3.0",
                }
            )

    df = pd.DataFrame(rows)

    # 5% outliers puissance_kw > 180 (20 lignes)
    idx_out = np.random.choice(df.index, size=20, replace=False)
    df.loc[idx_out, "puissance_kw"] = np.round(np.random.uniform(181, 200, size=20), 4)

    # Manquants 3% sur temperature_c et v_rms_mm_s
    n_miss = int(len(df) * 0.03)
    for col in ["temperature_c", "v_rms_mm_s"]:
        idx_m = np.random.choice(df.index, size=n_miss, replace=False)
        df.loc[idx_m, col] = np.nan

    # Recompute zone from v_rms
    df["zone_iso"] = df["v_rms_mm_s"].apply(zone_iso_from_vrms)

    # Doublons
    df = maybe_inject_duplicates(df, 10)
    df = enforce_duplicate_count(df, 10)
    return df.reset_index(drop=True)


def generate_capteurs_iot() -> pd.DataFrame:
    rows: list[dict] = []
    times_recent = pd.date_range("2026-03-01", "2026-05-05", periods=N_OBS_PER_MACHINE)
    times_old = pd.date_range("2025-12-01", "2026-02-28", periods=N_OBS_PER_MACHINE)

    sensor_types = ["Accéléromètre", "Vélocimètre", "Température", "Courant", "Pression"]
    sensor_probs = [0.35, 0.25, 0.20, 0.12, 0.08]
    positions = ["Roulement_DE", "Roulement_NDE", "Sortie_arbre", "Carter", "Phase_A", "Phase_B", "Entrée", "Sortie"]

    status_values = ["Actif", "Inactif", "Batterie faible", "En panne"]
    status_probs = [0.72, 0.10, 0.10, 0.08]

    freq_map = {
        "Accéléromètre": 10000,
        "Vélocimètre": 5000,
        "Température": 1,
        "Courant": 50,
        "Pression": 10,
    }
    threshold_map = {
        "Accéléromètre": 10.0,
        "Vélocimètre": 7.1,
        "Température": 95.0,
        "Courant": 70.0,
        "Pression": 8.0,
    }
    unit_map = {
        "Accéléromètre": "g",
        "Vélocimètre": "mm/s",
        "Température": "°C",
        "Courant": "A",
        "Pression": "bar",
    }

    for i in range(1, N_MACHINES + 1):
        mid = machine_id(i)
        mname = machine_name_for(i)

        for k in range(N_OBS_PER_MACHINE):
            stype = np.random.choice(sensor_types, p=sensor_probs)
            sstatus = np.random.choice(status_values, p=status_probs)
            freq = freq_map[stype]

            if sstatus == "Batterie faible":
                battery = int(np.random.randint(5, 20))
            elif sstatus == "En panne":
                battery = int(np.random.randint(0, 11))
            elif sstatus == "Actif":
                battery = int(np.random.randint(40, 101))
            else:
                battery = int(np.random.randint(20, 61))

            if sstatus == "En panne":
                sig = int(np.random.randint(0, 41))
            else:
                sig = int(np.random.randint(75, 101))

            if sstatus == "En panne":
                ts = times_old[k]
            else:
                ts = times_recent[k]

            calib = datetime(2025, 1, 1) + timedelta(days=int(np.random.randint(0, 366)))
            next_calib = calib + timedelta(days=int(np.random.randint(180, 366)))

            if stype == "Accéléromètre":
                measured = clamp(np.array([np.random.normal(2.5, 1.8)]), 0.1, 15)[0]
            elif stype == "Vélocimètre":
                measured = clamp(np.array([np.random.normal(3.2, 2.1)]), 0.1, 12)[0]
            elif stype == "Température":
                measured = clamp(np.array([np.random.normal(68, 18)]), 20, 120)[0]
            elif stype == "Courant":
                measured = clamp(np.array([np.random.normal(42, 12)]), 5, 80)[0]
            else:
                measured = clamp(np.array([np.random.normal(4.2, 1.1)]), 0.5, 10)[0]

            nb_24h = 0 if sstatus == "En panne" else int(min(2_000_000, freq * 86400 * np.random.uniform(0.8, 1.0)))
            threshold = threshold_map[stype]

            rows.append(
                {
                    "sensor_id": f"S{i:02d}_{int(np.random.randint(1, 6))}",
                    "linked_machine": mid,
                    "machine_name": mname,  # contains machine but no machine_id keyword
                    "sensor_type": stype,
                    "installation_position": np.random.choice(positions),
                    "sensor_status": sstatus,
                    "battery_pct": battery,
                    "signal_quality_pct": sig,
                    "acquisition_freq_hz": freq,
                    "nb_measurements_24h": nb_24h,
                    "last_measurement_ts": ts.isoformat(),
                    "calibration_date": calib.date().isoformat(),
                    "next_calibration": next_calib.date().isoformat(),
                    "sensor_firmware": f"FW_2.{int(np.random.randint(0,4))}.{int(np.random.randint(0,10))}",
                    "measured_value": round(float(measured), 4),
                    "measurement_unit": unit_map[stype],
                    "alert_threshold": threshold,
                    "in_alert": int(measured > (threshold * 0.85)),
                    "protocol_version": "MQTT_3.1",
                }
            )

    df = pd.DataFrame(rows)

    # Manquants
    idx_bat_nan = np.random.choice(df.index, size=int(len(df) * 0.04), replace=False)
    df.loc[idx_bat_nan, "battery_pct"] = np.nan
    idx_cal_nan = np.random.choice(df.index, size=int(len(df) * 0.05), replace=False)
    df.loc[idx_cal_nan, "calibration_date"] = np.nan

    # Doublons
    df = maybe_inject_duplicates(df, 8)
    df = enforce_duplicate_count(df, 8)
    return df.reset_index(drop=True)


def generate_classification_vis() -> pd.DataFrame:
    rows: list[dict] = []
    times = pd.date_range("2025-07-01", "2026-04-30", periods=N_OBS_PER_MACHINE)

    # bucket machines
    bucket_map = {}
    for i in range(1, N_MACHINES + 1):
        if 1 <= i <= 8:
            bucket_map[i] = "NORMAL"
        elif 9 <= i <= 13:
            bucket_map[i] = "ATTENTION"
        elif 14 <= i <= 17:
            bucket_map[i] = "CRITIQUE"
        else:
            bucket_map[i] = "URGENCE"

    for i in range(1, N_MACHINES + 1):
        mid = machine_id(i)
        mname = machine_name_for(i)
        mtype = machine_type_for(i)
        class_target = bucket_map[i]
        rpm_base = rpm_base_for(mtype)

        # Generate vrms with true increasing trend
        vrms_series = []
        for obs in range(N_OBS_PER_MACHINE):
            if class_target == "NORMAL":
                val = np.random.normal(2.0, 0.4) + 0.01 * obs
            elif class_target == "ATTENTION":
                val = np.random.normal(3.8, 0.7) + 0.05 * obs
            elif class_target == "CRITIQUE":
                val = np.random.normal(5.5, 0.9) + 0.08 * obs
            else:
                val = np.random.normal(8.1, 1.2) + 0.10 * obs
            vrms_series.append(float(clamp(np.array([val]), 0.1, 15.0)[0]))

        for obs in range(N_OBS_PER_MACHINE):
            vrms = vrms_series[obs]
            zone = zone_iso_from_vrms(vrms)

            if obs < 3:
                delta = 0.0
            else:
                delta = vrms_series[obs] - vrms_series[obs - 3]

            if delta < 0:
                tendance = "Baisse"
            elif delta < 0.3:
                tendance = "Stable"
            elif delta < 0.8:
                tendance = "Hausse modérée"
            else:
                tendance = "Hausse forte"

            # classe_vis from zone + trend
            if zone == "D":
                classe_vis = "URGENCE"
            elif zone == "C" and tendance == "Hausse forte":
                classe_vis = "CRITIQUE"
            elif (zone in {"B", "C"}) and tendance in {"Hausse modérée", "Hausse forte"}:
                classe_vis = "ATTENTION"
            elif zone in {"A", "B"} and tendance in {"Stable", "Baisse"}:
                classe_vis = "NORMAL"
            else:
                classe_vis = class_target

            crest = float(clamp(np.array([np.random.normal(3.5, 1.8)]), 1, 12)[0])
            kurt = float(clamp(np.array([np.random.normal(3.2, 2.0)]), 1.5, 15)[0])
            if classe_vis == "URGENCE":
                crest = float(clamp(np.array([crest * 2.0]), 1, 12)[0])
                kurt = float(clamp(np.array([kurt + 5]), 1.5, 15)[0])
            elif classe_vis == "CRITIQUE":
                crest = float(clamp(np.array([crest * 1.5]), 1, 12)[0])
                kurt = float(clamp(np.array([kurt + 2]), 1.5, 15)[0])

            if classe_vis == "NORMAL":
                fail30 = 0
            elif classe_vis == "ATTENTION":
                fail30 = int(np.random.randint(0, 2))
            elif classe_vis == "CRITIQUE":
                fail30 = int(np.random.randint(1, 4))
            else:
                fail30 = int(np.random.randint(2, 6))

            if classe_vis == "NORMAL":
                intervention = np.random.choice(["Préventive", "Aucune"], p=[0.7, 0.3])
                fault = "Aucun"
                rec = "Fonctionnement normal"
                action = "Contrôle 6 semaines"
                mcost = 0
                hidx = np.random.uniform(0.75, 1.0)
            elif classe_vis == "ATTENTION":
                intervention = np.random.choice(["Conditionnelle", "Préventive"], p=[0.6, 0.4])
                fault = np.random.choice(["Aucun", "Desalignement", "Desequilibre"], p=[0.4, 0.4, 0.2])
                rec = "Surveillance renforcée"
                action = "Contrôle 2 semaines"
                mcost = int(np.random.randint(200, 801))
                hidx = np.random.uniform(0.5, 0.75)
            elif classe_vis == "CRITIQUE":
                intervention = np.random.choice(["Corrective", "Conditionnelle"], p=[0.7, 0.3])
                fault = np.random.choice(["Defaut_roulement", "Desalignement"], p=[0.6, 0.4])
                rec = "Planifier intervention sous 30j"
                action = "Planifier arrêt"
                mcost = int(np.random.randint(800, 3001))
                hidx = np.random.uniform(0.25, 0.5)
            else:
                intervention = "Corrective"
                fault = np.random.choice(["Defaut_roulement", "Usure_engrenage"], p=[0.7, 0.3])
                rec = "ARRÊT — intervention immédiate"
                action = "Arrêt immédiat"
                mcost = int(np.random.randint(3000, 12001))
                hidx = np.random.uniform(0.05, 0.25)

            panne = int(fail30 > 0)
            repair_h = 0.0 if panne == 0 else float(clamp(np.array([np.random.normal(4.5, 2.0)]), 0.5, 24)[0])
            rpm = float(rpm_base + np.random.normal(0, 20))

            rows.append(
                {
                    "machine_id": mid,
                    "machine_nom": mname,
                    "timestamp": times[obs].isoformat(),
                    "v_rms_mm_s": round(vrms, 4),
                    "zone_iso": zone,
                    "classe_vis": classe_vis,
                    "tendance_7j": tendance,
                    "crest_factor": round(crest, 4),
                    "kurtosis_val": round(kurt, 4),
                    "failure_count_30j": fail30,
                    "intervention_type": intervention,
                    "panne_detectee": panne,
                    "fault_type": fault,
                    "recommandation": rec,
                    "action_maintenance": action,
                    "repair_duration_h": round(repair_h, 4),
                    "maintenance_cost_eur": mcost,
                    "rpm": round(rpm, 3),
                    "health_index": round(float(hidx), 4),
                    "maintenance_ticket": f"MT-{i:02d}-{obs:03d}",  # boost maintenance keywords
                    "vis_schema": "VIS_2024",
                }
            )

    df = pd.DataFrame(rows)

    # Outliers maintenance_cost_eur 6% ~= 25 lignes
    idx_out = np.random.choice(df.index, size=int(round(len(df) * 0.06)), replace=False)
    df.loc[idx_out, "maintenance_cost_eur"] = np.random.randint(12000, 25000, size=len(idx_out))

    # Missing 3% on crest_factor and repair_duration_h
    n_miss = int(len(df) * 0.03)
    for col in ["crest_factor", "repair_duration_h"]:
        idx_m = np.random.choice(df.index, size=n_miss, replace=False)
        df.loc[idx_m, col] = np.nan

    # Duplicates
    df = maybe_inject_duplicates(df, 12)
    df = enforce_duplicate_count(df, 12)
    return df.reset_index(drop=True)


def print_report(name: str, df: pd.DataFrame) -> None:
    print(f"\n{'=' * 55}")
    print(f"  {name}")
    print(f"{'=' * 55}")
    print(f"  Lignes         : {len(df)}")
    print(f"  Colonnes       : {len(df.columns)}")
    print(f"  Manquants      : {int(df.isnull().sum().sum())}")
    print(f"  Doublons       : {int(df.duplicated().sum())}")
    print(f"  Col. constantes: {[c for c in df.columns if df[c].nunique(dropna=False) == 1]}")
    if "zone_iso" in df.columns:
        print(f"  Zones ISO      : {df['zone_iso'].value_counts(dropna=False).to_dict()}")
    if "classe_vis" in df.columns:
        print(f"  Classes VIS    : {df['classe_vis'].value_counts(dropna=False).to_dict()}")
    if "sensor_status" in df.columns:
        print(f"  Statuts capteur: {df['sensor_status'].value_counts(dropna=False).to_dict()}")
    if "battery_pct" in df.columns:
        low_bat = int((pd.to_numeric(df["battery_pct"], errors="coerce") < 20).sum())
        print(f"  Batterie < 20% : {low_bat} capteurs")


if __name__ == "__main__":
    out_dir = Path(".")

    df1 = generate_parc_machines()
    df1.to_csv(out_dir / "parc_machines_dataset.csv", index=False, encoding="utf-8")
    print_report("parc_machines_dataset.csv", df1)

    df2 = generate_capteurs_iot()
    df2.to_csv(out_dir / "capteurs_iot_dataset.csv", index=False, encoding="utf-8")
    print_report("capteurs_iot_dataset.csv", df2)

    df3 = generate_classification_vis()
    df3.to_csv(out_dir / "classification_vis_dataset.csv", index=False, encoding="utf-8")
    print_report("classification_vis_dataset.csv", df3)

    print(f"\n[OK] 3 fichiers generes — total {len(df1) + len(df2) + len(df3)} lignes")
