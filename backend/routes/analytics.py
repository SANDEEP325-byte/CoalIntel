from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.kpi_extractor import get_mining_kpis
from services.lineage import get_data_lineage
from services.comparison import compare_production_temporal
from services.contradiction import detect_data_contradictions

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/kpis")
def fetch_kpis(
    category: Optional[str] = Query(None, description="Filter by category (Production, Dispatch, Safety, Revenue & Profit, Exploration)"),
    entity: Optional[str] = Query(None, description="Filter by entity (CIL, CMPDI, All India)"),
    year: Optional[str] = Query(None, description="Filter by year (e.g., 2024-25)"),
):
    """Fetches verified mining KPIs with page-level lineage citations."""
    try:
        data = get_mining_kpis(category=category, entity=entity, year=year)
        return {"count": len(data), "total_kpis": len(data), "kpis": data}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/lineage")
def fetch_data_lineage(metric_id: Optional[str] = Query(None)):
    """Retrieves full provenance tracking chain for a metric."""
    try:
        return get_data_lineage(metric_id=metric_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/lineage/{metric_id}")
def fetch_data_lineage_by_path(metric_id: str):
    """Retrieves full provenance tracking chain for a specific metric ID."""
    try:
        return get_data_lineage(metric_id=metric_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/contradictions")
def fetch_contradictions():
    """Scans for cross-document data contradictions and numeric discrepancies."""
    try:
        return detect_data_contradictions()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/why-change")
def explain_metric_changes():
    """Provides source-grounded explanations for historical shifts in production, dispatch, and safety."""
    try:
        return compare_production_temporal()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
