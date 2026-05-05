#!/usr/bin/env python3
# generate_datasets/2_maintenance_records.py
# Génère 500+ bons de travail, pannes, et interventions de maintenance
# Compatible avec l'EDA agent (détection "maintenance" via colonnes maintenance, intervention, panne, BT)

import csv
import random
import os
from datetime import datetime, timedelta

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

random.seed(43)

MACHINES = [
    {"id": "P-204", "nom": "Pompe centrifuge HP",     "atelier": "Pomperie", "criticite": "V=Vitale",   "cout_horaire": 4200},
    {"id": "C-118", "nom": "Compresseur à vis",        "atelier": "Air comprimé", "criticite": "V=Vitale", "cout_horaire": 6800},
    {"id": "V-302", "nom": "Ventilateur tirage",       "atelier": "Ventilation", "criticite": "I=Importante", "cout_horaire": 1800},
    {"id": "M-019", "nom": "Moteur électrique 400kW",  "atelier": "Broyage",   "criticite": "I=Importante", "cout_horaire": 5500},
    {"id": "R-077", "nom": "Réducteur convoyeur",      "atelier": "Convoyage", "criticite": "S=Standard", "cout_horaire": 950},
    {"id": "P-311", "nom": "Pompe centrifuge BP",      "atelier": "Pomperie", "criticite": "V=Vitale",   "cout_horaire": 3100},
    {"id": "V-401", "nom": "Ventilateur process",      "atelier": "Ventilation", "criticite": "I=Importante", "cout_horaire": 2200},
    {"id": "C-210", "nom": "Compresseur HP",           "atelier": "Air comprimé", "criticite": "V=Vitale", "cout_horaire": 7500},
]

TECHNICIENS = [
    {"id": "T-001", "nom": "Ahmed B.",       "certification": "ISO 18436 Cat III", "anciennete": 12},
    {"id": "T-002", "nom": "Fatima Z.",       "certification": "ISO 18436 Cat II",  "anciennete": 7},
    {"id": "T-003", "nom": "Youssef M.",      "certification": "ISO 18436 Cat IV", "anciennete": 15},
    {"id": "T-004", "nom": "Samira K.",       "certification": "ISO 18436 Cat I",   "anciennete": 3},
    {"id": "T-005", "nom": "Hicham R.",       "certification": "ISO 18436 Cat II",  "anciennete": 5},
    {"id": "T-006", "nom": "Karim E.",        "certification": "ISO 18436 Cat III", "anciennete": 9},
]

PIECES = [
    {"ref": "SKF 6314", "nom": "Roulement à billes 6314",   "unite": "pièce", "stock_secu": 2, "prix": 185.00},
    {"ref": "SKF 7314", "nom": "Roulement à billes 7314",   "unite": "pièce", "stock_secu": 2, "prix": 240.00},
    {"ref": "SKF 6320", "nom": "Roulement à billes 6320",   "unite": "pièce", "stock_secu": 1, "prix": 520.00},
    {"ref": "JNT-SEAL", "nom": "Joint spi 120x150x12",      "unite": "pièce", "stock_secu": 5, "prix": 32.50},
    {"ref": "CPLG-DISC", "nom": "Accouplement à disque DN80","unite": "pièce", "stock_secu": 1, "prix": 890.00},
    {"ref": "FILT-HYD",  "nom": "Filtre hydraulique 25µ",    "unite": "pièce", "stock_secu": 10,"prix": 18.75},
    {"ref": "OIL-MINER", "nom": "Huile minérale ISO VG68",   "unite": "litre", "stock_secu": 200,"prix": 4.20},
    {"ref": "BELT-8V",  "nom": "Courroie trapézoïdale 8V",  "unite": "pièce", "stock_secu": 4, "prix": 67.00},
    {"ref": "COOL-FAN", "nom": "Ventilateur de refroidissement", "unite": "pièce", "stock_secu": 2, "prix": 145.00},
    {"ref": "GASK-EXH", "nom": "Joint d'échappement DN200",  "unite": "pièce", "stock_secu": 3, "prix": 55.00},
]

