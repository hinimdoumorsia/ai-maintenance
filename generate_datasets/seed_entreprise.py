"""
Seed de données réalistes pour UNE entreprise (Dashboard + sous-pages Données).

Remplit machines, capteurs, mesures vibratoires, défauts, pronostics DRBF, alertes,
KPIs journaliers, économies prédictives et bons de travail — comme si c'étaient les
données réelles de l'entreprise (sans passer par un upload de dataset).

Idempotent : toutes les lignes créées sont rattachées à des machines taguées
origine_dataset='seed_demo' ; une ré-exécution supprime d'abord l'ancien seed.

Usage :
    python generate_datasets/seed_entreprise.py            # défaut : entreprise 6 (OCP)
    python generate_datasets/seed_entreprise.py 6 7 11     # ent_id usine_id atelier_id
"""
from __future__ import annotations

import random
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "backend" / "backend_data" / "db" / "ai_maintenance.db"

ENT_ID    = int(sys.argv[1]) if len(sys.argv) > 1 else 6
USINE_ID  = int(sys.argv[2]) if len(sys.argv) > 2 else 7
ATELIER_ID = int(sys.argv[3]) if len(sys.argv) > 3 else 11

random.seed(42)
NOW = datetime.now()


def zone_iso(vrms: float) -> str:
    if vrms < 1.8:  return "A"
    if vrms < 4.5:  return "B"
    if vrms < 7.1:  return "C"
    return "D"


# (code, nom, type, puissance_kw, rpm, santé)
MACHINES = [
    ("P-301",  "Pompe à boue P-301",        "pompe_centrifuge", 250, 1480, "attention"),
    ("BR-101", "Broyeur à boulets BR-101",  "broyeur",          800,  750, "critique"),
    ("CV-210", "Convoyeur CV-210",          "moteur_electrique", 90, 1500, "sain"),
    ("VE-150", "Ventilateur séchage VE-150","ventilateur",      160, 2950, "sain"),
    ("CP-401", "Compresseur air CP-401",    "compresseur",      132, 2980, "attention"),
    ("P-205",  "Pompe process P-205",       "pompe_centrifuge",  75, 2960, "sain"),
    ("CC-120", "Concasseur CC-120",         "broyeur",          400,  990, "critique"),
    ("AG-310", "Agitateur AG-310",          "agitateur",         45,  980, "sain"),
]

DEFAUTS = {
    "attention": ("BPFO", 2, 2),    # (type, gravite, stade)
    "critique":  ("BPFI", 4, 4),
}

VRMS_PROFILE = {  # (min, max) de base
    "sain":      (0.9, 2.2),
    "attention": (4.6, 6.6),
    "critique":  (7.6, 11.0),
}
HEALTH_INDEX = {"sain": (85, 98), "attention": (60, 78), "critique": (35, 55)}
DISPO = {"sain": (97, 99.5), "attention": (91, 95), "critique": (84, 90)}
MTBF = {"sain": (600, 900), "attention": (300, 450), "critique": (150, 260)}
MTTR = {"sain": (2.0, 3.0), "attention": (3.5, 5.0), "critique": (5.0, 8.0)}


