# backend/services/maintenance_service.py
# Logique métier — Page Maintenance (Planning / BT / Stocks)

from db.database import db_session, rows_to_list


# ─── Planning ────────────────────────────────────────────────────────────────

def get_planning() -> list[dict]:
    """
    BTs planifiés sur les 30 prochains jours, ordonnés par date planifiée.
    Joint machine, atelier, technicien principal.
    """
    with db_session() as conn:
        rows = conn.execute("""
            SELECT
                bt.id_bt,
                bt.numero_bt,
                bt.type_intervention,
                bt.priorite,
                bt.description,
                bt.date_planifiee,
                bt.duree_prevue_heures,
                bt.statut,
                m.code_machine,
                m.nom_machine,
                m.type_machine,
                a.nom_atelier,
                u.prenom || ' ' || u.nom AS technicien,
                u.telephone              AS technicien_tel,
                d.type_defaut,
                d.gravite
            FROM bon_de_travail bt
            JOIN machine m      ON bt.id_machine = m.id_machine
            JOIN atelier a      ON m.id_atelier  = a.id_atelier
            LEFT JOIN utilisateur u  ON bt.technicien_principal_id = u.id_utilisateur
            LEFT JOIN defaut_detecte d ON bt.id_defaut = d.id_defaut
            WHERE bt.statut IN ('cree','planifie','en_cours')
              AND bt.date_planifiee IS NOT NULL
            ORDER BY
                CASE bt.priorite
                    WHEN 'urgente' THEN 1
                    WHEN 'haute'   THEN 2
                    WHEN 'moyenne' THEN 3
                    ELSE 4
                END,
                bt.date_planifiee ASC
        """).fetchall()
        return rows_to_list(rows)


# ─── Bons de travail ─────────────────────────────────────────────────────────

def get_bons_de_travail(statut: str = None, priorite: str = None) -> list[dict]:
    """Liste tous les BTs avec filtre optionnel sur statut et priorité."""
    with db_session() as conn:
        where_clauses = []
        params = []

        if statut:
            where_clauses.append("bt.statut = ?")
            params.append(statut)
        if priorite:
            where_clauses.append("bt.priorite = ?")
            params.append(priorite)

        where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        rows = conn.execute(f"""
            SELECT
                bt.id_bt,
                bt.numero_bt,
                bt.type_intervention,
                bt.priorite,
                bt.description,
                bt.date_creation,
                bt.date_planifiee,
                bt.date_debut_reelle,
                bt.date_fin_reelle,
                bt.duree_prevue_heures,
                bt.duree_reelle_heures,
                bt.statut,
                bt.cout_main_oeuvre,
                bt.cout_pieces,
                bt.cout_total,
                m.code_machine,
                m.nom_machine,
                m.type_machine,
                a.nom_atelier,
                u.prenom || ' ' || u.nom AS technicien,
                d.type_defaut,
                d.gravite                AS gravite_defaut
            FROM bon_de_travail bt
            JOIN machine m      ON bt.id_machine = m.id_machine
            JOIN atelier a      ON m.id_atelier  = a.id_atelier
            LEFT JOIN utilisateur u  ON bt.technicien_principal_id = u.id_utilisateur
            LEFT JOIN defaut_detecte d ON bt.id_defaut = d.id_defaut
            {where_sql}
            ORDER BY
                CASE bt.statut
                    WHEN 'en_cours'  THEN 1
                    WHEN 'planifie'  THEN 2
                    WHEN 'cree'      THEN 3
                    WHEN 'termine'   THEN 4
                    ELSE 5
                END,
                CASE bt.priorite
                    WHEN 'urgente' THEN 1
                    WHEN 'haute'   THEN 2
                    WHEN 'moyenne' THEN 3
                    ELSE 4
                END,
                bt.date_planifiee ASC
        """, params).fetchall()
        return rows_to_list(rows)


def get_bt_detail(id_bt: int) -> dict:
    """Détail d'un BT avec ses interventions."""
    with db_session() as conn:
        bt = conn.execute("""
            SELECT bt.*, m.code_machine, m.nom_machine, a.nom_atelier
            FROM bon_de_travail bt
            JOIN machine m ON bt.id_machine = m.id_machine
            JOIN atelier a ON m.id_atelier = a.id_atelier
            WHERE bt.id_bt = ?
        """, (id_bt,)).fetchone()

        if not bt:
            return {}

        interventions = conn.execute("""
            SELECT i.*, u.prenom || ' ' || u.nom AS technicien_nom
            FROM intervention_technicien i
            JOIN utilisateur u ON i.id_utilisateur = u.id_utilisateur
            WHERE i.id_bt = ?
        """, (id_bt,)).fetchall()

        result = dict(bt)
        result["interventions"] = rows_to_list(interventions)
        return result


