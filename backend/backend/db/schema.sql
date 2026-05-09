-- ================================================================
-- SCRIPT SQLITE — SYSTÈME DE MAINTENANCE PRÉDICTIVE
-- Compatible SQLite 3.40+ (ISO 10816 / ISO 20816 / ISO 18436)
-- Atlas Industries Maroc — données de test incluses
-- ================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ================================================================
-- SECTION 1 : SUPPRESSION (idempotence — ordre inverse des FK)
-- ================================================================
DROP TABLE IF EXISTS incident_securite;
DROP TABLE IF EXISTS economie_predictive;
DROP TABLE IF EXISTS kpi_journalier;
DROP TABLE IF EXISTS mouvement_stock;
DROP TABLE IF EXISTS piece_rechange;
DROP TABLE IF EXISTS intervention_technicien;
DROP TABLE IF EXISTS certification;
DROP TABLE IF EXISTS panne;
DROP TABLE IF EXISTS historique_maintenance;
DROP TABLE IF EXISTS bon_de_travail;
DROP TABLE IF EXISTS alerte;
DROP TABLE IF EXISTS pronostic_drbf;
DROP TABLE IF EXISTS defaut_detecte;
DROP TABLE IF EXISTS seuil_alarme;
DROP TABLE IF EXISTS bande_fine_mesure;
DROP TABLE IF EXISTS mesure_spectrale;
DROP TABLE IF EXISTS mesure_globale;
DROP TABLE IF EXISTS configuration_acquisition;
DROP TABLE IF EXISTS passerelle_iot;
DROP TABLE IF EXISTS capteur;
DROP TABLE IF EXISTS composant;
DROP TABLE IF EXISTS machine;
DROP TABLE IF EXISTS categorie_vis;
DROP TABLE IF EXISTS classe_iso;
DROP TABLE IF EXISTS atelier;
DROP TABLE IF EXISTS usine;
DROP TABLE IF EXISTS utilisateur;
DROP TABLE IF EXISTS entreprise;

-- ================================================================
-- SECTION 2 : CRÉATION DES TABLES
-- ================================================================

-- ── MODULE 1 — RÉFÉRENTIEL ENTREPRISE ────────────────────────────

CREATE TABLE entreprise (
    id_entreprise           INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_entreprise          TEXT    NOT NULL,
    contact_telephone       TEXT,
    contact_email           TEXT,
    adresse_usine           TEXT,
    ville                   TEXT,
    pays                    TEXT    DEFAULT 'Maroc',
    code_postal             TEXT,
    domaine_industriel      TEXT    CHECK (domaine_industriel IN (
                                'petrochimie','agroalimentaire','ciment','siderurgie',
                                'automobile','pharmaceutique','papeterie','energie','textile','autre')),
    descriptif_activite     TEXT,
    production_principale   TEXT,
    document_descriptif_url TEXT,
    logo_url                TEXT,
    site_web                TEXT,
    date_creation_compte    TEXT    DEFAULT (datetime('now')),
    statut                  TEXT    DEFAULT 'actif' CHECK (statut IN ('actif','inactif','suspendu'))
);

CREATE TABLE utilisateur (
    id_utilisateur  INTEGER PRIMARY KEY AUTOINCREMENT,
    id_entreprise   INTEGER REFERENCES entreprise(id_entreprise),
    nom             TEXT NOT NULL,
    prenom          TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    telephone       TEXT,
    role            TEXT CHECK (role IN (
                        'admin','manager_maintenance','analyste_vibratoire',
                        'technicien','operateur','direction')),
    service         TEXT,
    date_embauche   TEXT,
    statut          TEXT DEFAULT 'actif' CHECK (statut IN ('actif','inactif'))
);

CREATE TABLE usine (
    id_usine            INTEGER PRIMARY KEY AUTOINCREMENT,
    id_entreprise       INTEGER NOT NULL REFERENCES entreprise(id_entreprise) ON DELETE CASCADE,
    nom_usine           TEXT    NOT NULL,
    adresse             TEXT,
    ville               TEXT,
    pays                TEXT,
    latitude            REAL,
    longitude           REAL,
    responsable_site    TEXT,
    nombre_employes     INTEGER
);

CREATE TABLE atelier (
    id_atelier          INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usine            INTEGER NOT NULL REFERENCES usine(id_usine) ON DELETE CASCADE,
    nom_atelier         TEXT    NOT NULL,
    description         TEXT,
    responsable_atelier TEXT
);

CREATE TABLE classe_iso (
    id_classe           INTEGER PRIMARY KEY AUTOINCREMENT,
    norme               TEXT    NOT NULL CHECK (norme IN ('ISO 10816','ISO 20816','ISO 7919','ISO 18436')),
    groupe              TEXT    NOT NULL,
    type_machine        TEXT,
    puissance_min_kw    REAL,
    puissance_max_kw    REAL,
    seuil_zone_A_max    REAL,
    seuil_zone_B_max    REAL,
    seuil_zone_C_max    REAL,
    seuil_zone_D_min    REAL,
    unite               TEXT    DEFAULT 'mm/s'
);

CREATE TABLE categorie_vis (
    id_categorie                            INTEGER PRIMARY KEY AUTOINCREMENT,
    code                                    TEXT    UNIQUE NOT NULL CHECK (code IN ('V','I','S')),
    libelle                                 TEXT    NOT NULL,
    description                             TEXT,
    frequence_surveillance_recommandee_jours INTEGER
);

-- ── MODULE 2 — PARC MACHINES ─────────────────────────────────────

