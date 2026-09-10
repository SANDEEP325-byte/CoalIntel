import re
from typing import List, Dict, Any, Tuple


def extract_numbers_and_keywords(text: str) -> List[str]:
    """Extracts numbers, percentages, financial values, and key entities from text."""
    # Find numbers with decimals, commas, MT, Crore, %, years
    tokens = re.findall(r'\b\d+(?:[.,]\d+)?%?\b|(?:FY\s*\d{4}-\d{2})|(?:\d{4}-\d{2})', text, re.IGNORECASE)
    return [t.strip().lower() for t in tokens if t.strip()]


def calculate_confidence(
    question: str,
    answer: str,
    sources: List[Dict[str, Any]],
) -> Tuple[float, str, Dict[str, Any]]:
    """
    Computes a multi-factor confidence score for an AI answer:
    1. Retrieval Quality: Highest hybrid/similarity score among retrieved chunks.
    2. Number & Fact Grounding: Ratio of key facts/numbers in answer that exist in context.
    3. Source Page Precision: Penalty if top source lacks a verified page number.
    Returns: (confidence_float, confidence_level_str, details_dict)
    """
    clean_answer = answer.strip()
    if "insufficient evidence" in clean_answer.lower() or "not found in the provided" in clean_answer.lower():
        # Confident that information is absent
        return 0.95, "HIGH", {"grounding": 1.0, "status": "verified_not_found"}

    if not sources:
        return 0.0, "LOW", {"reason": "No sources retrieved"}

    # Factor 1: Retrieval Quality (0 to 1)
    top_score = 0.0
    scores = []
    for s in sources:
        sc = s.get("hybrid_score") or s.get("similarity_score") or 0.0
        scores.append(sc)
    if scores:
        top_score = max(scores)
    avg_top3 = sum(sorted(scores, reverse=True)[:3]) / min(3, len(scores)) if scores else 0.0
    retrieval_factor = (top_score * 0.7) + (avg_top3 * 0.3)
    # Scale from cosine similarity range (0.3 - 0.9) to (0.2 - 1.0)
    retrieval_normalized = min(1.0, max(0.1, (retrieval_factor - 0.2) / 0.6))

    # Factor 2: Number & Fact Grounding
    all_context = " ".join(s.get("text", "") for s in sources).lower()
    answer_numbers = extract_numbers_and_keywords(clean_answer)

    if answer_numbers:
        matched = sum(1 for num in answer_numbers if num in all_context)
        grounding_ratio = matched / len(answer_numbers)
    else:
        # If no specific numbers, check word overlap
        ans_words = [w for w in clean_answer.lower().split() if len(w) > 4 and w.isalnum()]
        if ans_words:
            matched = sum(1 for w in ans_words if w in all_context)
            grounding_ratio = matched / len(ans_words)
        else:
            grounding_ratio = 0.8

    # Factor 3: Page traceability bonus
    page_traceable = any(s.get("page_number") is not None for s in sources[:2])
    trace_bonus = 0.05 if page_traceable else 0.0

    # Composite score
    composite = (retrieval_normalized * 0.45) + (grounding_ratio * 0.50) + trace_bonus
    composite = max(0.05, min(0.99, round(composite, 2)))

    if composite >= 0.75:
        level = "HIGH"
    elif composite >= 0.50:
        level = "MEDIUM"
    else:
        level = "LOW"

    details = {
        "retrieval_score": round(retrieval_factor, 3),
        "grounding_ratio": round(grounding_ratio, 3),
        "matched_facts": f"{len(answer_numbers)} numbers detected",
        "page_traceable": page_traceable,
    }

    return composite, level, details
