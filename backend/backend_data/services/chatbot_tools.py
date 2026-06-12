"""
Outils (tool use) de l'Assistant Maintenance — accès LECTURE SEULE à la base de l'app.

Chaque outil réutilise les services existants (dashboard_service / admin_service) ou
fait une requête SQL en lecture seule scopée à l'entreprise de l'utilisateur.

Sécurité :
- Aucune écriture (SELECT uniquement).
- La table `utilisateur` est volontairement EXCLUE (elle contient le hash des mots de passe).
- `query_table` n'accepte que des noms de tables présents dans WHITELIST_TABLES (anti-injection).
- Les chaînes très longues (base64 logo, JSON eda_results…) sont tronquées pour limiter les tokens.
"""
from __future__ import annotations

from typing import Any

from db.database import db_session, rows_to_list
from services import dashboard_service, admin_service

# Tables interrogeables via query_table (utilisateur EXCLU pour ne pas fuiter les mots de passe).
WHITELIST_TABLES: set[str] = {
    "entreprise", "usine", "atelier", "classe_iso", "categorie_vis",
    "machine", "composant", "capteur", "passerelle_iot", "configuration_acquisition",
    "mesure_globale", "mesure_spectrale", "bande_fine_mesure", "seuil_alarme",
    "defaut_detecte", "pronostic_drbf", "alerte", "bon_de_travail",
    "historique_maintenance", "panne", "certification", "intervention_technicien",
    "piece_rechange", "mouvement_stock", "kpi_journalier", "economie_predictive",
    "incident_securite", "dataset",
}

_MAX_STR = 600   # tronque les chaînes au-delà (base64, gros JSON)
_MAX_ROWS = 100  # plafond de lignes renvoyées


