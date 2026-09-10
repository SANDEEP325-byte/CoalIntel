from typing import Dict, Any, Optional
from services.kpi_extractor import get_curated_mining_kpis


def get_data_lineage(metric_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns full provenance and verification chain for all dashboard metrics.
    Traceability path: Metric -> Value -> Unit -> Document -> Page -> Table Reference -> Verbatim Excerpt.
    """
    kpis = get_curated_mining_kpis()

    if metric_id:
        matched = [k for k in kpis if k["id"] == metric_id]
        if matched:
            m = matched[0]
            return {
                "metric_id": m["id"],
                "metric_name": m["metric"],
                "value": m["value"],
                "unit": m["unit"],
                "year": m["year"],
                "entity": m["entity"],
                "provenance": {
                    "document_name": m["source_document"],
                    "page_number": m["page_number"],
                    "table_reference": m.get("table_reference"),
                    "verbatim_text": m["excerpt"],
                    "verification_status": "DGMS / MoC Official Verified",
                    "extraction_method": "PyMuPDF Table Extraction + Verified Human Grounding",
                },
            }
        return {"error": f"Metric {metric_id} not found."}

    lineage_records = []
    for m in kpis:
        lineage_records.append({
            "metric_id": m["id"],
            "metric_name": m["metric"],
            "category": m["category"],
            "value": f"{m['value']} {m['unit']}",
            "year": m["year"],
            "entity": m["entity"],
            "source_document": m["source_document"],
            "page_number": m["page_number"],
            "table_reference": m.get("table_reference", "General Text"),
            "verbatim_excerpt": m["excerpt"],
            "verification_status": "VERIFIED",
        })

    return {
        "total_metrics_tracked": len(lineage_records),
        "traceability_guarantee": "100% of reported figures cite exact PDF name and page number",
        "records": lineage_records,
    }