DEFAUT_TYPES = [
    "balourd", "desalignement_parallele", "desalignement_angulaire",
    "jeu_mecanique", "BPFO", "BPFI", "BSF", "FTF", "GMF",
    "cavitation", "resonance", "defaut_electrique", "courroie", "autre",
]

DOWNTIME_BY_PRIORITY = {
    "basse":    (0.5, 4),
    "moyenne":  (2, 12),
    "haute":    (6, 36),
    "urgente":  (12, 72),
}

START_DATE = datetime(2025, 1, 1)
END_DATE = datetime(2026, 4, 30)
DAYS_RANGE = (END_DATE - START_DATE).days

BT_FIELDS = [
    "bt_id", "machine_id", "machine_nom", "atelier", "criticite_machine",
    "date_creation", "date_planifiee", "date_ouverture", "date_cloture",
    "type_maintenance", "priorite", "statut",
    "description_intervention", "defaut_detecte", "cause_racine",
    "technicien_id", "technicien_nom", "technicien_certification",
    "duree_estimee_h", "duree_reelle_h", "cout_main_oeuvre_eur",
    "pieces_remplacees_json", "cout_pieces_eur",
    "cout_total_eur", "arret_production_h", "pertes_production_eur",
]

def generate_bt():
    m = random.choice(MACHINES)
    is_corrective = random.random() < 0.35
    is_predictive = random.random() < 0.20 and not is_corrective
    is_conditionnel = random.random() < 0.15 and not is_corrective and not is_predictive

    if is_corrective:
        type_m = "correctif"
    elif is_predictive:
        type_m = "predictif"
    elif is_conditionnel:
        type_m = "conditionnel"
    else:
        type_m = "preventif"

    # Date de création (aléatoire dans l'intervalle)
    days_offset = random.randint(0, DAYS_RANGE - 30)
    date_creation = START_DATE + timedelta(days=days_offset)

    # Priorité
    if type_m == "correctif":
        priorite = random.choices(["haute", "urgente", "moyenne"], weights=[40, 30, 30])[0]
    elif type_m == "predictif":
        priorite = random.choices(["moyenne", "haute", "basse"], weights=[50, 30, 20])[0]
    else:
        priorite = random.choices(["basse", "moyenne", "haute"], weights=[50, 35, 15])[0]

    # Date planifiée : +2 à +14 jours après création
    delta_planif = random.randint(2, 14)
    date_planifiee = date_creation + timedelta(days=delta_planif)

    # Date ouverture (proche de date_planifiee)
    delta_ouv = random.randint(-1, 3)
    date_ouverture = date_planifiee + timedelta(days=delta_ouv)

    # Statut
    if date_ouverture > END_DATE:
        statut = random.choice(["cree", "cree", "planifie"])
        date_cloture = ""
    elif random.random() < 0.15:
        statut = "annule"
        date_cloture = date_ouverture + timedelta(hours=random.randint(0, 8))
    else:
        statut = random.choices(["termine", "termine", "termine", "en_cours"], weights=[65, 15, 10, 10])[0]
        if statut == "termine":
            downtime_range = DOWNTIME_BY_PRIORITY[priorite]
            duree_h = round(random.uniform(*downtime_range), 1)
            date_cloture = date_ouverture + timedelta(hours=duree_h)
        else:
            date_cloture = ""

    # Description
    defaut = random.choice(DEFAUT_TYPES + [""])
    descs = {
        "balourd": "Déséquilibre détecté sur induction — correction par équilibrage statique et dynamique",
        "desalignement_parallele": "Désalignement parallèle arbre-moteur >0.15mm — réalignement laser requis",
        "BPFO": "Fréquence BPFO excessive (3.57x RPM) — remplacement roulement recommandé",
        "BPFI": "Défaut bague intérieure roulement BPFI — analyse confirmée par spectre FFT",
        "cavitation": "Cavitation détectée sur roue de pompe — nettoyage et contrôle jeu interne",
        "jeu_mecanique": "Jeu mécanique excessif sur palier côté accouplement",
        "defaut_electrique": "Défaut électrique stator — déséquilibre phases (Δ>5%)",
        "courroie": "Usure courroie trapézoïdale — remplacement préventif",
    }
    desc = descs.get(defaut, f"Intervention {type_m} — {m['nom']}")

    tech = random.choice(TECHNICIENS)
    duree_estimee = random.choices([1.5, 3.0, 5.0, 8.0, 12.0, 24.0], weights=[20, 25, 20, 15, 12, 8])[0]
    duree_reelle = ""
    if statut == "termine":
        duree_reelle = round(random.uniform(duree_estimee * 0.7, duree_estimee * 1.5), 1)
        arret_h = round(duree_reelle * random.uniform(0.8, 1.2), 1)
    else:
        arret_h = 0

    cout_mo = round(duree_reelle * 45 if isinstance(duree_reelle, float) else 0, 2)
    pertess = round(arret_h * m["cout_horaire"], 2)

    # Pièces remplacées
    nb_pieces = random.choices([0, 1, 2, 3], weights=[30, 40, 20, 10])[0]
    pieces_used = []
    cout_pieces = 0
    for _ in range(nb_pieces):
        p = random.choice(PIECES)
        qte = random.choices([1, 2, 3], weights=[70, 20, 10])[0]
        pieces_used.append(f"{p['ref']}|{p['nom']}|{qte}|{p['unite']}")
        cout_pieces += p["prix"] * qte
    cout_pieces = round(cout_pieces, 2)
    cout_total = round(cout_mo + cout_pieces, 2)

    pieces_json = "[" + ",".join(f'"{x}"' for x in pieces_used) + "]"

    bt_id = f"BT-{random.randint(10000, 99999)}"
    date_create_str = date_creation.strftime("%Y-%m-%d")
    date_planif_str = date_planifiee.strftime("%Y-%m-%d")
    date_ouv_str = date_ouverture.strftime("%Y-%m-%d %H:%M")
    date_clot_str = date_cloture.strftime("%Y-%m-%d %H:%M") if isinstance(date_cloture, datetime) else str(date_cloture)

    return [
        bt_id, m["id"], m["nom"], m["atelier"], m["criticite"],
        date_create_str, date_planif_str, date_ouv_str, date_clot_str,
        type_m, priorite, statut,
        desc, defaut, defaut if defaut else "inconnue",
        tech["id"], tech["nom"], tech["certification"],
        duree_estimee, duree_reelle, cout_mo,
        pieces_json, cout_pieces,
        cout_total, arret_h, pertess,
    ]

