#!/usr/bin/env python3
"""
generate_data.py — Générateur de données de démonstration complètes
pour alimenter le dashboard AI Maintenance.

Usage :
    cd generate_datasets
    python generate_data.py

Sorties dans output/ :
    ai_maintenance_demo.db                   → copier vers backend/backend_data/db/ai_maintenance.db
    datasets/vibration_P204_BPFI.csv         → upload dans Données > Chargement
    datasets/vibration_C118_desalignement.csv
    datasets/vibration_parc_complet.csv
    datasets/kpi_annuel.csv
    datasets/parc_machines.csv
"""

import sys
import sqlite3
import csv
import math
import random
import shutil
from datetime import datetime, timedelta
from pathlib import Path

# Force UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

random.seed(42)

# ── Chemins ──────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).parent
OUTPUT_DIR  = SCRIPT_DIR / "output"
DATASETS_DIR = OUTPUT_DIR / "datasets"
SCHEMA_PATH = SCRIPT_DIR.parent / "backend" / "backend_data" / "db" / "schema.sql"
DB_PATH     = OUTPUT_DIR / "ai_maintenance_demo.db"

# ── Constantes métier ─────────────────────────────────────────────────────────
NOW = datetime.now()

def dt(offset_days=0, offset_hours=0) -> str:
    return (NOW + timedelta(days=offset_days, hours=offset_hours)).strftime('%Y-%m-%d %H:%M:%S')

def d(offset_days=0) -> str:
    return (NOW + timedelta(days=offset_days)).strftime('%Y-%m-%d')

def vrms_zone(v: float) -> tuple[str, str]:
    if v < 2.3:  return 'A', 'normal'
    if v < 4.5:  return 'B', 'normal'
    if v < 7.1:  return 'C', 'alerte'
    return 'D', 'danger'

def gauss(mu=0, sigma=0.1):
    return random.gauss(mu, sigma)


# ════════════════════════════════════════════════════════════════════════════
# 1. Création de la base depuis schema.sql
# ════════════════════════════════════════════════════════════════════════════
def create_db() -> sqlite3.Connection:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    DATASETS_DIR.mkdir(parents=True, exist_ok=True)

    if DB_PATH.exists():
        DB_PATH.unlink()

    print("▶  Création de la base depuis schema.sql...")
    if not SCHEMA_PATH.exists():
        raise FileNotFoundError(f"schema.sql introuvable : {SCHEMA_PATH}")

    schema_sql = SCHEMA_PATH.read_text(encoding='utf-8')

    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(schema_sql)
    conn.commit()
    print("   ✓ Schema + données de base du schema.sql injectées")
    return conn


# ════════════════════════════════════════════════════════════════════════════
# 2. Capteurs manquants (machines 9 et 12 sans capteur dans le schema)
# ════════════════════════════════════════════════════════════════════════════
def add_missing_capteurs(conn: sqlite3.Connection):
    print("▶  Ajout capteurs manquants (P-318, C-501)...")
    capteurs = [
        # (id_machine, code_capteur, type, marque, modele, position, direction, bat, statut)
        (9,  'A-016', 'accelerometre', 'SKF',    'CMSS 2200', 'Palier pompe',        'radiale_horizontale', 90, 'actif'),
        (12, 'A-017', 'accelerometre', 'Kistler', '8640A5',   'Palier compresseur', 'radiale_horizontale', 88, 'actif'),
    ]
    for c in capteurs:
        conn.execute("""
            INSERT OR IGNORE INTO capteur
            (id_machine, code_capteur, type_capteur, marque, modele, position_montage,
             direction_mesure, gamme_freq_min_hz, gamme_freq_max_hz, unite_mesure,
             date_installation, date_derniere_calibration, niveau_batterie_pct, statut)
            VALUES (?,?,?,?,?,?,?,2,10000,'m/s²',?,?,?,?)
        """, (c[0], c[1], c[2], c[3], c[4], c[5], c[6],
              dt(-365), dt(-180), c[7], c[8]))
    conn.commit()
    print("   ✓ Capteurs A-016, A-017 ajoutés")


