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
                (SELECT prenom || ' ' || nom FROM utilisateur WHERE id_utilisateur = bt.technicien_principal_id) AS technicien,
                (SELECT telephone FROM utilisateur WHERE id_utilisateur = bt.technicien_principal_id) AS technicien_tel,
                d.type_defaut,
                d.gravite
            FROM bon_de_travail bt
            JOIN machine m      ON bt.id_machine = m.id_machine
            JOIN atelier a      ON m.id_atelier  = a.id_atelier
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
                bt.description as titre,
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
                (SELECT prenom || ' ' || nom FROM utilisateur WHERE id_utilisateur = bt.technicien_principal_id) AS prenom_nom_technicien,
                d.type_defaut,
                d.gravite                AS gravite_defaut
            FROM bon_de_travail bt
            JOIN machine m      ON bt.id_machine = m.id_machine
            JOIN atelier a      ON m.id_atelier  = a.id_atelier
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
        try:
            row = conn.execute("""
                SELECT
                    (SELECT COUNT(*) FROM bon_de_travail WHERE statut IN ('cree','planifie','en_cours')) AS bt_ouverts,
                    (SELECT COUNT(*) FROM bon_de_travail WHERE statut='en_cours') AS bt_en_cours,
                    (SELECT COUNT(*) FROM bon_de_travail WHERE priorite='urgente' AND statut!='termine') AS bt_urgents,
                    (SELECT COUNT(*) FROM bon_de_travail WHERE statut='termine') AS bt_termines,
                    (SELECT COUNT(*) FROM piece_rechange WHERE stock_actuel <= stock_min) AS stocks_critiques,
                    (SELECT COUNT(*) FROM piece_rechange) AS total_references,
                    ROUND(COALESCE((SELECT SUM(pr.prix_unitaire * pr.stock_actuel) FROM piece_rechange pr), 0), 0) AS valeur_stock_total,
                    ROUND(COALESCE((SELECT AVG(duree_reelle_heures) FROM bon_de_travail
                           WHERE duree_reelle_heures IS NOT NULL AND duree_reelle_heures > 0), 0), 1) AS mttr_moyen_h,
                    (SELECT COUNT(*) FROM bon_de_travail WHERE statut='termine') AS interventions_reussies
            """).fetchone()
            result = dict(row)
            for key in result:
                if result[key] is None:
                    result[key] = 0
            return result
        except Exception as e:
            print(f"[maintenance_stats] Erreur SQL : {e}")
            return {
                "bt_ouverts": 0, "bt_en_cours": 0, "bt_urgents": 0,
                "bt_termines": 0, "stocks_critiques": 0, "total_references": 0,
                "valeur_stock_total": 0, "mttr_moyen_h": 0, "interventions_reussies": 0,
            }


def get_machines() -> list[dict]:
    with db_session() as conn:
        rows = conn.execute("""
            SELECT id_machine, code_machine, nom_machine
            FROM machine
            WHERE statut = 'en_service'
            ORDER BY code_machine
        """).fetchall()
        return rows_to_list(rows)

def get_techniciens() -> list[dict]:
    with db_session() as conn:
        rows = conn.execute("""
            SELECT DISTINCT id_utilisateur as id_technicien,
                   prenom || ' ' || nom as nom_complet
            FROM utilisateur
            WHERE role = 'technicien' AND statut = 'actif'
            ORDER BY nom
        """).fetchall()
        return rows_to_list(rows)


def assigner_technicien(id_bt: int, id_technicien: int) -> dict:
    """Assigne un technicien à un BT et retourne son nom."""
    with db_session() as conn:
        if id_technicien and id_technicien > 0:
            conn.execute("""
                UPDATE bon_de_travail
                SET technicien_principal_id = ?
                WHERE id_bt = ?
            """, (id_technicien, id_bt))
        else:
            conn.execute("""
                UPDATE bon_de_travail
                SET technicien_principal_id = NULL
                WHERE id_bt = ?
            """, (id_bt,))
        conn.commit()

        row = conn.execute("""
            SELECT prenom || ' ' || nom as prenom_nom_technicien
            FROM utilisateur
            WHERE id_utilisateur = ?
        """, (id_technicien,)).fetchone() if id_technicien and id_technicien > 0 else None

        return {
            "success": True,
            "technicien": row['prenom_nom_technicien'] if row else None
        }