CREATE TABLE machine (
    id_machine                      INTEGER PRIMARY KEY AUTOINCREMENT,
    id_atelier                      INTEGER NOT NULL REFERENCES atelier(id_atelier),
    id_classe_iso                   INTEGER REFERENCES classe_iso(id_classe),
    id_categorie_vis                INTEGER REFERENCES categorie_vis(id_categorie),
    code_machine                    TEXT    UNIQUE NOT NULL,
    nom_machine                     TEXT    NOT NULL,
    type_machine                    TEXT    CHECK (type_machine IN (
                                        'pompe_centrifuge','compresseur','ventilateur',
                                        'moteur_electrique','reducteur','turbine','broyeur','agitateur','autre')),
    fabricant                       TEXT,
    modele                          TEXT,
    numero_serie                    TEXT,
    annee_mise_en_service           INTEGER,
    puissance_kw                    REAL,
    vitesse_rotation_nominale_rpm   REAL,
    nombre_aubes                    INTEGER,
    nombre_dents_engrenage          INTEGER,
    role_machine                    TEXT,
    document_technique_url          TEXT,
    valeur_remplacement_euros       REAL,
    cout_arret_horaire_euros        REAL,
    date_derniere_maintenance       TEXT,
    statut                          TEXT    DEFAULT 'en_service' CHECK (statut IN (
                                        'en_service','arret','maintenance','hors_service')),
    date_creation                   TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE composant (
    id_composant                INTEGER PRIMARY KEY AUTOINCREMENT,
    id_machine                  INTEGER NOT NULL REFERENCES machine(id_machine) ON DELETE CASCADE,
    type_composant              TEXT    CHECK (type_composant IN (
                                    'roulement','accouplement','courroie','engrenage',
                                    'joint','palier_lisse','garniture','autre')),
    reference_fabricant         TEXT,
    position                    TEXT,
    date_installation           TEXT,
    duree_vie_theorique_heures  INTEGER,
    nb_billes                   INTEGER,
    diametre_billes_mm          REAL,
    diametre_primitif_mm        REAL,
    angle_contact_deg           REAL,
    bpfo_calcule                REAL,
    bpfi_calcule                REAL,
    bsf_calcule                 REAL,
    ftf_calcule                 REAL
);

CREATE TABLE capteur (
    id_capteur                  INTEGER PRIMARY KEY AUTOINCREMENT,
    id_machine                  INTEGER NOT NULL REFERENCES machine(id_machine) ON DELETE CASCADE,
    id_composant                INTEGER REFERENCES composant(id_composant),
    code_capteur                TEXT    UNIQUE NOT NULL,
    type_capteur                TEXT    CHECK (type_capteur IN (
                                    'accelerometre','sonde_proximite','velocimetre',
                                    'thermique','ultrason','courant')),
    marque                      TEXT,
    modele                      TEXT,
    position_montage            TEXT,
    direction_mesure            TEXT    CHECK (direction_mesure IN (
                                    'radiale_horizontale','radiale_verticale','axiale','tangentielle')),
    gamme_freq_min_hz           REAL,
    gamme_freq_max_hz           REAL,
    gamme_amplitude_min         REAL,
    gamme_amplitude_max         REAL,
    unite_mesure                TEXT,
    date_installation           TEXT,
    date_derniere_calibration   TEXT,
    niveau_batterie_pct         INTEGER CHECK (niveau_batterie_pct BETWEEN 0 AND 100),
    statut                      TEXT    DEFAULT 'actif' CHECK (statut IN (
                                    'actif','en_panne','en_calibration','hs','batterie_faible'))
);

CREATE TABLE passerelle_iot (
    id_passerelle           INTEGER PRIMARY KEY AUTOINCREMENT,
    id_atelier              INTEGER NOT NULL REFERENCES atelier(id_atelier),
    code_passerelle         TEXT    UNIQUE NOT NULL,
    adresse_ip              TEXT,
    protocole               TEXT    CHECK (protocole IN ('MQTT','OPC_UA','Modbus','HTTP','LoRaWAN')),
    nb_capteurs_connectes   INTEGER DEFAULT 0,
    statut                  TEXT    DEFAULT 'actif',
    derniere_communication  TEXT
);

CREATE TABLE configuration_acquisition (
    id_config                       INTEGER PRIMARY KEY AUTOINCREMENT,
    id_capteur                      INTEGER NOT NULL REFERENCES capteur(id_capteur) ON DELETE CASCADE,
    frequence_echantillonnage_hz    INTEGER,
    duree_acquisition_secondes      REAL,
    type_mesure                     TEXT    CHECK (type_mesure IN (
                                        'RMS','peak','FFT','enveloppe','cepstre','order_tracking')),
    intervalle_acquisition_minutes  INTEGER,
    bandes_fines_definies           TEXT    -- JSON (TEXT)
);

-- ── MODULE 3 — MESURES VIBRATOIRES ───────────────────────────────

CREATE TABLE mesure_globale (
    id_mesure               INTEGER PRIMARY KEY AUTOINCREMENT,
    id_capteur              INTEGER NOT NULL REFERENCES capteur(id_capteur),
    id_machine              INTEGER NOT NULL REFERENCES machine(id_machine),
    timestamp_mesure        TEXT    NOT NULL,
    v_rms_mm_s              REAL,
    a_rms_g                 REAL,
    a_peak_g                REAL,
    deplacement_pp_microns  REAL,
    crest_factor            REAL,
    facteur_k               REAL,
    facteur_fd              REAL,
    kurtosis                REAL,
    skewness                REAL,
    temperature_c           REAL,
    vitesse_rotation_rpm    REAL,
    zone_iso_calculee       TEXT    CHECK (zone_iso_calculee IN ('A','B','C','D')),
    statut_alarme           TEXT    DEFAULT 'normal' CHECK (statut_alarme IN ('normal','alerte','danger'))
);

CREATE TABLE mesure_spectrale (
    id_spectre          INTEGER PRIMARY KEY AUTOINCREMENT,
    id_capteur          INTEGER NOT NULL REFERENCES capteur(id_capteur),
    id_machine          INTEGER NOT NULL REFERENCES machine(id_machine),
    timestamp_mesure    TEXT    NOT NULL,
    type_spectre        TEXT    CHECK (type_spectre IN ('FFT','enveloppe','cepstre')),
    frequence_min_hz    REAL,
    frequence_max_hz    REAL,
    nombre_lignes       INTEGER,
    donnees_spectre_url TEXT,
    donnees_spectre_json TEXT   -- JSON compressé pour petits spectres
);

CREATE TABLE bande_fine_mesure (
    id_bande_mesure INTEGER PRIMARY KEY AUTOINCREMENT,
    id_capteur      INTEGER NOT NULL REFERENCES capteur(id_capteur),
    nom_bande       TEXT,
    frequence_min_hz REAL,
    frequence_max_hz REAL,
    timestamp_mesure TEXT NOT NULL,
    amplitude_max   REAL,
    amplitude_rms   REAL,
    frequence_pic   REAL,
    statut          TEXT CHECK (statut IN ('normal','alerte','danger'))
);

CREATE TABLE seuil_alarme (
    id_seuil            INTEGER PRIMARY KEY AUTOINCREMENT,
    id_machine          INTEGER REFERENCES machine(id_machine),
    id_capteur          INTEGER REFERENCES capteur(id_capteur),
    type_indicateur     TEXT    NOT NULL,
    valeur_reference    REAL,
    valeur_alerte       REAL,
    valeur_danger       REAL,
    methode_definition  TEXT    CHECK (methode_definition IN ('ISO','statistique','expert','ML'))
);

-- ── MODULE 4 — DIAGNOSTIC & PRONOSTIC ────────────────────────────

CREATE TABLE defaut_detecte (
    id_defaut                   INTEGER PRIMARY KEY AUTOINCREMENT,
    id_machine                  INTEGER NOT NULL REFERENCES machine(id_machine),
    id_composant                INTEGER REFERENCES composant(id_composant),
    type_defaut                 TEXT    CHECK (type_defaut IN (
                                    'balourd','desalignement_parallele','desalignement_angulaire',
                                    'jeu_mecanique','BPFO','BPFI','BSF','FTF','GMF',
                                    'cavitation','resonance','defaut_electrique','courroie','autre')),
    date_premiere_detection     TEXT    NOT NULL,
    date_confirmation           TEXT,
    gravite                     INTEGER CHECK (gravite BETWEEN 1 AND 5),
    stade_degradation           INTEGER CHECK (stade_degradation BETWEEN 1 AND 4),
    frequences_caracteristiques TEXT,   -- JSON
    methode_detection           TEXT,
    confiance_diagnostic_pct    REAL,
    statut                      TEXT    DEFAULT 'actif' CHECK (statut IN (
                                    'actif','resolu','en_observation','faux_positif')),
    commentaire_analyste        TEXT
);

CREATE TABLE pronostic_drbf (
    id_pronostic            INTEGER PRIMARY KEY AUTOINCREMENT,
    id_defaut               INTEGER NOT NULL REFERENCES defaut_detecte(id_defaut) ON DELETE CASCADE,
    id_machine              INTEGER NOT NULL REFERENCES machine(id_machine),
    date_calcul             TEXT    DEFAULT (datetime('now')),
    drbf_jours              INTEGER,
    drbf_min_jours          INTEGER,
    drbf_max_jours          INTEGER,
    methode_calcul          TEXT    CHECK (methode_calcul IN ('extrapolation','ML','loi_paris','expert','statistique')),
    precision_estimee_pct   REAL,
    date_defaillance_predite TEXT
);

CREATE TABLE alerte (
    id_alerte       INTEGER PRIMARY KEY AUTOINCREMENT,
    id_machine      INTEGER REFERENCES machine(id_machine),
    id_capteur      INTEGER REFERENCES capteur(id_capteur),
    id_defaut       INTEGER REFERENCES defaut_detecte(id_defaut),
    timestamp_alerte TEXT   NOT NULL DEFAULT (datetime('now')),
    niveau          TEXT    CHECK (niveau IN ('info','alerte','critique')),
    type_alerte     TEXT    CHECK (type_alerte IN (
                        'vibratoire','capteur','seuil','anomalie_ml','batterie','communication')),
    titre           TEXT,
    message         TEXT,
    statut          TEXT    DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle','vue','traitee','fermee')),
    assignee_id     INTEGER REFERENCES utilisateur(id_utilisateur),
    date_traitement TEXT
);

-- ── MODULE 5 — MAINTENANCE GMAO ──────────────────────────────────

CREATE TABLE bon_de_travail (
    id_bt                   INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_bt               TEXT    UNIQUE NOT NULL,
    id_machine              INTEGER NOT NULL REFERENCES machine(id_machine),
    id_defaut               INTEGER REFERENCES defaut_detecte(id_defaut),
    type_intervention       TEXT    CHECK (type_intervention IN (
                                'preventif','correctif','conditionnel','predictif')),
    priorite                TEXT    CHECK (priorite IN ('basse','moyenne','haute','urgente')),
    description             TEXT,
    date_creation           TEXT    DEFAULT (datetime('now')),
    date_planifiee          TEXT,
    date_debut_reelle       TEXT,
    date_fin_reelle         TEXT,
    duree_prevue_heures     REAL,
    duree_reelle_heures     REAL,
    statut                  TEXT    DEFAULT 'cree' CHECK (statut IN (
                                'cree','planifie','en_cours','termine','annule')),
    cout_main_oeuvre        REAL,
    cout_pieces             REAL,
    cout_total              REAL,
    technicien_principal_id INTEGER REFERENCES utilisateur(id_utilisateur)
);

CREATE TABLE historique_maintenance (
    id_histo            INTEGER PRIMARY KEY AUTOINCREMENT,
    id_machine          INTEGER NOT NULL REFERENCES machine(id_machine),
    id_bt               INTEGER REFERENCES bon_de_travail(id_bt),
    date_intervention   TEXT    NOT NULL,
    type_intervention   TEXT,
    description_travaux TEXT,
    pieces_remplacees   TEXT,   -- JSON
    duree_arret_heures  REAL,
    defaut_resolu       INTEGER DEFAULT 0  -- BOOLEAN (0/1)
);

CREATE TABLE panne (
    id_panne                    INTEGER PRIMARY KEY AUTOINCREMENT,
    id_machine                  INTEGER NOT NULL REFERENCES machine(id_machine),
    date_debut_panne            TEXT    NOT NULL,
    date_fin_panne              TEXT,
    duree_arret_heures          REAL,
    type_panne                  TEXT    CHECK (type_panne IN ('catastrophique','majeure','mineure')),
    cause_racine                TEXT,
    detection_predictive        INTEGER DEFAULT 0,  -- BOOLEAN
    cout_arret_estime_euros     REAL,
    production_perdue_unites    REAL
);

-- ── MODULE 6 — PERSONNEL ─────────────────────────────────────────

CREATE TABLE certification (
    id_certif               INTEGER PRIMARY KEY AUTOINCREMENT,
    id_utilisateur          INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),
    type_certification      TEXT    CHECK (type_certification IN (
                                'ISO_18436_cat_I','ISO_18436_cat_II',
                                'ISO_18436_cat_III','ISO_18436_cat_IV','autre')),
    date_obtention          TEXT,
    date_expiration         TEXT,
    organisme_certificateur TEXT
);

