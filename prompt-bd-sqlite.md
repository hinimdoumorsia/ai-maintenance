# PROMPT — BASE DE DONNÉES SQLITE POUR SYSTÈME DE MAINTENANCE PRÉDICTIVE

## CONTEXTE
Tu es un expert en conception de bases de données SQLite pour systèmes industriels IoT. Je développe une application web de maintenance prédictive pour machines tournantes basée sur l'analyse vibratoire (normes ISO 10816, ISO 20816, ISO 18436). Le système intègre un dashboard temps réel avec 9 catégories de KPIs : Revenue Recovery, Smart Replacement, Planned Maintenance Reduction, Internet of Things, Service Loss Reduction, Risk Reduction, Workforce Improvement, Asset Availability, et Predictive Maintenance Core.

## OBJECTIF
Génère un script SQLite complet et exécutable comprenant :
1. La création de TOUTES les tables avec leurs contraintes (PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, CHECK)
2. Les types de données SQLite appropriés
3. Des index sur les colonnes fréquemment requêtées (timestamps, FK, codes)
4. Des commentaires explicatifs sur chaque table
5. Des données de test réalistes : MINIMUM 10 lignes par table, avec cohérence référentielle parfaite
6. Des vues SQL pour les KPIs principaux du dashboard
7. Des triggers pour automatisation (calcul zone ISO, mise à jour timestamps)

## SGBD CIBLE : SQLITE 3.40+

### ⚠️ IMPORTANT — Adaptations spécifiques SQLite

SQLite a des contraintes différentes de PostgreSQL. Respecte STRICTEMENT ces règles :

1. **Pas de type ENUM** → Utilise `TEXT CHECK (champ IN ('valeur1', 'valeur2', ...))`
2. **Pas de type UUID** → Utilise `TEXT` avec `lower(hex(randomblob(16)))` ou simplement INTEGER PRIMARY KEY AUTOINCREMENT
3. **Pas de TIMESTAMPTZ** → Utilise `TEXT` au format ISO8601 ('YYYY-MM-DD HH:MM:SS') ou `INTEGER` (timestamp Unix)
4. **Pas de JSONB** → Utilise `TEXT` (SQLite 3.38+ supporte les fonctions JSON natives via `json()`)
5. **Pas de NUMERIC(p,s)** → Utilise `REAL` (flottant) ou `INTEGER` pour montants en centimes
6. **Pas de BOOLEAN** → Utilise `INTEGER` (0 = faux, 1 = vrai)
7. **Foreign keys NON activées par défaut** → Commence le script par `PRAGMA foreign_keys = ON;`
8. **WAL mode recommandé** → Active avec `PRAGMA journal_mode = WAL;`
9. **Pas de fonctions stockées PL/pgSQL** → Utilise des TRIGGERS pour la logique automatique
10. **AUTOINCREMENT** → À utiliser uniquement si nécessaire (sinon INTEGER PRIMARY KEY suffit)

## ARCHITECTURE DES TABLES

### MODULE 1 — RÉFÉRENTIEL ENTREPRISE

**entreprise**
- id_entreprise INTEGER PRIMARY KEY AUTOINCREMENT
- nom_entreprise TEXT NOT NULL
- contact_telephone TEXT
- contact_email TEXT
- adresse_usine TEXT
- ville TEXT
- pays TEXT DEFAULT 'Maroc'
- code_postal TEXT
- domaine_industriel TEXT CHECK (domaine_industriel IN ('petrochimie','agroalimentaire','ciment','siderurgie','automobile','pharmaceutique','papeterie','energie','textile','autre'))
- descriptif_activite TEXT
- production_principale TEXT
- document_descriptif_url TEXT
- logo_url TEXT
- site_web TEXT
- date_creation_compte TEXT DEFAULT (datetime('now'))
- statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif','inactif','suspendu'))

**usine**
- id_usine INTEGER PRIMARY KEY AUTOINCREMENT
- id_entreprise INTEGER NOT NULL REFERENCES entreprise(id_entreprise) ON DELETE CASCADE
- nom_usine TEXT NOT NULL
- adresse TEXT
- ville TEXT
- pays TEXT
- latitude REAL
- longitude REAL
- responsable_site TEXT
- nombre_employes INTEGER

