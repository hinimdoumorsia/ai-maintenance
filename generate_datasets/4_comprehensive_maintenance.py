# generate_datasets/4_comprehensive_maintenance.py
# Dataset complet 600 lignes — trigger tous les graphiques EDA + vibration + KPI + pronostic

import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

np.random.seed(42)

out = "output"
os.makedirs(out, exist_ok=True)

N = 600
N_MACHINES = 8

machines = [
    ("M001", "Compresseur Atlas C-1", "Compresseur", "Broyage", "Casablanca", "II"),
    ("M002", "Pompe hydraulique P-12", "Pompe", "Pomperie", "Casablanca", "III"),
    ("M003", "Moteur electrique ME-45", "Moteur", "Convoyage", "Casablanca", "I"),
    ("M004", "Ventilateur V-08", "Ventilateur", "Ventilation", "Tanger", "II"),
    ("M005", "Reducteur R-22", "Reducteur", "Broyage", "Tanger", "III"),
    ("M006", "Compresseur C-201", "Compresseur", "Air comprime", "Casablanca", "II"),
    ("M007", "Pompe transfert PT-09", "Pompe", "Pomperie", "Tanger", "I"),
    ("M008", "Turbine T-100", "Turbine", "Ventilation", "Tanger", "III"),
]

start_date = datetime(2025, 10, 1)

rows = []
for i in range(N):
    machine_id, machine_nom, machine_type, atelier, usine, classe_iso = machines[i % N_MACHINES]

    ts = start_date + timedelta(hours=i * 2 + np.random.randint(0, 3))
    day = ts.strftime("%Y-%m-%d")
    timestamp = ts.strftime("%Y-%m-%d %H:%M:%S")

    # ---- Core vibration ----
    base_rms = {"I": 0.6, "II": 2.0, "III": 3.5}[classe_iso]
    noise = np.random.normal(0, 0.3)
    trend = (i / N) * np.random.uniform(0.5, 2.0)
    wear = 0
    if machine_id in ("M002", "M005"):
        wear = (i / N) * 4.0  # degrades over dataset
    v_rms = max(0.1, base_rms + wear + trend + noise)
    accel = v_rms * np.random.uniform(0.8, 3.2)
    crest_factor = max(1.2, 1.8 + wear * 0.3 + np.random.normal(0, 0.3))
    kurtosis_val = max(1.5, 2.5 + wear * 0.6 + np.random.normal(0, 0.5))
    rpm = np.random.normal(1480, 30) if machine_type != "Turbine" else np.random.normal(8000, 100)

    # Zone ISO
    if v_rms < 2.3:
        zone_iso = "A"
    elif v_rms < 4.5:
        zone_iso = "B"
    elif v_rms < 7.1:
        zone_iso = "C"
    else:
        zone_iso = "D"

    # ---- Health & RUL ----
    health_index = max(5, 95 - wear * 12 - np.random.normal(0, 2))
    rul = max(1, int(health_index * 1.8 - wear * 10 + np.random.randint(-15, 15)))
    degradation_score = round(max(0.01, (100 - health_index) / 100 + np.random.uniform(-0.02, 0.02)), 3)

    # ---- KPI ----
    mtbf = int(np.random.normal(450, 60))
    mttr = round(np.random.uniform(2.5, 8.0), 1)
    dispo = round(max(60, mtbf / (mtbf + mttr) * 100), 1)
    oee = round(dispo * np.random.uniform(0.75, 0.98), 1)
    trs = round(oee * np.random.uniform(0.92, 0.99), 1)
    cout_maint = np.random.randint(150, 3000)

    # ---- Temperatures & pressure ----
    temp = round(30 + wear * 3 + np.random.normal(0, 1.5), 1)
    pressure = round(2.0 + np.random.uniform(0, 3.5) + (v_rms / 2), 1)

    # ---- Faults (probabilistic) ----
    defaut_roulement = v_rms > 6.0 and kurtosis_val > 4
    desalignement = v_rms > 5.5 and kurtosis_val > 3.5 and crest_factor > 3.5
    balourd = v_rms > 4.0 and kurtosis_val < 4 and crest_factor > 3
    if defaut_roulement:
        type_defaut = "Defaut roulement"
        severite = "Elevee" if v_rms > 8 else "Moderee"
    elif desalignement:
        type_defaut = "Desalignement"
        severite = "Elevee" if v_rms > 7 else "Moderee"
    elif balourd:
        type_defaut = "Balourd"
        severite = "Moderee" if v_rms < 6 else "Elevee"
    elif v_rms < 1.5:
        type_defaut = "Aucun - Etat nominal"
        severite = "Aucune"
    else:
        type_defaut = "Aucun - Etat acceptable"
        severite = "Faible"

    # ---- Additional features ----
    courant = round(rpm / 50 + wear * 1.5 + np.random.uniform(0, 5), 1)
    nb_alertes = int(np.random.poisson(0.5 + wear * 0.3))
    nb_demarrages = np.random.randint(0, 80 + int(wear * 20))
    duree_fonctionnement_h = np.random.randint(800, 28000)
    age_machine_jours = np.random.randint(30, 4000)

    rows.append({
        "machine_id": machine_id,
        "machine_nom": machine_nom,
        "machine_type": machine_type,
        "atelier": atelier,
        "usine": usine,
        "timestamp": timestamp,
        "date": day,
        "v_rms_mm_s": round(v_rms, 2),
        "acceleration_g": round(accel, 2),
        "crest_factor": round(crest_factor, 2),
        "kurtosis": round(kurtosis_val, 2),
        "rpm": int(rpm),
        "zone_iso": zone_iso,
        "health_index": round(health_index, 1),
        "rul_days": rul,
        "degradation_score": degradation_score,
        "mtbf_heures": mtbf,
        "mttr_heures": mttr,
        "disponibilite_pct": dispo,
        "oee_pct": oee,
        "trs_pct": trs,
        "cout_maintenance_euros": cout_maint,
        "type_defaut": type_defaut,
        "severite_defaut": severite,
        "temperature_c": temp,
        "pression_bar": pressure,
        "courant_A": courant,
        "nb_alertes": nb_alertes,
        "nb_demarrages": nb_demarrages,
        "duree_fonctionnement_h": duree_fonctionnement_h,
        "age_machine_jours": age_machine_jours,
    })

