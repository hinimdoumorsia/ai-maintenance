# generate_datasets/5_dashboard_seed.py
# Injecte toutes les données nécessaires pour alimenter les 9 piliers du dashboard
# À exécuter une fois après la création de la BD

import sqlite3
import random
import os
from datetime import datetime, timedelta

random.seed(42)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "db", "ai_maintenance.db")
db_path = os.path.normpath(DB_PATH)

conn = sqlite3.connect(db_path)
conn.execute("PRAGMA foreign_keys = ON")
cur = conn.cursor()

now = datetime(2026, 5, 5, 12, 0, 0)

print("=== INJECTION DONNÉES DASHBOARD ===")

# ═══ ④ IOT NETWORK — Capteurs + passerelles ═══
print("\n[IoT Network] Capteurs + passerelles...")

machines = cur.execute("SELECT id_machine, code_machine, nom_machine, type_machine, id_atelier FROM machine").fetchall()
machine_ids = [(r[0], r[1], r[2], r[3], r[4]) for r in machines]

# Passerelles supplémentaires pour couvrir tous les ateliers
for atelier_id, atelier_nom in [(1,"A"),(2,"B"),(3,"C"),(4,"Utilités"),(5,"Conditionnement")]:
    exist = cur.execute("SELECT COUNT(*) FROM passerelle_iot WHERE id_atelier=?",(atelier_id,)).fetchone()[0]
    if exist == 0:
        cur.execute("""INSERT INTO passerelle_iot (id_atelier,code_passerelle,adresse_ip,protocole,nb_capteurs_connectes,statut,derniere_communication)
            VALUES (?,?,?,?,?,?,?)""", (atelier_id, f"GW-{atelier_nom[:2]}{random.randint(10,99):02d}",
            f"192.168.{random.randint(10,50)}.{random.randint(1,254)}","MQTT",0,"actif",
            (now - timedelta(seconds=random.randint(1,60))).strftime("%Y-%m-%d %H:%M:%S")))

# Ajouter 200+ capteurs
capteur_types = ["accelerometre","sonde_proximite","velocimetre","thermique","ultrason","courant"]
capteur_id_start = 100
compteur_capteurs = 0

