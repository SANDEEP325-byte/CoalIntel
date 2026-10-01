from typing import Optional, List
from fastapi import APIRouter, HTTPException, Response, Query
from pydantic import BaseModel
from services.report_generator import build_structured_report, export_report_to_docx, generate_subsidiary_kpi_csv
from services.parliamentary import process_parliamentary_query
from datetime import datetime

router = APIRouter(prefix="/reports", tags=["Reports"])


class ParliamentaryQueryRequest(BaseModel):
    question: str
    question_type: Optional[str] = "STARRED"
    house: Optional[str] = "LOK_SABHA"
    session: Optional[str] = None
    question_number: Optional[str] = None


class ReportGenerateRequest(BaseModel):
    title: Optional[str] = "Annual Mining Performance & Decision Intelligence Report"
    report_type: Optional[str] = "comprehensive_annual"
    year: Optional[str] = "2024-25"
    subsidiary: Optional[str] = None


@router.get("/templates")
def get_report_templates():
    """Returns available structured intelligence report templates."""
    return {
        "templates": [
            {
                "id": "comprehensive_annual",
                "name": "Comprehensive Annual Performance & Intelligence Report",
                "sections": 9,
                "description": "Full multi-subsidiary review including macro production, dispatch, exploration, safety indicators, and data anomaly registries.",
            },
            {
                "id": "production_dispatch",
                "name": "Executive Coal Production & Dispatch Performance Brief",
                "sections": 9,
                "description": "Focused operational brief detailing CIL production (781.06 MT), dispatch (762.83 MT), railway evacuation, and power utility supply.",
            },
            {
                "id": "subsidiary_review",
                "name": "CIL Subsidiary-Wise Operational & Safety Review",
                "sections": 9,
                "description": "Subsidiary-level scorecards comparing MCL, SECL, NCL, CCL, WCL, ECL, and BCCL on production, targets, and fatality rates.",
            },
            {
                "id": "geological_exploration",
                "name": "CMPDIL Geological Exploration & Technical Consultancy Report",
                "sections": 9,
                "description": "Specialized report on CMPDI's 2D seismic exploration (438 line km), drilling operations, and all-time record PBT (Rs. 882.14 Cr).",
            },
        ]
    }


@router.post("/generate")
def generate_report(request: ReportGenerateRequest):
    """Generates the full 9-section structured mining intelligence report with tables and sources."""
    try:
        title = request.title or "Annual Mining Performance & Decision Intelligence Report"
        report_type = request.report_type or "comprehensive_annual"
        year = request.year or "2024-25"
        return build_structured_report(
            title=title,
            report_type=report_type,
            year=year,
            subsidiary=request.subsidiary,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/download/docx")
@router.get("/export-docx")
def download_report_docx(
    title: str = Query("Annual Mining Performance & Decision Intelligence Report"),
    report_type: str = Query("comprehensive_annual"),
    year: str = Query("2024-25"),
    subsidiary: Optional[str] = Query(None),
):
    """Generates and downloads the structured report as a formatted Microsoft Word (.docx) document."""
    try:
        report_data = build_structured_report(
            title=title,
            report_type=report_type,
            year=year,
            subsidiary=subsidiary,
        )
        docx_bytes = export_report_to_docx(report_data)
        safe_name = title.replace(" ", "_").replace("&", "and")[:40]
        filename = f"{safe_name}.docx"
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/export/csv")
@router.get("/download/csv")
def download_kpi_csv():
    """Generates and downloads the verified subsidiary KPI and YoY matrix as a standard CSV file."""
    try:
        csv_data = generate_subsidiary_kpi_csv()
        filename = f"CoalIntel_Subsidiary_Performance_{datetime.now().strftime('%Y%m%d')}.csv"
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))



@router.post("/parliamentary")
def answer_parliamentary_query(request: ParliamentaryQueryRequest):
    """Processes natural language questions in official Government of India parliamentary brief format."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    try:
        return process_parliamentary_query(
            question=request.question,
            question_type=request.question_type or "STARRED",
            house=request.house or "LOK_SABHA",
            session=request.session,
            question_number=request.question_number,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
