#!/usr/bin/env python3
# generate_datasets/1_vibration_monitoring.py
# Génère 1000 lignes de mesures vibratoires horaires sur 6 machines pendant ~20 jours
# Compatible avec l'EDA agent (détection "vibration" via colonnes vrms, acceleration, rpm, bearing)

import csv
import math
import random
import os
from datetime import datetime, timedelta

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

random.seed(42)

MACHINES = [
    {"id": "P-204", "nom": "Pompe centrifuge HP",     "type": "pompe_centrifuge", "rpm_base": 2980, "zone": "A", "puissance_kw": 250, "cout_horaire": 4200},
    {"id": "C-118", "nom": "Compresseur à vis",        "type": "compresseur",      "rpm_base": 1485, "zone": "B", "puissance_kw": 500, "cout_horaire": 6800},
    {"id": "V-302", "nom": "Ventilateur tirage",       "type": "ventilateur",      "rpm_base": 980,  "zone": "A", "puissance_kw": 75,  "cout_horaire": 1800},
    {"id": "M-019", "nom": "Moteur électrique 400kW",  "type": "moteur_electrique", "rpm_base": 1490, "zone": "C", "puissance_kw": 400, "cout_horaire": 5500},
    {"id": "R-077", "nom": "Réducteur convoyeur",      "type": "reducteur",        "rpm_base": 720,  "zone": "A", "puissance_kw": 55,  "cout_horaire": 950},
    {"id": "P-311", "nom": "Pompe centrifuge BP",      "type": "pompe_centrifuge", "rpm_base": 2960, "zone": "D", "puissance_kw": 180, "cout_horaire": 3100},
]

BEARINGS = {  # roulements par machine avec paramètres de défaut
    "P-204": {"ref": "SKF 6314", "bpfo_factor": 3.57, "bpfi_factor": 5.43, "bsf_factor": 2.38, "ftf_factor": 0.397},
    "C-118": {"ref": "SKF 7314", "bpfo_factor": 3.92, "bpfi_factor": 6.08, "bsf_factor": 2.56, "ftf_factor": 0.392},
    "V-302": {"ref": "SKF 22216", "bpfo_factor": 4.18, "bpfi_factor": 5.82, "bsf_factor": 2.71, "ftf_factor": 0.418},
    "M-019": {"ref": "SKF 6320", "bpfo_factor": 3.63, "bpfi_factor": 5.37, "bsf_factor": 2.42, "ftf_factor": 0.403},
    "R-077": {"ref": "SKF 2312", "bpfo_factor": 4.42, "bpfi_factor": 5.58, "bsf_factor": 2.95, "ftf_factor": 0.442},
    "P-311": {"ref": "SKF 6312", "bpfo_factor": 3.55, "bpfi_factor": 5.45, "bsf_factor": 2.36, "ftf_factor": 0.395},
}

START_DATE = datetime(2026, 4, 14, 0, 0, 0)
TOTAL_HOURS = 480  # 20 jours de données horaires
ISO_A_LIMIT = 2.3  # mm/s
ISO_B_LIMIT = 4.5
ISO_C_LIMIT = 7.1

def iso_zone(vrms: float) -> str:
    if vrms < ISO_A_LIMIT:
        return "A"
    elif vrms < ISO_B_LIMIT:
        return "B"
    elif vrms < ISO_C_LIMIT:
        return "C"
    else:
        return "D"

def generate_drift(machine, hour):
    """Chaque machine a un profil de dégradation différent."""
    rpm_factor = machine["rpm_base"] / 2980.0
    zone = machine["zone"]
    # Base vibratoire selon zone ISO
    if zone == "A":
        base_vrms = random.gauss(1.2, 0.3)
    elif zone == "B":
        base_vrms = random.gauss(3.0, 0.4)
    elif zone == "C":
        base_vrms = random.gauss(5.2, 0.7)
    else:
        base_vrms = random.gauss(8.5, 1.2)

    # Dérive progressive (dégradation lente)
    drift = hour * 0.003 * rpm_factor
    # Ajouter des cycles de variation
    cycle = math.sin(hour / 48 * math.pi) * 0.4
    # P-311 a un défaut qui s'aggrave
    if machine["id"] == "P-311":
        drift *= 1.8
        cycle *= 1.3

    vrms = max(0.1, base_vrms + drift + cycle)
    return vrms

def generate_temperature(vrms, machine):
    base_temp = 38.0 + (machine["puissance_kw"] / 500) * 15
    temp = base_temp + vrms * 2.5 + random.gauss(0, 1.5)
    return round(temp, 1)

def generate_acceleration(vrms, machine):
    rpm = machine["rpm_base"] + random.gauss(0, 5)
    base_a = vrms * 1.8 + random.gauss(0, 0.3)
    # a-peak est environ 3x a-rms pour un signal sinusoïdal
    a_peak = base_a * 3.0 + random.gauss(0, 0.8)
    return round(base_a, 3), round(a_peak, 3), round(rpm)

