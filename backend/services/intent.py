import re
from typing import Dict, Any


def classify_intent(query: str) -> Dict[str, Any]:
    """
    Classifies the user's natural language query into one of:
    FACTUAL, COMPARISON, REPORT_GENERATION, VALIDATION, ANALYTICS, DOCUMENT_SEARCH.
    Also extracts target entities (e.g., CIL, CMPDI) and years if present.
    """
    q_lower = query.lower().strip()

    # Detect entities
    entities = []
    if "cil" in q_lower or "coal india" in q_lower:
        entities.append("CIL")
    if "cmpdi" in q_lower or "cmpdil" in q_lower:
        entities.append("CMPDI")
    if "sccl" in q_lower or "singareni" in q_lower:
        entities.append("SCCL")
    if "nlc" in q_lower or "nlcil" in q_lower:
        entities.append("NLCIL")

    # Detect financial/calendar years
    years = re.findall(r'\b(?:20\d{2}[-–/]\d{2,4}|20\d{2})\b', query)

    # 1. REPORT_GENERATION
    if any(k in q_lower for k in [
        "generate report", "generate a report", "create report", "prepare report",
        "make report", "annual report summary", "mining report"
    ]):
        return {
            "intent": "REPORT_GENERATION",
            "entities": entities,
            "years": years,
            "description": "User requested formal multi-section report generation.",
        }

    # 2. VALIDATION / CONTRADICTION
    if any(k in q_lower for k in [
        "inconsistent", "inconsistency", "contradiction", "discrepancy",
        "conflicting", "mismatch", "data conflict", "validate data"
    ]):
        return {
            "intent": "VALIDATION",
            "entities": entities,
            "years": years,
            "description": "User requested detection of conflicting or contradictory data.",
        }

    # 3. COMPARISON
    if any(k in q_lower for k in [
        "compare", "comparison", "difference between", "versus", "vs.", "vs",
        "vis-a-vis", "growth from", "change between"
    ]) or (len(entities) >= 2) or ("2023" in q_lower and "2024" in q_lower):
        return {
            "intent": "COMPARISON",
            "entities": entities,
            "years": years,
            "description": "User requested comparison across entities, subsidiaries, or time periods.",
        }

    # 4. ANALYTICS / TRENDS
    if any(k in q_lower for k in [
        "trend", "trends", "statistics", "analytics", "total", "average", "growth rate",
        "kpi", "metrics", "chart", "breakdown", "performance over time"
    ]):
        return {
            "intent": "ANALYTICS",
            "entities": entities,
            "years": years,
            "description": "User requested analytical aggregation, statistical trend, or KPI overview.",
        }

    # 5. DOCUMENT_SEARCH
    if any(k in q_lower for k in [
        "search for", "find documents", "locate", "list documents containing",
        "where is", "which page mentions"
    ]):
        return {
            "intent": "DOCUMENT_SEARCH",
            "entities": entities,
            "years": years,
            "description": "User requested document search with page citations.",
        }

    # Default: FACTUAL
    return {
        "intent": "FACTUAL",
        "entities": entities,
        "years": years,
        "description": "User asked a direct factual question grounded in indexed documents.",
    }
