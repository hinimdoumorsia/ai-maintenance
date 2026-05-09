#!/usr/bin/env python3
# generate_datasets/3_daily_kpis.py
# Génère des KPIs journaliers (MTBF, MTTR, OEE, disponibilité, coûts) sur 18 mois
# Compatible avec l'EDA agent (détection "kpi" via colonnes oee, mtbf, mttr, disponibilite, trs)

import csv
import random
import os
from datetime import datetime, timedelta

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

random.seed(44)

START_DATE = datetime(2025, 1, 1)
END_DATE = datetime(2026, 4, 30)
DAYS = (END_DATE - START_DATE).days

ATELIERS = ["Pomperie", "Air comprimé", "Ventilation", "Broyage", "Convoyage"]
USINES = ["Casablanca", "Tanger"]

# ---------- génération déterministe + bruit ----------
rows = []

for day_offset in range(DAYS):
    d = START_DATE + timedelta(days=day_offset)
    ts = d.strftime("%Y-%m-%d")

    for atelier in ATELIERS:
        usine = "Casablanca" if atelier in ["Pomperie", "Ventilation", "Broyage"] else "Tanger"

        day_of_year = d.timetuple().tm_yday
        seasonal = 0.85 + 0.15 * abs(((day_of_year - 180) % 365) / 182.5 - 1)

        # MTBF heures — entre 300 et 600h selon atelier + saisonnalité + tendance
        base_mtbf = {
            "Pomperie": 420, "Air comprimé": 480, "Ventilation": 550,
            "Broyage": 380, "Convoyage": 510,
        }[atelier]
        trend = day_offset * 0.05  # amélioration lente
        mtbf = round(max(50, random.gauss(base_mtbf + trend, 35) * seasonal), 1)

        # MTTR heures — inverse proportionnel à MTBF
        base_mttr = base_mtbf / 80
        mttr = round(max(0.5, random.gauss(base_mttr, base_mttr * 0.3)), 1)

        # Disponibilité % = MTBF / (MTBF + MTTR)
        disponibilite = round(mtbf / (mtbf + mttr) * 100, 2)

        # TRS/OEE = Disponibilité × Performance × Qualité
        perf = round(random.gauss(93, 3), 1)
        qual = round(random.gauss(97, 1.5), 1)
        oee = round(disponibilite / 100 * perf / 100 * qual / 100 * 100, 2)
        oee = min(100, max(60, oee))

        # Nombre d'alertes
        nb_alertes = random.choices([0, 0, 0, 0, 1, 1, 1, 2, 2, 3], weights=[30, 25, 15, 10, 5, 4, 3, 3, 3, 2])[0]
        nb_pannes = max(0, min(5, random.choices([0, 0, 0, 1, 1, 2], weights=[40, 25, 15, 10, 7, 3])[0]))

        # Coût maintenance / jour
        cout_base = {"Pomperie": 2800, "Air comprimé": 3500, "Ventilation": 1200, "Broyage": 4200, "Convoyage": 900}[atelier]
        cout_maintenance = round(random.gauss(cout_base, cout_base * 0.25), 2)

        # VRMS moyen journalier (mm/s)
        vrms_base = {"Pomperie": 2.5, "Air comprimé": 3.0, "Ventilation": 1.8, "Broyage": 4.2, "Convoyage": 1.4}[atelier]
        vrms_moyen = round(random.gauss(vrms_base, 0.4), 2)

        # Asset health index (0-100)
        ahi = round(random.gauss(78 + (oee - 80) * 0.5, 8), 1)
        ahi = max(0, min(100, ahi))

        # Économies prédictives (quand des pannes sont évitées)
        nb_pannes_evitees = random.choices([0, 0, 1, 2], weights=[60, 20, 15, 5])[0]
        economies_predictif = round(nb_pannes_evitees * random.uniform(1500, 8000), 2)

        rows.append([
            ts, atelier, usine,
            mtbf, mttr, disponibilite, oee,
            round(perf, 1), round(qual, 1),
            nb_alertes, nb_pannes, nb_pannes_evitees,
            cout_maintenance, economies_predictif,
            vrms_moyen, ahi,
        ])

FIELDS = [
    "date", "atelier", "usine",
    "mtbf_heures", "mttr_heures", "disponibilite_pct", "trs_oee_pct",
    "performance_pct", "qualite_pct",
    "nb_alertes", "nb_pannes", "nb_pannes_evitees",
    "cout_maintenance_jour_eur", "economies_predictif_eur",
    "vrms_moyen_mm_s", "asset_health_index",
]

FILEPATH = os.path.join(OUTPUT_DIR, "daily_kpis.csv")
with open(FILEPATH, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(FIELDS)
    w.writerows(rows)

# Stats globales
mtbf_vals = [r[3] for r in rows]
mttr_vals = [r[4] for r in rows]
disp_vals = [r[5] for r in rows]
oee_vals  = [r[6] for r in rows]
cout_vals = [r[12] for r in rows]
eco_vals  = [r[13] for r in rows]

print(f"Fichier genere : {FILEPATH}")
print(f"  --> {len(rows)} lignes ({DAYS}j x {len(ATELIERS)} ateliers)")
print(f"  --> Taille : {os.path.getsize(FILEPATH):,} octets")
print(f"\nKPIs globaux :")
print(f"  MTBF moyen        : {sum(mtbf_vals)/len(mtbf_vals):.1f}h")
print(f"  MTTR moyen        : {sum(mttr_vals)/len(mttr_vals):.1f}h")
print(f"  Disponibilite moy.: {sum(disp_vals)/len(disp_vals):.2f}%")
print(f"  OEE/TRS moyen      : {sum(oee_vals)/len(oee_vals):.2f}%")
print(f"  Cout maintenance   : {sum(cout_vals)/len(cout_vals):.0f} EUR/j")
print(f"  Economies predict. : {sum(eco_vals):,.0f} EUR cumules")