CREATE TABLE intervention_technicien (
    id_inter                    INTEGER PRIMARY KEY AUTOINCREMENT,
    id_bt                       INTEGER NOT NULL REFERENCES bon_de_travail(id_bt),
    id_utilisateur              INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),
    date_debut                  TEXT,
    date_fin                    TEXT,
    temps_clef_en_main_minutes  INTEGER
);

-- ── MODULE 7 — STOCKS ────────────────────────────────────────────

CREATE TABLE piece_rechange (
    id_piece                        INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_fabricant             TEXT    NOT NULL,
    designation                     TEXT    NOT NULL,
    categorie                       TEXT    CHECK (categorie IN (
                                        'roulement','joint','courroie','filtre','huile','accouplement','autre')),
    prix_unitaire                   REAL,
    delai_approvisionnement_jours   INTEGER,
    fournisseur_principal           TEXT,
    stock_min                       INTEGER,
    stock_actuel                    INTEGER,
    emplacement_magasin             TEXT
);

CREATE TABLE mouvement_stock (
    id_mouvement    INTEGER PRIMARY KEY AUTOINCREMENT,
    id_piece        INTEGER NOT NULL REFERENCES piece_rechange(id_piece),
    date_mouvement  TEXT    NOT NULL DEFAULT (datetime('now')),
    type_mouvement  TEXT    CHECK (type_mouvement IN ('entree','sortie','inventaire')),
    quantite        INTEGER NOT NULL,
    id_bt           INTEGER REFERENCES bon_de_travail(id_bt)
);

-- ── MODULE 8 — KPIs & REPORTING ──────────────────────────────────

CREATE TABLE kpi_journalier (
    id_kpi              INTEGER PRIMARY KEY AUTOINCREMENT,
    date_kpi            TEXT    NOT NULL,
    id_machine          INTEGER REFERENCES machine(id_machine),
    id_atelier          INTEGER REFERENCES atelier(id_atelier),
    id_usine            INTEGER REFERENCES usine(id_usine),
    mtbf_heures         REAL,
    mttr_heures         REAL,
    disponibilite_pct   REAL,
    trs_oee_pct         REAL,
    performance_pct     REAL,
    qualite_pct         REAL,
    nb_alertes          INTEGER DEFAULT 0,
    nb_pannes           INTEGER DEFAULT 0,
    nb_pannes_evitees   INTEGER DEFAULT 0,
    cout_maintenance_jour REAL,
    economies_predictif REAL,
    vrms_moyen          REAL,
    asset_health_index  REAL
);

CREATE TABLE economie_predictive (
    id_economie             INTEGER PRIMARY KEY AUTOINCREMENT,
    id_machine              INTEGER REFERENCES machine(id_machine),
    date_evenement          TEXT    NOT NULL,
    type_economie           TEXT    CHECK (type_economie IN (
                                'panne_evitee','remplacement_optimal','pm_supprimee')),
    montant_economise_euros REAL,
    description             TEXT,
    id_defaut_detecte       INTEGER REFERENCES defaut_detecte(id_defaut)
);

CREATE TABLE incident_securite (
    id_incident                 INTEGER PRIMARY KEY AUTOINCREMENT,
    id_machine                  INTEGER REFERENCES machine(id_machine),
    date_incident               TEXT    NOT NULL,
    type_incident               TEXT    CHECK (type_incident IN (
                                    'incident','quasi_accident','accident_travail')),
    gravite                     INTEGER CHECK (gravite BETWEEN 1 AND 5),
    heures_travaillees_periode  INTEGER
);

-- ── MODULE 9 — DATASETS UPLOADÉS (EDA) ───────────────────────

CREATE TABLE IF NOT EXISTS dataset (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    description     TEXT,
    original_filename TEXT NOT NULL,
    upload_path     TEXT NOT NULL,
    processed_path  TEXT,
    file_type       TEXT,
    file_size_bytes INTEGER,
    n_rows          INTEGER,
    n_cols          INTEGER,
    detected_type   TEXT,
    status          TEXT DEFAULT 'uploaded',
    eda_report_path TEXT,
    eda_results     TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    processed_at    TEXT,
    error_message   TEXT,
    chemin_raw      TEXT,
    chemins_processed TEXT,
    chemin_rapport  TEXT,
    chemins_plots   TEXT,
    taille_octets   INTEGER,
    colonnes_detectees TEXT,
    types_colonnes  TEXT,
    eda_statistiques    TEXT,
    eda_manquants       TEXT,
    eda_correlations    TEXT,
    eda_encodages       TEXT,
    eda_plan_pretraitement TEXT,
    eda_narration_llm   TEXT,
    eda_recommandations TEXT,
    eda_alertes_qualite TEXT,
    compatible_vibration    INTEGER DEFAULT 0,
    compatible_kpi          INTEGER DEFAULT 0,
    compatible_maintenance  INTEGER DEFAULT 0,
    compatible_pronostic    INTEGER DEFAULT 0,
    compatible_iot          INTEGER DEFAULT 0,
    colonnes_manquantes_par_page TEXT,
    date_upload     TEXT DEFAULT (datetime('now')),
    date_traitement TEXT,
    duree_traitement_s REAL
);

-- ================================================================
-- SECTION 3 : INDEX
-- ================================================================

CREATE INDEX idx_machine_atelier       ON machine(id_atelier);
CREATE INDEX idx_machine_statut        ON machine(statut);
CREATE INDEX idx_machine_code          ON machine(code_machine);
CREATE INDEX idx_capteur_machine       ON capteur(id_machine);
CREATE INDEX idx_composant_machine     ON composant(id_machine);
CREATE INDEX idx_mesure_timestamp      ON mesure_globale(timestamp_mesure);
CREATE INDEX idx_mesure_machine        ON mesure_globale(id_machine);
CREATE INDEX idx_mesure_capteur        ON mesure_globale(id_capteur);
CREATE INDEX idx_mesure_zone           ON mesure_globale(zone_iso_calculee);
CREATE INDEX idx_alerte_statut         ON alerte(statut);
CREATE INDEX idx_alerte_timestamp      ON alerte(timestamp_alerte);
CREATE INDEX idx_alerte_niveau         ON alerte(niveau);
CREATE INDEX idx_defaut_machine        ON defaut_detecte(id_machine);
CREATE INDEX idx_defaut_statut         ON defaut_detecte(statut);
CREATE INDEX idx_bt_machine            ON bon_de_travail(id_machine);
CREATE INDEX idx_bt_statut             ON bon_de_travail(statut);
CREATE INDEX idx_kpi_date              ON kpi_journalier(date_kpi);
CREATE INDEX idx_kpi_machine           ON kpi_journalier(id_machine);
CREATE INDEX idx_economie_date         ON economie_predictive(date_evenement);
CREATE INDEX idx_panne_machine         ON panne(id_machine);
CREATE INDEX idx_histo_machine         ON historique_maintenance(id_machine);

