# backend/services/admin_service.py
# Logique métier pour la page Paramètres / Administration

from db.database import db_session, rows_to_list

def get_entreprise(user_id: int):
    with db_session() as conn:
        # Get entreprise ID from user
        user = conn.execute("SELECT id_entreprise FROM utilisateur WHERE id_utilisateur = ?", (user_id,)).fetchone()
        if not user or not user["id_entreprise"]:
            return {}
        
        ent = conn.execute("SELECT * FROM entreprise WHERE id_entreprise = ?", (user["id_entreprise"],)).fetchone()
        return dict(ent) if ent else {}

def update_entreprise(user_id: int, data: dict):
    with db_session() as conn:
        user = conn.execute("SELECT id_entreprise FROM utilisateur WHERE id_utilisateur = ?", (user_id,)).fetchone()
        if not user or not user["id_entreprise"]:
            return {"success": False, "detail": "Pas d'entreprise associée"}
            
        ent_id = user["id_entreprise"]
        conn.execute(
            """UPDATE entreprise 
               SET nom_entreprise = ?, contact_telephone = ?, contact_email = ?, 
                   adresse_usine = ?, ville = ?, pays = ?, code_postal = ?, 
                   domaine_industriel = ?, descriptif_activite = ?, production_principale = ?, site_web = ?
               WHERE id_entreprise = ?""",
            (
                data.get("nom_entreprise"), data.get("contact_telephone"), data.get("contact_email"),
                data.get("adresse_usine"), data.get("ville"), data.get("pays"), data.get("code_postal"),
                data.get("domaine_industriel"), data.get("descriptif_activite"), data.get("production_principale"), data.get("site_web"),
                ent_id
            )
        )
        return {"success": True}

def get_machines(user_id: int):
    with db_session() as conn:
        user = conn.execute("SELECT id_entreprise FROM utilisateur WHERE id_utilisateur = ?", (user_id,)).fetchone()
        if not user or not user["id_entreprise"]:
            return []
            
        # Get machines for the usines/ateliers of this entreprise
        rows = conn.execute(
            """SELECT m.*, a.nom_atelier 
               FROM machine m
               JOIN atelier a ON m.id_atelier = a.id_atelier
               JOIN usine u ON a.id_usine = u.id_usine
               WHERE u.id_entreprise = ?""", 
            (user["id_entreprise"],)
        ).fetchall()
        
        machines = rows_to_list(rows)
        for machine in machines:
            capteurs_rows = conn.execute("SELECT * FROM capteur WHERE id_machine = ?", (machine["id_machine"],)).fetchall()
            machine["capteurs"] = rows_to_list(capteurs_rows)
            
        return machines

def add_machine(user_id: int, data: dict):
    with db_session() as conn:
        # Get user's first atelier
        user = conn.execute("SELECT id_entreprise FROM utilisateur WHERE id_utilisateur = ?", (user_id,)).fetchone()
        if not user or not user["id_entreprise"]:
            return {"success": False, "detail": "Pas d'entreprise associée"}
            
        atelier = conn.execute(
            """SELECT a.id_atelier FROM atelier a 
               JOIN usine u ON a.id_usine = u.id_usine 
               WHERE u.id_entreprise = ? LIMIT 1""", 
            (user["id_entreprise"],)
        ).fetchone()
        
        if not atelier:
            return {"success": False, "detail": "Pas d'atelier trouvé pour l'entreprise"}
            
        cur = conn.execute(
            """INSERT INTO machine (id_atelier, code_machine, nom_machine, type_machine, role_machine, statut)
               VALUES (?, ?, ?, ?, ?, 'en_service')""",
            (atelier["id_atelier"], data.get("code", ""), data.get("nom", ""), data.get("type", "autre"), data.get("role", ""))
        )
        return {"success": True, "id": cur.lastrowid}

def update_machine(machine_id: int, data: dict):
    with db_session() as conn:
        conn.execute(
            """UPDATE machine 
               SET code_machine = ?, type_machine = ?, role_machine = ?
               WHERE id_machine = ?""",
            (data.get("code"), data.get("type"), data.get("role"), machine_id)
        )
    return {"success": True, "id": machine_id}

def delete_machine(machine_id: int):
    with db_session() as conn:
        conn.execute("DELETE FROM machine WHERE id_machine = ?", (machine_id,))
    return {"success": True, "id": machine_id}

def get_machine_capteurs(machine_id: int):
    with db_session() as conn:
        rows = conn.execute("SELECT * FROM capteur WHERE id_machine = ?", (machine_id,)).fetchall()
        return rows_to_list(rows)

def add_capteur(machine_id: int, data: dict):
    with db_session() as conn:
        code = f"C-{data.get('type', 'U')[:3].upper()}-{machine_id}"
        cur = conn.execute(
            """INSERT INTO capteur (id_machine, code_capteur, type_capteur, position_montage, unite_mesure, statut, date_installation, niveau_batterie_pct)
               VALUES (?, ?, ?, ?, ?, 'actif', datetime('now'), 100)""",
            (machine_id, code, data.get("type", "accelerometre"), data.get("position", ""), data.get("acquisition", ""))
        )
        return {"success": True, "id": cur.lastrowid}

def delete_capteur(capteur_id: int):
    with db_session() as conn:
        conn.execute("DELETE FROM capteur WHERE id_capteur = ?", (capteur_id,))
    return {"success": True, "id": capteur_id}
