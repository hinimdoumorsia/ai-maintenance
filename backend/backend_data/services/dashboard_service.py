# backend/services/dashboard_service.py
# Logique métier Dashboard — toutes les données viennent de la BD SQLite

from db.database import db_session, rows_to_list


# ─── Helper entreprise ────────────────────────────────────────────────────────
def _get_ent_id(conn, user_id: int) -> int | None:
    row = conn.execute(
        "SELECT id_entreprise FROM utilisateur WHERE id_utilisateur = ?", (user_id,)
    ).fetchone()
    return row["id_entreprise"] if row else None

# CTE réutilisable — filtre les machines par entreprise (1 seul ? = ent_id)
_ENT_CTE = """
WITH ent_machines AS (
    SELECT m.id_machine FROM machine m
    JOIN atelier a ON m.id_atelier = a.id_atelier
    JOIN usine u ON a.id_usine = u.id_usine
    WHERE u.id_entreprise = ?
)
"""
# Sous-requête inline (pour les contextes sans CTE)
_ENT_INLINE = """(
    SELECT m.id_machine FROM machine m
    JOIN atelier a ON m.id_atelier = a.id_atelier
    JOIN usine u ON a.id_usine = u.id_usine
    WHERE u.id_entreprise = ?
)"""


# ─── 1. KPIs héro (4 cartes du haut) ────────────────────────────────────────
def get_hero_kpis(user_id: int) -> dict:
    with db_session() as conn:
        ent_id = _get_ent_id(conn, user_id)
        row = conn.execute("""
            WITH ent_machines AS (
                SELECT m.id_machine FROM machine m
                JOIN atelier a ON m.id_atelier = a.id_atelier
                JOIN usine u ON a.id_usine = u.id_usine
                WHERE u.id_entreprise = ?
            )
            SELECT
                -- Disponibilité globale 7j
                ROUND((
                    SELECT AVG(disponibilite_pct) FROM kpi_journalier
                    WHERE date_kpi >= date('now','-7 days')
                      AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines))
                ), 1) AS disponibilite_7j,

                -- Disponibilité mois précédent
                ROUND((
                    SELECT AVG(disponibilite_pct) FROM kpi_journalier
                    WHERE date_kpi >= date('now','-37 days')
                      AND date_kpi < date('now','-7 days')
                      AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines))
                ), 1) AS disponibilite_7j_prev,

                -- Économies YTD (k€)
                ROUND((
                    SELECT COALESCE(SUM(montant_economise_euros), 0) FROM economie_predictive
                    WHERE strftime('%Y', date_evenement) = strftime('%Y','now')
                      AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines))
                ) / 1000.0, 0) AS economies_ytd_k,

                -- Pannes évitées YTD
                (SELECT COUNT(*) FROM economie_predictive
                 WHERE type_economie = 'panne_evitee'
                   AND strftime('%Y', date_evenement) = strftime('%Y','now')
                   AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines))
                ) AS pannes_evitees_ytd,

                -- Machines en alerte (défaut actif)
                (SELECT COUNT(DISTINCT id_machine) FROM defaut_detecte
                 WHERE statut = 'actif'
                   AND id_machine IN (SELECT id_machine FROM ent_machines)
                ) AS machines_en_alerte,

                -- Machines critiques (gravité >= 4)
                (SELECT COUNT(DISTINCT id_machine) FROM defaut_detecte
                 WHERE statut = 'actif' AND gravite >= 4
                   AND id_machine IN (SELECT id_machine FROM ent_machines)
                ) AS machines_critiques,

                -- Total machines de l'entreprise
                (SELECT COUNT(*) FROM ent_machines) AS machines_total,

                -- Taux détection prédictif
                ROUND(
                    CASE WHEN (
                        (SELECT COUNT(*) FROM economie_predictive
                         WHERE type_economie = 'panne_evitee'
                           AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines)))
                        + (SELECT COUNT(*) FROM panne
                           WHERE id_machine IN (SELECT id_machine FROM ent_machines))
                    ) = 0 THEN 0
                    ELSE (
                        (SELECT COUNT(*) FROM economie_predictive
                         WHERE type_economie = 'panne_evitee'
                           AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines)))
                        * 100.0 /
                        (
                            (SELECT COUNT(*) FROM economie_predictive
                             WHERE type_economie = 'panne_evitee'
                               AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines)))
                            + (SELECT COUNT(*) FROM panne
                               WHERE id_machine IN (SELECT id_machine FROM ent_machines))
                        )
                    ) END
                , 1) AS taux_detection_pct,

                -- Faux positifs proxy
                ROUND(
                    CASE WHEN (SELECT COUNT(*) FROM defaut_detecte
                               WHERE id_machine IN (SELECT id_machine FROM ent_machines)) = 0 THEN 0
                    ELSE (
                        (SELECT COUNT(*) FROM defaut_detecte
                         WHERE statut = 'faux_positif'
                           AND id_machine IN (SELECT id_machine FROM ent_machines)) * 100.0
                        / (SELECT COUNT(*) FROM defaut_detecte
                           WHERE id_machine IN (SELECT id_machine FROM ent_machines))
                    ) END
                , 1) AS faux_positifs_pct,

                -- Lead time moyen (jours)
                ROUND((
                    SELECT AVG(p.drbf_jours) FROM pronostic_drbf p
                    JOIN defaut_detecte d ON p.id_defaut = d.id_defaut
                    WHERE d.statut = 'actif'
                      AND p.id_machine IN (SELECT id_machine FROM ent_machines)
                ), 1) AS lead_time_jours
        """, (ent_id,)).fetchone()
        return dict(row)