for mid, code_m, nom_m, type_m, aid in machine_ids:
    nb_capteurs = {"moteur_electrique": 8, "compresseur": 12, "pompe_centrifuge": 8,
                   "ventilateur": 6, "reducteur": 6, "turbine": 15}.get(type_m, 6)
    for i in range(nb_capteurs):
        typ = random.choice(capteur_types)
        pos = ["Palier "+d for d in ["DE","NDE","côté charge"]]+["Sortie compresseur","Refoulement","Aspiration"]
        dirs = ["radiale_horizontale","radiale_verticale","axiale","tangentielle"]
        batt = random.randint(30, 100)
        stat = "actif" if batt > 20 else "batterie_faible"
        if random.random() < 0.03: stat = random.choice(["en_panne","hs"])
        code_s = f"S-{capteur_id_start + compteur_capteurs:04d}"
        try:
            cur.execute("""INSERT INTO capteur (id_machine,code_capteur,type_capteur,marque,modele,
                position_montage,direction_mesure,gamme_freq_min_hz,gamme_freq_max_hz,unite_mesure,
                date_installation,date_derniere_calibration,niveau_batterie_pct,statut)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (mid, code_s, typ, random.choice(["SKF","FAG","Fluke","Kistler","ABB"]),
                 random.choice(["CMSS2200","VibStic","80PK-27","8640A5","M3BP"]),
                 random.choice(pos), random.choice(dirs),
                 random.choice([0.5,2,10]), random.choice([1000,5000,10000,25000]),
                 random.choice(["m/s²","mm/s","°C","A","g"]),
                 (now - timedelta(days=random.randint(365, 1800))).strftime("%Y-%m-%d"),
                 (now - timedelta(days=random.randint(90, 540))).strftime("%Y-%m-%d"),
                 batt, stat))
            compteur_capteurs += 1
        except sqlite3.IntegrityError:
            pass

# Mettre à jour nb_capteurs par passerelle
for pid, aid in cur.execute("SELECT id_passerelle, id_atelier FROM passerelle_iot").fetchall():
    n = cur.execute("""SELECT COUNT(*) FROM capteur c JOIN machine m ON c.id_machine=m.id_machine
        WHERE m.id_atelier=?""",(aid,)).fetchone()[0]
    cur.execute("UPDATE passerelle_iot SET nb_capteurs_connectes=? WHERE id_passerelle=?",(n,pid))

total_capteurs = cur.execute("SELECT COUNT(*) FROM capteur").fetchone()[0]
print(f"   {total_capteurs} capteurs créés, {cur.execute('SELECT COUNT(*) FROM passerelle_iot').fetchone()[0]} passerelles")

# ═══ ⑥ WORKFORCE — Certifications supplémentaires ═══
print("\n[Workforce] Certifications ISO 18436...")

techs = cur.execute("SELECT id_utilisateur FROM utilisateur WHERE role IN ('technicien','analyste_vibratoire')").fetchall()
for (uid,) in techs:
    exist = cur.execute("SELECT COUNT(*) FROM certification WHERE id_utilisateur=?",(uid,)).fetchone()[0]
    if exist == 0:
        cert = random.choice(["ISO_18436_cat_I","ISO_18436_cat_II","ISO_18436_cat_III"])
        cur.execute("""INSERT INTO certification (id_utilisateur,type_certification,date_obtention,date_expiration,organisme_certificateur)
            VALUES (?,?,?,?,?)""", (uid, cert,
            (now - timedelta(days=random.randint(365,1460))).strftime("%Y-%m-%d"),
            (now + timedelta(days=random.randint(90,1095))).strftime("%Y-%m-%d"),
            random.choice(["COMADEM France","BINDT UK","CETIM Maroc","COFREND","VCAT II"])))

n_certs = cur.execute("SELECT COUNT(*) FROM certification").fetchone()[0]
print(f"   {n_certs} certifications ISO 18436")

# ═══ ③ PLANNED MAINTENANCE — BTs + interventions ═══
print("\n[Planned Maintenance] Bons de travail + interventions...")

bt_types = ["preventif","correctif","conditionnel","predictif"]
bt_priorities = ["basse","moyenne","haute","urgente"]
bt_statuts = ["cree","planifie","en_cours","termine","annule"]
nbt_created = 0

for mid, code_m, nom_m, _, _ in machine_ids:
    nb_bt = random.randint(2, 6)
    for i in range(nb_bt):
        stat = random.choice(["termine","en_cours","planifie","cree"])
        prio = "urgente" if stat in ("en_cours","planifie") and random.random() < 0.2 else random.choice(bt_priorities)
        date_plan = (now + timedelta(days=random.randint(-90, 60))).strftime("%Y-%m-%d")
        duree = random.choice([1.5,2.0,3.0,4.0,6.0,8.0])
        nbt_created += 1
        num_bt = f"BT-2026-{5000+nbt_created:04d}"
        try:
            cur.execute("""INSERT INTO bon_de_travail (numero_bt,id_machine,type_intervention,priorite,
                description,date_creation,date_planifiee,duree_prevue_heures,statut,cout_main_oeuvre,cout_pieces,cout_total,
                technicien_principal_id)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (num_bt, mid, random.choice(bt_types), prio,
                 f"Intervention {random.choice(['vibratoire','mécanique','électrique','hydraulique'])} sur {nom_m}",
                 (now - timedelta(days=random.randint(0,30))).strftime("%Y-%m-%d"),
                 date_plan, duree, stat,
                 round(duree*random.uniform(30,60),0),
                 round(random.uniform(50,500),0),
                 round(duree*random.uniform(80,200),0),
                 random.choice([t[0] for t in techs])))
        except sqlite3.IntegrityError:
            pass

