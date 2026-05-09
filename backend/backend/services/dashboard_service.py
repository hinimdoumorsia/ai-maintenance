# backend/services/dashboard_service.py
# Logique métier Dashboard — toutes les données viennent de la BD SQLite

from db.database import db_session, rows_to_list


# ─── 1. KPIs héro (4 cartes du haut) ────────────────────────────────────────
def get_hero_kpis() -> dict:
    """
    Retourne les 4 indicateurs principaux du dashboard depuis v_dashboard_global.
    Formules :
      disponibilite     = AVG(disponibilite_pct) sur 7 derniers jours (kpi_journalier)
      economies_ytd     = SUM(montant_economise_euros) depuis début année (economie_predictive)
      machines_alerte   = COUNT(*) WHERE statut != 'en_service' OU defaut actif (machine + defaut_detecte)
      taux_detection    = pannes_evitees / (pannes_evitees + pannes_non_evitees) × 100
    """
    with db_session() as conn:
        row = conn.execute("""
            SELECT
                -- Disponibilité globale 7j
                ROUND((
                    SELECT AVG(disponibilite_pct)
                    FROM kpi_journalier
                    WHERE date_kpi >= date('now','-7 days')
                ), 1) AS disponibilite_7j,

                -- Disponibilité mois précédent (pour trend)
                ROUND((
                    SELECT AVG(disponibilite_pct)
                    FROM kpi_journalier
                    WHERE date_kpi >= date('now','-37 days')
                      AND date_kpi < date('now','-7 days')
                ), 1) AS disponibilite_7j_prev,

                -- Économies YTD (k€)
                ROUND((
                    SELECT COALESCE(SUM(montant_economise_euros), 0)
                    FROM economie_predictive
                    WHERE strftime('%Y', date_evenement) = strftime('%Y','now')
                ) / 1000.0, 0) AS economies_ytd_k,

                -- Pannes évitées YTD (pour ROI)
                (SELECT COUNT(*)
                 FROM economie_predictive
                 WHERE type_economie = 'panne_evitee'
                   AND strftime('%Y', date_evenement) = strftime('%Y','now')
                ) AS pannes_evitees_ytd,

                -- Machines en alerte ou critique (défaut actif + zone C/D)
                (SELECT COUNT(DISTINCT id_machine)
                 FROM defaut_detecte
                 WHERE statut = 'actif'
                ) AS machines_en_alerte,

                -- Machines critiques (défaut gravité >= 4)
                (SELECT COUNT(DISTINCT id_machine)
                 FROM defaut_detecte
                 WHERE statut = 'actif' AND gravite >= 4
                ) AS machines_critiques,

                -- Total machines
                (SELECT COUNT(*) FROM machine) AS machines_total,

                -- Taux détection prédictif = pannes_evitees / (evitees + pannes réelles)
                -- proxy: pannes_evitees / (pannes_evitees + nb_pannes sur même période) × 100
                ROUND(
                    CASE WHEN (
                            (SELECT COUNT(*) FROM economie_predictive WHERE type_economie = 'panne_evitee')
                            +
                            (SELECT COUNT(*) FROM panne)
                         ) = 0 THEN 0
                    ELSE (
                        (SELECT COUNT(*) FROM economie_predictive WHERE type_economie = 'panne_evitee')
                        * 100.0
                        / (
                            (SELECT COUNT(*) FROM economie_predictive WHERE type_economie = 'panne_evitee')
                            + (SELECT COUNT(*) FROM panne)
                        )
                    ) END
                , 1) AS taux_detection_pct,

                -- Faux positifs proxy (alertes fermées comme faux_positif / total alertes)
                ROUND(
                    CASE WHEN (SELECT COUNT(*) FROM alerte) = 0 THEN 0
                    ELSE (
                        (SELECT COUNT(*) FROM defaut_detecte WHERE statut = 'faux_positif') * 100.0
                        / (SELECT COUNT(*) FROM defaut_detecte)
                    ) END
                , 1) AS faux_positifs_pct,

                -- Lead time moyen (jours) = AVG(drbf_jours) sur pronostics actifs
                ROUND((
                    SELECT AVG(p.drbf_jours)
                    FROM pronostic_drbf p
                    JOIN defaut_detecte d ON p.id_defaut = d.id_defaut
                    WHERE d.statut = 'actif'
                ), 1) AS lead_time_jours
        """).fetchone()

        return dict(row)