# ─── 1b. Dernière mise à jour dashboard ──────────────────────────────────────
def get_last_update() -> dict:
    with db_session() as conn:
        row = conn.execute("""
            SELECT MAX(ts) AS derniere_maj, SUM(nb) AS total_records
            FROM (
                SELECT MAX(timestamp_mesure) AS ts, COUNT(*) AS nb FROM mesure_globale
                UNION ALL
                SELECT MAX(date_kpi || 'T00:00:00') AS ts, COUNT(*) AS nb FROM kpi_journalier
            )
        """).fetchone()
        d = dict(row)
        return {
            "derniere_maj": d.get("derniere_maj"),
            "has_data": (d.get("total_records") or 0) > 0
        }


# ─── 2. Machines à risque (tableau principal) ─────────────────────────────────
def get_machines_risque(user_id: int) -> list[dict]:
    with db_session() as conn:
        ent_id = _get_ent_id(conn, user_id)
        rows = conn.execute("""
            SELECT
                m.id_machine, m.code_machine, m.nom_machine, m.type_machine,
                m.statut AS statut_machine, m.puissance_kw, a.nom_atelier,
                ROUND(mg.v_rms_mm_s, 2) AS vrms,
                CASE
                    WHEN mg.v_rms_mm_s IS NULL THEN NULL
                    WHEN mg.v_rms_mm_s < 1.8   THEN 'A'
                    WHEN mg.v_rms_mm_s < 4.5   THEN 'B'
                    WHEN mg.v_rms_mm_s < 7.1   THEN 'C'
                    ELSE 'D'
                END AS zone,
                mg.timestamp_mesure AS derniere_mesure,
                d.type_defaut, d.gravite, d.stade_degradation,
                p.drbf_jours, p.date_defaillance_predite
            FROM machine m
            JOIN atelier a ON m.id_atelier = a.id_atelier
            JOIN usine u ON a.id_usine = u.id_usine
            LEFT JOIN (
                SELECT id_machine, v_rms_mm_s, zone_iso_calculee, timestamp_mesure,
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
              AND u.id_entreprise = ?
            ORDER BY
                CASE WHEN d.gravite IS NULL THEN 1 ELSE 0 END,
                d.gravite DESC,
                p.drbf_jours ASC
        """, (ent_id,)).fetchall()
        return rows_to_list(rows)