def compute_bearing_faults(machine, actual_rpm, vrms):
    """Calcule les fréquences de défauts de roulement."""
    factor = actual_rpm / 60.0  # Hz = RPM / 60
    b = BEARINGS[machine["id"]]
    bpfo = round(b["bpfo_factor"] * factor, 2)
    bpfi = round(b["bpfi_factor"] * factor, 2)
    bsf  = round(b["bsf_factor"]  * factor, 2)
    ftf  = round(b["ftf_factor"]  * factor, 2)

    # Amplitude fictive de chaque défaut (proportionnelle à vrms)
    noise = 0.001 * vrms
    bpfo_amp = round(random.lognormvariate(mu=-2, sigma=vrms * 0.08), 5)
    bpfi_amp = round(random.lognormvariate(mu=-2.5, sigma=vrms * 0.07), 5)
    bsf_amp  = round(random.lognormvariate(mu=-3, sigma=vrms * 0.05), 5)

    return bpfo, bpfi, bsf, ftf, bpfo_amp, bpfi_amp, bsf_amp

def compute_advanced_indicators(vrms, a_rms):
    """Indicateurs avancés : kurtosis, crest factor, facteur-K, facteur-FD."""
    kurtosis = round(random.gauss(3.0, 0.6), 2) + vrms * 0.15
    crest_factor = round(random.gauss(3.2, 0.4), 2) + vrms * 0.12
    facteur_k = crest_factor * (vrms / 1.5)
    facteur_fd = round(random.gauss(1.8, 0.3), 2)
    return round(kurtosis, 2), round(crest_factor, 2), round(facteur_k, 2), round(facteur_fd, 2)

FIELDS = [
    "timestamp", "machine_id", "machine_nom", "machine_type",
    "v_rms_mm_s", "a_rms_g", "a_peak_g", "deplacement_pp_microns",
    "vitesse_rotation_rpm", "temperature_c", "zone_iso_calculee",
    "statut_alarme", "crest_factor", "facteur_k", "facteur_fd", "kurtosis",
    "bpfo_freq_hz", "bpfi_freq_hz", "bsf_freq_hz", "ftf_freq_hz",
    "bpfo_amplitude", "bpfi_amplitude", "bsf_amplitude",
    "puissance_kw", "cout_horaire_arret_eur", "bearing_ref",
]

rows = []

for hour in range(TOTAL_HOURS):
    ts = START_DATE + timedelta(hours=hour)
    ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")

    for machine in MACHINES:
        vrms = round(generate_drift(machine, hour), 3)
        temp = generate_temperature(vrms, machine)
        a_rms, a_peak, actual_rpm = generate_acceleration(vrms, machine)
        # Déplacement pic-à-pic en microns (approximatif)
        deplacement = round(a_peak * 196.2, 1)

        zone = iso_zone(vrms)
        if vrms >= ISO_C_LIMIT:
            statut = "danger"
        elif vrms >= ISO_B_LIMIT:
            statut = "alerte"
        else:
            statut = "normal"

        kurt, crest, fact_k, fact_fd = compute_advanced_indicators(vrms, a_rms)
        bpfo, bpfi, bsf, ftf, bpfo_amp, bpfi_amp, bsf_amp = compute_bearing_faults(machine, actual_rpm, vrms)

        rows.append([
            ts_str, machine["id"], machine["nom"], machine["type"],
            vrms, a_rms, a_peak, deplacement,
            actual_rpm, temp, zone, statut,
            crest, fact_k, fact_fd, kurt,
            bpfo, bpfi, bsf, ftf,
            bpfo_amp, bpfi_amp, bsf_amp,
            machine["puissance_kw"], machine["cout_horaire"], BEARINGS[machine["id"]]["ref"],
        ])

FILEPATH = os.path.join(OUTPUT_DIR, "vibration_monitoring.csv")
with open(FILEPATH, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(FIELDS)
    w.writerows(rows)

STATS = {}
for m in MACHINES:
    mid = m["id"]
    machine_rows = [r for r in rows if r[1] == mid]
    vrms_vals = [r[4] for r in machine_rows]
    STATS[mid] = {
        "count": len(machine_rows),
        "vrms_min": round(min(vrms_vals), 3),
        "vrms_max": round(max(vrms_vals), 3),
        "vrms_avg": round(sum(vrms_vals) / len(vrms_vals), 3),
        "alertes": sum(1 for r in machine_rows if r[11] == "alerte"),
        "dangers": sum(1 for r in machine_rows if r[11] == "danger"),
    }

print(f"Fichier genere : {FILEPATH}")
print(f"  --> {len(rows)} lignes ({TOTAL_HOURS}h x {len(MACHINES)} machines)")
print(f"  --> Colonnes : {len(FIELDS)}")
print(f"  --> Taille : {os.path.getsize(FILEPATH):,} octets")
print("\nStatistiques par machine :")
for mid, s in STATS.items():
    print(f"  {mid:6s} | VRMS min={s['vrms_min']:.2f} max={s['vrms_max']:.2f} moy={s['vrms_avg']:.2f} | Alerte={s['alertes']:3d} Danger={s['dangers']:3d}")