def update_bt_statut(id_bt: int, statut: str) -> dict:
    """Met à jour le statut d'un BT."""
    with db_session() as conn:
        conn.execute("""
            UPDATE bon_de_travail
            SET statut = ?
            WHERE id_bt = ?
        """, (statut, id_bt))
        conn.commit()
        return {"success": True, "statut": statut}


def enregistrer_historique(type_action: str, action: str, description: str, utilisateur: str = None, details: str = None):
    """Enregistre une action dans l'historique."""
    with db_session() as conn:
        conn.execute("""
            INSERT INTO historique (type, action, description, utilisateur, details)
            VALUES (?, ?, ?, ?, ?)
        """, (type_action, action, description, utilisateur, details))
        conn.commit()


def get_historique() -> list[dict]:
    """Récupère tout l'historique."""
    with db_session() as conn:
        rows = conn.execute("""
            SELECT id_historique as id, type, action, description, utilisateur, details, date
            FROM historique
            ORDER BY date DESC
            LIMIT 500
        """).fetchall()
        return rows_to_list(rows)


def get_historique_stats() -> dict:
    """Statistiques globales de l'historique."""
    with db_session() as conn:
        row = conn.execute("""
            SELECT
                COUNT(*) as total_actions,
                SUM(CASE WHEN type = 'bt' THEN 1 ELSE 0 END) as bt_crees,
                SUM(CASE WHEN type = 'technicien' THEN 1 ELSE 0 END) as assignations,
                SUM(CASE WHEN type = 'statut' THEN 1 ELSE 0 END) as changements_statut,
                SUM(CASE WHEN type = 'stock' THEN 1 ELSE 0 END) as mouvements_stock
            FROM historique
        """).fetchone()
        return dict(row) if row else {}


def clear_historique() -> dict:
    """Efface tout l'historique."""
    with db_session() as conn:
        conn.execute("DELETE FROM historique")
        conn.commit()
        return {"success": True}


def create_bon_de_travail(data: dict) -> dict:
    from datetime import datetime

    with db_session() as conn:
        bt_count = conn.execute("SELECT COUNT(*) as count FROM bon_de_travail").fetchone()
        bt_num = f"BT-{datetime.now().strftime('%Y%m%d')}-{bt_count['count'] + 1}"

        conn.execute("""
            INSERT INTO bon_de_travail (
                numero_bt, description, type_intervention, priorite, statut,
                date_creation, date_planifiee, id_machine
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            bt_num,
            data.get("description", ""),
            data.get("type_intervention", "predictif"),
            data.get("priorite", "moyenne"),
            "cree",
            datetime.now().isoformat(),
            data.get("date_planifiee", datetime.now().isoformat()),
            int(data.get("id_machine"))
        ))
        conn.commit()

        machine = conn.execute("SELECT nom_machine FROM machine WHERE id_machine = ?", (int(data.get("id_machine")),)).fetchone()
        enregistrer_historique(
            type_action="bt",
            action="Création BT",
            description=f"BT {bt_num} créé pour la machine {machine['nom_machine'] if machine else 'Inconnue'}",
            utilisateur=data.get("utilisateur", "Système"),
            details=f"Priorité: {data.get('priorite', 'moyenne')}, Type: {data.get('type_intervention', 'predictif')}"
        )

        return {"success": True, "numero_bt": bt_num, "message": f"BT {bt_num} créé"}


def update_stock_threshold(id_piece: int, stock_min: int, stock_max: int) -> dict:
    with db_session() as conn:
        conn.execute("""
            UPDATE piece_rechange
            SET stock_min = ?, stock_max = ?
            WHERE id_piece = ?
        """, (stock_min, stock_max, id_piece))
        conn.commit()

        enregistrer_historique(
            type_action="stock",
            action="Modification seuils",
            description=f"Seuils modifiés: min={stock_min}, max={stock_max}",
            utilisateur="Utilisateur",
            details=f"Pièce ID: {id_piece}"
        )

        return {"success": True, "stock_min": stock_min, "stock_max": stock_max}
