# backend/api/dashboard.py
# Routes FastAPI — Dashboard

from fastapi import APIRouter, HTTPException
from services import dashboard_service

router = APIRouter()


@router.get("/hero")
def get_hero_kpis():
    """4 KPIs du haut : disponibilité, économies YTD, machines alerte, taux détection."""
    try:
        return dashboard_service.get_hero_kpis()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/machines")
def get_machines_risque():
    """Liste machines avec V_RMS, zone ISO, DRBF, défaut."""
    try:
        return dashboard_service.get_machines_risque()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alertes")
def get_alertes():
    """Alertes actives des 24 dernières heures."""
    try:
        return dashboard_service.get_alertes_actives()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/series")
def get_kpi_series():
    """Série journalière 30j pour les graphiques."""
    try:
        return dashboard_service.get_kpi_series_30j()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
def get_kpi_categories():
    """9 catégories de KPIs (fleur de maintenance prédictive)."""
    try:
        return dashboard_service.get_kpi_categories()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/capteurs")
def get_capteurs():
    """État du réseau capteurs IoT."""
    try:
        return dashboard_service.get_capteurs_etat()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