-- ================================================================
-- SECTION 4 : TRIGGERS (désactivés — non compatibles SQLite vanilla sur Windows)
-- ================================================================
-- Les triggers ci-dessous sont commentés car ils utilisent des fonctions
-- mathématiques (cos) non disponibles dans le module sqlite3 standard Windows.
-- Ils restent documentés comme référence métier.
/*
-- Trigger 1 : Calcul automatique de zone_iso_calculee
CREATE TRIGGER trg_calcul_zone_iso
BEFORE INSERT ON mesure_globale
FOR EACH ROW
BEGIN
    UPDATE mesure_globale SET zone_iso_calculee = CASE
        WHEN NEW.v_rms_mm_s IS NULL    THEN NULL
        WHEN NEW.v_rms_mm_s < 2.3      THEN 'A'
        WHEN NEW.v_rms_mm_s < 4.5      THEN 'B'
        WHEN NEW.v_rms_mm_s < 7.1      THEN 'C'
        ELSE                                 'D'
    END
    WHERE id_mesure = NEW.id_mesure;
END;

CREATE TRIGGER trg_alerte_zone_d
AFTER INSERT ON mesure_globale
WHEN NEW.zone_iso_calculee = 'D'
BEGIN
    INSERT INTO alerte (id_machine, id_capteur, timestamp_alerte, niveau, type_alerte, titre, message, statut)
    VALUES (
        NEW.id_machine, NEW.id_capteur, datetime('now'), 'critique', 'seuil',
        'ZONE D - Vibration critique',
        'V_RMS = ' || CAST(NEW.v_rms_mm_s AS TEXT) || ' mm/s detecte',
        'nouvelle'
    );
END;

CREATE TRIGGER trg_update_passerelle
AFTER INSERT ON capteur
BEGIN
    UPDATE passerelle_iot
    SET nb_capteurs_connectes = (
        SELECT COUNT(*) FROM capteur c
        JOIN machine m ON c.id_machine = m.id_machine
        WHERE m.id_atelier = (SELECT id_atelier FROM atelier
                              WHERE id_atelier IN (SELECT id_atelier FROM machine WHERE id_machine = NEW.id_machine))
    )
    WHERE id_atelier = (SELECT id_atelier FROM machine WHERE id_machine = NEW.id_machine);
END;
*/

-- Trigger 4 (BPFO/BPFI) commenté — cos() non supporté sur Windows/vanilla SQLite
/*
CREATE TRIGGER trg_calcul_bpfo_bpfi ...
END;
*/

-- ================================================================
-- SECTION 5 : DONNÉES DE TEST
-- ================================================================

-- Entreprise
INSERT INTO entreprise (nom_entreprise, contact_telephone, contact_email, adresse_usine, ville, pays,
    domaine_industriel, descriptif_activite, production_principale, site_web)
VALUES ('Atlas Industries Maroc', '+212 522 450 100', 'maintenance@atlas-industries.ma',
    'Zone Industrielle Sidi Maarouf, Lot 47', 'Casablanca', 'Maroc',
    'agroalimentaire', 'Production, conditionnement et distribution de produits agroalimentaires.',
    'Farines, semoules, huiles végétales, conserves', 'https://www.atlas-industries.ma');

-- Utilisateurs (12 — rôles variés)
INSERT INTO utilisateur (id_entreprise, nom, prenom, email, role, service, date_embauche, statut) VALUES
(1,'Benali','Karim','k.benali@atlas-industries.ma','admin','IT / Maintenance',datetime('now','-5 years'),'actif'),
(1,'Cherkaoui','Samir','s.cherkaoui@atlas-industries.ma','manager_maintenance','Maintenance',datetime('now','-8 years'),'actif'),
(1,'El Idrissi','Nadia','n.elidrissi@atlas-industries.ma','analyste_vibratoire','Bureau Études',datetime('now','-3 years'),'actif'),
(1,'Tazi','Omar','o.tazi@atlas-industries.ma','analyste_vibratoire','Bureau Études',datetime('now','-6 years'),'actif'),
(1,'Bouzidi','Younes','y.bouzidi@atlas-industries.ma','technicien','Atelier A',datetime('now','-4 years'),'actif'),
(1,'Hamidi','Hassan','h.hamidi@atlas-industries.ma','technicien','Atelier B',datetime('now','-2 years'),'actif'),
(1,'Naciri','Fatima','f.naciri@atlas-industries.ma','technicien','Utilités',datetime('now','-7 years'),'actif'),
(1,'Amrani','Bilal','b.amrani@atlas-industries.ma','technicien','Atelier C',datetime('now','-1 years'),'actif'),
(1,'Lahlou','Zineb','z.lahlou@atlas-industries.ma','operateur','Production',datetime('now','-3 years'),'actif'),
(1,'Moussaoui','Amine','a.moussaoui@atlas-industries.ma','operateur','Production',datetime('now','-2 years'),'actif'),
(1,'Berrada','Soumia','s.berrada@atlas-industries.ma','direction','Direction Générale',datetime('now','-10 years'),'actif'),
(1,'Khatib','Rachid','r.khatib@atlas-industries.ma','manager_maintenance','Tanger',datetime('now','-6 years'),'actif');

-- Certifications ISO 18436 (8 utilisateurs certifiés)
INSERT INTO certification (id_utilisateur, type_certification, date_obtention, date_expiration, organisme_certificateur) VALUES
(3,'ISO_18436_cat_III',datetime('now','-2 years'),datetime('now','3 years'),'COMADEM France'),
(4,'ISO_18436_cat_II',datetime('now','-4 years'),datetime('now','1 year'),'BINDT UK'),
(5,'ISO_18436_cat_I',datetime('now','-1 years'),datetime('now','2 years'),'CETIM Maroc'),
(6,'ISO_18436_cat_I',datetime('now','-1 years'),datetime('now','2 years'),'CETIM Maroc'),
(7,'ISO_18436_cat_II',datetime('now','-3 years'),datetime('now','0 years'),'BINDT UK'),
(8,'ISO_18436_cat_I',datetime('now','-0 years'),datetime('now','3 years'),'CETIM Maroc'),
(2,'ISO_18436_cat_II',datetime('now','-5 years'),datetime('now','0 years'),'COMADEM France'),
(12,'ISO_18436_cat_I',datetime('now','-2 years'),datetime('now','1 year'),'CETIM Maroc');

-- Usines (2)
INSERT INTO usine (id_entreprise, nom_usine, adresse, ville, pays, latitude, longitude, responsable_site, nombre_employes) VALUES
(1,'Usine Casablanca','Zone Industrielle Sidi Maarouf, Lot 47','Casablanca','Maroc',33.5731,-7.5898,'Cherkaoui Samir',340),
(1,'Usine Tanger','Zone Franche de Tanger, Parcelle 12','Tanger','Maroc',35.7595,-5.8340,'Khatib Rachid',180);

-- Ateliers (6 — Casablanca: 5, Tanger: 1)
INSERT INTO atelier (id_usine, nom_atelier, description, responsable_atelier) VALUES
(1,'Atelier A','Ligne de production farine et semoule','Bouzidi Younes'),
(1,'Atelier B','Conditionnement et emballage','Hamidi Hassan'),
(1,'Atelier C','Extraction et raffinage huiles','Amrani Bilal'),
(1,'Utilités','Centrale vapeur, air comprimé, eau glacée','Naciri Fatima'),
(1,'Conditionnement','Palettisation et expédition','Lahlou Zineb'),
(2,'Atelier Tanger','Production multi-lignes Tanger','Khatib Rachid');

-- Classes ISO (seuils réalistes pour pompes/compresseurs/ventilateurs)
INSERT INTO classe_iso (norme, groupe, type_machine, puissance_min_kw, puissance_max_kw,
    seuil_zone_A_max, seuil_zone_B_max, seuil_zone_C_max, seuil_zone_D_min, unite) VALUES
('ISO 10816','Groupe 1','machines >15kW sur socle rigide',15,NULL,   2.3,4.5,7.1,7.1,'mm/s'),
('ISO 10816','Groupe 2','machines >15kW sur socle souple',15,NULL,   3.5,7.1,11.0,11.0,'mm/s'),
('ISO 10816','Groupe 3','pompes à accouplements',NULL,NULL,            2.3,4.5,7.1,7.1,'mm/s'),
('ISO 20816','Classe I','machines <15kW',NULL,15,                     0.71,1.8,4.5,4.5,'mm/s'),
('ISO 20816','Classe II','machines 15-75kW',15,75,                    1.12,2.8,7.1,7.1,'mm/s'),
('ISO 20816','Classe III','machines >75kW socle rigide',75,NULL,      1.8,4.5,7.1,7.1,'mm/s'),
('ISO 20816','Classe IV','machines >75kW socle souple',75,NULL,       2.8,7.1,11.0,11.0,'mm/s');

-- Catégories vibratoires
INSERT INTO categorie_vis (code, libelle, description, frequence_surveillance_recommandee_jours) VALUES
('V','Vitale (V)','Machine critique — arrêt production si défaillance',7),
('I','Importante (I)','Machine importante — impact significatif',30),
('S','Standard (S)','Machine standard — impact limité',90);