**atelier**
- id_atelier INTEGER PRIMARY KEY AUTOINCREMENT
- id_usine INTEGER NOT NULL REFERENCES usine(id_usine) ON DELETE CASCADE
- nom_atelier TEXT NOT NULL
- description TEXT
- responsable_atelier TEXT

**classe_iso**
- id_classe INTEGER PRIMARY KEY AUTOINCREMENT
- norme TEXT NOT NULL CHECK (norme IN ('ISO 10816','ISO 20816','ISO 7919','ISO 18436'))
- groupe TEXT NOT NULL
- type_machine TEXT
- puissance_min_kw REAL
- puissance_max_kw REAL
- seuil_zone_A_max REAL
- seuil_zone_B_max REAL
- seuil_zone_C_max REAL
- seuil_zone_D_min REAL
- unite TEXT DEFAULT 'mm/s'

**categorie_vis**
- id_categorie INTEGER PRIMARY KEY AUTOINCREMENT
- code TEXT UNIQUE NOT NULL CHECK (code IN ('V','I','S'))
- libelle TEXT NOT NULL
- description TEXT
- frequence_surveillance_recommandee_jours INTEGER

### MODULE 2 — PARC MACHINES

**machine**
- id_machine INTEGER PRIMARY KEY AUTOINCREMENT
- id_atelier INTEGER NOT NULL REFERENCES atelier(id_atelier)
- id_classe_iso INTEGER REFERENCES classe_iso(id_classe)
- id_categorie_vis INTEGER REFERENCES categorie_vis(id_categorie)
- code_machine TEXT UNIQUE NOT NULL
- nom_machine TEXT NOT NULL
- type_machine TEXT CHECK (type_machine IN ('pompe_centrifuge','compresseur','ventilateur','moteur_electrique','reducteur','turbine','broyeur','agitateur','autre'))
- fabricant TEXT
- modele TEXT
- numero_serie TEXT
- annee_mise_en_service INTEGER
- puissance_kw REAL
- vitesse_rotation_nominale_rpm REAL
- nombre_aubes INTEGER
- nombre_dents_engrenage INTEGER
- role_machine TEXT
- document_technique_url TEXT
- valeur_remplacement_euros REAL
- cout_arret_horaire_euros REAL
- date_derniere_maintenance TEXT
- statut TEXT DEFAULT 'en_service' CHECK (statut IN ('en_service','arret','maintenance','hors_service'))
- date_creation TEXT DEFAULT (datetime('now'))

**composant**
- id_composant INTEGER PRIMARY KEY AUTOINCREMENT
- id_machine INTEGER NOT NULL REFERENCES machine(id_machine) ON DELETE CASCADE
- type_composant TEXT CHECK (type_composant IN ('roulement','accouplement','courroie','engrenage','joint','palier_lisse','garniture','autre'))
- reference_fabricant TEXT
- position TEXT
- date_installation TEXT
- duree_vie_theorique_heures INTEGER
- nb_billes INTEGER
- diametre_billes_mm REAL
- diametre_primitif_mm REAL
- angle_contact_deg REAL
- bpfo_calcule REAL
- bpfi_calcule REAL
- bsf_calcule REAL
- ftf_calcule REAL

**capteur**
- id_capteur INTEGER PRIMARY KEY AUTOINCREMENT
- id_machine INTEGER NOT NULL REFERENCES machine(id_machine) ON DELETE CASCADE
- id_composant INTEGER REFERENCES composant(id_composant)
- code_capteur TEXT UNIQUE NOT NULL
- type_capteur TEXT CHECK (type_capteur IN ('accelerometre','sonde_proximite','velocimetre','thermique','ultrason','courant'))
- marque TEXT
- modele TEXT
- position_montage TEXT
- direction_mesure TEXT CHECK (direction_mesure IN ('radiale_horizontale','radiale_verticale','axiale','tangentielle'))
- gamme_freq_min_hz REAL
- gamme_freq_max_hz REAL
- gamme_amplitude_min REAL
- gamme_amplitude_max REAL
- unite_mesure TEXT
- date_installation TEXT
- date_derniere_calibration TEXT
- niveau_batterie_pct INTEGER CHECK (niveau_batterie_pct BETWEEN 0 AND 100)
- statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif','en_panne','en_calibration','hs','batterie_faible'))

