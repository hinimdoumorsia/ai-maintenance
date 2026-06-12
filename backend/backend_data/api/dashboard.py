# backend/api/dashboard.py
# Routes FastAPI — Dashboard

from fastapi import APIRouter, HTTPException, Query
from services import dashboard_service

router = APIRouter()


@router.get("/hero")
def get_hero_kpis(user_id: int = Query(...)):
    """4 KPIs du haut : disponibilité, économies YTD, machines alerte, taux détection."""
    try:
        return dashboard_service.get_hero_kpis(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/machines")
def get_machines_risque(user_id: int = Query(...)):
    """Liste machines avec V_RMS, zone ISO, DRBF, défaut."""
    try:
        return dashboard_service.get_machines_risque(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alertes")
def get_alertes(user_id: int = Query(...)):
    """Alertes actives des 24 dernières heures."""
    try:
        return dashboard_service.get_alertes_actives(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/series")
def get_kpi_series(user_id: int = Query(...)):
    """Série journalière 30j pour les graphiques."""
    try:
        return dashboard_service.get_kpi_series_30j(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
def get_kpi_categories(user_id: int = Query(...)):
    """9 catégories de KPIs (fleur de maintenance prédictive)."""
    try:
        return dashboard_service.get_kpi_categories(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/capteurs")
def get_capteurs(user_id: int = Query(...)):
    """État du réseau capteurs IoT."""
    try:
        return dashboard_service.get_capteurs_etat(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/last-update")
def get_last_update():
    """Timestamp de la dernière donnée utile pour le dashboard (mesures vibratoires ou KPIs)."""
    try:
        return dashboard_service.get_last_update()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