# ════════════════════════════════════════════════════════════════════════════
# 3. Mesures vibratoires pour les machines 3-12 (30 jours horaires)
# ════════════════════════════════════════════════════════════════════════════
def add_mesures_machines(conn: sqlite3.Connection):
    """
    Le schema.sql génère déjà 90 jours pour P-204 (cap 1, mach 1)
    et C-118 (cap 4, mach 2).
    On complète les 10 autres machines sur 30 jours.
    """
    print("▶  Ajout mesures vibratoires 30 j pour machines 3-12...")

    # (capteur_id, machine_id, vrms_j0, vrms_j30, rpm, profil)
    # profil : 'stable' | 'croissant' | 'cyclic'
    configs = [
        # Machine 3  P-156   cavitation en observation
        (13, 3,  2.8, 3.5, 1450, 'croissant'),
        # Machine 4  V-302   balourd zone C stable
        (9,  4,  5.0, 5.8, 1480, 'stable'),
        # Machine 5  M-019   défaut électrique zone C
        (11, 5,  4.2, 4.9, 1480, 'cyclic'),
        # Machine 6  P-211   nominal zone A
        (15, 6,  0.9, 1.1, 2900, 'stable'),
        # Machine 7  R-077   GMF zone C → D
        (7,  7,  4.5, 7.2, 750,  'croissant'),
        # Machine 8  C-201   zone A/B nominal
        (16, 8,  1.4, 2.1, 2980, 'croissant'),
        # Machine 9  P-318   nominal
        (19, 9,  1.1, 1.4, 1450, 'stable'),
        # Machine 10 C-104   désalignement naissant
        (17, 10, 2.8, 4.5, 2980, 'croissant'),
        # Machine 11 P-101   nominal
        (18, 11, 1.0, 1.3, 1480, 'stable'),
        # Machine 12 C-501   nominal Tanger
        (20, 12, 1.3, 1.8, 2980, 'cyclic'),
    ]

    rows = []
    N = 30 * 24  # heures

    for cap_id, mach_id, v0, v30, rpm_nom, profil in configs:
        # Vérifie que le capteur existe
        exists = conn.execute("SELECT 1 FROM capteur WHERE id_capteur=?", (cap_id,)).fetchone()
        if not exists:
            continue

        for h in range(N):
            ts = NOW - timedelta(hours=(N - 1 - h))
            progress = h / (N - 1)  # 0 = oldest → 1 = newest

            if profil == 'stable':
                vrms = v0 + gauss(0, 0.08)
            elif profil == 'croissant':
                vrms = v0 + (v30 - v0) * progress + gauss(0, 0.10)
            else:  # cyclic
                vrms = v0 + (v30 - v0) * 0.5 * (1 + math.sin(progress * 4 * math.pi)) + gauss(0, 0.07)

            vrms = max(0.2, vrms)
            a_rms  = vrms * 0.11 + gauss(0, 0.008)
            a_peak = a_rms * (3.2 + gauss(0, 0.25))
            cf     = round(a_peak / a_rms, 3) if a_rms > 0 else 3.2
            kurt   = max(1.0, 3.0 + (cf - 3.2) * 0.7 + gauss(0, 0.15))
            temp   = 48.0 + vrms * 1.8 + gauss(0, 0.8)
            rpm    = rpm_nom + gauss(0, 2)
            zone, statut = vrms_zone(vrms)

            rows.append((
                cap_id, mach_id,
                ts.strftime('%Y-%m-%d %H:%M:%S'),
                round(vrms, 3), round(a_rms, 4), round(a_peak, 4),
                cf, round(kurt, 3), round(temp, 1), round(rpm, 1),
                zone, statut,
            ))

    conn.executemany("""
        INSERT INTO mesure_globale
        (id_capteur, id_machine, timestamp_mesure,
         v_rms_mm_s, a_rms_g, a_peak_g, crest_factor, kurtosis,
         temperature_c, vitesse_rotation_rpm, zone_iso_calculee, statut_alarme)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """, rows)
    conn.commit()
    print(f"   ✓ {len(rows):,} mesures vibratoires ajoutées")