def main() -> None:
    con = sqlite3.connect(str(DB_PATH))
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    # ── 1. Nettoyage de l'ancien seed (préserve les machines réelles, ex. M1) ──
    old = [r["id_machine"] for r in cur.execute(
        "SELECT id_machine FROM machine WHERE id_atelier=? AND origine_dataset='seed_demo'", (ATELIER_ID,)
    )]
    if old:
        ph = ",".join("?" * len(old))
        old_def = [r["id_defaut"] for r in cur.execute(f"SELECT id_defaut FROM defaut_detecte WHERE id_machine IN ({ph})", old)]
        if old_def:
            dph = ",".join("?" * len(old_def))
            cur.execute(f"DELETE FROM pronostic_drbf WHERE id_defaut IN ({dph})", old_def)
        # interventions liées aux BT des machines seed (avant de supprimer les BT)
        cur.execute(f"DELETE FROM intervention_technicien WHERE id_bt IN (SELECT id_bt FROM bon_de_travail WHERE id_machine IN ({ph}))", old)
        for tbl in ("mesure_globale", "defaut_detecte", "alerte", "kpi_journalier",
                    "economie_predictive", "bon_de_travail", "capteur", "panne", "incident_securite"):
            cur.execute(f"DELETE FROM {tbl} WHERE id_machine IN ({ph})", old)
        cur.execute(f"DELETE FROM machine WHERE id_machine IN ({ph})", old)
        print(f"[seed] ancien seed supprimé : {len(old)} machines")

    # Techniciens / certifications seed (marqueur service='seed_demo') + passerelles seed
    seed_techs = [r[0] for r in cur.execute(
        "SELECT id_utilisateur FROM utilisateur WHERE id_entreprise=? AND service='seed_demo'", (ENT_ID,))]
    if seed_techs:
        tph = ",".join("?" * len(seed_techs))
        cur.execute(f"DELETE FROM certification WHERE id_utilisateur IN ({tph})", seed_techs)
        cur.execute(f"DELETE FROM utilisateur WHERE id_utilisateur IN ({tph})", seed_techs)
    cur.execute("DELETE FROM passerelle_iot WHERE id_atelier=? AND code_passerelle LIKE 'SEEDGW-%'", (ATELIER_ID,))

    machine_ids: dict[str, int] = {}
    bt_counter = 1

    for code, nom, typ, kw, rpm, sante in MACHINES:
        annee = random.randint(2009, 2021)
        cur.execute(
            """INSERT INTO machine (id_atelier, code_machine, nom_machine, type_machine, fabricant,
               annee_mise_en_service, puissance_kw, vitesse_rotation_nominale_rpm, role_machine,
               valeur_remplacement_euros, cout_arret_horaire_euros, statut, origine_dataset)
               VALUES (?,?,?,?,?,?,?,?,?,?,?, 'en_service', 'seed_demo')""",
            (ATELIER_ID, code, nom, typ, random.choice(["KSB", "Siemens", "ABB", "Metso", "Atlas Copco"]),
             annee, kw, rpm, "Production", kw * random.uniform(800, 1500),
             round(kw * random.uniform(8, 20), 0)),
        )
        mid = cur.lastrowid
        machine_ids[code] = mid

        # ── Capteurs (accéléromètre + température) ──
        cur.execute(
            """INSERT INTO capteur (id_machine, code_capteur, type_capteur, marque, position_montage,
               direction_mesure, unite_mesure, date_installation, niveau_batterie_pct, statut)
               VALUES (?,?,?,?,?,?,?,?,?,'actif')""",
            (mid, f"{code}-ACC01", "accelerometre", "SKF", "Palier moteur côté accouplement",
             "radiale_horizontale", "mm/s", (NOW - timedelta(days=random.randint(200, 700))).strftime("%Y-%m-%d"),
             random.randint(35, 100)),
        )
        cap_acc = cur.lastrowid
        cur.execute(
            """INSERT INTO capteur (id_machine, code_capteur, type_capteur, marque, position_montage,
               unite_mesure, date_installation, niveau_batterie_pct, statut)
               VALUES (?,?,?,?,?,?,?,?,'actif')""",
            (mid, f"{code}-TMP01", "thermique", "Pt100", "Palier moteur", "°C",
             (NOW - timedelta(days=random.randint(200, 700))).strftime("%Y-%m-%d"),
             random.randint(60, 100)),
        )

        vmin, vmax = VRMS_PROFILE[sante]
        base_v = random.uniform(vmin, vmax)

        # ── Mesures globales : 45 points journaliers (tendance haussière si défaut) ──
        last_v = base_v
        for d in range(44, -1, -1):
            ts = NOW - timedelta(days=d, hours=random.randint(0, 6))
            trend = (1 + (44 - d) / 44 * 0.25) if sante != "sain" else 1.0
            v = max(0.3, base_v * trend * random.uniform(0.92, 1.08))
            last_v = v
            crest = round(random.uniform(3.0, 4.2) + (1.5 if sante == "critique" else 0), 2)
            kurt = round(random.uniform(2.6, 3.2) + (2.0 if sante == "critique" else 0), 2)
            temp = round(40 + (kw / 40) + (15 if sante == "critique" else 0) + random.uniform(-3, 4), 1)
            cur.execute(
                """INSERT INTO mesure_globale (id_capteur, id_machine, timestamp_mesure, v_rms_mm_s,
                   a_rms_g, a_peak_g, crest_factor, kurtosis, temperature_c, vitesse_rotation_rpm,
                   zone_iso_calculee, statut_alarme)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                (cap_acc, mid, ts.strftime("%Y-%m-%d %H:%M:%S"), round(v, 2),
                 round(v / 9.81 * random.uniform(0.8, 1.2), 3), round(v / 9.81 * crest, 3),
                 crest, kurt, temp, rpm + random.uniform(-15, 15), zone_iso(v),
                 "danger" if zone_iso(v) == "D" else "alerte" if zone_iso(v) == "C" else "normal"),
            )

        # ── Défaut + pronostic (machines en attention/critique) ──
        if sante in DEFAUTS:
            typ_def, grav, stade = DEFAUTS[sante]
            d0 = NOW - timedelta(days=random.randint(15, 45))
            cur.execute(
                """INSERT INTO defaut_detecte (id_machine, type_defaut, date_premiere_detection, gravite,
                   stade_degradation, methode_detection, confiance_diagnostic_pct, statut)
                   VALUES (?,?,?,?,?,?,?,'actif')""",
                (mid, typ_def, d0.strftime("%Y-%m-%d %H:%M:%S"), grav, stade,
                 "analyse_spectrale", round(random.uniform(72, 95), 1)),
            )
            id_def = cur.lastrowid
            drbf = random.randint(5, 22) if sante == "critique" else random.randint(60, 120)
            cur.execute(
                """INSERT INTO pronostic_drbf (id_defaut, id_machine, drbf_jours, drbf_min_jours,
                   drbf_max_jours, methode_calcul, precision_estimee_pct, date_defaillance_predite)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (id_def, mid, drbf, max(1, int(drbf * 0.7)), int(drbf * 1.4), "extrapolation",
                 round(random.uniform(70, 90), 1), (NOW + timedelta(days=drbf)).strftime("%Y-%m-%d")),
            )
            # Alerte active récente
            if sante == "critique":
                cur.execute(
                    """INSERT INTO alerte (id_machine, id_capteur, id_defaut, timestamp_alerte, niveau,
                       type_alerte, titre, message, statut)
                       VALUES (?,?,?,?,?,?,?,?, 'nouvelle')""",
                    (mid, cap_acc, id_def, (NOW - timedelta(hours=random.randint(1, 20))).strftime("%Y-%m-%d %H:%M:%S"),
                     "critique", "vibratoire", f"Vibration critique sur {code}",
                     f"V-RMS {round(last_v,1)} mm/s (zone D) — {typ_def} détecté, DRBF {drbf} j."),
                )
            # Bon de travail correctif
            cur.execute(
                """INSERT INTO bon_de_travail (numero_bt, id_machine, id_defaut, type_intervention,
                   priorite, description, date_planifiee, duree_prevue_heures, statut, cout_main_oeuvre,
                   cout_pieces, cout_total)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                (f"BT-{NOW.year}-{bt_counter:04d}", mid, id_def, "correctif",
                 "haute" if sante == "critique" else "moyenne",
                 f"Remplacement roulement suite {typ_def} sur {code}",
                 (NOW + timedelta(days=random.randint(2, 10))).strftime("%Y-%m-%d"),
                 random.uniform(3, 8), "planifie", random.uniform(400, 1200),
                 random.uniform(300, 2500), 0),
            )
            bt_counter += 1

        # ── KPIs journaliers : 90 jours ──
        for d in range(89, -1, -1):
            day = (NOW - timedelta(days=d)).strftime("%Y-%m-%d")
            dispo = round(random.uniform(*DISPO[sante]), 1)
            perf = round(random.uniform(88, 97), 1)
            qual = round(random.uniform(95, 99.5), 1)
            oee = round(dispo / 100 * perf / 100 * qual / 100 * 100, 1)
            cur.execute(
                """INSERT INTO kpi_journalier (date_kpi, id_machine, id_atelier, id_usine, mtbf_heures,
                   mttr_heures, disponibilite_pct, trs_oee_pct, performance_pct, qualite_pct,
                   nb_alertes, nb_pannes, nb_pannes_evitees, cout_maintenance_jour, economies_predictif,
                   vrms_moyen, asset_health_index)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (day, mid, ATELIER_ID, USINE_ID, round(random.uniform(*MTBF[sante]), 0),
                 round(random.uniform(*MTTR[sante]), 2), dispo, oee, perf, qual,
                 random.randint(1, 3) if sante == "critique" else random.randint(0, 1),
                 1 if (sante == "critique" and random.random() < 0.05) else 0,
                 1 if random.random() < 0.15 else 0,
                 round(random.uniform(150, 1400), 0),
                 round(random.uniform(0, 900), 0),
                 round(base_v * (1 + (89 - d) / 89 * (0.25 if sante != "sain" else 0)), 2),
                 round(random.uniform(*HEALTH_INDEX[sante]), 1)),
            )

    # ── Économies prédictives (YTD) ──
    codes = list(machine_ids.keys())
    for _ in range(16):
        c = random.choice(codes)
        ev = NOW - timedelta(days=random.randint(0, 330))
        cur.execute(
            """INSERT INTO economie_predictive (id_machine, date_evenement, type_economie,
               montant_economise_euros, description) VALUES (?,?,?,?,?)""",
            (machine_ids[c], ev.strftime("%Y-%m-%d"),
             random.choice(["panne_evitee", "remplacement_optimal", "pm_supprimee"]),
             round(random.uniform(3000, 28000), 0),
             f"Intervention prédictive sur {c} — défaillance anticipée évitée."),
        )

    mids = list(machine_ids.values())

    # ── Passerelles IoT (pilier IoT Network) ──
    for i in range(1, 4):
        cur.execute(
            """INSERT INTO passerelle_iot (id_atelier, code_passerelle, adresse_ip, protocole,
               nb_capteurs_connectes, statut, derniere_communication) VALUES (?,?,?,?,?, 'actif', ?)""",
            (ATELIER_ID, f"SEEDGW-{i:02d}", f"10.0.{ATELIER_ID}.{i}",
             random.choice(["MQTT", "OPC_UA", "Modbus", "LoRaWAN"]), random.randint(4, 10),
             (NOW - timedelta(minutes=random.randint(1, 120))).strftime("%Y-%m-%d %H:%M:%S")),
        )

    # ── Techniciens + certifications (pilier Workforce) ──
    TECHS = [("Benali", "Karim"), ("Ouattara", "Awa"), ("El Mansouri", "Yassine"),
             ("Traore", "Fatou"), ("Said", "Nabil")]
    tech_ids: list[int] = []
    for nom, prenom in TECHS:
        email = f"{prenom}.{nom}{ENT_ID}@seed-ocp.ma".lower().replace(" ", "")
        cur.execute(
            """INSERT INTO utilisateur (id_entreprise, nom, prenom, email, telephone, role, service,
               date_embauche, statut) VALUES (?,?,?,?,?, 'technicien', 'seed_demo', ?, 'actif')""",
            (ENT_ID, nom, prenom, email, f"+2126{random.randint(10000000, 99999999)}",
             (NOW - timedelta(days=random.randint(200, 2200))).strftime("%Y-%m-%d")),
        )
        tid = cur.lastrowid
        tech_ids.append(tid)
        for _ in range(random.randint(1, 2)):
            cur.execute(
                """INSERT INTO certification (id_utilisateur, type_certification, date_obtention,
                   date_expiration, organisme_certificateur) VALUES (?,?,?,?,?)""",
                (tid, random.choice(["ISO_18436_cat_I", "ISO_18436_cat_II", "ISO_18436_cat_III"]),
                 (NOW - timedelta(days=random.randint(100, 1500))).strftime("%Y-%m-%d"),
                 (NOW + timedelta(days=random.randint(120, 1000))).strftime("%Y-%m-%d"),
                 random.choice(["Mobius Institute", "CSP", "SKF", "Bureau Veritas"])),
            )

    # ── Pannes historiques (pilier Service Loss) ──
    for _ in range(7):
        mid = random.choice(mids)
        start = NOW - timedelta(days=random.randint(20, 360), hours=random.randint(0, 12))
        dur = round(random.uniform(2, 48), 1)
        cur.execute(
            """INSERT INTO panne (id_machine, date_debut_panne, date_fin_panne, duree_arret_heures,
               type_panne, cause_racine, detection_predictive, cout_arret_estime_euros,
               production_perdue_unites) VALUES (?,?,?,?,?,?,?,?,?)""",
            (mid, start.strftime("%Y-%m-%d %H:%M:%S"),
             (start + timedelta(hours=dur)).strftime("%Y-%m-%d %H:%M:%S"), dur,
             random.choice(["mineure", "majeure", "catastrophique"]),
             random.choice(["Roulement HS", "Défaut lubrification", "Surchauffe palier", "Balourd", "Désalignement"]),
             random.randint(0, 1), round(dur * random.uniform(300, 1500), 0), random.randint(0, 5000)),
        )

    # ── Incidents sécurité (pilier Risk Reduction, année courante) ──
    for _ in range(2):
        cur.execute(
            """INSERT INTO incident_securite (id_machine, date_incident, type_incident, gravite,
               heures_travaillees_periode) VALUES (?,?,?,?,?)""",
            (random.choice(mids), (NOW - timedelta(days=random.randint(0, 150))).strftime("%Y-%m-%d"),
             random.choice(["incident", "quasi_accident"]), random.randint(1, 3), random.randint(1000, 5000)),
        )

    # ── Bons de travail variés (en_cours / terminés / urgent) + interventions ──
    bt_variants = [("en_cours", "moyenne", None), ("en_cours", "haute", None),
                   ("termine", "moyenne", 4.5), ("termine", "basse", 2.0),
                   ("termine", "haute", 6.0), ("planifie", "urgente", None)]
    for st, prio, dreel in bt_variants:
        mid = random.choice(mids)
        date_fin = (NOW - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d") if st == "termine" else None
        cur.execute(
            """INSERT INTO bon_de_travail (numero_bt, id_machine, type_intervention, priorite, description,
               date_planifiee, date_fin_reelle, duree_prevue_heures, duree_reelle_heures, statut,
               cout_main_oeuvre, cout_pieces, cout_total) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (f"BT-{NOW.year}-{bt_counter:04d}", mid,
             random.choice(["preventif", "correctif", "predictif", "conditionnel"]), prio,
             f"Intervention {st} ({prio})", (NOW - timedelta(days=random.randint(0, 20))).strftime("%Y-%m-%d"),
             date_fin, round(random.uniform(2, 8), 1), dreel, st,
             round(random.uniform(200, 1000), 0), round(random.uniform(100, 1500), 0), 0),
        )
        bt_id = cur.lastrowid
        bt_counter += 1
        if st in ("en_cours", "termine") and tech_ids:
            deb = NOW - timedelta(days=random.randint(1, 25))
            fin = deb + timedelta(hours=dreel or random.uniform(2, 6)) if st == "termine" else None
            cur.execute(
                """INSERT INTO intervention_technicien (id_bt, id_utilisateur, date_debut, date_fin,
                   temps_clef_en_main_minutes) VALUES (?,?,?,?,?)""",
                (bt_id, random.choice(tech_ids), deb.strftime("%Y-%m-%d %H:%M:%S"),
                 fin.strftime("%Y-%m-%d %H:%M:%S") if fin else None, random.randint(30, 360)),
            )

    # ── Économies de l'année courante (piliers Revenue / Smart Replacement) ──
    this_year_types = ["remplacement_optimal"] * 4 + ["pm_supprimee"] * 2 + ["panne_evitee"] * 3
    for te in this_year_types:
        cur.execute(
            """INSERT INTO economie_predictive (id_machine, date_evenement, type_economie,
               montant_economise_euros, description) VALUES (?,?,?,?,?)""",
            (random.choice(mids), (NOW - timedelta(days=random.randint(0, 150))).strftime("%Y-%m-%d"),
             te, round(random.uniform(8000, 30000), 0),
             "Économie issue de la maintenance prédictive."),
        )

    con.commit()

    # ── Récapitulatif ──
    def cnt(sql, p=()):
        return cur.execute(sql, p).fetchone()[0]
    ph = ",".join("?" * len(machine_ids))
    ids = list(machine_ids.values())
    print(f"[seed] entreprise {ENT_ID} / atelier {ATELIER_ID} — OK")
    print(f"  machines  : {len(machine_ids)}")
    print(f"  capteurs  : {cnt(f'SELECT COUNT(*) FROM capteur WHERE id_machine IN ({ph})', ids)}")
    print(f"  mesures   : {cnt(f'SELECT COUNT(*) FROM mesure_globale WHERE id_machine IN ({ph})', ids)}")
    print(f"  défauts   : {cnt(f'SELECT COUNT(*) FROM defaut_detecte WHERE id_machine IN ({ph})', ids)}")
    print(f"  alertes   : {cnt(f'SELECT COUNT(*) FROM alerte WHERE id_machine IN ({ph})', ids)}")
    print(f"  kpi jours : {cnt(f'SELECT COUNT(*) FROM kpi_journalier WHERE id_machine IN ({ph})', ids)}")
    print(f"  économies : {cnt(f'SELECT COUNT(*) FROM economie_predictive WHERE id_machine IN ({ph})', ids)}")
    con.close()


if __name__ == "__main__":
    main()
