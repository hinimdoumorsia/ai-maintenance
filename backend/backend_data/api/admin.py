# backend/api/admin.py
# Routes FastAPI pour la page Paramètres / Administration

from fastapi import APIRouter, HTTPException
from services import admin_service

router = APIRouter()


@router.get("/entreprise")
def get_entreprise():
    try:
        return admin_service.get_entreprise()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/entreprise")
def update_entreprise(data: dict):
    try:
        return admin_service.update_entreprise(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/machines")
def get_machines():
    try:
        return admin_service.get_machines()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/machines")
def add_machine(data: dict):
    try:
        return admin_service.add_machine(data)
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
