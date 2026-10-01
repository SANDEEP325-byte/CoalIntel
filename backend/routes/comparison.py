from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from services.comparison import compare_cil_and_cmpdi, compare_production_temporal
from services.contradiction import detect_data_contradictions
from services.report_diff import compare_reports_diff

router = APIRouter(prefix="/comparison", tags=["Comparison"])


@router.get("/cil-vs-cmpdi")
@router.get("/cil-cmpdi")
def get_cil_cmpdi_comparison(year: str = Query("2024-25"), fiscal_year: Optional[str] = Query(None)):
    """Compares operational roles, production, PBT, and technical outputs of CIL and CMPDI."""
    try:
        yr = fiscal_year or year
        return compare_cil_and_cmpdi(year=yr)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/temporal")
def get_temporal_comparison():
    """Compares production and safety trends across consecutive financial years."""
    try:
        return compare_production_temporal()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/contradictions")
def get_contradictions(
    severity: Optional[str] = Query(None, description="Filter by severity (HIGH, MEDIUM, LOW)"),
    entity: Optional[str] = Query(None, description="Filter by entity (CIL, CMPDI, All India)"),
):
    """Scans for cross-document data contradictions and numeric discrepancies."""
    try:
        return detect_data_contradictions(severity=severity, entity=entity)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/diff")
def get_report_diff(
    doc_a: str = Query("CIL_Annual_Report_2024_25.pdf.pdf"),
    doc_b: str = Query("Coal & Lignite Production Report 2025-26.pdf"),
):
    """Compares two report versions detecting NEW, REMOVED, CHANGED, and UNCHANGED items."""
    try:
        return compare_reports_diff(doc_a_name=doc_a, doc_b_name=doc_b)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/subsidiaries")
def get_subsidiaries_comparison(subsidiaries: Optional[str] = Query(None, description="Comma-separated list of subsidiaries (e.g., MCL,SECL,NCL)")):
    """Compares operational and safety metrics across CIL subsidiaries."""
    try:
        from services.comparison import compare_subsidiaries
        subs_list = [s.strip() for s in subsidiaries.split(",")] if subsidiaries else None
        return compare_subsidiaries(selected_subsidiaries=subs_list)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/yoy")
def get_yoy_comparison():
    """Provides comprehensive Year-over-Year (YoY) operational analysis."""
    try:
        from services.comparison import get_yoy_analysis
        return get_yoy_analysis()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