# ─── 3. Alertes actives ────────────────────────────────────────────────────────
def get_alertes_actives(user_id: int) -> list[dict]:
    with db_session() as conn:
        ent_id = _get_ent_id(conn, user_id)
        try:
            rows = conn.execute("""
                WITH ent_machines AS (
                    SELECT m.id_machine FROM machine m
                    JOIN atelier a ON m.id_atelier = a.id_atelier
                    JOIN usine u ON a.id_usine = u.id_usine
                    WHERE u.id_entreprise = ?
                )
                SELECT * FROM v_alertes_actives
                WHERE id_machine IN (SELECT id_machine FROM ent_machines)
                LIMIT 20
            """, (ent_id,)).fetchall()
            return rows_to_list(rows)
        except Exception:
            pass
        try:
            rows = conn.execute("""
                WITH ent_machines AS (
                    SELECT m.id_machine FROM machine m
                    JOIN atelier a ON m.id_atelier = a.id_atelier
                    JOIN usine u ON a.id_usine = u.id_usine
                    WHERE u.id_entreprise = ?
                )
                SELECT a.id_alerte, a.timestamp_alerte, a.niveau, a.type_alerte,
                       a.titre, a.message, a.statut,
                       m.code_machine, m.nom_machine, c.code_capteur
                FROM alerte a
                LEFT JOIN machine m ON a.id_machine = m.id_machine
                LEFT JOIN capteur c ON a.id_capteur = c.id_capteur
                WHERE a.statut IN ('nouvelle', 'vue')
                  AND a.timestamp_alerte >= datetime('now', '-24 hours')
                  AND (a.id_machine IS NULL OR a.id_machine IN (SELECT id_machine FROM ent_machines))
                ORDER BY
                    CASE a.niveau WHEN 'critique' THEN 1 WHEN 'alerte' THEN 2 ELSE 3 END,
                    a.timestamp_alerte DESC
                LIMIT 20
            """, (ent_id,)).fetchall()
            return rows_to_list(rows)
        except Exception:
            return []


# ─── 4. KPI séries temporelles (30j) ──────────────────────────────────────────
def get_kpi_series_30j(user_id: int) -> list[dict]:
    with db_session() as conn:
        ent_id = _get_ent_id(conn, user_id)
        rows = conn.execute("""
            WITH ent_machines AS (
                SELECT m.id_machine FROM machine m
                JOIN atelier a ON m.id_atelier = a.id_atelier
                JOIN usine u ON a.id_usine = u.id_usine
                WHERE u.id_entreprise = ?
            )
            SELECT
                date_kpi,
                ROUND(AVG(disponibilite_pct), 1) AS disponibilite_pct,
                ROUND(AVG(trs_oee_pct), 1)       AS oee_pct,
                ROUND(AVG(mtbf_heures), 0)       AS mtbf_heures,
                ROUND(AVG(mttr_heures), 2)       AS mttr_heures,
                SUM(economies_predictif)          AS economies_jour,
                SUM(nb_alertes)                   AS nb_alertes,
                SUM(nb_pannes_evitees)            AS pannes_evitees
            FROM kpi_journalier
            WHERE date_kpi >= date('now', '-30 days')
              AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines))
            GROUP BY date_kpi
            ORDER BY date_kpi ASC
        """, (ent_id,)).fetchall()
        return rows_to_list(rows)