-- Machines (12 représentatives — mix V/I/S)
INSERT INTO machine (id_atelier, id_classe_iso, id_categorie_vis, code_machine, nom_machine, type_machine,
    fabricant, modele, numero_serie, annee_mise_en_service, puissance_kw,
    vitesse_rotation_nominale_rpm, role_machine, valeur_remplacement_euros,
    cout_arret_horaire_euros, statut) VALUES
-- Atelier A (vitales et importantes)
(1,3,1,'P-204','Pompe alimentation broyeur A','pompe_centrifuge','Grundfos','CR 32-4','GF2041',2018,37.0,1480,'Alimente en eau le broyeur principal Atelier A',28000,1800,'en_service'),
(1,1,1,'C-118','Compresseur air procédé A','compresseur','Atlas Copco','GA 75','AC2018B',2019,75.0,2980,'Fournit l''air comprimé à 8 bar pour Atelier A',95000,2400,'en_service'),
(1,3,2,'P-156','Pompe recyclage A','pompe_centrifuge','KSB','Etanorm 40-250','KSB201',2020,22.0,1450,'Recyclage des eaux de process Atelier A',18000,900,'en_service'),
(1,2,2,'V-302','Ventilateur aspiration broyeur','ventilateur','ABB','M3BP 200','AB3022',2017,55.0,1480,'Aspiration des poussières fines Atelier A',42000,1200,'en_service'),
(1,1,2,'M-019','Moteur broyeur principal','moteur_electrique','Siemens','1LE1001','SM0198',2016,110.0,1480,'Entraîne le broyeur à marteaux',85000,2200,'en_service'),
-- Atelier B
(2,3,2,'P-211','Pompe lubrification ligne B','pompe_centrifuge','Grundfos','CM 5-6','GF2112',2021,5.5,2900,'Lubrification des lignes de conditionnement',8000,600,'en_service'),
(2,2,3,'R-077','Réducteur convoyeur B','reducteur','Siemens','H2SH10','SIE077',2015,30.0,750,'Réducteur principal du convoyeur Atelier B',35000,800,'en_service'),
-- Atelier C
(3,1,1,'C-201','Compresseur extraction huile','compresseur','Atlas Copco','ZR 55','AC2019C',2019,55.0,2980,'Air procédé extraction par solvant',72000,2000,'en_service'),
(3,3,2,'P-318','Pompe transfert huile brute','pompe_centrifuge','KSB','Megachem 50-200','KSB318',2020,15.0,1450,'Transfert huile de palme brute vers raffinerie',14000,700,'en_service'),
-- Utilités
(4,2,1,'C-104','Compresseur central utilités','compresseur','Atlas Copco','GA 110','AC2017U',2017,110.0,2980,'Alimentation air comprimé réseau général usine',120000,3000,'en_service'),
(4,3,2,'P-101','Pompe eau glacée','pompe_centrifuge','Grundfos','TP 100-360','GF1011',2018,18.5,1480,'Refroidissement process et HVAC',15000,500,'en_service'),
-- Tanger
(6,1,2,'C-501','Compresseur Tanger principal','compresseur','Atlas Copco','GA 55','AC2020T',2020,55.0,2980,'Air comprimé usine Tanger',68000,1500,'en_service');

-- Passerelles IoT (une par atelier avec machines)
INSERT INTO passerelle_iot (id_atelier, code_passerelle, adresse_ip, protocole, nb_capteurs_connectes, statut, derniere_communication) VALUES
(1,'GW-A001','192.168.10.11','MQTT',18,'actif',datetime('now','-0.02 hours')),
(2,'GW-B001','192.168.10.12','MQTT',8,'actif',datetime('now','-0.05 hours')),
(3,'GW-C001','192.168.10.13','OPC_UA',12,'actif',datetime('now','-0.01 hours')),
(4,'GW-U001','192.168.10.14','MQTT',10,'actif',datetime('now','-0.1 hours')),
(5,'GW-E001','192.168.10.15','HTTP',4,'actif',datetime('now','-1 hours')),
(6,'GW-T001','192.168.20.11','MQTT',6,'actif',datetime('now','-0.03 hours'));

-- Capteurs (2-4 par machine pour données de test)
INSERT INTO capteur (id_machine, code_capteur, type_capteur, marque, modele, position_montage,
    direction_mesure, gamme_freq_min_hz, gamme_freq_max_hz, unite_mesure,
    date_installation, date_derniere_calibration, niveau_batterie_pct, statut) VALUES
-- P-204 (machine id=1 — défaut BPFI critique)
(1,'A-001','accelerometre','SKF','CMSS 2200','Palier côté accouplement','radiale_horizontale',2,10000,'m/s²',datetime('now','-3 years'),datetime('now','-0.5 years'),85,'actif'),
(1,'A-002','accelerometre','SKF','CMSS 2200','Palier côté libre','radiale_verticale',2,10000,'m/s²',datetime('now','-3 years'),datetime('now','-0.5 years'),82,'actif'),
(1,'T-001','thermique','Fluke','80PK-27','Carter roulement DE','axiale',0,100,'°C',datetime('now','-3 years'),datetime('now','-1 year'),90,'actif'),
-- C-118 (machine id=2 — désalignement critique)
(2,'A-003','accelerometre','SKF','CMSS 2200','Sortie compresseur','radiale_horizontale',2,10000,'m/s²',datetime('now','-4 years'),datetime('now','-1 year'),78,'actif'),
(2,'A-004','accelerometre','FAG','VibStic','Moteur côté charge','radiale_verticale',2,10000,'m/s²',datetime('now','-4 years'),datetime('now','-1 year'),91,'actif'),
(2,'T-002','thermique','Fluke','80PK-27','Palier moteur DE','axiale',0,100,'°C',datetime('now','-4 years'),datetime('now','-1 year'),95,'actif'),
-- R-077 (machine id=7 — défaut GMF)
(7,'A-005','accelerometre','SKF','CMSS 2200','Entrée réducteur','axiale',2,10000,'m/s²',datetime('now','-5 years'),datetime('now','-1 year'),67,'actif'),
(7,'A-006','accelerometre','SKF','CMSS 2200','Sortie réducteur','radiale_horizontale',2,10000,'m/s²',datetime('now','-5 years'),datetime('now','-1 year'),70,'actif'),
-- V-302 (machine id=4 — balourd)
(4,'A-007','accelerometre','FAG','VibStic','Palier ventilateur','radiale_horizontale',2,10000,'m/s²',datetime('now','-4 years'),datetime('now','-0.5 years'),88,'actif'),
(4,'A-008','accelerometre','FAG','VibStic','Palier moteur','radiale_verticale',2,10000,'m/s²',datetime('now','-4 years'),datetime('now','-0.5 years'),92,'actif'),
-- M-019 (machine id=5 — défaut électrique)
(5,'A-009','accelerometre','SKF','CMSS 2200','Côté charge','radiale_horizontale',2,10000,'m/s²',datetime('now','-5 years'),datetime('now','-0.5 years'),55,'batterie_faible'),
(5,'A-010','accelerometre','SKF','CMSS 2200','Côté opposé charge','axiale',2,10000,'m/s²',datetime('now','-5 years'),datetime('now','-0.5 years'),60,'actif'),
-- P-156 (machine id=3 — cavitation)
(3,'A-011','accelerometre','SKF','CMSS 2200','Refoulement','radiale_horizontale',2,25000,'m/s²',datetime('now','-2 years'),datetime('now','-0.5 years'),95,'actif'),
(3,'T-003','thermique','Fluke','80PK-27','Corps pompe','axiale',0,100,'°C',datetime('now','-2 years'),datetime('now','-0.5 years'),89,'actif'),
-- Autres machines
(6,'A-012','accelerometre','SKF','CMSS 2200','Palier pompe B','radiale_horizontale',2,10000,'m/s²',datetime('now','-2 years'),datetime('now','-0.5 years'),97,'actif'),
(8,'A-013','accelerometre','FAG','VibStic','Sortie compresseur C','radiale_horizontale',2,10000,'m/s²',datetime('now','-3 years'),datetime('now','-1 year'),83,'actif'),
(10,'A-014','accelerometre','SKF','CMSS 2200','Palier central','radiale_horizontale',2,10000,'m/s²',datetime('now','-5 years'),datetime('now','-1 year'),74,'actif'),
(11,'A-015','accelerometre','Kistler','8640A5','Aspiration pompe','radiale_verticale',2,10000,'m/s²',datetime('now','-4 years'),datetime('now','-1 year'),88,'actif');

-- Composants roulements (BPFO/BPFI calculés par trigger — n=8, d=12mm, D=60mm, alpha=0)
INSERT INTO composant (id_machine, type_composant, reference_fabricant, position,
    date_installation, duree_vie_theorique_heures,
    nb_billes, diametre_billes_mm, diametre_primitif_mm, angle_contact_deg) VALUES