# Générer les BT
bt_rows = [generate_bt() for _ in range(550)]

FILEPATH = os.path.join(OUTPUT_DIR, "maintenance_records.csv")
with open(FILEPATH, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(BT_FIELDS)
    w.writerows(bt_rows)

# Statistiques
stats = {"total": len(bt_rows), "par_type": {}, "par_statut": {}, "par_priorite": {}, "par_machine": {}}
for r in bt_rows:
    stats["par_type"][r[9]] = stats["par_type"].get(r[9], 0) + 1
    stats["par_statut"][r[11]] = stats["par_statut"].get(r[11], 0) + 1
    stats["par_priorite"][r[10]] = stats["par_priorite"].get(r[10], 0) + 1
    stats["par_machine"][r[1]] = stats["par_machine"].get(r[1], 0) + 1
cout_total = sum(r[22] for r in bt_rows if isinstance(r[22], (int, float)))

print(f"Fichier genere : {FILEPATH}")
print(f"  --> {len(bt_rows)} bons de travail")
print(f"  --> Taille : {os.path.getsize(FILEPATH):,} octets")
print(f"  --> Cout total maintenance : {cout_total:,.0f} EUR")
print(f"\nRepartition par type : {stats['par_type']}")
print(f"Repartition par statut : {stats['par_statut']}")
print(f"Repartition par priorite : {stats['par_priorite']}")