**passerelle_iot**
- id_passerelle INTEGER PRIMARY KEY AUTOINCREMENT
- id_atelier INTEGER NOT NULL REFERENCES atelier(id_atelier)
- code_passerelle TEXT UNIQUE NOT NULL
- adresse_ip TEXT
- protocole TEXT CHECK (protocole IN ('MQTT','OPC_UA','Modbus','HTTP','LoRaWAN'))
- nb_capteurs_connectes INTEGER DEFAULT 0
- statut TEXT DEFAULT 'actif'
- derniere_communication TEXT

**configuration_acquisition**
- id_config INTEGER PRIMARY KEY AUTOINCREMENT
- id_capteur INTEGER NOT NULL REFERENCES capteur(id_capteur) ON DELETE CASCADE
- frequence_echantillonnage_hz INTEGER
- duree_acquisition_secondes REAL
- type_mesure TEXT CHECK (type_mesure IN ('RMS','peak','FFT','enveloppe','cepstre','order_tracking'))
- intervalle_acquisition_minutes INTEGER
- bandes_fines_definies TEXT  -- JSON sous forme de TEXT

### MODULE 3 — MESURES VIBRATOIRES

**mesure_globale**
- id_mesure INTEGER PRIMARY KEY AUTOINCREMENT
- id_capteur INTEGER NOT NULL REFERENCES capteur(id_capteur)
- id_machine INTEGER NOT NULL REFERENCES machine(id_machine)
- timestamp_mesure TEXT NOT NULL
- v_rms_mm_s REAL
- a_rms_g REAL
- a_peak_g REAL
- deplacement_pp_microns REAL
- crest_factor REAL
- facteur_k REAL
- facteur_fd REAL
- kurtosis REAL
- skewness REAL
- temperature_c REAL
- vitesse_rotation_rpm REAL
- zone_iso_calculee TEXT CHECK (zone_iso_calculee IN ('A','B','C','D'))
- statut_alarme TEXT DEFAULT 'normal' CHECK (statut_alarme IN ('normal','alerte','danger'))

**mesure_spectrale**
- id_spectre INTEGER PRIMARY KEY AUTOINCREMENT
- id_capteur INTEGER NOT NULL REFERENCES capteur(id_capteur)
- id_machine INTEGER NOT NULL REFERENCES machine(id_machine)
- timestamp_mesure TEXT NOT NULL
- type_spectre TEXT CHECK (type_spectre IN ('FFT','enveloppe','cepstre'))
- frequence_min_hz REAL
- frequence_max_hz REAL
- nombre_lignes INTEGER
- donnees_spectre_url TEXT
- donnees_spectre_json TEXT  -- JSON compressé pour petits spectres

**bande_fine_mesure**
- id_bande_mesure INTEGER PRIMARY KEY AUTOINCREMENT
- id_capteur INTEGER NOT NULL REFERENCES capteur(id_capteur)
- nom_bande TEXT
- frequence_min_hz REAL
- frequence_max_hz REAL
- timestamp_mesure TEXT NOT NULL
- amplitude_max REAL
- amplitude_rms REAL
- frequence_pic REAL
- statut TEXT CHECK (statut IN ('normal','alerte','danger'))

**seuil_alarme**
- id_seuil INTEGER PRIMARY KEY AUTOINCREMENT
- id_machine INTEGER REFERENCES machine(id_machine)
- id_capteur INTEGER REFERENCES capteur(id_capteur)
- type_indicateur TEXT NOT NULL
- valeur_reference REAL
- valeur_alerte REAL
- valeur_danger REAL
- methode_definition TEXT CHECK (methode_definition IN ('ISO','statistique','expert','ML'))

### MODULE 4 — DIAGNOSTIC & PRONOSTIC