(1,'roulement','SKF 6309','Palier DE pompe P-204',datetime('now','-1 year'),26280,8,12.0,60.0,0.0),
(1,'roulement','SKF 6307','Palier NDE pompe P-204',datetime('now','-1 year'),26280,8,11.0,55.0,0.0),
(2,'roulement','FAG NU 319','Palier compresseur C-118',datetime('now','-2 years'),35040,9,14.0,72.0,0.0),
(7,'roulement','SKF 22220','Entrée réducteur R-077',datetime('now','-3 years'),52560,14,20.0,100.0,15.0),
(4,'roulement','FAG 6312','Palier ventilateur V-302',datetime('now','-2 years'),26280,8,12.0,60.0,0.0);

-- Seuils alarme (personnalisés pour les machines critiques)
INSERT INTO seuil_alarme (id_machine, id_capteur, type_indicateur, valeur_reference, valeur_alerte, valeur_danger, methode_definition) VALUES
(1,1,'v_rms_mm_s',1.8,4.5,7.1,'ISO'),
(1,1,'kurtosis',3.0,5.0,8.0,'statistique'),
(2,3,'v_rms_mm_s',2.1,4.5,7.1,'ISO'),
(7,5,'v_rms_mm_s',2.5,4.5,7.1,'ISO'),
(4,7,'v_rms_mm_s',1.9,4.5,7.1,'ISO'),
(5,9,'v_rms_mm_s',1.7,4.5,7.1,'ISO'),
(10,14,'v_rms_mm_s',3.0,7.1,11.0,'ISO');

-- Défauts détectés (7 actifs)
INSERT INTO defaut_detecte (id_machine, id_composant, type_defaut, date_premiere_detection,
    gravite, stade_degradation, confiance_diagnostic_pct, statut, commentaire_analyste) VALUES
(1,1,'BPFI',datetime('now','-18 days'),5,3,94.2,'actif','Progression rapide — stade 3 confirmé. DRBF estimé 4 jours.'),
(2,NULL,'desalignement_parallele',datetime('now','-30 days'),5,4,97.5,'actif','Désalignement sévère côté accouplement. V_RMS 11.4 mm/s zone D.'),
(7,4,'GMF',datetime('now','-45 days'),3,2,82.0,'actif','Bandes latérales GMF détectées. Engrenage à surveiller.'),
(4,5,'balourd',datetime('now','-22 days'),3,2,88.5,'actif','Composante 1×fr prédominante. Rééquilibrage prévu.'),
(5,NULL,'defaut_electrique',datetime('now','-12 days'),3,1,75.0,'actif','Pic à 100 Hz d''origine électrique. Vérifier alimentation.'),
(3,NULL,'cavitation',datetime('now','-60 days'),2,1,68.0,'en_observation','Transitoires HF en aspiration. Niveau bague à vérifier.'),
(10,NULL,'desalignement_angulaire',datetime('now','-8 days'),2,1,71.0,'actif','Stade naissant détecté. Alignement laser planifié.');

-- Pronostics DRBF
INSERT INTO pronostic_drbf (id_defaut, id_machine, drbf_jours, drbf_min_jours, drbf_max_jours,
    methode_calcul, precision_estimee_pct, date_defaillance_predite) VALUES
(1,1,4,2,7,'ML',87.0,datetime('now','4 days')),
(2,2,0,0,1,'extrapolation',92.0,datetime('now','0 days')),
(3,7,35,25,50,'extrapolation',74.0,datetime('now','35 days')),
(4,4,28,20,40,'expert',80.0,datetime('now','28 days')),
(5,5,60,40,90,'expert',65.0,datetime('now','60 days')),
(6,3,120,80,180,'statistique',55.0,datetime('now','120 days')),
(7,10,45,30,70,'extrapolation',68.0,datetime('now','45 days'));

-- Alertes actives
INSERT INTO alerte (id_machine, id_capteur, id_defaut, timestamp_alerte, niveau, type_alerte, titre, message, statut) VALUES
(1,1,1,datetime('now','-2 hours'),'critique','vibratoire','ZONE D — P-204 BPFI stade 3','V_RMS = 9.8 mm/s — DRBF 4 jours. Arrêt programmé urgent.','nouvelle'),
(2,3,2,datetime('now','-4 hours'),'critique','vibratoire','ZONE D — C-118 Désalignement','V_RMS = 11.4 mm/s. Arrêt immédiat recommandé.','nouvelle'),
(7,5,3,datetime('now','-6 hours'),'alerte','vibratoire','ZONE C — R-077 GMF','V_RMS = 7.2 mm/s. Bandes latérales GMF confirmées.','vue'),
(4,7,4,datetime('now','-8 hours'),'alerte','vibratoire','ZONE C — V-302 Balourd','V_RMS = 5.8 mm/s. 1×fr prédominant. Rééquilibrage requis.','vue'),
(5,9,5,datetime('now','-10 hours'),'alerte','vibratoire','ZONE C — M-019 Défaut électrique','V_RMS = 4.9 mm/s. Pic 100 Hz détecté.','traitee'),
(5,9,NULL,datetime('now','-1 hours'),'alerte','batterie','Batterie faible — capteur A-009','Niveau batterie : 55%. Remplacement requis sous 30 jours.','nouvelle'),
(3,11,6,datetime('now','-12 hours'),'info','vibratoire','ZONE B — P-156 Cavitation','V_RMS = 3.4 mm/s. Transitoires HF. Surveillance renforcée.','traitee');

-- Bons de travail
INSERT INTO bon_de_travail (numero_bt, id_machine, id_defaut, type_intervention, priorite, description,
    date_planifiee, duree_prevue_heures, statut, technicien_principal_id) VALUES
('BT-2026-0041',1,1,'predictif','urgente','Remplacement roulement palier DE pompe P-204 — BPFI stade 3',datetime('now','3 days'),4.0,'planifie',5),
('BT-2026-0042',2,2,'correctif','urgente','Réalignement laser compresseur C-118 — désalignement critique',datetime('now','0 days'),6.0,'en_cours',5),
('BT-2026-0043',7,3,'predictif','haute','Inspection engrenages réducteur R-077',datetime('now','10 days'),3.0,'planifie',6),
('BT-2026-0044',4,4,'predictif','haute','Rééquilibrage ventilateur V-302',datetime('now','7 days'),2.5,'planifie',7),
('BT-2026-0045',5,5,'conditionnel','moyenne','Vérification alimentation électrique M-019',datetime('now','5 days'),2.0,'cree',6),
('BT-2026-0040',10,7,'preventif','moyenne','Alignement laser compresseur C-104',datetime('now','14 days'),3.0,'planifie',7);

-- Historique maintenance (pannes évitées et interventions passées)
INSERT INTO historique_maintenance (id_machine, id_bt, date_intervention, type_intervention,
    description_travaux, duree_arret_heures, defaut_resolu) VALUES
(1,NULL,datetime('now','-90 days'),'preventif','Remplacement roulement palier NDE selon planning',3.5,1),
(2,NULL,datetime('now','-120 days'),'correctif','Réalignement suite à bruit anormal',5.0,1),
(7,NULL,datetime('now','-180 days'),'preventif','Vidange huile et contrôle jeux réducteur',2.0,1),
(4,NULL,datetime('now','-60 days'),'preventif','Équilibrage ventilateur — balourd niveau 2',3.0,1),
(10,NULL,datetime('now','-45 days'),'preventif','Lubrification et contrôle vibratoire général',1.5,1),
(5,NULL,datetime('now','-30 days'),'correctif','Remplacement condensateurs moteur M-019',2.0,0);

-- Pannes (historique)
INSERT INTO panne (id_machine, date_debut_panne, date_fin_panne, duree_arret_heures,
    type_panne, cause_racine, detection_predictive, cout_arret_estime_euros, production_perdue_unites) VALUES
(2,datetime('now','-180 days'),datetime('now','-179 days'),22.5,'majeure','Défaillance roulement — absence de surveillance',0,54000,450),
(7,datetime('now','-365 days'),datetime('now','-364 days'),31.0,'catastrophique','Rupture dent engrenage — surcharge non détectée',0,24800,310),
(10,datetime('now','-90 days'),datetime('now','-89 days'),8.5,'mineure','Joint défaillant — fuite huile',0,25500,85),
(4,datetime('now','-270 days'),datetime('now','-269 days'),14.0,'majeure','Balourd excessif — défaillance palier',0,16800,140);

-- Pièces de rechange (stock)
INSERT INTO piece_rechange (reference_fabricant, designation, categorie, prix_unitaire,
    delai_approvisionnement_jours, fournisseur_principal, stock_min, stock_actuel, emplacement_magasin) VALUES
