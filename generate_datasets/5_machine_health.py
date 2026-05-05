#!/usr/bin/env python3
# generate_datasets/5_machine_health.py
# Génère un dataset "Asset Health Index" avec features prédictives : âge, signaux vibratoires
# dégradés, cycles restants (RUL), scores de santé. 500+ lignes.

import csv
import random
import math
import os
from datetime import datetime, timedelta

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

random.seed(46)

MACHINES_POOL = [
    {"id": "P-204", "nom": "Pompe HP",        "type": "pompe",         "install": datetime(2018, 3, 15), "mtbf_base_h": 8000,  "cost": 250000},
    {"id": "C-118", "nom": "Compresseur vis",  "type": "compresseur",   "install": datetime(2019, 8, 22), "mtbf_base_h": 10000, "cost": 480000},
    {"id": "V-302", "nom": "Ventilateur",      "type": "ventilateur",   "install": datetime(2020, 1, 10), "mtbf_base_h": 15000, "cost": 85000},
    {"id": "M-019", "nom": "Moteur 400kW",     "type": "moteur",        "install": datetime(2017, 11, 5), "mtbf_base_h": 12000, "cost": 320000},
    {"id": "R-077", "nom": "Réducteur",        "type": "reducteur",     "install": datetime(2021, 5, 18), "mtbf_base_h": 20000, "cost": 45000},
    {"id": "P-311", "nom": "Pompe BP",         "type": "pompe",         "install": datetime(2016, 7, 3),  "mtbf_base_h": 7500,  "cost": 180000},
    {"id": "V-401", "nom": "Ventilateur PR",   "type": "ventilateur",   "install": datetime(2022, 2, 14), "mtbf_base_h": 16000, "cost": 95000},
    {"id": "C-210", "nom": "Compresseur HP",   "type": "compresseur",   "install": datetime(2020, 10, 1), "mtbf_base_h": 9500,  "cost": 520000},
    {"id": "M-102", "nom": "Moteur 150kW",     "type": "moteur",        "install": datetime(2019, 4, 30), "mtbf_base_h": 14000, "cost": 110000},
    {"id": "R-300", "nom": "Réducteur 2",      "type": "reducteur",     "install": datetime(2023, 1, 20), "mtbf_base_h": 22000, "cost": 38000},
    {"id": "P-510", "nom": "Pompe dosage",     "type": "pompe",         "install": datetime(2021, 9, 12), "mtbf_base_h": 9000,  "cost": 95000},
    {"id": "V-220", "nom": "Extracteur",       "type": "ventilateur",   "install": datetime(2018, 6, 8),  "mtbf_base_h": 13000, "cost": 70000},
]

REFERENCE_DATE = datetime(2026, 4, 30)
OBSERVATIONS_PER_MACHINE = 45

def hours_since_install(machine, ref_date):
    delta = ref_date - machine["install"]
    return delta.total_seconds() / 3600

fields = [
    "machine_id", "machine_nom", "machine_type",
    "date_installation", "age_jours", "heures_operation_estimees",
    "mtbf_theorique_h", "mtbf_actuel_h",
    "derniere_panne_jours", "nb_pannes_12m",
    "v_rms_mm_s", "a_rms_g", "temperature_c", "zone_iso",
    "crest_factor", "kurtosis",
    "disponibilite_pct", "oee_pct",
    "asset_health_index", "rul_estime_jours", "rul_confiance_pct",
    "cout_remplacement_eur", "cout_horaire_arret",
    "score_degradation", "niveau_risque",
]

rows = []

