# backend/services/admin_service.py
# Logique métier pour la page Paramètres / Administration

def get_entreprise():
    return {"id": 1, "nom": "Atlas Industries Maroc", "secteur": "Manufacturing", "site": "Casablanca", "effectif": 250}

def update_entreprise(data: dict):
    return {"success": True, "data": data}

def get_machines():
    return [
        {"id": 1, "code": "M001", "nom": "Compresseur Atlas C-1", "type": "Compresseur", "atelier": "A"},
        {"id": 2, "code": "M002", "nom": "Pompe hydraulique P-12", "type": "Pompe", "atelier": "B"},
        {"id": 3, "code": "M003", "nom": "Moteur électrique ME-45", "type": "Moteur", "atelier": "A"},
        {"id": 4, "code": "M004", "nom": "Ventilateur V-08", "type": "Ventilateur", "atelier": "C"},
        {"id": 5, "code": "M005", "nom": "Réducteur R-22", "type": "Réducteur", "atelier": "B"},
    ]

def add_machine(data: dict):
    return {"success": True, "machine": data}

def update_machine(machine_id: int, data: dict):
    return {"success": True, "id": machine_id, "data": data}

def delete_machine(machine_id: int):
    return {"success": True, "id": machine_id}

def get_machine_capteurs(machine_id: int):
    return [
        {"id": 1, "type": "Accéléromètre", "position": "Roulement 1", "statut": "Actif", "batterie": 85},
        {"id": 2, "type": "Vélocimètre", "position": "Sortie arbre", "statut": "Actif", "batterie": 72},
    ]

def add_capteur(machine_id: int, data: dict):
    return {"success": True, "machine_id": machine_id, "capteur": data}

def delete_capteur(capteur_id: int):
    return {"success": True, "id": capteur_id}