# ─── 2. Machines à risque (tableau principal) ─────────────────────────────────
def get_machines_risque() -> list[dict]:
    """
    Retourne la liste des machines actives avec leurs dernières mesures vibratoires.
    Source : v_machines_a_risque + machine + dernière mesure de chaque capteur.
    """
    with db_session() as conn:
        rows = conn.execute("""
            SELECT
                m.id_machine,
                m.code_machine,
                m.nom_machine,
                m.type_machine,
                m.statut           AS statut_machine,
                m.puissance_kw,
                a.nom_atelier,
                -- Dernière mesure V_RMS
                ROUND(mg.v_rms_mm_s, 2)  AS vrms,
                mg.zone_iso_calculee     AS zone,
                mg.timestamp_mesure      AS derniere_mesure,
                -- Défaut le plus grave
                d.type_defaut,
                d.gravite,
                d.stade_degradation,
                -- DRBF le plus court
                p.drbf_jours,
                p.date_defaillance_predite
            FROM machine m
            JOIN atelier a ON m.id_atelier = a.id_atelier
            LEFT JOIN (
                SELECT id_machine,
                       v_rms_mm_s,
                       zone_iso_calculee,
                       timestamp_mesure,
                       ROW_NUMBER() OVER (PARTITION BY id_machine ORDER BY timestamp_mesure DESC) rn
                FROM mesure_globale
            ) mg ON mg.id_machine = m.id_machine AND mg.rn = 1
            LEFT JOIN (
                SELECT id_machine, type_defaut, gravite, stade_degradation,
                       ROW_NUMBER() OVER (PARTITION BY id_machine ORDER BY gravite DESC) rn
                FROM defaut_detecte WHERE statut = 'actif'
            ) d ON d.id_machine = m.id_machine AND d.rn = 1
            LEFT JOIN (
                SELECT id_machine, drbf_jours, date_defaillance_predite,
                       ROW_NUMBER() OVER (PARTITION BY id_machine ORDER BY drbf_jours ASC) rn
                FROM pronostic_drbf
            ) p ON p.id_machine = m.id_machine AND p.rn = 1
            WHERE m.statut != 'hors_service'
            ORDER BY
                CASE WHEN d.gravite IS NULL THEN 1 ELSE 0 END,
                d.gravite DESC,
                p.drbf_jours ASC
        """).fetchall()
        return rows_to_list(rows)


# ─── 3. Alertes actives ────────────────────────────────────────────────────────
def get_alertes_actives() -> list[dict]:
    """
    Alertes des 24h, triées par gravité DESC puis timestamp DESC.
    Essaie d'abord la vue v_alertes_actives (si elle existe), sinon requête directe.
    """
    with db_session() as conn:
        try:
            rows = conn.execute("SELECT * FROM v_alertes_actives LIMIT 20").fetchall()
            return rows_to_list(rows)
        except Exception:
            pass
        # Fallback : requête directe si la vue n'existe pas encore dans la BD
        try:
            rows = conn.execute("""
                SELECT a.id_alerte,
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
                WHERE a.statut IN ('nouvelle', 'vue')
                  AND a.timestamp_alerte >= datetime('now', '-24 hours')
                ORDER BY
                    CASE a.niveau WHEN 'critique' THEN 1 WHEN 'alerte' THEN 2 ELSE 3 END,
                    a.timestamp_alerte DESC
                LIMIT 20
            """).fetchall()
            return rows_to_list(rows)
        except Exception:
            return []


# ─── 4. KPI séries temporelles (30j) ──────────────────────────────────────────
def get_kpi_series_30j() -> list[dict]:
    """
    Série journalière pour les graphiques (30 derniers jours).
    Retourne : date, disponibilite_pct, oee, mtbf, economies, nb_alertes
    """
    with db_session() as conn:
        rows = conn.execute("""
            SELECT
                date_kpi,
                ROUND(AVG(disponibilite_pct), 1)  AS disponibilite_pct,
                ROUND(AVG(trs_oee_pct), 1)        AS oee_pct,
                ROUND(AVG(mtbf_heures), 0)        AS mtbf_heures,
                ROUND(AVG(mttr_heures), 2)        AS mttr_heures,
                SUM(economies_predictif)           AS economies_jour,
                SUM(nb_alertes)                    AS nb_alertes,
                SUM(nb_pannes_evitees)             AS pannes_evitees
            FROM kpi_journalier
            WHERE date_kpi >= date('now', '-30 days')
            GROUP BY date_kpi
            ORDER BY date_kpi ASC
        """).fetchall()
        return rows_to_list(rows)