# ─── 5. Indicateurs de performance (9 catégories de la fleur) ─────────────────
def get_kpi_categories(user_id: int) -> dict:
    with db_session() as conn:
        ent_id = _get_ent_id(conn, user_id)
        cur = conn.cursor()

        # ── Revenue Recovery ──────────────────────────────────────────
        cur.execute("""
            WITH ent_machines AS (
                SELECT m.id_machine FROM machine m
                JOIN atelier a ON m.id_atelier = a.id_atelier
                JOIN usine u ON a.id_usine = u.id_usine
                WHERE u.id_entreprise = ?
            )
            SELECT
                ROUND(SUM(CASE WHEN strftime('%Y',date_evenement)=strftime('%Y','now')
                               THEN montant_economise_euros ELSE 0 END)/1000.0, 0) AS economies_ytd_k,
                SUM(CASE WHEN type_economie='panne_evitee'
                          AND strftime('%Y',date_evenement)=strftime('%Y','now')
                         THEN 1 ELSE 0 END) AS pannes_evitees,
                ROUND(AVG(CASE WHEN type_economie='panne_evitee'
                               THEN montant_economise_euros END), 0) AS cout_moy_panne,
                ROUND(
                    SUM(montant_economise_euros)
                    / NULLIF((SELECT SUM(cout_maintenance_jour) FROM kpi_journalier
                              WHERE date_kpi >= date('now','-365 days')
                                AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines))), 0)
                * 100, 0) AS roi_pct
            FROM economie_predictive
            WHERE id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines)
        """, (ent_id,))
        revenue = dict(cur.fetchone())

        # ── Asset Availability ────────────────────────────────────────
        cur.execute("""
            WITH ent_machines AS (
                SELECT m.id_machine FROM machine m
                JOIN atelier a ON m.id_atelier = a.id_atelier
                JOIN usine u ON a.id_usine = u.id_usine
                WHERE u.id_entreprise = ?
            )
            SELECT
                ROUND(AVG(disponibilite_pct),1) AS disponibilite_moy,
                ROUND(AVG(trs_oee_pct),1)       AS oee_moy,
                ROUND(AVG(mtbf_heures),0)       AS mtbf_moy,
                ROUND(AVG(mttr_heures),2)       AS mttr_moy
            FROM kpi_journalier
            WHERE date_kpi >= date('now','-30 days')
              AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines))
        """, (ent_id,))
        availability = dict(cur.fetchone())

        # ── Risk Reduction ────────────────────────────────────────────
        cur.execute("""
            WITH ent_machines AS (
                SELECT m.id_machine FROM machine m
                JOIN atelier a ON m.id_atelier = a.id_atelier
                JOIN usine u ON a.id_usine = u.id_usine
                WHERE u.id_entreprise = ?
            )
            SELECT
                (SELECT COUNT(DISTINCT id_machine) FROM mesure_globale
                 WHERE zone_iso_calculee='D'
                   AND timestamp_mesure >= datetime('now','-24 hours')
                   AND id_machine IN (SELECT id_machine FROM ent_machines)) AS machines_zone_d,
                (SELECT COUNT(*) FROM defaut_detecte
                 WHERE statut='actif'
                   AND id_machine IN (SELECT id_machine FROM ent_machines)) AS defauts_actifs,
                (SELECT COUNT(*) FROM incident_securite
                 WHERE strftime('%Y',date_incident)=strftime('%Y','now')
                   AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines))) AS incidents_ytd,
                (SELECT MIN(drbf_jours) FROM pronostic_drbf p
                 JOIN defaut_detecte d ON p.id_defaut=d.id_defaut
                 WHERE d.statut='actif'
                   AND p.id_machine IN (SELECT id_machine FROM ent_machines)) AS drbf_min_parc
        """, (ent_id,))
        risk = dict(cur.fetchone())

        # ── Smart Replacement ─────────────────────────────────────────
        cur.execute("""
            WITH ent_machines AS (
                SELECT m.id_machine FROM machine m
                JOIN atelier a ON m.id_atelier = a.id_atelier
                JOIN usine u ON a.id_usine = u.id_usine
                WHERE u.id_entreprise = ?
            )
            SELECT
                SUM(CASE WHEN type_economie='remplacement_optimal' THEN 1 ELSE 0 END) AS remplacements_optimaux,
                ROUND(SUM(CASE WHEN type_economie='remplacement_optimal'
                               THEN montant_economise_euros ELSE 0 END)/1000.0, 0) AS economies_remplacement_k,
                SUM(CASE WHEN type_economie='pm_supprimee' THEN 1 ELSE 0 END) AS pm_supprimees,
                ROUND(SUM(CASE WHEN type_economie='pm_supprimee'
                               THEN montant_economise_euros ELSE 0 END)/1000.0, 0) AS economies_pm_k
            FROM economie_predictive
            WHERE strftime('%Y',date_evenement)=strftime('%Y','now')
              AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines))
        """, (ent_id,))
        smart = dict(cur.fetchone())

        # ── IoT Network ───────────────────────────────────────────────
        cur.execute("""
            WITH ent_machines AS (
                SELECT m.id_machine FROM machine m
                JOIN atelier a ON m.id_atelier = a.id_atelier
                JOIN usine u ON a.id_usine = u.id_usine
                WHERE u.id_entreprise = ?
            ),
            ent_ateliers AS (
                SELECT a.id_atelier FROM atelier a
                JOIN usine u ON a.id_usine = u.id_usine
                WHERE u.id_entreprise = ?
            )
            SELECT
                (SELECT COUNT(*) FROM capteur
                 WHERE id_machine IN (SELECT id_machine FROM ent_machines)) AS total_capteurs,
                (SELECT COUNT(*) FROM capteur
                 WHERE statut='actif'
                   AND id_machine IN (SELECT id_machine FROM ent_machines)) AS capteurs_actifs,
                (SELECT COUNT(*) FROM capteur
                 WHERE statut='batterie_faible'
                   AND id_machine IN (SELECT id_machine FROM ent_machines)) AS batterie_faible,
                (SELECT COUNT(*) FROM capteur
                 WHERE statut='en_panne'
                   AND id_machine IN (SELECT id_machine FROM ent_machines)) AS en_panne,
                (SELECT COUNT(*) FROM passerelle_iot
                 WHERE statut='actif'
                   AND id_atelier IN (SELECT id_atelier FROM ent_ateliers)) AS passerelles_actives,
                (SELECT ROUND(AVG(niveau_batterie_pct),0) FROM capteur
                 WHERE id_machine IN (SELECT id_machine FROM ent_machines)) AS batterie_moy_pct
        """, (ent_id, ent_id))
        iot = dict(cur.fetchone())

        # ── Planned Maintenance ↓ ─────────────────────────────────────
        cur.execute("""
            WITH ent_machines AS (
                SELECT m.id_machine FROM machine m
                JOIN atelier a ON m.id_atelier = a.id_atelier
                JOIN usine u ON a.id_usine = u.id_usine
                WHERE u.id_entreprise = ?
            )
            SELECT
                (SELECT COUNT(*) FROM bon_de_travail
                 WHERE statut='planifie'
                   AND id_machine IN (SELECT id_machine FROM ent_machines)) AS bt_planifies,
                (SELECT COUNT(*) FROM bon_de_travail
                 WHERE statut='en_cours'
                   AND id_machine IN (SELECT id_machine FROM ent_machines)) AS bt_en_cours,
                (SELECT COUNT(*) FROM bon_de_travail
                 WHERE statut='termine'
                   AND id_machine IN (SELECT id_machine FROM ent_machines)) AS bt_termines,
                (SELECT COUNT(*) FROM bon_de_travail
                 WHERE priorite='urgente' AND statut!='termine'
                   AND id_machine IN (SELECT id_machine FROM ent_machines)) AS bt_urgents,
                ROUND((SELECT AVG(duree_reelle_heures) FROM bon_de_travail
                       WHERE duree_reelle_heures IS NOT NULL
                         AND id_machine IN (SELECT id_machine FROM ent_machines)), 1) AS duree_moy_h
        """, (ent_id,))
        planned = dict(cur.fetchone())

        # ── Service Loss ↓ ────────────────────────────────────────────
        cur.execute("""
            WITH ent_machines AS (
                SELECT m.id_machine FROM machine m
                JOIN atelier a ON m.id_atelier = a.id_atelier
                JOIN usine u ON a.id_usine = u.id_usine
                WHERE u.id_entreprise = ?
            )
            SELECT
                (SELECT COUNT(*) FROM panne
                 WHERE id_machine IN (SELECT id_machine FROM ent_machines)) AS nb_pannes_historique,
                ROUND((SELECT AVG(duree_arret_heures) FROM panne
                       WHERE id_machine IN (SELECT id_machine FROM ent_machines)), 1) AS arret_moy_h,
                ROUND((SELECT SUM(cout_arret_estime_euros) FROM panne
                       WHERE id_machine IN (SELECT id_machine FROM ent_machines))/1000.0, 0) AS pertes_arret_k,
                (SELECT SUM(duree_arret_heures) FROM panne
                 WHERE id_machine IN (SELECT id_machine FROM ent_machines)) AS total_arret_h
        """, (ent_id,))
        service = dict(cur.fetchone())

        # ── Workforce ─────────────────────────────────────────────────
        cur.execute("""
            WITH ent_machines AS (
                SELECT m.id_machine FROM machine m
                JOIN atelier a ON m.id_atelier = a.id_atelier
                JOIN usine u ON a.id_usine = u.id_usine
                WHERE u.id_entreprise = ?
            )
            SELECT
                (SELECT COUNT(*) FROM utilisateur
                 WHERE role='technicien' AND id_entreprise = ?) AS nb_techniciens,
                (SELECT COUNT(*) FROM certification c
                 JOIN utilisateur u ON c.id_utilisateur = u.id_utilisateur
                 WHERE u.id_entreprise = ?) AS nb_certifications,
                (SELECT COUNT(*) FROM utilisateur
                 WHERE statut='actif' AND id_entreprise = ?) AS equipe_active,
                (SELECT COUNT(*) FROM intervention_technicien it
                 JOIN bon_de_travail bt ON it.id_bt = bt.id_bt
                 WHERE bt.id_machine IN (SELECT id_machine FROM ent_machines)) AS nb_interventions
        """, (ent_id, ent_id, ent_id, ent_id))
        workforce = dict(cur.fetchone())

        # ── Predictive Power ──────────────────────────────────────────
        cur.execute("""
            WITH ent_machines AS (
                SELECT m.id_machine FROM machine m
                JOIN atelier a ON m.id_atelier = a.id_atelier
                JOIN usine u ON a.id_usine = u.id_usine
                WHERE u.id_entreprise = ?
            )
            SELECT
                ROUND(
                    (SELECT COUNT(*) FROM economie_predictive
                     WHERE type_economie='panne_evitee'
                       AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines))) * 100.0
                    / NULLIF(
                        (SELECT COUNT(*) FROM economie_predictive
                         WHERE type_economie='panne_evitee'
                           AND (id_machine IS NULL OR id_machine IN (SELECT id_machine FROM ent_machines)))
                        + (SELECT COUNT(*) FROM panne
                           WHERE id_machine IN (SELECT id_machine FROM ent_machines)), 0
                    ), 1) AS taux_detection_pct,
                ROUND((SELECT AVG(confiance_diagnostic_pct) FROM defaut_detecte
                       WHERE confiance_diagnostic_pct IS NOT NULL
                         AND id_machine IN (SELECT id_machine FROM ent_machines)), 1) AS confiance_moy_pct,
                (SELECT COUNT(*) FROM defaut_detecte
                 WHERE statut='actif'
                   AND id_machine IN (SELECT id_machine FROM ent_machines)) AS defauts_actifs,
                ROUND((SELECT AVG(drbf_jours) FROM pronostic_drbf p
                       JOIN defaut_detecte d ON p.id_defaut=d.id_defaut
                       WHERE d.statut='actif'
                         AND p.id_machine IN (SELECT id_machine FROM ent_machines)), 1) AS lead_time_moy_j
        """, (ent_id,))
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
def get_capteurs_etat(user_id: int) -> list[dict]:
    with db_session() as conn:
        ent_id = _get_ent_id(conn, user_id)
        try:
            rows = conn.execute("""
                WITH ent_machines AS (
                    SELECT m.id_machine FROM machine m
                    JOIN atelier a ON m.id_atelier = a.id_atelier
                    JOIN usine u ON a.id_usine = u.id_usine
                    WHERE u.id_entreprise = ?
                )
                SELECT * FROM v_etat_capteurs
                WHERE id_machine IN (SELECT id_machine FROM ent_machines)
                LIMIT 30
            """, (ent_id,)).fetchall()
            return rows_to_list(rows)
        except Exception:
            rows = conn.execute("""
                WITH ent_machines AS (
                    SELECT m.id_machine FROM machine m
                    JOIN atelier a ON m.id_atelier = a.id_atelier
                    JOIN usine u ON a.id_usine = u.id_usine
                    WHERE u.id_entreprise = ?
                )
                SELECT c.* FROM capteur c
                WHERE c.id_machine IN (SELECT id_machine FROM ent_machines)
                LIMIT 30
            """, (ent_id,)).fetchall()
            return rows_to_list(rows)