# ════════════════════════════════════════════════════════════════════════════
# 4. KPI journaliers PAR MACHINE (30 jours)
# ════════════════════════════════════════════════════════════════════════════
def add_kpi_par_machine(conn: sqlite3.Connection):
    print("▶  Ajout KPIs journaliers par machine (30 j)...")

    # Profils : (dispo_base, oee_base, mtbf_base, mttr_base, nb_alertes_base)
    PROFILES = {
        1:  (90.5, 80.0, 340, 4.2, 3),   # P-204  dégradé BPFI
        2:  (86.0, 76.0, 290, 5.8, 4),   # C-118  critique
        3:  (94.0, 84.0, 410, 3.1, 1),   # P-156
        4:  (91.0, 81.5, 370, 3.7, 2),   # V-302
        5:  (92.0, 82.0, 380, 3.5, 2),   # M-019
        6:  (98.0, 90.0, 510, 2.0, 0),   # P-211  bon
        7:  (90.0, 79.5, 355, 4.0, 2),   # R-077
        8:  (97.0, 88.0, 490, 2.3, 1),   # C-201
        9:  (97.5, 88.5, 500, 2.1, 0),   # P-318
        10: (93.0, 83.0, 400, 3.4, 2),   # C-104
        11: (98.5, 91.0, 520, 1.8, 0),   # P-101
        12: (96.0, 87.0, 470, 2.5, 1),   # C-501
    }

    rows = []
    machines = conn.execute("SELECT id_machine, id_atelier FROM machine").fetchall()

    for mach_id, atelier_id in machines:
        dispo, oee, mtbf, mttr, n_al = PROFILES.get(mach_id, (96.0, 86.0, 450, 2.8, 1))
        for day in range(30):
            date_kpi = (NOW - timedelta(days=day)).strftime('%Y-%m-%d')
            rows.append((
                date_kpi, mach_id, atelier_id, None,
                round(mtbf + gauss(0, 18), 1),
                round(max(0.5, mttr + gauss(0, 0.35)), 2),
                round(min(99.9, dispo + gauss(0, 1.2)), 1),
                round(min(99.0, oee   + gauss(0, 0.9)), 1),
                round(min(99.5, oee + 2 + gauss(0, 0.5)), 1),
                round(99.0 + gauss(0, 0.15), 2),
                max(0, n_al + (1 if random.random() < 0.15 else 0)),
                1 if random.random() < 0.02 else 0,
                1 if random.random() < 0.10 else 0,
                round(3200 + gauss(0, 450), 0),
                round(7500 + gauss(0, 1800), 0),
                round(2.4 + gauss(0, 0.4), 3),
                round(80.0 + gauss(0, 3.5), 1),
            ))

    conn.executemany("""
        INSERT INTO kpi_journalier
        (date_kpi, id_machine, id_atelier, id_usine,
         mtbf_heures, mttr_heures, disponibilite_pct, trs_oee_pct,
         performance_pct, qualite_pct, nb_alertes, nb_pannes, nb_pannes_evitees,
         cout_maintenance_jour, economies_predictif, vrms_moyen, asset_health_index)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, rows)
    conn.commit()
    print(f"   ✓ {len(rows):,} entrées KPI par machine")


# ════════════════════════════════════════════════════════════════════════════
# 5. Alertes supplémentaires (pour remplir les 24h du widget alertes)
# ════════════════════════════════════════════════════════════════════════════
def add_alertes(conn: sqlite3.Connection):
    print("▶  Ajout alertes complémentaires (24h)...")
    alertes = [
        # (id_machine, id_capteur, niveau, type, titre, message, statut, offset_h)
        (7,  7,  'alerte',   'vibratoire', 'ZONE C — R-077 GMF détecté',          'Bandes latérales 3× fr confirmées. Inspection engrenages planifiée.', 'vue',     -3),
        (4,  9,  'alerte',   'vibratoire', 'ZONE C — V-302 balourd persistant',    '1×fr = 5.8 mm/s. Rééquilibrage BT-2026-0044 confirmé.', 'vue',                    -5),
        (10, 17, 'alerte',   'vibratoire', 'ZONE B→C — C-104 désalignement naiss.','V_RMS franchit 4.5 mm/s. Alignement laser planifié.', 'nouvelle',               -1),
        (5,  11, 'info',     'capteur',    'Batterie faible — A-009',              'Niveau 55 %. Remplacement requis sous 30 jours.', 'nouvelle',                      -0.5),
        (8,  16, 'info',     'vibratoire', 'C-201 nominal',                        'V_RMS = 2.1 mm/s — zone B. Surveillance standard.', 'fermee',                     -18),
        (3,  13, 'info',     'vibratoire', 'P-156 cavitation — surveillance',      'Transitoires HF niveau 2. Vérifier hauteur bague aspiration.', 'vue',             -7),
        (12, 20, 'info',     'capteur',    'C-501 Tanger — mesure manuelle',       'Mesure hebdo capteur. V_RMS 1.7 mm/s — zone A.', 'fermee',                        -20),
    ]
    for a in alertes:
        conn.execute("""
            INSERT INTO alerte (id_machine, id_capteur, timestamp_alerte,
                niveau, type_alerte, titre, message, statut)
            VALUES (?,?,?,?,?,?,?,?)
        """, (a[0], a[1], dt(offset_hours=a[7]), a[2], a[3], a[4], a[5], a[6]))
    conn.commit()
    print(f"   ✓ {len(alertes)} alertes supplémentaires")


# ════════════════════════════════════════════════════════════════════════════
# 6. Interventions techniciens (lier BTs existants)
# ════════════════════════════════════════════════════════════════════════════
def add_interventions(conn: sqlite3.Connection):
    print("▶  Ajout interventions techniciens...")
    bts = conn.execute("SELECT id_bt, technicien_principal_id FROM bon_de_travail WHERE statut != 'annule'").fetchall()
    rows = []
    for bt_id, tech_id in bts:
        if not tech_id:
            continue
        debut = dt(-random.randint(1, 5))
        fin   = dt(-random.randint(0, 0), offset_hours=random.randint(2, 6))
        rows.append((bt_id, tech_id, debut, fin, random.randint(120, 480)))
    conn.executemany("""
        INSERT OR IGNORE INTO intervention_technicien
        (id_bt, id_utilisateur, date_debut, date_fin, temps_clef_en_main_minutes)
        VALUES (?,?,?,?,?)
    """, rows)
    conn.commit()
    print(f"   ✓ {len(rows)} interventions")


# ════════════════════════════════════════════════════════════════════════════
# 7. Génération des CSV pour la page Données > Chargement
# ════════════════════════════════════════════════════════════════════════════

def csv_write(path: Path, headers: list, rows: list):
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(headers)
        w.writerows(rows)
    print(f"   ✓ {path.name}  ({len(rows):,} lignes)")


def gen_csv_vibration_bpfi():
    """
    P-204 — Défaut BPFI stade 3 en progression.
    Colonnes : timestamp, machine_id, capteur_id, bearing_ref,
               v_rms_mm_s, a_rms_g, a_peak_g, crest_factor, kurtosis,
               bpfi_freq_hz, bpfo_freq_hz, bsf_freq_hz, ftf_freq_hz,
               temperature_c, vitesse_rotation_rpm, zone_iso_calculee
    """
    # SKF 6309 : Nb=9, d=7.938, D=38.5, alpha=0
    Nb, d_b, D_b, alpha = 9, 7.938, 38.5, 0.0
    headers = [
        'timestamp', 'machine_id', 'capteur_id', 'bearing_ref',
        'v_rms_mm_s', 'a_rms_g', 'a_peak_g', 'crest_factor', 'kurtosis',
        'bpfi_freq_hz', 'bpfo_freq_hz', 'bsf_freq_hz', 'ftf_freq_hz',
        'temperature_c', 'vitesse_rotation_rpm', 'zone_iso_calculee',
    ]
    rows = []
    N = 720  # 30 jours × 24 mesures/j
    for i in range(N):
        ts  = NOW - timedelta(hours=(N - 1 - i))
        prog = i / (N - 1)
        rpm  = 1480 + gauss(0, 2)
        fr   = rpm / 60
        ratio = (d_b / D_b) * math.cos(math.radians(alpha))
        bpfi  = round((Nb / 2) * fr * (1 + ratio), 3)
        bpfo  = round((Nb / 2) * fr * (1 - ratio), 3)
        bsf   = round((D_b / (2 * d_b)) * fr * (1 - ratio**2), 3)
        ftf   = round((fr / 2) * (1 - ratio), 3)

        vrms  = 1.8 + 8.0 * prog + gauss(0, 0.12)
        vrms  = max(0.3, vrms)
        a_rms = 0.30 + 2.2 * prog + gauss(0, 0.02)
        a_pk  = a_rms * (3.0 + 4.5 * prog + gauss(0, 0.3))
        cf    = round(a_pk / a_rms, 3) if a_rms > 0 else 3.0
        kurt  = max(1.0, 3.0 + 5.0 * prog + gauss(0, 0.4))
        temp  = 52 + 12 * prog + gauss(0, 0.8)
        zone, _ = vrms_zone(vrms)

        rows.append([
            ts.strftime('%Y-%m-%d %H:%M:%S'), 'P-204', 'A-001', 'SKF 6309',
            round(vrms, 3), round(a_rms, 4), round(a_pk, 4), cf, round(kurt, 3),
            bpfi, bpfo, bsf, ftf,
            round(temp, 1), round(rpm, 1), zone,
        ])

    csv_write(DATASETS_DIR / 'vibration_P204_BPFI.csv', headers, rows)


def gen_csv_vibration_desalign():
    """
    C-118 — Désalignement parallèle sévère.
    Signatures : 2×fr dominant, harmoniques 1× 2× 3×.
    """
    headers = [
        'timestamp', 'machine_id', 'capteur_id',
        'v_rms_mm_s', 'a_rms_g', 'a_peak_g', 'crest_factor', 'kurtosis',
        'temperature_c', 'vitesse_rotation_rpm', 'zone_iso_calculee',
        'freq_1x_mm_s', 'freq_2x_mm_s', 'freq_3x_mm_s',
    ]
    rows = []
    N = 720
    for i in range(N):
        ts   = NOW - timedelta(hours=(N - 1 - i))
        prog = i / (N - 1)
        rpm  = 2980 + gauss(0, 3)
        fr   = rpm / 60

        vrms = 2.1 + 9.3 * prog + gauss(0, 0.15)
        vrms = max(0.5, vrms)
        a_rms = 0.4 + 3.1 * prog + gauss(0, 0.025)
        a_pk  = a_rms * (2.8 + gauss(0, 0.2))
        cf    = round(a_pk / a_rms, 3) if a_rms > 0 else 2.8
        kurt  = max(1.0, 3.2 + 2.8 * prog + gauss(0, 0.25))
        temp  = 58 + 15 * prog + gauss(0, 1.0)
        zone, _ = vrms_zone(vrms)

        # Composantes harmoniques : 2×fr dominant en désalignement
        f1 = round(vrms * 0.25 + gauss(0, 0.05), 3)
        f2 = round(vrms * 0.55 + gauss(0, 0.08), 3)  # dominant
        f3 = round(vrms * 0.20 + gauss(0, 0.04), 3)

        rows.append([
            ts.strftime('%Y-%m-%d %H:%M:%S'), 'C-118', 'A-003',
            round(vrms, 3), round(a_rms, 4), round(a_pk, 4), cf, round(kurt, 3),
            round(temp, 1), round(rpm, 1), zone,
            f1, f2, f3,
        ])

    csv_write(DATASETS_DIR / 'vibration_C118_desalignement.csv', headers, rows)


def gen_csv_vibration_parc():
    """
    Snapshot dernière mesure de tout le parc machines (format large).
    Compatible AnalyseVibratoire — une ligne par machine.
    """
    headers = [
        'machine_id', 'nom_machine', 'type_machine', 'atelier',
        'vitesse_rotation_rpm', 'puissance_kw',
        'v_rms_mm_s', 'a_rms_g', 'a_peak_g', 'crest_factor', 'kurtosis',
        'temperature_c', 'zone_iso_calculee', 'drbf_jours',
        'bearing_ref', 'bpfi_freq_hz', 'bpfo_freq_hz',
    ]
    # (code, nom, type, atelier, rpm, kw, vrms, drbf, bearing)
    machines = [
        ('P-204','Pompe alimentation broyeur A','pompe_centrifuge','Atelier A', 1480,37,  9.8, 4,  'SKF 6309'),
        ('C-118','Compresseur air procédé A',   'compresseur',    'Atelier A', 2980,75,  11.4,0,  'FAG NU 319'),
        ('P-156','Pompe recyclage A',           'pompe_centrifuge','Atelier A',1450,22,  3.4, 120,''),
        ('V-302','Ventilateur aspiration',      'ventilateur',    'Atelier A', 1480,55,  5.8, 28, 'FAG 6312'),
        ('M-019','Moteur broyeur principal',    'moteur_electrique','Atelier A',1480,110, 4.9, 60, ''),
        ('P-211','Pompe lubrification B',       'pompe_centrifuge','Atelier B', 2900,5.5, 1.1, 999,''),
        ('R-077','Réducteur convoyeur B',       'reducteur',      'Atelier B', 750, 30,  7.2, 35, 'SKF 22220'),
        ('C-201','Compresseur extraction huile','compresseur',    'Atelier C', 2980,55,  2.1, 999,''),
        ('P-318','Pompe transfert huile brute', 'pompe_centrifuge','Atelier C', 1450,15,  1.4, 999,''),
        ('C-104','Compresseur central utilités','compresseur',    'Utilités',  2980,110, 4.5, 45, ''),
        ('P-101','Pompe eau glacée',            'pompe_centrifuge','Utilités',  1480,18.5,1.3, 999,''),
        ('C-501','Compresseur Tanger',          'compresseur',    'Tanger',    2980,55,  1.8, 999,''),
    ]
    BEARING = {
        'SKF 6309':  (9, 7.938,  38.5,  0.0),
        'FAG NU 319':(9, 14.0,   72.0,  0.0),
        'FAG 6312':  (8, 12.0,   60.0,  0.0),
        'SKF 22220': (14,20.0,  100.0,  15.0),
    }
    rows = []
    for code, nom, typ, atelier, rpm, kw, vrms, drbf, bref in machines:
        a_rms = vrms * 0.11
        a_pk  = a_rms * (3.2 + gauss(0, 0.2))
        cf    = round(a_pk / a_rms, 3) if a_rms > 0 else 3.2
        kurt  = max(1.0, 3.0 + (cf - 3.2) * 0.7)
        temp  = 48 + vrms * 1.8
        zone, _ = vrms_zone(vrms)
        bpfi_hz = ''
        bpfo_hz = ''
        if bref and bref in BEARING:
            Nb, d_b, D_b, alpha = BEARING[bref]
            fr = rpm / 60
            ratio = (d_b / D_b) * math.cos(math.radians(alpha))
            bpfi_hz = round((Nb / 2) * fr * (1 + ratio), 2)
            bpfo_hz = round((Nb / 2) * fr * (1 - ratio), 2)
        drbf_val = '' if drbf == 999 else drbf
        rows.append([
            code, nom, typ, atelier, rpm, kw,
            round(vrms, 2), round(a_rms, 3), round(a_pk, 3), cf, round(kurt, 2),
            round(temp, 1), zone, drbf_val, bref, bpfi_hz, bpfo_hz,
        ])

    csv_write(DATASETS_DIR / 'vibration_parc_complet.csv', headers, rows)


def gen_csv_kpi_annuel():
    """
    Série KPI journaliers 365 jours — global usine.
    Compatible KPIsPage et PronosticPage.
    """
    headers = [
        'date', 'disponibilite_pct', 'oee_pct', 'mtbf_heures', 'mttr_heures',
        'nb_alertes', 'nb_pannes', 'nb_pannes_evitees',
        'cout_maintenance_eur', 'economies_eur',
        'vrms_moyen_mm_s', 'asset_health_index',
    ]
    rows = []
    for d_ago in range(365, -1, -1):
        date = (NOW - timedelta(days=d_ago)).strftime('%Y-%m-%d')
        # Tendance légère amélioration sur l'année
        trend = d_ago / 365  # 1 = il y a 1 an, 0 = aujourd'hui
        dispo = round(min(99.9, 93.0 + (1 - trend) * 3 + gauss(0, 1.2)), 1)
        oee   = round(min(99.0, 83.0 + (1 - trend) * 4 + gauss(0, 0.9)), 1)
        mtbf  = round(380 + (1 - trend) * 60 + gauss(0, 25), 0)
        mttr  = round(max(0.5, 4.2 - (1 - trend) * 1.5 + gauss(0, 0.4)), 2)
        nb_al = max(0, int(5 + gauss(0, 2)))
        nb_pa = 1 if random.random() < 0.015 else 0
        nb_pe = 1 if random.random() < 0.08  else 0
        cout  = round(4800 + gauss(0, 600), 0)
        eco   = round(max(0, 11000 + gauss(0, 3000)), 0)
        vrms  = round(3.2 - (1 - trend) * 0.8 + gauss(0, 0.3), 2)
        ahi   = round(min(100, 76 + (1 - trend) * 8 + gauss(0, 3)), 1)
        rows.append([date, dispo, oee, mtbf, mttr, nb_al, nb_pa, nb_pe, cout, eco, vrms, ahi])

    csv_write(DATASETS_DIR / 'kpi_annuel.csv', headers, rows)


def gen_csv_parc_machines():
    """
    Catalogue parc machines avec états — compatible DonneesParc & ClassificationVIS.
    """
    headers = [
        'code_machine', 'nom_machine', 'type_machine', 'atelier', 'usine',
        'fabricant', 'puissance_kw', 'vitesse_rotation_rpm', 'annee_mise_en_service',
        'statut', 'categorie_vis',
        'vrms_derniere', 'zone_iso', 'drbf_jours',
        'mtbf_30j', 'disponibilite_30j',
        'cout_arret_horaire', 'valeur_remplacement',
        'nb_capteurs', 'nb_defauts_actifs',
    ]
    machines = [
        ('P-204','Pompe alimentation broyeur A','pompe_centrifuge','Atelier A','Casablanca','Grundfos',  37.0, 1480,2018,'en_service','V', 9.8, 'D',4,   340,90.5,1800,28000,3,1),
        ('C-118','Compresseur air procédé A',   'compresseur',    'Atelier A','Casablanca','Atlas Copco',75.0,2980,2019,'en_service','V', 11.4,'D',0,   290,86.0,2400,95000,3,1),
        ('P-156','Pompe recyclage A',           'pompe_centrifuge','Atelier A','Casablanca','KSB',       22.0,1450,2020,'en_service','I', 3.4, 'B',120, 410,94.0,900, 18000,2,1),
        ('V-302','Ventilateur aspiration',      'ventilateur',    'Atelier A','Casablanca','ABB',        55.0,1480,2017,'en_service','I', 5.8, 'C',28,  370,91.0,1200,42000,2,1),
        ('M-019','Moteur broyeur principal',    'moteur_electrique','Atelier A','Casablanca','Siemens', 110.0,1480,2016,'en_service','I', 4.9, 'C',60,  380,92.0,2200,85000,2,1),
        ('P-211','Pompe lubrification B',       'pompe_centrifuge','Atelier B','Casablanca','Grundfos',   5.5,2900,2021,'en_service','S', 1.1, 'A',999, 510,98.0,600, 8000, 1,0),
        ('R-077','Réducteur convoyeur B',       'reducteur',      'Atelier B','Casablanca','Siemens',    30.0,750, 2015,'en_service','I', 7.2, 'C',35,  355,90.0,800, 35000,2,1),
        ('C-201','Compresseur extraction huile','compresseur',    'Atelier C','Casablanca','Atlas Copco',55.0,2980,2019,'en_service','V', 2.1, 'A',999, 490,97.0,2000,72000,1,0),
        ('P-318','Pompe transfert huile brute', 'pompe_centrifuge','Atelier C','Casablanca','KSB',       15.0,1450,2020,'en_service','S', 1.4, 'A',999, 500,97.5,700, 14000,1,0),
        ('C-104','Compresseur central utilités','compresseur',    'Utilités', 'Casablanca','Atlas Copco',110.0,2980,2017,'en_service','V', 4.5, 'C',45,  400,93.0,3000,120000,1,1),
        ('P-101','Pompe eau glacée',            'pompe_centrifuge','Utilités', 'Casablanca','Grundfos',  18.5,1480,2018,'en_service','I', 1.3, 'A',999, 520,98.5,500, 15000,1,0),
        ('C-501','Compresseur Tanger',          'compresseur',    'Tanger',   'Tanger',    'Atlas Copco',55.0,2980,2020,'en_service','I', 1.8, 'A',999, 470,96.0,1500,68000,1,0),
    ]
    rows = []
    for m in machines:
        drbf = '' if m[13] == 999 else m[13]
        rows.append(list(m[:13]) + [drbf] + list(m[14:]))

    csv_write(DATASETS_DIR / 'parc_machines.csv', headers, rows)


def gen_csv_ent_dashboard():
    """
    CSV conçu pour l'upload en mode ENT (company) dans Données > Chargement.
    Colonnes nommées exactement comme _ingest_dashboard() les cherche :
      - machine_id       → mesure_globale (id_machine via int("M1".replace("M","")))
      - timestamp        → clé temporelle commune
      - v_rms_mm_s       → mesure_globale.v_rms_mm_s  (valeurs brutes mm/s)
      - crest_factor     → mesure_globale.crest_factor
      - kurtosis         → mesure_globale.facteur_k
      - temperature_c    → mesure_globale.temperature_c
      - mtbf_heures      → kpi_journalier.mtbf_heures
      - mttr_heures      → kpi_journalier.mttr_heures
      - disponibilite_pct → kpi_journalier.disponibilite_pct
      - oee_pct          → kpi_journalier.trs_oee_pct
      - defaut_type      → defaut_detecte.type_defaut (vide = pas de défaut)

    30 jours × 12 machines = 360 lignes — une mesure journalière consolidée par machine.
    Valeurs BRUTES (non scalées) pour que l'intégration dashboard soit correcte.
    """
    headers = [
        'timestamp', 'machine_id',
        'v_rms_mm_s', 'crest_factor', 'kurtosis', 'temperature_c',
        'mtbf_heures', 'mttr_heures', 'disponibilite_pct', 'oee_pct',
        'defaut_type',
    ]

    # Profils par machine (machine_id_str, vrms_j30, vrms_j0, dispo, oee, mtbf, mttr, defaut)
    # vrms_j0 = valeur il y a 30 jours (oldest), vrms_j30 = valeur aujourd'hui (newest)
    PROFILES = [
        ('M1',  1.8, 9.8,  90.5, 80.0, 340, 4.2, 'BPFI'),
        ('M2',  2.1, 11.4, 86.0, 76.0, 290, 5.8, 'desalignement_parallele'),
        ('M3',  2.5, 3.4,  94.0, 84.0, 410, 3.1, 'cavitation'),
        ('M4',  4.2, 5.8,  91.0, 81.5, 370, 3.7, 'balourd'),
        ('M5',  3.5, 4.9,  92.0, 82.0, 380, 3.5, 'defaut_electrique'),
        ('M6',  0.8, 1.1,  98.0, 90.0, 510, 2.0, ''),
        ('M7',  4.0, 7.2,  90.0, 79.5, 355, 4.0, 'GMF'),
        ('M8',  1.2, 2.1,  97.0, 88.0, 490, 2.3, ''),
        ('M9',  1.0, 1.4,  97.5, 88.5, 500, 2.1, ''),
        ('M10', 2.5, 4.5,  93.0, 83.0, 400, 3.4, 'desalignement_angulaire'),
        ('M11', 0.9, 1.3,  98.5, 91.0, 520, 1.8, ''),
        ('M12', 1.3, 1.8,  96.0, 87.0, 470, 2.5, ''),
    ]

    rows = []
    for day in range(30, -1, -1):   # de J-30 (oldest) à J0 (newest)
        ts = (NOW - timedelta(days=day)).strftime('%Y-%m-%d 08:00:00')
        progress = 1 - (day / 30)   # 0 = oldest, 1 = newest

        for mid, v0, v30, dispo, oee, mtbf, mttr, defaut in PROFILES:
            # Interpolation linéaire + légère variation quotidienne
            vrms  = v0 + (v30 - v0) * progress + gauss(0, 0.06)
            vrms  = max(0.2, round(vrms, 3))
            a_rms = vrms * 0.11
            a_pk  = a_rms * (3.2 + gauss(0, 0.15))
            cf    = round(a_pk / a_rms, 3) if a_rms > 0 else 3.2
            kurt  = max(1.5, round(3.0 + (cf - 3.2) * 0.7 + gauss(0, 0.12), 3))
            temp  = round(48 + vrms * 1.8 + gauss(0, 0.5), 1)
            dispo_v = round(min(99.9, dispo + gauss(0, 0.8)), 1)
            oee_v   = round(min(99.0, oee   + gauss(0, 0.7)), 1)
            mtbf_v  = round(max(50, mtbf + gauss(0, 15)), 0)
            mttr_v  = round(max(0.5, mttr + gauss(0, 0.25)), 2)
            # N'insère le défaut que sur les 7 derniers jours (stade actif récent)
            defaut_v = defaut if (day <= 7 and defaut) else ''

            rows.append([
                ts, mid,
                vrms, cf, kurt, temp,
                mtbf_v, mttr_v, dispo_v, oee_v,
                defaut_v,
            ])

    csv_write(DATASETS_DIR / 'ent_dashboard_complet.csv', headers, rows)


# ════════════════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════════════════
def main():
    print("=" * 62)
    print("  Générateur données AI Maintenance — Dashboard complet")
    print("=" * 62)

    # Base SQLite
    conn = create_db()
    add_missing_capteurs(conn)
    add_mesures_machines(conn)
    add_kpi_par_machine(conn)
    add_alertes(conn)
    add_interventions(conn)
    conn.close()

    print("\n▶  Génération des CSV (page Données > Chargement)...")
    gen_csv_vibration_bpfi()
    gen_csv_vibration_desalign()
    gen_csv_vibration_parc()
    gen_csv_kpi_annuel()
    gen_csv_parc_machines()
    gen_csv_ent_dashboard()

    print("\n" + "=" * 62)
    print("  ✅  Génération terminée !")
    print("=" * 62)
    print(f"\n  📁  Dossier de sortie : {OUTPUT_DIR}")
    print()
    print("  Base SQLite :")
    db_size = DB_PATH.stat().st_size / 1024 / 1024
    print(f"    ai_maintenance_demo.db  ({db_size:.1f} Mo)")
    print()
    print("  Datasets CSV (upload dans Données > Chargement) :")
    for csv_file in sorted(DATASETS_DIR.glob("*.csv")):
        n = sum(1 for _ in open(csv_file)) - 1
        print(f"    {csv_file.name:<42}  ({n:,} lignes)")
    print()
    print("  Pour utiliser la base :")
    print("    Copier output/ai_maintenance_demo.db")
    print("    → backend/backend_data/db/ai_maintenance.db")
    print("    Puis redémarrer le backend.")
    print()


if __name__ == "__main__":
    main()
