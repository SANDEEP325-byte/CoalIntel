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

    # Detect Hindi / Devanagari script or Hinglish
    has_devanagari = bool(re.search(r'[\u0900-\u097F]', query))
    hinglish_markers = ["kitna", "kya", "kaise", "batao", "lakshya", "utpadan", "koyla", "khadan"]
    has_hinglish = any(m in q_lower for m in hinglish_markers)
    language = "HINDI" if has_devanagari else ("HINGLISH" if has_hinglish else "ENGLISH")

    # Domain dictionary mapping Hindi mining terms to English equivalents for search
    hindi_to_eng = {
        "कोयला": "coal",
        "उत्पादन": "production",
        "लक्ष्य": "target",
        "प्रेषण": "dispatch",
        "सुरक्षा": "safety",
        "दुर्घटना": "accident",
        "खदान": "mine",
        "खनन": "mining",
        "अन्वेषण": "exploration",
        "सहायक": "subsidiary",
        "वित्तीय": "financial",
        "वार्षिक": "annual",
        "रिपोर्ट": "report",
        "koyla": "coal",
        "utpadan": "production",
        "lakshya": "target",
        "preshan": "dispatch",
        "suraksha": "safety",
    }
    extracted_search_terms = []
    for h_term, eng_term in hindi_to_eng.items():
        if h_term in query or h_term in q_lower:
            extracted_search_terms.append(eng_term)

    # Detect domain category
    target_category = None
    if any(k in q_lower for k in ["safety", "accident", "accidents", "fatal", "fatality", "fatalities", "injury", "injuries", "dgms"]):
        target_category = "Mine Safety"
    elif any(k in q_lower for k in ["seismic", "exploration", "drilling", "borehole", "pbt", "profit before tax", "cmpdi", "cmpdil"]):
        target_category = "CMPDI"
    elif any(k in q_lower for k in ["lignite", "dispatch", "offtake", "production", "raw coal"]):
        target_category = "Coal & Lignite Production"
    elif "cil" in q_lower or "coal india" in q_lower:
        target_category = "CIL"

    # Domain acronym expansion
    if "cil" in q_lower:
        extracted_search_terms.extend(["Coal", "India", "Limited"])
    if "cmpdi" in q_lower or "cmpdil" in q_lower:
        extracted_search_terms.extend(["CMPDIL", "Central", "Mine", "Planning"])
    if "obr" in q_lower:
        extracted_search_terms.extend(["Overburden", "Removal"])
    if any(k in q_lower for k in ["safety", "accident", "accidents", "fatal", "fatality", "fatalities"]):
        extracted_search_terms.extend(["Accident", "Statistics", "Fatalities", "Fatality"])

    # Detect numerical / statistical fact intent
    is_numerical = any(k in q_lower for k in [
        "how much", "what was", "figure", "target", "production", "dispatch", "offtake", "tonnes", "mt", "crore", "rate"
    ]) or has_devanagari and any(w in query for w in ["कितना", "उत्पादन", "लक्ष्य", "संख्या"])

    # 1. REPORT_GENERATION
    if any(k in q_lower for k in [
        "generate report", "generate a report", "create report", "prepare report",
        "make report", "annual report summary", "mining report"
    ]):
        return {
            "intent": "REPORT_GENERATION",
            "entities": entities,
            "years": years,
            "target_category": target_category,
            "language": language,
            "extracted_search_terms": extracted_search_terms,
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
            "target_category": target_category,
            "language": language,
            "extracted_search_terms": extracted_search_terms,
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
            "target_category": target_category,
            "language": language,
            "extracted_search_terms": extracted_search_terms,
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
            "target_category": target_category,
            "language": language,
            "extracted_search_terms": extracted_search_terms,
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
            "target_category": target_category,
            "language": language,
            "extracted_search_terms": extracted_search_terms,
            "description": "User requested document search with page citations.",
        }

    # 6. NUMERICAL_FACT
    if is_numerical:
        return {
            "intent": "NUMERICAL_FACT",
            "entities": entities,
            "years": years,
            "target_category": target_category,
            "language": language,
            "extracted_search_terms": extracted_search_terms,
            "description": "User requested numerical or statistical metrics often found in tables.",
        }

    # Default: FACTUAL
    return {
        "intent": "FACTUAL",
        "entities": entities,
        "years": years,
        "target_category": target_category,
        "language": language,
        "extracted_search_terms": extracted_search_terms,
        "description": "User asked a direct factual question grounded in indexed documents.",
    }