df = pd.DataFrame(rows)

# ---- Introduire quelques NaN (2-5%) pour déclencher le graphique missing values ----
for col in ["temperature_c", "pression_bar", "courant_A", "mtbf_heures", "mttr_heures"]:
    nans = np.random.choice(len(df), size=int(len(df) * np.random.uniform(0.02, 0.05)), replace=False)
    df.loc[nans, col] = np.nan

# ---- Sauvegarder ----
path = os.path.join(out, "maintenance_complete.csv")
df.to_csv(path, index=False)

print(f"[COMPREHENSIVE] {path}")
print(f"  → {len(df)} lignes × {len(df.columns)} colonnes")
print(f"  → Machines: {N_MACHINES} (types: moteur, pompe, compresseur, ventilateur, réducteur, turbine)")
print(f"  → Ateliers: {df['atelier'].nunique()} | Usines: {df['usine'].nunique()}")
print(f"  → Zones ISO: A={len(df[df['zone_iso']=='A'])} B={len(df[df['zone_iso']=='B'])} C={len(df[df['zone_iso']=='C'])} D={len(df[df['zone_iso']=='D'])}")
print(f"  → Défauts: {dict(df['type_defaut'].value_counts())}")
print(f"  → NaN count: {df.isnull().sum().sum()} valeurs manquantes")
print()
print("GRAPHIQUES QUI SERONT GÉNÉRÉS PAR L'EDA :")
print("  1. missing_values.png — valeurs manquantes (NaN)")
print("  2. distributions.png — histogrammes 12 colonnes num.")
print("  3. correlation.png — heatmap corrélation Pearson")
print("  4. time_series.png — séries temporelles V-RMS/température")
print("  5. categoricals.png — variables catégorielles")
print("  6. vib_vrms_trend.png — tendance V-RMS + zones ISO colorées")
print("  7. vib_crest_kurtosis.png — scatter CF vs Kurtosis + seuils diagnostic")
print("  8. vib_zone_distribution.png — camembert zones A/B/C/D")
print("  9. vib_boxplot_par_machine.png — boxplot V-RMS par machine")
print()
print("PAGES COMPATIBLES APRÈS UPLOAD :")
print("  ✓ Vue Générale (tous onglets)")
print("  ✓ Analyse Vibratoire (4 graphiques + KPI + zones ISO)")
print("  ✓ KPIs & Performance (dispo/OEE/MTBF/MTTR + évolution)")
print("  ✓ Pronostic & DRBF (health_index + RUL + courbe dégradation)")
print("  ✓ Parc Machines (machine_id + atelier + zone ISO)")
print(f"Colonnes : {', '.join(df.columns)}")