**defaut_detecte**
- id_defaut INTEGER PRIMARY KEY AUTOINCREMENT
- id_machine INTEGER NOT NULL REFERENCES machine(id_machine)
- id_composant INTEGER REFERENCES composant(id_composant)
- type_defaut TEXT CHECK (type_defaut IN ('balourd','desalignement_parallele','desalignement_angulaire','jeu_mecanique','BPFO','BPFI','BSF','FTF','GMF','cavitation','resonance','defaut_electrique','courroie','autre'))
- date_premiere_detection TEXT NOT NULL
- date_confirmation TEXT
- gravite INTEGER CHECK (gravite BETWEEN 1 AND 5)
- stade_degradation INTEGER CHECK (stade_degradation BETWEEN 1 AND 4)
- frequences_caracteristiques TEXT  -- JSON
- methode_detection TEXT
- confiance_diagnostic_pct REAL
- statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif','resolu','en_observation','faux_positif'))
- commentaire_analyste TEXT

**pronostic_drbf**
- id_pronostic INTEGER PRIMARY KEY AUTOINCREMENT
- id_defaut INTEGER NOT NULL REFERENCES defaut_detecte(id_defaut) ON DELETE CASCADE
- id_machine INTEGER NOT NULL REFERENCES machine(id_machine)
- date_calcul TEXT DEFAULT (datetime('now'))
- drbf_jours INTEGER
- drbf_min_jours INTEGER
- drbf_max_jours INTEGER
- methode_calcul TEXT CHECK (methode_calcul IN ('extrapolation','ML','loi_paris','expert'))
- precision_estimee_pct REAL
- date_defaillance_predite TEXT

**alerte**
- id_alerte INTEGER PRIMARY KEY AUTOINCREMENT
- id_machine INTEGER REFERENCES machine(id_machine)
- id_capteur INTEGER REFERENCES capteur(id_capteur)
- id_defaut INTEGER REFERENCES defaut_detecte(id_defaut)
- timestamp_alerte TEXT NOT NULL DEFAULT (datetime('now'))
- niveau TEXT CHECK (niveau IN ('info','alerte','critique'))
- type_alerte TEXT CHECK (type_alerte IN ('vibratoire','capteur','seuil','anomalie_ml','batterie','communication'))
- titre TEXT
- message TEXT
- statut TEXT DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle','vue','traitee','fermee'))
- assignee_id INTEGER REFERENCES utilisateur(id_utilisateur)
- date_traitement TEXT

### MODULE 5 — MAINTENANCE GMAO

**bon_de_travail**
- id_bt INTEGER PRIMARY KEY AUTOINCREMENT
- numero_bt TEXT UNIQUE NOT NULL
- id_machine INTEGER NOT NULL REFERENCES machine(id_machine)
- id_defaut INTEGER REFERENCES defaut_detecte(id_defaut)
- type_intervention TEXT CHECK (type_intervention IN ('preventif','correctif','conditionnel','predictif'))
- priorite TEXT CHECK (priorite IN ('basse','moyenne','haute','urgente'))
- description TEXT
- date_creation TEXT DEFAULT (datetime('now'))
- date_planifiee TEXT
- date_debut_reelle TEXT
- date_fin_reelle TEXT
- duree_prevue_heures REAL
- duree_reelle_heures REAL
- statut TEXT DEFAULT 'cree' CHECK (statut IN ('cree','planifie','en_cours','termine','annule'))
- cout_main_oeuvre REAL
- cout_pieces REAL
- cout_total REAL
- technicien_principal_id INTEGER REFERENCES utilisateur(id_utilisateur)

**historique_maintenance**
- id_histo INTEGER PRIMARY KEY AUTOINCREMENT
- id_machine INTEGER NOT NULL REFERENCES machine(id_machine)
- id_bt INTEGER REFERENCES bon_de_travail(id_bt)
- date_intervention TEXT NOT NULL
- type_intervention TEXT
- description_travaux TEXT
- pieces_remplacees TEXT  -- JSON
- duree_arret_heures REAL
- defaut_resolu INTEGER DEFAULT 0  -- BOOLEAN

