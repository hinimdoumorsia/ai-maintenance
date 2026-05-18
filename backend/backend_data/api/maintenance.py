# backend/api/maintenance.py
# Routes FastAPI — Page Maintenance (Planning / BT / Stocks)

from fastapi import APIRouter, HTTPException
from services import maintenance_service

router = APIRouter()


# ── Planning ──────────────────────────────────────────────────────────────────

@router.get("/planning")
def get_planning():
    """BTs planifiés avec machine et technicien — calendrier 30j."""
    try:
        return maintenance_service.get_planning()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Bons de travail ───────────────────────────────────────────────────────────

@router.get("/bons-de-travail")
def get_bons_de_travail(statut: str = None, priorite: str = None):
    """Liste complète des BTs avec filtres optionnels."""
    try:
        return maintenance_service.get_bons_de_travail(statut=statut, priorite=priorite)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bons-de-travail/{id_bt}")
def get_bt_detail(id_bt: int):
    """Détail complet d'un BT avec interventions et pièces."""
    try:
        return maintenance_service.get_bt_detail(id_bt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bons-de-travail")
def create_bon_de_travail(bt: dict):
    """Créer un nouveau bon de travail."""
    try:
        return maintenance_service.create_bon_de_travail(bt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Stocks pièces ─────────────────────────────────────────────────────────────

@router.get("/stocks")
def get_stocks():
    """Inventaire pièces de rechange avec alertes stock min."""
    try:
        return maintenance_service.get_stocks()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stocks/mouvements")
def get_mouvements_stock():
    """Historique des mouvements de stock (30 derniers)."""
    try:
        return maintenance_service.get_mouvements_stock()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
def get_maintenance_stats():
    """KPIs résumés pour la page Maintenance."""
    try:
        return maintenance_service.get_maintenance_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Machines pour formulaire ───────────────────────────────────────────────────

@router.get("/machines")
def get_machines():
    """Liste des machines actives pour les formulaires (création BT)."""
    try:
        return maintenance_service.get_machines()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@router.get("/techniciens")
def get_techniciens():
    try:
        return maintenance_service.get_techniciens()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bons-de-travail/{id_bt}/assigner")
def assigner_technicien(id_bt: int, data: dict):
    try:
        return maintenance_service.assigner_technicien(id_bt, data.get("id_technicien"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bons-de-travail/{id_bt}/assigner")
def assigner_technicien(id_bt: int, data: dict):
    try:
        result = maintenance_service.assigner_technicien(id_bt, data.get("id_technicien"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/bons-de-travail/{id_bt}/statut")
def update_bt_statut(id_bt: int, data: dict):
    try:
        return maintenance_service.update_bt_statut(id_bt, data.get("statut"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/historique")
def get_historique():
    try:
        return maintenance_service.get_historique()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/historique/stats")
def get_historique_stats():
    try:
        return maintenance_service.get_historique_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/historique/clear")
def clear_historique():
    try:
        return maintenance_service.clear_historique()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/stocks/{id_piece}/seuil")
def update_stock_threshold(id_piece: int, data: dict):
    try:
        return maintenance_service.update_stock_threshold(id_piece, data.get("stock_min"), data.get("stock_max"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))