('SKF 6309','Roulement à billes SKF 6309','roulement',185.0,7,'SKF Maroc',2,4,'A-02'),
('SKF 6307','Roulement à billes SKF 6307','roulement',145.0,7,'SKF Maroc',2,3,'A-02'),
('FAG NU319','Roulement à rouleaux FAG NU 319','roulement',320.0,14,'FAG Casablanca',1,2,'A-03'),
('SKF 22220','Roulement à rotule SKF 22220','roulement',480.0,21,'SKF Maroc',1,1,'A-04'),
('FAG 6312','Roulement à billes FAG 6312','roulement',210.0,7,'FAG Casablanca',2,3,'A-02'),
('GRUNDFOS KIT-204','Kit joints mécaniques Grundfos CR 32','joint',95.0,5,'Grundfos MA',3,8,'B-01'),
('ACCOUPLMT-118','Accouplement élastique C-118','accouplement',560.0,30,'Atlas Copco MA',1,1,'C-05'),
('FILTRE-GA75','Filtre à air GA 75','filtre',45.0,3,'Atlas Copco MA',4,12,'C-01'),
('HUILE-ISO46','Huile hydraulique ISO VG 46 — bidon 20L','huile',85.0,2,'Total Maroc',5,18,'D-01'),
('COURROIE-V-302','Courroie trapézoïdale V-302 SPA-1800','courroie',38.0,5,'Fenner MA',4,10,'B-03');

-- Mouvements stock
INSERT INTO mouvement_stock (id_piece, date_mouvement, type_mouvement, quantite, id_bt) VALUES
(1,datetime('now','-90 days'),'sortie',1,NULL),
(6,datetime('now','-45 days'),'sortie',2,NULL),
(8,datetime('now','-7 days'),'entree',6,NULL),
(9,datetime('now','-3 days'),'entree',10,NULL),
(1,datetime('now'),'entree',2,NULL),
(7,datetime('now','-120 days'),'sortie',1,NULL);

-- KPI journaliers (30 derniers jours — global usine)
INSERT INTO kpi_journalier (date_kpi, id_usine, mtbf_heures, mttr_heures, disponibilite_pct,
    trs_oee_pct, performance_pct, qualite_pct, nb_alertes, nb_pannes, nb_pannes_evitees,
    cout_maintenance_jour, economies_predictif, vrms_moyen, asset_health_index)
WITH RECURSIVE jours(j) AS (
    SELECT 0 UNION ALL SELECT j+1 FROM jours WHERE j < 29
)
SELECT
    date(datetime('now', '-' || j || ' days')),
    1,
    420 + (j % 3)*12,
    3.0 + (j % 2)*0.4,
    96.0 + (j % 5)*0.1,
    87.0 + (j % 4)*0.3,
    91.5 + (j % 3)*0.2,
    99.1 + (j % 4)*0.05,
    2 + (j % 4),
    CASE WHEN j % 15 = 0 THEN 1 ELSE 0 END,
    CASE WHEN j % 5 = 0 THEN 1 ELSE 0 END,
    4500 + (j % 7)*300,
    12000 + (j % 5)*2000,
    2.8 + (j % 10)*0.15,
    78.0 + (j % 6)*1.2
FROM jours;

-- Économies prédictives (23 pannes évitées YTD — total ≈ 847 000 €)
INSERT INTO economie_predictive (id_machine, date_evenement, type_economie, montant_economise_euros, description, id_defaut_detecte) VALUES
(1,datetime('now','-5 days'),'panne_evitee',54000,'Roulement P-204 remplacé avant défaillance — BPFI stade 3 détecté',1),
(2,datetime('now','-2 days'),'panne_evitee',120000,'Désalignement C-118 corrigé avant casse accouplement',2),
(7,datetime('now','-30 days'),'remplacement_optimal',38000,'Roulement R-077 remplacé en pleine fenêtre optimale',3),
(4,datetime('now','-15 days'),'panne_evitee',45000,'Balourd V-302 corrigé avant défaillance palier',4),
(10,datetime('now','-40 days'),'pm_supprimee',18000,'Maintenance préventive C-104 annulée — état bon confirmé',NULL),
(5,datetime('now','-8 days'),'panne_evitee',62000,'Défaut électrique M-019 traité avant défaillance moteur',5),
(3,datetime('now','-55 days'),'remplacement_optimal',22000,'Joint P-156 remplacé avant fuite majeure',6),
(8,datetime('now','-70 days'),'panne_evitee',95000,'Roulement C-201 remplacé — détection précoce BPFO',NULL),
(11,datetime('now','-80 days'),'panne_evitee',28000,'Pompe P-101 — cavitation traitée avant défaillance',NULL),
(2,datetime('now','-100 days'),'remplacement_optimal',42000,'Courroie C-118 remplacée en fenêtre optimale',NULL),
(7,datetime('now','-110 days'),'panne_evitee',75000,'Engrenages R-077 inspectés — usure anormale stoppée',3),
(4,datetime('now','-120 days'),'pm_supprimee',15000,'PM trimestrielle V-302 annulée — état vibratoire nominal',NULL),
(10,datetime('now','-130 days'),'panne_evitee',88000,'Joint C-104 remplacé avant panne majeure',NULL),
(1,datetime('now','-140 days'),'remplacement_optimal',31000,'Roulement P-204 — remplacement anticipé optimal',NULL),
(5,datetime('now','-150 days'),'panne_evitee',48000,'Condensateur M-019 — défaut électrique traité',NULL),
(8,datetime('now','-160 days'),'pm_supprimee',12000,'PM annuelle C-201 réduite — monitoring OK',NULL),
(3,datetime('now','-170 days'),'panne_evitee',35000,'Bague P-156 remplacée avant défaillance cavitation',NULL),
(11,datetime('now','-180 days'),'remplacement_optimal',19000,'Pompe P-101 — impulseur remplacé à temps',NULL),
(6,datetime('now','-190 days'),'panne_evitee',27000,'P-211 — joint défaillant remplacé avant fuite',NULL),
(9,datetime('now','-200 days'),'panne_evitee',41000,'P-318 — roulement remplacé avant défaillance',NULL),
(12,datetime('now','-210 days'),'remplacement_optimal',18000,'C-501 Tanger — filtre remplacé optimalement',NULL),
(10,datetime('now','-220 days'),'panne_evitee',56000,'C-104 — accouplement remplacé avant rupture',NULL),
(2,datetime('now','-230 days'),'pm_supprimee',13000,'PM mensuelle C-118 allégée — monitoring vibratoire OK',NULL);

-- Mesures globales (90 jours × 24h pour P-204 et C-118 — ~4320 mesures chacun)
WITH RECURSIVE heures(h) AS (
    SELECT 0 UNION ALL SELECT h+1 FROM heures WHERE h < 2159
)
INSERT INTO mesure_globale (id_capteur, id_machine, timestamp_mesure, v_rms_mm_s, a_rms_g, a_peak_g,
    kurtosis, temperature_c, vitesse_rotation_rpm, zone_iso_calculee, statut_alarme)
SELECT
    1,  -- capteur A-001 de P-204
    1,  -- machine P-204
    datetime('now', '-' || (h/24) || ' days', '-' || (h%24) || ' hours'),
    -- V_RMS augmente progressivement : 1.8 → 9.8 sur 90 jours
    1.8 + (h / 2159.0) * 8.0 + (abs(((h * 7) % 19) - 9)) * 0.08,
    0.3 + (h / 2159.0) * 2.2,
    1.2 + (h / 2159.0) * 8.5,
    3.0 + (h / 2159.0) * 5.0,
    52.0 + (h / 2159.0) * 12.0,
    1480.0 + (h % 5)*0.5,
    CASE
        WHEN (1.8 + (h / 2159.0) * 8.0) < 2.3  THEN 'A'
        WHEN (1.8 + (h / 2159.0) * 8.0) < 4.5  THEN 'B'
        WHEN (1.8 + (h / 2159.0) * 8.0) < 7.1  THEN 'C'
        ELSE 'D'
    END,
    CASE
        WHEN (1.8 + (h / 2159.0) * 8.0) < 4.5  THEN 'normal'
        WHEN (1.8 + (h / 2159.0) * 8.0) < 7.1  THEN 'alerte'
        ELSE 'danger'
    END
FROM heures;

-- C-118 (capteur A-003, machine id=2) — désalignement progressif
WITH RECURSIVE heures(h) AS (
    SELECT 0 UNION ALL SELECT h+1 FROM heures WHERE h < 2159
)
INSERT INTO mesure_globale (id_capteur, id_machine, timestamp_mesure, v_rms_mm_s, a_rms_g, a_peak_g,
    kurtosis, temperature_c, vitesse_rotation_rpm, zone_iso_calculee, statut_alarme)
