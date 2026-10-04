from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from services.mining_knowledge import (
    get_mining_glossary,
    get_safety_rules,
    compute_production_vs_dispatch,
    compare_coal_producers,
    extract_verified_document_statistics,
    summarize_mining_report,
    generate_decision_brief,
    get_preset_decision_briefs,
)
from services.auth import require_permission
from services.audit import log_audit_event

router = APIRouter(prefix="/mining", tags=["Mining Decision Support"])


class DecisionBriefRequest(BaseModel):
    topic: str
    document_id: Optional[str] = None


class SummarizeRequest(BaseModel):
    filename: str


@router.get("/glossary")
def fetch_mining_glossary(
    query: Optional[str] = Query(None, description="Search term (e.g. 'OMS', 'OBR', 'Gassy', 'RMR')"),
    category: Optional[str] = Query(None, description="Filter by category (Opencast, Strata Control, Safety, Logistics)"),
):
    """Retrieves curated coal mining terminology glossary with statutory references and Hindi equivalents."""
    try:
        entries = get_mining_glossary(query=query, category=category)
        return {"count": len(entries), "glossary": entries}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/glossary/{term}")
def fetch_glossary_term(term: str):
    """Fetches details for a single mining term or acronym."""
    entries = get_mining_glossary(query=term)
    if not entries:
        raise HTTPException(status_code=404, detail=f"Term '{term}' not found in mining glossary")
    return entries[0]


@router.get("/safety-rules")
def fetch_safety_rules(
    query: Optional[str] = Query(None, description="Search regulations (e.g. 'roof support', 'methane', 'HEMM', 'CMR 104')"),
):
    """Retrieves Coal Mines Regulations (CMR) 2017 and DGMS statutory safety directives."""
    try:
        rules = get_safety_rules(query=query)
        return {"count": len(rules), "rules": rules}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/production-vs-dispatch")
def fetch_production_vs_dispatch():
    """Computes exact production vs dispatch variance analysis and net pithead inventory accretion."""
    try:
        return compute_production_vs_dispatch()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/producers-comparison")
def fetch_producers_comparison():
    """Comparative analysis across India's three major coal producer groups: CIL vs SCCL vs Captive."""
    try:
        return compare_coal_producers()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/extracted-statistics")
def fetch_extracted_statistics(
    document_id: Optional[str] = Query(None, description="Filter by document name or ID"),
):
    """Returns verified numerical statistics extracted from statutory documents with exact citations."""
    try:
        stats = extract_verified_document_statistics(document_id=document_id)
        return {"count": len(stats), "statistics": stats}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/summarize-report")
def summarize_report_endpoint(req: SummarizeRequest):
    """Generates an executive, operational, safety, and financial structured summary of a mining document."""
    if not req.filename.strip():
        raise HTTPException(status_code=400, detail="Filename cannot be empty")
    try:
        return summarize_mining_report(filename=req.filename)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/decision-briefs")
def fetch_decision_briefs():
    """Returns preset statutory decision briefs for executive review."""
    try:
        briefs = get_preset_decision_briefs()
        return {"count": len(briefs), "briefs": briefs}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/decision-brief")
def create_decision_brief(
    req: DecisionBriefRequest,
    current_user: Dict[str, Any] = Depends(require_permission("report.generate")),
):
    """Generates a structured Mining Decision Brief based on verified document evidence."""
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    try:
        res = generate_decision_brief(topic=req.topic, document_id=req.document_id)

        log_audit_event(
            action="report.generate_brief",
            resource="decision_brief",
            user_id=str(current_user["_id"]),
            username=current_user.get("username"),
            status="success",
            metadata={"topic": req.topic[:100], "document_id": req.document_id},
        )

        return res
    except Exception as exc:
        log_audit_event(
            action="report.generate_brief",
            resource="decision_brief",
            user_id=str(current_user["_id"]),
            username=current_user.get("username"),
            status="failure",
            metadata={"topic": req.topic[:100], "error": str(exc)},
        )
        raise HTTPException(status_code=500, detail=str(exc))