**panne**
- id_panne INTEGER PRIMARY KEY AUTOINCREMENT
- id_machine INTEGER NOT NULL REFERENCES machine(id_machine)
- date_debut_panne TEXT NOT NULL
- date_fin_panne TEXT
- duree_arret_heures REAL
- type_panne TEXT CHECK (type_panne IN ('catastrophique','majeure','mineure'))
- cause_racine TEXT
- detection_predictive INTEGER DEFAULT 0  -- BOOLEAN
- cout_arret_estime_euros REAL
- production_perdue_unites REAL

### MODULE 6 — PERSONNEL

**utilisateur**
- id_utilisateur INTEGER PRIMARY KEY AUTOINCREMENT
- id_entreprise INTEGER REFERENCES entreprise(id_entreprise)
- nom TEXT NOT NULL
- prenom TEXT NOT NULL
- email TEXT UNIQUE NOT NULL
- telephone TEXT
- role TEXT CHECK (role IN ('admin','manager_maintenance','analyste_vibratoire','technicien','operateur','direction'))
- service TEXT
- date_embauche TEXT
- statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif','inactif'))

**certification**
- id_certif INTEGER PRIMARY KEY AUTOINCREMENT
- id_utilisateur INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur)
- type_certification TEXT CHECK (type_certification IN ('ISO_18436_cat_I','ISO_18436_cat_II','ISO_18436_cat_III','ISO_18436_cat_IV','autre'))
- date_obtention TEXT
- date_expiration TEXT
- organisme_certificateur TEXT

**intervention_technicien**
- id_inter INTEGER PRIMARY KEY AUTOINCREMENT
- id_bt INTEGER NOT NULL REFERENCES bon_de_travail(id_bt)
- id_utilisateur INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur)
- date_debut TEXT
- date_fin TEXT
- temps_clef_en_main_minutes INTEGER

### MODULE 7 — STOCKS

**piece_rechange**
- id_piece INTEGER PRIMARY KEY AUTOINCREMENT
- reference_fabricant TEXT NOT NULL
- designation TEXT NOT NULL
- categorie TEXT CHECK (categorie IN ('roulement','joint','courroie','filtre','huile','accouplement','autre'))
- prix_unitaire REAL
- delai_approvisionnement_jours INTEGER
- fournisseur_principal TEXT
- stock_min INTEGER
- stock_actuel INTEGER
- emplacement_magasin TEXT

**mouvement_stock**
- id_mouvement INTEGER PRIMARY KEY AUTOINCREMENT
- id_piece INTEGER NOT NULL REFERENCES piece_rechange(id_piece)
- date_mouvement TEXT NOT NULL DEFAULT (datetime('now'))
- type_mouvement TEXT CHECK (type_mouvement IN ('entree','sortie','inventaire'))
- quantite INTEGER NOT NULL
- id_bt INTEGER REFERENCES bon_de_travail(id_bt)

### MODULE 8 — KPIs & REPORTING

**kpi_journalier**
- id_kpi INTEGER PRIMARY KEY AUTOINCREMENT
- date_kpi TEXT NOT NULL
- id_machine INTEGER REFERENCES machine(id_machine)
- id_atelier INTEGER REFERENCES atelier(id_atelier)
- id_usine INTEGER REFERENCES usine(id_usine)
- mtbf_heures REAL
- mttr_heures REAL
- disponibilite_pct REAL
- trs_oee_pct REAL
- performance_pct REAL
- qualite_pct REAL
- nb_alertes INTEGER DEFAULT 0
- nb_pannes INTEGER DEFAULT 0
- nb_pannes_evitees INTEGER DEFAULT 0
- cout_maintenance_jour REAL
- economies_predictif REAL
- vrms_moyen REAL
- asset_health_index REAL

**economie_predictive**
- id_economie INTEGER PRIMARY KEY AUTOINCREMENT
- id_machine INTEGER REFERENCES machine(id_machine)
- date_evenement TEXT NOT NULL
- type_economie TEXT CHECK (type_economie IN ('panne_evitee','remplacement_optimal','pm_supprimee'))
- montant_economise_euros REAL
- description TEXT
- id_defaut_detecte INTEGER REFERENCES defaut_detecte(id_defaut)