# ─── Stocks pièces ───────────────────────────────────────────────────────────

def get_stocks() -> list[dict]:
    """
    Inventaire complet avec indicateur de stock critique.
    stock_critique = 1 si stock_actuel <= stock_min
    """
    with db_session() as conn:
        rows = conn.execute("""
            SELECT
                pr.id_piece,
                pr.reference_fabricant,
                pr.designation,
                pr.categorie,
                pr.prix_unitaire,
                pr.delai_approvisionnement_jours,
                pr.fournisseur_principal,
                pr.stock_min,
                pr.stock_actuel,
                pr.emplacement_magasin,
                -- Valeur totale stock
                ROUND(pr.prix_unitaire * pr.stock_actuel, 0) AS valeur_stock,
                -- Stock critique
                CASE WHEN pr.stock_actuel <= pr.stock_min THEN 1 ELSE 0 END AS stock_critique,
                -- Dernière sortie
                (SELECT date(ms.date_mouvement)
                 FROM mouvement_stock ms
                 WHERE ms.id_piece = pr.id_piece AND ms.type_mouvement = 'sortie'
                 ORDER BY ms.date_mouvement DESC LIMIT 1) AS derniere_sortie,
                -- Nombre de sorties ce mois
                (SELECT COALESCE(SUM(ms.quantite), 0)
                 FROM mouvement_stock ms
                 WHERE ms.id_piece = pr.id_piece
                   AND ms.type_mouvement = 'sortie'
                   AND ms.date_mouvement >= date('now', '-30 days')) AS sorties_30j
            FROM piece_rechange pr
            ORDER BY
                CASE WHEN pr.stock_actuel <= pr.stock_min THEN 0 ELSE 1 END,
                pr.categorie,
                pr.designation
        """).fetchall()
        return rows_to_list(rows)


def get_mouvements_stock() -> list[dict]:
    """30 derniers mouvements de stock."""
    with db_session() as conn:
        rows = conn.execute("""
            SELECT
                ms.id_mouvement,
                ms.date_mouvement,
                ms.type_mouvement,
                ms.quantite,
                pr.reference_fabricant,
                pr.designation,
                pr.categorie,
                bt.numero_bt
            FROM mouvement_stock ms
            JOIN piece_rechange pr ON ms.id_piece = pr.id_piece
            LEFT JOIN bon_de_travail bt ON ms.id_bt = bt.id_bt
            ORDER BY ms.date_mouvement DESC
            LIMIT 30
        """).fetchall()
        return rows_to_list(rows)


# ─── Stats résumées pour la page ─────────────────────────────────────────────

def get_maintenance_stats() -> dict:
    """KPIs résumés : BTs ouverts, stocks critiques, coût total."""
    with db_session() as conn:
        row = conn.execute("""
            SELECT
                (SELECT COUNT(*) FROM bon_de_travail WHERE statut IN ('cree','planifie','en_cours')) AS bt_ouverts,
                (SELECT COUNT(*) FROM bon_de_travail WHERE statut='en_cours') AS bt_en_cours,
                (SELECT COUNT(*) FROM bon_de_travail WHERE priorite='urgente' AND statut!='termine') AS bt_urgents,
                (SELECT COUNT(*) FROM bon_de_travail WHERE statut='termine') AS bt_termines,
                (SELECT COUNT(*) FROM piece_rechange WHERE stock_actuel <= stock_min) AS stocks_critiques,
                (SELECT COUNT(*) FROM piece_rechange) AS total_references,
                ROUND((SELECT SUM(pr.prix_unitaire * pr.stock_actuel) FROM piece_rechange), 0) AS valeur_stock_total,
                ROUND((SELECT AVG(duree_reelle_heures) FROM bon_de_travail
                       WHERE duree_reelle_heures IS NOT NULL), 1) AS mttr_moyen_h,
                (SELECT COUNT(*) FROM historique_maintenance WHERE defaut_resolu=1) AS interventions_reussies
        """).fetchone()
        return dict(row)