SELECT
    3,  -- capteur A-003 de C-118
    2,  -- machine C-118
    datetime('now', '-' || (h/24) || ' days', '-' || (h%24) || ' hours'),
    2.1 + (h / 2159.0) * 9.3 + (abs(((h * 11) % 17) - 8)) * 0.1,
    0.4 + (h / 2159.0) * 3.1,
    1.5 + (h / 2159.0) * 10.2,
    3.2 + (h / 2159.0) * 2.8,
    58.0 + (h / 2159.0) * 15.0,
    2980.0 + (h % 3)*1.0,
    CASE
        WHEN (2.1 + (h / 2159.0) * 9.3) < 2.3  THEN 'A'
        WHEN (2.1 + (h / 2159.0) * 9.3) < 4.5  THEN 'B'
        WHEN (2.1 + (h / 2159.0) * 9.3) < 7.1  THEN 'C'
        ELSE 'D'
    END,
    CASE
        WHEN (2.1 + (h / 2159.0) * 9.3) < 4.5  THEN 'normal'
        WHEN (2.1 + (h / 2159.0) * 9.3) < 7.1  THEN 'alerte'
        ELSE 'danger'
    END
FROM heures;

-- Incidents sécurité
INSERT INTO incident_securite (id_machine, date_incident, type_incident, gravite, heures_travaillees_periode) VALUES
(2,datetime('now','-200 days'),'quasi_accident',2,15600),
(7,datetime('now','-365 days'),'incident',1,8760),
(4,datetime('now','-150 days'),'incident',1,12000);

-- ================================================================
-- SECTION 6 : VUES SQL POUR LE DASHBOARD
-- ================================================================

-- Vue 1 : Dashboard global (indicateurs parc complet)
CREATE VIEW IF NOT EXISTS v_dashboard_global AS
SELECT
    (SELECT COUNT(*) FROM machine WHERE statut = 'en_service')          AS machines_actives,
    (SELECT COUNT(*) FROM machine)                                       AS machines_total,
    (SELECT COUNT(*) FROM alerte WHERE statut = 'nouvelle')             AS alertes_nouvelles,
    (SELECT COUNT(*) FROM alerte WHERE niveau = 'critique' AND statut != 'fermee') AS alertes_critiques,
    (SELECT COUNT(*) FROM defaut_detecte WHERE statut = 'actif')        AS defauts_actifs,
    (SELECT ROUND(AVG(disponibilite_pct),1) FROM kpi_journalier WHERE date_kpi >= date('now','-7 days')) AS disponibilite_7j_pct,
    (SELECT ROUND(AVG(trs_oee_pct),1)       FROM kpi_journalier WHERE date_kpi >= date('now','-7 days')) AS oee_7j_pct,
    (SELECT ROUND(AVG(mtbf_heures),0)       FROM kpi_journalier WHERE date_kpi >= date('now','-30 days')) AS mtbf_30j_heures,
    (SELECT ROUND(AVG(mttr_heures),1)       FROM kpi_journalier WHERE date_kpi >= date('now','-30 days')) AS mttr_30j_heures,
    (SELECT ROUND(SUM(montant_economise_euros)/1000,0) FROM economie_predictive WHERE strftime('%Y', date_evenement) = strftime('%Y','now')) AS economies_ytd_k_euros,
    (SELECT COUNT(*) FROM economie_predictive WHERE strftime('%Y', date_evenement) = strftime('%Y','now') AND type_economie = 'panne_evitee') AS pannes_evitees_ytd,
    (SELECT COUNT(*) FROM capteur WHERE statut != 'actif')              AS capteurs_en_anomalie,
    (SELECT COUNT(*) FROM capteur)                                      AS capteurs_total;

-- Vue 2 : Machines à risque (DRBF croissant)
CREATE VIEW IF NOT EXISTS v_machines_a_risque AS
SELECT
    m.code_machine,
    m.nom_machine,
    m.type_machine,
    m.statut         AS statut_machine,
    d.type_defaut,
    d.stade_degradation,
    d.gravite,
    p.drbf_jours,
    p.date_defaillance_predite,
    p.methode_calcul,
    mg.v_rms_mm_s    AS vrms_derniere,
    mg.zone_iso_calculee
FROM pronostic_drbf p
JOIN defaut_detecte d  ON p.id_defaut  = d.id_defaut
JOIN machine m         ON p.id_machine = m.id_machine
LEFT JOIN (
    SELECT id_machine, v_rms_mm_s, zone_iso_calculee,
           ROW_NUMBER() OVER (PARTITION BY id_machine ORDER BY timestamp_mesure DESC) AS rn
    FROM mesure_globale
) mg ON mg.id_machine = m.id_machine AND mg.rn = 1
WHERE d.statut = 'actif'
ORDER BY p.drbf_jours ASC;

-- Vue 3 : Alertes actives (24h)
CREATE VIEW IF NOT EXISTS v_alertes_actives AS
SELECT
    a.id_alerte,
    a.timestamp_alerte,
    a.niveau,
    a.type_alerte,
    a.titre,
    a.message,
    a.statut,
    m.code_machine,
    m.nom_machine,
    c.code_capteur
FROM alerte a
LEFT JOIN machine m ON a.id_machine = m.id_machine
LEFT JOIN capteur c ON a.id_capteur = c.id_capteur
WHERE a.statut IN ('nouvelle','vue')
  AND a.timestamp_alerte >= datetime('now', '-24 hours')
ORDER BY
    CASE a.niveau WHEN 'critique' THEN 1 WHEN 'alerte' THEN 2 ELSE 3 END,
    a.timestamp_alerte DESC;

-- Vue 4 : KPI Revenue Recovery (ROI et économies par mois)
CREATE VIEW IF NOT EXISTS v_kpi_revenue_recovery AS
SELECT
    strftime('%Y-%m', date_evenement)       AS mois,
    COUNT(*)                                AS nb_evenements,
    SUM(montant_economise_euros)            AS total_economise_euros,
    SUM(CASE WHEN type_economie = 'panne_evitee'           THEN montant_economise_euros ELSE 0 END) AS pannes_evitees_euros,
    SUM(CASE WHEN type_economie = 'remplacement_optimal'   THEN montant_economise_euros ELSE 0 END) AS remplacement_optimal_euros,
    SUM(CASE WHEN type_economie = 'pm_supprimee'           THEN montant_economise_euros ELSE 0 END) AS pm_supprimees_euros
FROM economie_predictive
GROUP BY strftime('%Y-%m', date_evenement)
ORDER BY mois DESC;

-- Vue 5 : Asset Availability (OEE / MTBF / MTTR par machine sur 30j)
CREATE VIEW IF NOT EXISTS v_kpi_asset_availability AS
SELECT
    m.code_machine,
    m.nom_machine,
    m.statut,
    ROUND(AVG(k.mtbf_heures), 0)       AS mtbf_moyen_heures,
    ROUND(AVG(k.mttr_heures), 1)       AS mttr_moyen_heures,
    ROUND(AVG(k.disponibilite_pct), 1) AS disponibilite_moy_pct,
    ROUND(AVG(k.trs_oee_pct), 1)       AS oee_moyen_pct,
    ROUND(SUM(k.economies_predictif)/1000, 0) AS economies_30j_k_euros
FROM kpi_journalier k
JOIN machine m ON k.id_machine = m.id_machine
WHERE k.date_kpi >= date('now', '-30 days')
GROUP BY m.id_machine
ORDER BY disponibilite_moy_pct ASC;

-- Vue 6 : État santé réseau capteurs IoT
CREATE VIEW IF NOT EXISTS v_etat_capteurs AS
SELECT
    c.code_capteur,
    c.type_capteur,
    c.position_montage,
    c.statut,
    c.niveau_batterie_pct,
    c.date_derniere_calibration,
    m.code_machine,
    m.nom_machine,
    a.nom_atelier,
    mg.v_rms_mm_s        AS vrms_derniere,
    mg.zone_iso_calculee AS derniere_zone,
    mg.timestamp_mesure  AS derniere_mesure
FROM capteur c
JOIN machine m ON c.id_machine = m.id_machine
JOIN atelier a ON m.id_atelier = a.id_atelier
LEFT JOIN (
    SELECT id_capteur, v_rms_mm_s, zone_iso_calculee, timestamp_mesure,
           ROW_NUMBER() OVER (PARTITION BY id_capteur ORDER BY timestamp_mesure DESC) AS rn
    FROM mesure_globale
) mg ON mg.id_capteur = c.id_capteur AND mg.rn = 1
ORDER BY
    CASE c.statut
        WHEN 'en_panne'       THEN 1
        WHEN 'batterie_faible' THEN 2
        WHEN 'hs'             THEN 3
        WHEN 'en_calibration' THEN 4
        ELSE 5
    END,
    c.niveau_batterie_pct ASC;

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================
