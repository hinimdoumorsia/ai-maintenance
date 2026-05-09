#!/usr/bin/env python3
# generate_datasets/4_iot_sensors.py
# Génère des données multi-capteurs IoT (température, pression, courant, débit) pour 6 machines
# 700+ lignes — Compatible avec l'EDA agent (détection "machine" ou "generic")

import csv
import random
import os
from datetime import datetime, timedelta

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

random.seed(45)

MACHINES = [
    {"id": "P-204", "nom": "Pompe centrifuge HP"},
    {"id": "C-118", "nom": "Compresseur à vis"},
    {"id": "V-302", "nom": "Ventilateur tirage"},
    {"id": "M-019", "nom": "Moteur électrique 400kW"},
    {"id": "R-077", "nom": "Réducteur convoyeur"},
    {"id": "P-311", "nom": "Pompe centrifuge BP"},
]

SENSOR_INFO = [
    {"type": "accelerometre", "unite": "mm/s",   "plage": (0.5, 12),   "base": 2.8, "noise": 0.3, "drift_h": 0.002},
    {"type": "accelerometre", "unite": "g",       "plage": (0.05, 3.0), "base": 0.6, "noise": 0.08,"drift_h": 0.0004},
    {"type": "thermique",     "unite": "°C",     "plage": (25, 95),    "base": 45,  "noise": 2.0, "drift_h": 0.005},
    {"type": "sonde_proximite","unite": "microns","plage": (5, 200),    "base": 60,  "noise": 8.0, "drift_h": 0.02},
    {"type": "ultrason",      "unite": "dB",      "plage": (20, 80),    "base": 42,  "noise": 4.0, "drift_h": 0.008},
    {"type": "courant",       "unite": "A",       "plage": (10, 450),   "base": 120, "noise": 8.0, "drift_h": 0.01},
    {"type": "debit",         "unite": "m3/h",    "plage": (5, 200),    "base": 85,  "noise": 5.0, "drift_h": 0.003},
    {"type": "pression",      "unite": "bar",     "plage": (1, 15),     "base": 6.5, "noise": 0.4, "drift_h": 0.001},
]

START_DATE = datetime(2026, 4, 1, 0, 0, 0)
TOTAL_HOURS = 120  # 5 jours de données par capteur

fields = [
    "timestamp", "machine_id", "machine_nom",
    "capteur_id", "capteur_type", "grandeur", "unite",
    "valeur_mesuree", "seuil_alerte_bas", "seuil_alerte_haut",
    "statut", "batterie_pct", "qualite_signal_pct",
    "frequence_acquisition_hz", "passerelle_iot", "latence_ms",
]

rows = []

for hour in range(TOTAL_HOURS):
    day_offset = hour // 24
    hour_of_day = hour % 24
    ts = datetime(2026, 4, 14 + day_offset, hour_of_day, 0, 0) + timedelta(minutes=random.randint(0, 59))

    for machine in MACHINES:
        for i, sensor in enumerate(SENSOR_INFO):
            ts_micro = ts + timedelta(seconds=random.randint(0, 59))
            ts_str = ts_micro.strftime("%Y-%m-%d %H:%M:%S")

            capteur_id = f"{machine['id']}-SEN-{i+1:02d}"

            # Calcul de la valeur avec bruit + dérive
            m_idx = MACHINES.index(machine)
            machine_factor = 0.6 + m_idx * 0.14  # chaque machine a un offset
            drift = hour * sensor["drift_h"] * machine_factor
            val = sensor["base"] * machine_factor + drift + random.gauss(0, sensor["noise"])
            val = round(val, 4)

            seuil_haut = sensor["base"] * machine_factor * 2.0 + drift * 2
            seuil_bas  = sensor["base"] * machine_factor * 0.15
            seuil_haut = round(seuil_haut, 2)
            seuil_bas  = round(seuil_bas, 2)

            if val > seuil_haut:
                statut = "alerte"
            elif val < seuil_bas:
                statut = "hors_plage"
            else:
                statut = "normal"

            batterie = round(max(10, 100 - hour * random.uniform(0.05, 0.15)), 1)
            qualite = round(random.gauss(97, 2), 1)

            freq_acq = random.choice([128, 256, 512, 1000, 2000, 5000])
            passerelle = random.choice(["GW-MQTT-01", "GW-OPCUA-02", "GW-Modbus-03"])
            latence = round(random.gauss(1.2, 0.4), 1)

            rows.append([
                ts_str, machine["id"], machine["nom"],
                capteur_id, sensor["type"], sensor["type"], sensor["unite"],
                val, seuil_bas, seuil_haut, statut,
                batterie, qualite,
                freq_acq, passerelle, latence,
            ])

FILEPATH = os.path.join(OUTPUT_DIR, "iot_sensors.csv")
with open(FILEPATH, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(fields)
    w.writerows(rows)

# Statistiques
alertes = sum(1 for r in rows if r[10] == "alerte")
hors_plage = sum(1 for r in rows if r[10] == "hors_plage")
normaux = sum(1 for r in rows if r[10] == "normal")

print(f"Fichier genere : {FILEPATH}")
print(f"  --> {len(rows)} lignes ({TOTAL_HOURS}h x {len(MACHINES)} machines x {len(SENSOR_INFO)} capteurs)")
print(f"  --> Colonnes : {len(fields)}")
print(f"  --> Taille : {os.path.getsize(FILEPATH):,} octets")
print(f"\nStatuts : {normaux} normal | {alertes} alerte | {hors_plage} hors_plage")
print(f"Taux d'anomalies : {round((alertes + hors_plage) / len(rows) * 100, 1)}%")