# Interventions pour BTs terminés/en cours
bt_done = cur.execute("SELECT id_bt, statut FROM bon_de_travail WHERE statut IN ('termine','en_cours')").fetchall()
for (bt_id, _) in bt_done[:50]:
    tech_id = random.choice([t[0] for t in techs])
    cur.execute("""INSERT INTO intervention_technicien (id_bt,id_utilisateur,date_debut,date_fin,temps_clef_en_main_minutes)
        VALUES (?,?,?,?,?)""", (bt_id, tech_id,
        (now - timedelta(days=random.randint(1,30))).strftime("%Y-%m-%d %H:%M"),
        (now - timedelta(days=random.randint(0,1), hours=random.randint(1,6))).strftime("%Y-%m-%d %H:%M"),
        random.randint(30,240)))

print(f"   {cur.execute('SELECT COUNT(*) FROM bon_de_travail').fetchone()[0]} BTs, {cur.execute('SELECT COUNT(*) FROM intervention_technicien').fetchone()[0]} interventions")

# ═══ ② SMART REPLACEMENT — Pièces + économies prédictives ═══
print("\n[Smart Replacement] Pièces rechange + économies...")

pieces = [
    ("SKF 6309","Roulement à billes SKF 6309","roulement",185,2,4),
    ("SKF 6307","Roulement à billes SKF 6307","roulement",145,2,3),
    ("FAG NU319","Roulement à rouleaux FAG NU 319","roulement",320,1,2),
    ("SKF 22220","Roulement à rotule SKF 22220","roulement",480,1,1),
    ("FAG 6312","Roulement à billes FAG 6312","roulement",210,2,3),
    ("GRUNDFOS KIT-204","Kit joints mécaniques Grundfos CR 32","joint",95,3,8),
    ("ACCOUPLMT-118","Accouplement élastique C-118","accouplement",560,1,1),
    ("FILTRE-GA75","Filtre à air GA 75","filtre",45,4,12),
    ("HUILE-ISO46","Huile hydraulique ISO VG 46 20L","huile",85,5,18),
    ("COURROIE-V-302","Courroie trapézoïdale SPA-1800","courroie",38,4,10),
    ("SKF-LGMT3","Graisse haute température SKF","huile",29,10,45),
    ("JOINT-TOR-100","Joint torique NBR 100mm","joint",4,20,150),
    ("FILTRE-HYD-25","Filtre hydraulique 25 microns","filtre",65,6,22),
    ("COURROIE-C-118","Courroie poly-V PC-2000","courroie",52,3,7),
]

for ref, des, cat, pu, stock_min, stock_act in pieces:
    exist = cur.execute("SELECT COUNT(*) FROM piece_rechange WHERE reference_fabricant=?",(ref,)).fetchone()[0]
    if exist == 0:
        cur.execute("""INSERT INTO piece_rechange (reference_fabricant,designation,categorie,prix_unitaire,
            delai_approvisionnement_jours,fournisseur_principal,stock_min,stock_actuel,emplacement_magasin)
            VALUES (?,?,?,?,?,?,?,?,?)""",
            (ref, des, cat, pu, random.randint(3,30), random.choice(["SKF Maroc","FAG Casablanca","Total Maroc","Grundfos MA"]),
             stock_min, stock_act, f"{random.choice(['A','B','C','D'])}-{random.randint(1,99):02d}"))

# Mouvements stock
for _ in range(30):
    pid = random.randint(1, len(pieces))
    cur.execute("""INSERT INTO mouvement_stock (id_piece,date_mouvement,type_mouvement,quantite)
        VALUES (?,?,?,?)""", (pid,
        (now - timedelta(days=random.randint(0,180))).strftime("%Y-%m-%d"),
        random.choice(["entree","sortie"]), random.randint(1,5)))

# Économies prédictives mensuelles
for mois in range(1,6):
    d = datetime(2026, mois, random.randint(1,28))
    mid = random.choice([m[0] for m in machine_ids])
    cur.execute("""INSERT INTO economie_predictive (id_machine,date_evenement,type_economie,montant_economise_euros,description)
        VALUES (?,?,?,?,?)""", (mid, d.strftime("%Y-%m-%d"),
        random.choice(["panne_evitee","remplacement_optimal","pm_supprimee"]),
        random.randint(5000,95000),
        f"Intervention prédictive mois {mois}"))

