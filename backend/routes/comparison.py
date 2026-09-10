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
def get_contradictions():
    """Scans for cross-document data contradictions and numeric discrepancies."""
    try:
        return detect_data_contradictions()
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