**incident_securite**
- id_incident INTEGER PRIMARY KEY AUTOINCREMENT
- id_machine INTEGER REFERENCES machine(id_machine)
- date_incident TEXT NOT NULL
- type_incident TEXT CHECK (type_incident IN ('incident','quasi_accident','accident_travail'))
- gravite INTEGER CHECK (gravite BETWEEN 1 AND 5)
- heures_travaillees_periode INTEGER

## EXIGENCES POUR LES DONNÉES DE TEST

### Cohérence métier OBLIGATOIRE
- 1 entreprise principale : "Atlas Industries Maroc" (domaine : agroalimentaire)
- 2 usines (Casablanca, Tanger)
- 6 ateliers (Atelier A, B, C, Utilités, Conditionnement, Logistique)
- 47 machines au minimum (10 V, 25 I, 12 S)
- Mix : pompes centrifuges, compresseurs, ventilateurs, moteurs, réducteurs
- 312 capteurs distribués (≈6-7 par machine vitale, 2-3 pour les autres)
- Pour 5-6 machines critiques, 90 jours d'historique de mesures (1 mesure/heure)
- Total mesure_globale : minimum 5000 lignes
- 7 défauts actifs avec stades variés :
  * P-204 → BPFI stade 3, DRBF 4 jours, V_RMS 9.8 mm/s zone D
  * C-118 → désalignement, V_RMS 11.4 mm/s zone D
  * R-077 → bandes latérales GMF, V_RMS 7.2 mm/s zone C
  * V-302 → balourd 1×fr, V_RMS 5.8 mm/s zone C
  * M-019 → pic 100 Hz électrique, V_RMS 4.9 mm/s zone C
  * P-156 → cavitation HF, V_RMS 3.4 mm/s zone B
  * Un autre stade naissant
- 12 utilisateurs (rôles variés), dont 8 certifiés ISO 18436
- 23 pannes évitées YTD (économies cumulées ≈ 847 000 €)
- KPI : disponibilité 96.4%, OEE 87.4%, MTBF 428h, MTTR 3.2h

### Réalisme des données
- Codes machines : P-XXX (pompes), C-XXX (compresseurs), V-XXX (ventilateurs), M-XXX (moteurs), R-XXX (réducteurs)
- Codes capteurs : A-XXX (accéléromètres), S-XXX (sondes proximité), T-XXX (thermiques)
- Fabricants : SKF, FAG, Siemens, ABB, Schneider, Atlas Copco, Grundfos, KSB
- Vitesses RPM réalistes : 1450, 1480, 2900, 2980 (moteurs) ; 750, 1000, 1500 (pompes)
- BPFO/BPFI calculés selon vraies formules (utilise n=8, d=12mm, D=60mm, α=0°)
- Zones ISO appliquées correctement selon V_RMS
- Timestamps ISO8601 : 'YYYY-MM-DD HH:MM:SS'
- Dates des 90 derniers jours (utilise datetime('now', '-X days') pour générer)

### Astuce SQLite pour générer des séries de timestamps
Utilise une CTE récursive WITH RECURSIVE pour générer les 90 jours × 24 heures de mesures :
```sql
WITH RECURSIVE jours(j) AS (
  SELECT 0 UNION ALL SELECT j+1 FROM jours WHERE j < 90
)
INSERT INTO mesure_globale (...)
SELECT ... datetime('now', '-' || j || ' days', '-' || (random() % 24) || ' hours') ...
FROM jours WHERE ...
```

### Formules à appliquer pour cohérence
$$BPFO = \frac{n}{2} \cdot f_r \cdot (1 - \frac{d}{D}\cos\alpha)$$
$$BPFI = \frac{n}{2} \cdot f_r \cdot (1 + \frac{d}{D}\cos\alpha)$$
$$Disponibilite = \frac{MTBF}{MTBF + MTTR} \times 100$$
$$Crest\_Factor = \frac{A_{peak}}{A_{RMS}}$$
$$Facteur\_K = A_{peak} \times A_{RMS}$$

