from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from services.report_generator import build_structured_report, export_report_to_docx
from services.parliamentary import process_parliamentary_query

router = APIRouter(prefix="/reports", tags=["Reports"])


class ParliamentaryQueryRequest(BaseModel):
    question: str


class ReportGenerateRequest(BaseModel):
    title: str = "Annual Mining Performance & Decision Intelligence Report"


@router.post("/generate")
def generate_report(request: ReportGenerateRequest):
    """Generates the full 9-section structured mining intelligence report with tables and sources."""
    try:
        return build_structured_report(title=request.title)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/download/docx")
@router.get("/export-docx")
def download_report_docx(title: str = "Annual Mining Performance & Decision Intelligence Report"):
    """Generates and downloads the structured report as a formatted Microsoft Word (.docx) document."""
    try:
        report_data = build_structured_report(title=title)
        docx_bytes = export_report_to_docx(report_data)
        filename = "CoalIntel_Mining_Performance_Report.docx"
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/parliamentary")
def answer_parliamentary_query(request: ParliamentaryQueryRequest):
    """Processes natural language questions in official Government of India parliamentary brief format."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    try:
        return process_parliamentary_query(question=request.question)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
