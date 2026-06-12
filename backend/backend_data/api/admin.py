# backend/api/admin.py
# Routes FastAPI pour la page Paramètres / Administration

from fastapi import APIRouter, HTTPException, Query
from services import admin_service

router = APIRouter()


@router.get("/entreprise")
def get_entreprise(user_id: int = Query(...)):
    try:
        return admin_service.get_entreprise(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/entreprise")
def update_entreprise(data: dict, user_id: int = Query(...)):
    try:
        return admin_service.update_entreprise(user_id, data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/machines")
def get_machines(user_id: int = Query(...)):
    try:
        return admin_service.get_machines(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/machines")
def add_machine(data: dict, user_id: int = Query(...)):
    try:
        return admin_service.add_machine(user_id, data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/machines/{machine_id}")
def update_machine(machine_id: int, data: dict):
    try:
        return admin_service.update_machine(machine_id, data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/machines/{machine_id}")
def delete_machine(machine_id: int):
    try:
        return admin_service.delete_machine(machine_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/machines/{machine_id}/capteurs")
def get_machine_capteurs(machine_id: int):
    try:
        return admin_service.get_machine_capteurs(machine_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/machines/{machine_id}/capteurs")
def add_capteur(machine_id: int, data: dict):
    try:
        return admin_service.add_capteur(machine_id, data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/capteurs/{capteur_id}")
def delete_capteur(capteur_id: int):
    try:
        return admin_service.delete_capteur(capteur_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/machines/needs-review-count")
def get_needs_review_count(user_id: int = Query(...)):
    """Compte les machines auto-importées depuis datasets avec infos incomplètes."""
    from db.database import db_session
    try:
        with db_session() as conn:
            row = conn.execute("""
                SELECT COUNT(*) as cnt FROM machine m
                JOIN atelier a ON m.id_atelier = a.id_atelier
                JOIN usine u ON a.id_usine = u.id_usine
                JOIN utilisateur ut ON u.id_entreprise = ut.id_entreprise
                WHERE ut.id_utilisateur = ?
                  AND m.origine_dataset IS NOT NULL
                  AND (m.type_machine = 'autre' OR m.puissance_kw IS NULL)
            """, [user_id]).fetchone()
        return {"count": row["cnt"] if row else 0}
    except Exception:
        return {"count": 0}