## VUES SQL À CRÉER (compatibles SQLite)

1. **v_dashboard_global** : agrégation parc complet
2. **v_machines_a_risque** : top machines par DRBF croissant
3. **v_alertes_actives** : alertes 24h avec jointure machine
4. **v_kpi_revenue_recovery** : ROI, économies par mois
5. **v_kpi_asset_availability** : OEE, MTBF, MTTR par machine
6. **v_etat_capteurs** : santé du réseau IoT

## TRIGGERS SQLITE À CRÉER

1. **trg_calcul_zone_iso** : Avant INSERT dans mesure_globale, calcule automatiquement zone_iso_calculee selon v_rms_mm_s et la classe ISO de la machine
2. **trg_alerte_zone_d** : Après INSERT mesure_globale en zone D, crée automatiquement une alerte critique
3. **trg_update_passerelle** : Met à jour nb_capteurs_connectes dans passerelle_iot
4. **trg_calcul_bpfo_bpfi** : À l'INSERT d'un composant roulement, calcule BPFO/BPFI/BSF/FTF si n, d, D, alpha sont fournis

## FORMAT DE LA RÉPONSE

Génère le script en sections clairement commentées :

```sql
-- ================================================
-- SCRIPT SQLITE — MAINTENANCE PRÉDICTIVE
-- Compatible SQLite 3.40+
-- ================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ================================================
-- SECTION 1 : SUPPRESSION DES TABLES (idempotence)
-- ================================================
DROP TABLE IF EXISTS ...;

-- ================================================
-- SECTION 2 : CRÉATION DES TABLES (par module)
-- ================================================
-- Module 1 — Référentiel
CREATE TABLE entreprise (...);
...

-- ================================================
-- SECTION 3 : INDEX
-- ================================================
CREATE INDEX idx_mesure_timestamp ON mesure_globale(timestamp_mesure);
...

-- ================================================
-- SECTION 4 : DONNÉES DE TEST
-- ================================================
INSERT INTO entreprise (...) VALUES (...);
...

-- ================================================
-- SECTION 5 : VUES
-- ================================================
CREATE VIEW v_dashboard_global AS ...;
...

-- ================================================
-- SECTION 6 : TRIGGERS
-- ================================================
CREATE TRIGGER trg_calcul_zone_iso ...;
...

-- ================================================
-- SECTION 7 : REQUÊTES DE VALIDATION
-- ================================================
SELECT 'Test 1 : Dashboard global' AS test;
SELECT * FROM v_dashboard_global;
...
```

## CONTRAINTES ADDITIONNELLES

1. Le script doit être **exécutable d'un seul bloc** dans `sqlite3 ma_bd.db < script.sql`
2. **Idempotent** (DROP TABLE IF EXISTS au début)
3. Commenté en français
4. Complet (aucun "..." ou "à compléter")
5. Activer `PRAGMA foreign_keys = ON;` au début
6. Tous les timestamps au format ISO8601 (`'YYYY-MM-DD HH:MM:SS'`)
7. Utiliser `datetime('now')` pour les dates par défaut
8. Ordre d'INSERT respectant les FK : entreprise → usine → atelier → classe_iso → categorie_vis → machine → composant → capteur → mesures
9. Les BOOLEAN représentés en INTEGER (0/1)
10. Les JSON stockés comme TEXT avec contenu JSON valide

## TESTS À INCLURE EN FIN DE SCRIPT

```sql
-- Vérifier le nombre de lignes par table
SELECT 'entreprise' AS table_name, COUNT(*) AS nb FROM entreprise
UNION ALL SELECT 'machine', COUNT(*) FROM machine
UNION ALL SELECT 'capteur', COUNT(*) FROM capteur
UNION ALL SELECT 'mesure_globale', COUNT(*) FROM mesure_globale
-- ... etc pour toutes les tables

-- Vérifier les machines à risque
SELECT * FROM v_machines_a_risque LIMIT 10;

-- Vérifier le dashboard global
SELECT * FROM v_dashboard_global;
```

DÉMARRE LE SCRIPT MAINTENANT.