# ─── 5. Indicateurs de performance (9 catégories de la fleur) ─────────────────
def get_kpi_categories() -> dict:
    """
    Calcule les KPIs pour chacune des 9 catégories de la maquette.
    Formules détaillées dans les commentaires.
    """
    with db_session() as conn:
        cur = conn.cursor()

        # ── Revenue Recovery ──────────────────────────────────────────
        cur.execute("""
            SELECT
                -- Économies YTD (K€)
                ROUND(SUM(CASE WHEN strftime('%Y',date_evenement)=strftime('%Y','now')
                               THEN montant_economise_euros ELSE 0 END)/1000.0, 0) AS economies_ytd_k,
                -- Pannes évitées YTD
                SUM(CASE WHEN type_economie='panne_evitee'
                          AND strftime('%Y',date_evenement)=strftime('%Y','now')
                         THEN 1 ELSE 0 END) AS pannes_evitees,
                -- Coût moyen panne évitée
                ROUND(AVG(CASE WHEN type_economie='panne_evitee'
                               THEN montant_economise_euros END), 0) AS cout_moy_panne,
                -- ROI prédictif = économies / coût maintenance (proxy via kpi)
                ROUND(
                    SUM(montant_economise_euros)
                    / NULLIF((SELECT SUM(cout_maintenance_jour) FROM kpi_journalier
                              WHERE date_kpi >= date('now','-365 days')), 0)
                * 100, 0) AS roi_pct
            FROM economie_predictive
        """)
        revenue = dict(cur.fetchone())

        # ── Asset Availability ────────────────────────────────────────
        cur.execute("""
            SELECT
                ROUND(AVG(disponibilite_pct),1)    AS disponibilite_moy,
                ROUND(AVG(trs_oee_pct),1)          AS oee_moy,
                ROUND(AVG(mtbf_heures),0)          AS mtbf_moy,
                ROUND(AVG(mttr_heures),2)          AS mttr_moy
            FROM kpi_journalier
            WHERE date_kpi >= date('now','-30 days')
        """)
        availability = dict(cur.fetchone())

        # ── Risk Reduction ────────────────────────────────────────────
        cur.execute("""
            SELECT
                -- Machines zone D (risque critique)
                (SELECT COUNT(DISTINCT id_machine) FROM mesure_globale
                 WHERE zone_iso_calculee='D'
                   AND timestamp_mesure >= datetime('now','-24 hours')) AS machines_zone_d,
                -- Défauts actifs
                (SELECT COUNT(*) FROM defaut_detecte WHERE statut='actif') AS defauts_actifs,
                -- Incidents sécurité YTD
                (SELECT COUNT(*) FROM incident_securite
                 WHERE strftime('%Y',date_incident)=strftime('%Y','now')) AS incidents_ytd,
                -- DRBF min sur parc
                (SELECT MIN(drbf_jours) FROM pronostic_drbf p
                 JOIN defaut_detecte d ON p.id_defaut=d.id_defaut
                 WHERE d.statut='actif') AS drbf_min_parc
        """)
        risk = dict(cur.fetchone())

        # ── Smart Replacement ─────────────────────────────────────────
        cur.execute("""
            SELECT
                SUM(CASE WHEN type_economie='remplacement_optimal' THEN 1 ELSE 0 END) AS remplacements_optimaux,
                ROUND(SUM(CASE WHEN type_economie='remplacement_optimal'
                               THEN montant_economise_euros ELSE 0 END)/1000.0, 0) AS economies_remplacement_k,
                SUM(CASE WHEN type_economie='pm_supprimee' THEN 1 ELSE 0 END) AS pm_supprimees,
                ROUND(SUM(CASE WHEN type_economie='pm_supprimee'
                               THEN montant_economise_euros ELSE 0 END)/1000.0, 0) AS economies_pm_k
            FROM economie_predictive
            WHERE strftime('%Y',date_evenement)=strftime('%Y','now')
        """)
        smart = dict(cur.fetchone())

        # ── IoT Network ───────────────────────────────────────────────
        cur.execute("""
            SELECT
                (SELECT COUNT(*) FROM capteur) AS total_capteurs,
                (SELECT COUNT(*) FROM capteur WHERE statut='actif') AS capteurs_actifs,
                (SELECT COUNT(*) FROM capteur WHERE statut='batterie_faible') AS batterie_faible,
                (SELECT COUNT(*) FROM capteur WHERE statut='en_panne') AS en_panne,
                (SELECT COUNT(*) FROM passerelle_iot WHERE statut='actif') AS passerelles_actives,
                (SELECT ROUND(AVG(niveau_batterie_pct),0) FROM capteur) AS batterie_moy_pct
        """)
        iot = dict(cur.fetchone())

        # ── Planned Maintenance ↓ ─────────────────────────────────────
        cur.execute("""
            SELECT
                (SELECT COUNT(*) FROM bon_de_travail WHERE statut='planifie') AS bt_planifies,
                (SELECT COUNT(*) FROM bon_de_travail WHERE statut='en_cours') AS bt_en_cours,
                (SELECT COUNT(*) FROM bon_de_travail WHERE statut='termine') AS bt_termines,
                (SELECT COUNT(*) FROM bon_de_travail WHERE priorite='urgente' AND statut!='termine') AS bt_urgents,
                ROUND((SELECT AVG(duree_reelle_heures) FROM bon_de_travail
                       WHERE duree_reelle_heures IS NOT NULL), 1) AS duree_moy_h
        """)
        planned = dict(cur.fetchone())

        # ── Service Loss ↓ ────────────────────────────────────────────
        cur.execute("""
            SELECT
                (SELECT COUNT(*) FROM panne) AS nb_pannes_historique,
                ROUND((SELECT AVG(duree_arret_heures) FROM panne), 1) AS arret_moy_h,
                ROUND((SELECT SUM(cout_arret_estime_euros) FROM panne)/1000.0, 0) AS pertes_arret_k,
                (SELECT SUM(duree_arret_heures) FROM panne) AS total_arret_h
        """)
        service = dict(cur.fetchone())

        # ── Workforce ─────────────────────────────────────────────────
        cur.execute("""
            SELECT
                (SELECT COUNT(*) FROM utilisateur WHERE role='technicien') AS nb_techniciens,
                (SELECT COUNT(*) FROM certification) AS nb_certifications,
                (SELECT COUNT(*) FROM utilisateur WHERE statut='actif') AS equipe_active,
                (SELECT COUNT(*) FROM intervention_technicien) AS nb_interventions
        """)
        workforce = dict(cur.fetchone())

        # ── Predictive Power ──────────────────────────────────────────
        cur.execute("""
            SELECT
                -- Taux détection = pannes_evitees / (evitees + réelles)
                ROUND(
                    (SELECT COUNT(*) FROM economie_predictive WHERE type_economie='panne_evitee') * 100.0
                    / NULLIF(
                        (SELECT COUNT(*) FROM economie_predictive WHERE type_economie='panne_evitee')
                        + (SELECT COUNT(*) FROM panne), 0
                    ), 1) AS taux_detection_pct,
                -- Confiance moyenne diagnostic
                ROUND((SELECT AVG(confiance_diagnostic_pct) FROM defaut_detecte
                       WHERE confiance_diagnostic_pct IS NOT NULL), 1) AS confiance_moy_pct,
                -- Défauts détectés actifs
                (SELECT COUNT(*) FROM defaut_detecte WHERE statut='actif') AS defauts_actifs,
                -- Lead time moyen
                ROUND((SELECT AVG(drbf_jours) FROM pronostic_drbf p
                       JOIN defaut_detecte d ON p.id_defaut=d.id_defaut
                       WHERE d.statut='actif'), 1) AS lead_time_moy_j
        """)
        predictive = dict(cur.fetchone())

        return {
            "revenue_recovery": revenue,
            "asset_availability": availability,
            "risk_reduction": risk,
            "smart_replacement": smart,
            "iot_network": iot,
            "planned_maintenance": planned,
            "service_loss": service,
            "workforce": workforce,
            "predictive_power": predictive,
        }


# ─── 6. État capteurs IoT ──────────────────────────────────────────────────────
def get_capteurs_etat() -> list[dict]:
    with db_session() as conn:
        rows = conn.execute("""
            SELECT * FROM v_etat_capteurs LIMIT 30
        """).fetchall()
        return rows_to_list(rows)