print(f"   {cur.execute('SELECT COUNT(*) FROM piece_rechange').fetchone()[0]} pièces, {cur.execute('SELECT COUNT(*) FROM economie_predictive').fetchone()[0]} économies")

# ═══ ⑤ SERVICE LOSS — pannes historiques ═══
print("\n[Service Loss] Pannes historiques + KPIs journaliers...")

for mois in range(1,13):
    if random.random() < 0.4:
        d = datetime(2025, mois, random.randint(1,28))
        mid = random.choice([m[0] for m in machine_ids])
        duree = round(random.uniform(2, 48), 1)
        cur.execute("""INSERT INTO panne (id_machine,date_debut_panne,date_fin_panne,duree_arret_heures,
            type_panne,cause_racine,detection_predictive,cout_arret_estime_euros,production_perdue_unites)
            VALUES (?,?,?,?,?,?,?,?,?)""",
            (mid, d.strftime("%Y-%m-%d"), (d + timedelta(hours=int(duree))).strftime("%Y-%m-%d"),
             duree, random.choice(["catastrophique","majeure","mineure"]),
             random.choice(["Défaillance roulement","Surcharge","Désalignement","Cavitation","Fuite","Usure"]),
             random.randint(0,1), round(duree*random.uniform(400,2000),0), random.randint(10,500)))

# KPIs journaliers (120 jours)
for j in range(120):
    d = now - timedelta(days=j)
    cur.execute("""INSERT INTO kpi_journalier (date_kpi,id_usine,mtbf_heures,mttr_heures,disponibilite_pct,
        trs_oee_pct,performance_pct,qualite_pct,nb_alertes,nb_pannes,nb_pannes_evitees,
        cout_maintenance_jour,economies_predictif,vrms_moyen,asset_health_index)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (d.strftime("%Y-%m-%d"), 1,
         random.randint(380, 520), round(random.uniform(2.5, 6.0), 1),
         round(random.uniform(92, 98), 1), round(random.uniform(82, 91), 1),
         round(random.uniform(88, 96), 1), round(random.uniform(97, 100), 1),
         random.randint(1, 8), random.randint(0, 2), random.randint(0, 4),
         random.randint(2000, 6000), random.randint(5000, 25000),
         round(random.uniform(1.8, 5.5), 1), round(random.uniform(60, 92), 1)))

# Historique maintenance
for mid, code_m, nom_m, _, _ in machine_ids[:6]:
    for _ in range(random.randint(2,5)):
        d = now - timedelta(days=random.randint(60, 400))
        cur.execute("""INSERT INTO historique_maintenance (id_machine,date_intervention,type_intervention,
            description_travaux,duree_arret_heures,defaut_resolu)
            VALUES (?,?,?,?,?,?)""", (mid, d.strftime("%Y-%m-%d"),
            random.choice(["preventif","correctif","conditionnel","predictif"]),
            f"Intervention programmée sur {nom_m}", round(random.uniform(1, 8), 1), random.randint(0,1)))

# Incidents sécurité
for _ in range(5):
    d = now - timedelta(days=random.randint(30, 500))
    mid = random.choice([m[0] for m in machine_ids])
    cur.execute("""INSERT INTO incident_securite (id_machine,date_incident,type_incident,gravite,heures_travaillees_periode)
        VALUES (?,?,?,?,?)""", (mid, d.strftime("%Y-%m-%d"),
        random.choice(["incident","quasi_accident","accident_travail"]),
        random.randint(1,3), random.randint(800, 4000)))

print(f"   {cur.execute('SELECT COUNT(*) FROM panne').fetchone()[0]} pannes, {cur.execute('SELECT COUNT(*) FROM kpi_journalier').fetchone()[0]} jours KPIs")
print(f"   {cur.execute('SELECT COUNT(*) FROM incident_securite').fetchone()[0]} incidents sécurité")

conn.commit()
conn.close()

print(f"\n=== INJECTION TERMINÉE ===")
print(f"Base : {db_path}")
print(f"Dashboard désormais entièrement alimenté.")
