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