for machine in MACHINES_POOL:
    age_h = hours_since_install(machine, REFERENCE_DATE)
    age_j = round(age_h / 24, 1)

    # Cycle de dégradation : la machine commence en bonne santé, puis se dégrade
    for obs_id in range(OBSERVATIONS_PER_MACHINE):
        fraction = obs_id / (OBSERVATIONS_PER_MACHINE - 1)  # 0 à 1
        # Âge progressif
        obs_age_h = age_h * (0.5 + 0.5 * fraction)  # on part à 50% du cycle puis progresse
        obs_age_j = round(obs_age_h / 24, 1)

        # MTBF actuel (décroît avec l'âge)
        mtbf_actuel = round(machine["mtbf_base_h"] * (1 - 0.5 * fraction**1.5))

        # Dernière panne et nb pannes
        derniere_panne = round(random.expovariate(1 / (obs_age_j / 2 + 30)), 1)
        nb_pannes = max(0, int(fraction * 4 + random.gauss(0, 0.5)))

        # Vibration : augmente avec la dégradation
        vrms = round(1.2 + fraction * 6.5 + random.gauss(0, 0.5), 3)
        vrms = max(0.2, vrms)
        a_rms = round(vrms * 0.45 + random.gauss(0, 0.08), 3)

        # Température : augmente
        temp = round(30 + fraction * 35 + random.gauss(0, 2), 1)

        # Zone ISO
        if vrms < 2.3:
            zone = "A"
        elif vrms < 4.5:
            zone = "B"
        elif vrms < 7.1:
            zone = "C"
        else:
            zone = "D"

        crest = round(2.5 + fraction * 2.0 + random.gauss(0, 0.2), 2)
        kurt = round(2.8 + fraction * 3.5 + random.gauss(0, 0.4), 2)

        # Disponibilité & OEE : diminuent avec la dégradation
        disp = round(98 - fraction * 10 + random.gauss(0, 1), 1)
        oee  = round(92 - fraction * 20 + random.gauss(0, 1.5), 1)
        disp = max(50, min(100, disp))
        oee  = max(40, min(100, oee))

        # Asset Health Index (0-100) : diminue
        ahi = round(95 - fraction * 45 + random.gauss(0, 5), 1)
        ahi = max(10, min(100, ahi))

        # RUL estimé en jours
        rul = round((1 - fraction) * 365 + random.gauss(0, 15), 1)
        rul_conf = round(max(30, 90 - fraction * 25 + random.gauss(0, 5)), 1)

        score_deg = round(fraction * 100, 1)

        if score_deg < 30:
            risque = "faible"
        elif score_deg < 55:
            risque = "moyen"
        elif score_deg < 75:
            risque = "eleve"
        else:
            risque = "critique"

        rows.append([
            machine["id"], machine["nom"], machine["type"],
            machine["install"].strftime("%Y-%m-%d"), obs_age_j, round(obs_age_h),
            machine["mtbf_base_h"], mtbf_actuel,
            derniere_panne, nb_pannes,
            vrms, a_rms, temp, zone,
            crest, kurt,
            disp, oee,
            ahi, rul, rul_conf,
            machine["cost"], machine["cost"] * 0.008,
            score_deg, risque,
        ])

FILEPATH = os.path.join(OUTPUT_DIR, "machine_health.csv")
with open(FILEPATH, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(fields)
    w.writerows(rows)

# Stats
ahi_vals = [r[18] for r in rows]
vrms_vals = [r[10] for r in rows]
disp_vals = [r[16] for r in rows]

print(f"Fichier genere : {FILEPATH}")
print(f"  --> {len(rows)} lignes ({len(MACHINES_POOL)} machines x {OBSERVATIONS_PER_MACHINE} observations)")
print(f"  --> Colonnes : {len(fields)}")
print(f"  --> Taille : {os.path.getsize(FILEPATH):,} octets")
print(f"\nAsset Health Index : {min(ahi_vals):.0f} - {max(ahi_vals):.0f} (moy {sum(ahi_vals)/len(ahi_vals):.1f})")
print(f"VRMS : {min(vrms_vals):.2f} - {max(vrms_vals):.2f} mm/s")
print(f"Disponibilite : {min(disp_vals):.1f}% - {max(disp_vals):.1f}%")
print(f"\nDistribution niveaux de risque :")
for r in ["faible", "moyen", "eleve", "critique"]:
    count = sum(1 for row in rows if row[24] == r)
    print(f"  {r:10s}: {count:3d} machines ({count/len(rows)*100:.0f}%)")