def _truncate(obj: Any) -> Any:
    """Tronque récursivement les longues chaînes pour limiter les tokens envoyés au LLM."""
    if isinstance(obj, str):
        return obj if len(obj) <= _MAX_STR else obj[:_MAX_STR] + f"… [tronqué, {len(obj)} caractères]"
    if isinstance(obj, list):
        return [_truncate(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _truncate(v) for k, v in obj.items()}
    return obj


# ── Définitions des outils (format Anthropic) ──────────────────────────────────
TOOL_DEFINITIONS_DB: list[dict] = [
    {
        "name": "get_company_profile",
        "description": "Profil de l'entreprise de l'utilisateur (nom, secteur, adresse, contact) "
                       "et compteurs globaux (nombre de machines, capteurs, datasets, alertes actives). "
                       "À utiliser pour toute question sur l'entreprise ou un état global rapide.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_dashboard_kpis",
        "description": "KPIs « héro » exacts du tableau de bord : disponibilité, économies prédictives YTD, "
                       "nombre de machines en alerte, taux de détection prédictif, etc.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_kpi_indicators",
        "description": "Indicateurs de performance EXACTS affichés sur le tableau de bord (les 9 piliers), "
                       "calculés sur les 30 derniers jours pour l'entreprise. Contient notamment le "
                       "TRS/OEE (champ asset_availability.oee_moy), la disponibilité moyenne, MTBF, MTTR, "
                       "le ROI, la réduction de risque, etc. À UTILISER pour toute question sur le TRS/OEE, "
                       "la disponibilité, le MTBF/MTTR ou un indicateur de performance de l'entreprise — "
                       "ces valeurs correspondent exactement à celles du tableau de bord (et NON au TRS "
                       "d'un dataset uploadé).",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_machines",
        "description": "Liste des machines du parc avec leur état de santé : V-RMS (mm/s), zone ISO (A/B/C/D), "
                       "défaut actif, gravité, et DRBF (jours restants avant défaillance prédite). "
                       "Triées du plus critique au moins critique.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_active_alerts",
        "description": "Alertes actives récentes (machines/capteurs) avec niveau, type, titre et message.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_sensors",
        "description": "État du réseau de capteurs IoT : type, position, statut, niveau de batterie.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_datasets",
        "description": "Datasets uploadés dans l'application : nom, type détecté, statut du traitement EDA, "
                       "nombre de lignes/colonnes, date.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "query_table",
        "description": "Lecture seule générique d'une table de la base, AUTOMATIQUEMENT filtrée sur "
                       "l'entreprise de l'utilisateur, pour les questions précises non couvertes par les "
                       "autres outils (ex. mesures, pronostics, bons de travail, historique de maintenance, "
                       "KPIs journaliers…). Renvoie les lignes les plus récentes. Certaines tables non "
                       "rattachées à une entreprise ne sont pas lisibles. Tables autorisées : "
                       + ", ".join(sorted(WHITELIST_TABLES)) + ".",
        "input_schema": {
            "type": "object",
            "properties": {
                "table": {"type": "string", "description": "Nom exact de la table autorisée."},
                "limit": {"type": "integer", "description": "Nombre de lignes (défaut 20, max 100)."},
            },
            "required": ["table"],
        },
    },
]


# ── Exécution ──────────────────────────────────────────────────────────────────
def _counts(user_id: int) -> dict:
    """Compteurs globaux scopés à l'entreprise de l'utilisateur."""
    with db_session() as conn:
        ent_id = dashboard_service._get_ent_id(conn, user_id)
        if ent_id is None:
            return {"id_entreprise": None}
        ent_machines = """(
            SELECT m.id_machine FROM machine m
            JOIN atelier a ON m.id_atelier = a.id_atelier
            JOIN usine u ON a.id_usine = u.id_usine
            WHERE u.id_entreprise = ?)"""
        nb_machines = conn.execute(
            f"SELECT COUNT(*) c FROM machine WHERE id_machine IN {ent_machines}", (ent_id,)
        ).fetchone()["c"]
        nb_capteurs = conn.execute(
            f"SELECT COUNT(*) c FROM capteur WHERE id_machine IN {ent_machines}", (ent_id,)
        ).fetchone()["c"]
        nb_alertes = conn.execute(
            f"""SELECT COUNT(*) c FROM alerte
                WHERE statut IN ('nouvelle','vue')
                  AND (id_machine IS NULL OR id_machine IN {ent_machines})""",
            (ent_id,),
        ).fetchone()["c"]
        try:
            # Datasets scopés à l'utilisateur (comme /api/donnees/datasets : filtre uploaded_by)
            nb_datasets = conn.execute(
                "SELECT COUNT(*) c FROM dataset WHERE uploaded_by = ?", (user_id,)
            ).fetchone()["c"]
        except Exception:
            nb_datasets = None
    return {
        "id_entreprise": ent_id,
        "nb_machines": nb_machines,
        "nb_capteurs": nb_capteurs,
        "nb_alertes_actives": nb_alertes,
        "nb_datasets": nb_datasets,
    }


def _list_datasets(user_id: int) -> list[dict]:
    """Datasets de l'utilisateur courant (scopés par uploaded_by, comme la page Données)."""
    with db_session() as conn:
        try:
            rows = conn.execute(
                """SELECT id, name, original_filename, detected_type, status,
                          n_rows, n_cols, created_at, processed_at, error_message
                   FROM dataset WHERE uploaded_by = ? ORDER BY created_at DESC LIMIT 50""",
                (user_id,),
            ).fetchall()
            return rows_to_list(rows)
        except Exception:
            # Schéma dataset variable selon migrations — fallback large mais toujours scopé
            rows = conn.execute(
                "SELECT * FROM dataset WHERE uploaded_by = ? LIMIT 50", (user_id,)
            ).fetchall()
            data = rows_to_list(rows)
            for d in data:
                d.pop("eda_results", None)
            return data


# Tables de référence ISO/VIS — pas de données privées, lecture globale autorisée.
REFERENCE_TABLES: set[str] = {"classe_iso", "categorie_vis"}

# Sous-requêtes de scope entreprise (chacune prend 1 paramètre = id_entreprise).
_SQ_USINES = "SELECT id_usine FROM usine WHERE id_entreprise = ?"
_SQ_ATELIERS = (
    "SELECT a.id_atelier FROM atelier a JOIN usine u ON a.id_usine = u.id_usine "
    "WHERE u.id_entreprise = ?"
)
_SQ_MACHINES = (
    "SELECT m.id_machine FROM machine m JOIN atelier a ON m.id_atelier = a.id_atelier "
    "JOIN usine u ON a.id_usine = u.id_usine WHERE u.id_entreprise = ?"
)
_SQ_CAPTEURS = (
    "SELECT c.id_capteur FROM capteur c JOIN machine m ON c.id_machine = m.id_machine "
    "JOIN atelier a ON m.id_atelier = a.id_atelier JOIN usine u ON a.id_usine = u.id_usine "
    "WHERE u.id_entreprise = ?"
)
# Priorité : colonne de scope la plus large d'abord.
_SCOPE_PRIORITY = [
    ("id_entreprise", "id_entreprise = ?", lambda ent: [ent]),
    ("id_usine", f"id_usine IN ({_SQ_USINES})", lambda ent: [ent]),
    ("id_atelier", f"id_atelier IN ({_SQ_ATELIERS})", lambda ent: [ent]),
    ("id_machine", f"id_machine IN ({_SQ_MACHINES})", lambda ent: [ent]),
    ("id_capteur", f"id_capteur IN ({_SQ_CAPTEURS})", lambda ent: [ent]),
]


def _scope_clause(table: str, cols: set[str], conn, user_id: int):
    """Renvoie (where_sql, params). where_sql == '' → pas de filtre (table de référence).
    Renvoie (None, None) si la table ne peut pas être cloisonnée par entreprise (refus)."""
    if table in REFERENCE_TABLES:
        return "", []
    if table == "dataset":
        return "uploaded_by = ?", [user_id]
    ent_id = dashboard_service._get_ent_id(conn, user_id)
    if ent_id is None:
        return None, None
    for col, frag, mk in _SCOPE_PRIORITY:
        if col in cols:
            return frag, mk(ent_id)
    return None, None


def _query_table(table: str, limit: int, user_id: int) -> Any:
    if table not in WHITELIST_TABLES:
        return {"error": f"Table '{table}' non autorisée. Tables disponibles : {sorted(WHITELIST_TABLES)}"}
    limit = max(1, min(int(limit or 20), _MAX_ROWS))
    with db_session() as conn:
        cols = {r["name"] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()}
        where, params = _scope_clause(table, cols, conn, user_id)
        if where is None:
            return {"error": (
                f"La table '{table}' n'est pas rattachée à une entreprise et ne peut pas être "
                "cloisonnée par compte ; je ne peux pas la lire ici pour des raisons de confidentialité."
            )}
        base = f"SELECT * FROM {table}" + (f" WHERE {where}" if where else "")
        try:
            rows = conn.execute(f"{base} ORDER BY ROWID DESC LIMIT ?", (*params, limit)).fetchall()
        except Exception:
            rows = conn.execute(f"{base} LIMIT ?", (*params, limit)).fetchall()
        data = rows_to_list(rows)
    # Retire les colonnes très lourdes connues
    for r in data:
        r.pop("eda_results", None)
        r.pop("logo_url", None)
        r.pop("document_descriptif_url", None)
    return data


def dispatch_db_tool(name: str, tool_input: dict, user_id: int | None) -> Any:
    """Exécute un outil base de données et renvoie un objet JSON-sérialisable (tronqué)."""
    if user_id is None:
        return {"error": "Aucun utilisateur connecté : impossible de scoper les données à l'entreprise."}

    try:
        if name == "get_company_profile":
            return _truncate({"entreprise": admin_service.get_entreprise(user_id), "compteurs": _counts(user_id)})
        if name == "get_dashboard_kpis":
            return _truncate(dashboard_service.get_hero_kpis(user_id))
        if name == "get_kpi_indicators":
            return _truncate(dashboard_service.get_kpi_categories(user_id))
        if name == "list_machines":
            return _truncate(dashboard_service.get_machines_risque(user_id))
        if name == "list_active_alerts":
            return _truncate(dashboard_service.get_alertes_actives(user_id))
        if name == "list_sensors":
            return _truncate(dashboard_service.get_capteurs_etat(user_id))
        if name == "list_datasets":
            return _truncate(_list_datasets(user_id))
        if name == "query_table":
            return _truncate(_query_table(tool_input.get("table", ""), tool_input.get("limit", 20), user_id))
        return {"error": f"Outil inconnu : {name}"}
    except Exception as exc:  # robustesse : ne jamais casser la boucle agentique
        return {"error": f"Erreur lors de l'exécution de l'outil '{name}': {exc}"}
