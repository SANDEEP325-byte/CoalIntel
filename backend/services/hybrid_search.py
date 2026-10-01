from typing import List, Dict, Any, Optional
from bson import ObjectId
from database.mongodb import chunks_collection
from services.semantic_search import semantic_search
import re


STOP_WORDS = {
    "what", "was", "were", "the", "this", "that", "these", "those", "is", "are",
    "in", "of", "and", "or", "to", "for", "with", "on", "at", "by", "from", "as",
    "into", "like", "through", "after", "over", "between", "out", "against", "during",
    "without", "before", "under", "around", "among", "total", "some", "any", "every",
    "all", "more", "most", "other", "such", "only", "own", "same", "so", "than", "too",
    "very", "can", "will", "just", "should", "now", "how", "much", "many", "tell",
    "give", "please", "about", "which", "there", "their"
}


def keyword_search(
    query: str,
    top_k: int = 15,
    document_id: Optional[str] = None,
    category: Optional[str] = None,
    organization: Optional[str] = None,
    fiscal_year: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Performs full-text keyword search using MongoDB text index with fallback regex."""
    clean_query = query.strip()
    if not clean_query:
        return []

    # Extract informative content words (skipping generic stop words)
    content_words = [
        w.lower() for w in re.findall(r'\b[a-zA-Z0-9_-]+\b', clean_query)
        if w.lower() not in STOP_WORDS and len(w) > 2
    ]
    if not content_words:
        content_words = [w.lower() for w in clean_query.split() if len(w) > 2]

    filter_criteria: Dict[str, Any] = {}
    if document_id:
        filter_criteria["document_id"] = ObjectId(document_id) if ObjectId.is_valid(document_id) else document_id
    if category:
        filter_criteria["document_category"] = category
    if organization:
        filter_criteria["organization"] = {"$regex": re.escape(organization), "$options": "i"}
    if fiscal_year:
        filter_criteria["fiscal_year"] = fiscal_year

    results = []
    search_terms = " ".join(content_words) if content_words else clean_query

    try:
        # MongoDB $text search using informative content terms
        text_query = dict(filter_criteria)
        text_query["$text"] = {"$search": search_terms}

        cursor = chunks_collection.find(
            text_query,
            {
                "document_id": 1,
                "document_name": 1,
                "document_category": 1,
                "organization": 1,
                "fiscal_year": 1,
                "chunk_index": 1,
                "page_number": 1,
                "text": 1,
                "is_table": 1,
                "score": {"$meta": "textScore"},
            },
        ).sort([("score", {"$meta": "textScore"})]).limit(top_k)

        for doc in cursor:
            results.append({
                "document_id": str(doc.get("document_id", "")),
                "document_name": doc.get("document_name") or "Unknown document",
                "document_category": doc.get("document_category") or "Uncategorized",
                "chunk_index": doc.get("chunk_index", 0),
                "page_number": doc.get("page_number"),
                "text": doc.get("text", ""),
                "is_table": doc.get("is_table", False),
                "keyword_score": float(doc.get("score", 1.0)),
            })
    except Exception as exc:
        print(f"Text index search warning: {exc}, using regex fallback")

    # Fallback to regex if $text yielded few results
    if len(results) < top_k and content_words:
        pattern = "|".join(re.escape(w) for w in content_words)
        regex_query = dict(filter_criteria)
        regex_query["text"] = {"$regex": pattern, "$options": "i"}

        existing_chunk_ids = {(r["document_name"], r["chunk_index"]) for r in results}
        cursor = chunks_collection.find(
            regex_query,
            {
                "document_id": 1,
                "document_name": 1,
                "document_category": 1,
                "chunk_index": 1,
                "page_number": 1,
                "text": 1,
                "is_table": 1,
            },
        ).limit(top_k * 2)

        for doc in cursor:
            doc_name = doc.get("document_name") or "Unknown document"
            c_idx = doc.get("chunk_index", 0)
            if (doc_name, c_idx) not in existing_chunk_ids:
                results.append({
                    "document_id": str(doc.get("document_id", "")),
                    "document_name": doc_name,
                    "document_category": doc.get("document_category") or "Uncategorized",
                    "chunk_index": c_idx,
                    "page_number": doc.get("page_number"),
                    "text": doc.get("text", ""),
                    "is_table": doc.get("is_table", False),
                    "keyword_score": 1.0,
                })
                existing_chunk_ids.add((doc_name, c_idx))

    # Calculate mathematically grounded keyword score based on content-word coverage
    valid_results = []
    for r in results:
        txt_lower = r["text"].lower()
        matched = sum(1 for w in content_words if w in txt_lower)
        coverage = matched / max(len(content_words), 1)
        raw_hits = sum(txt_lower.count(w) for w in content_words)
        if coverage > 0.0:
            freq_bonus = min(raw_hits / 10.0, 0.3)
            r["normalized_keyword_score"] = round(min(1.0, (coverage * 0.7) + freq_bonus), 4)
            valid_results.append(r)

    valid_results.sort(key=lambda x: x["normalized_keyword_score"], reverse=True)
    return valid_results[:top_k]


def hybrid_search(
    query: str,
    top_k: int = 5,
    document_id: Optional[str] = None,
    category: Optional[str] = None,
    organization: Optional[str] = None,
    fiscal_year: Optional[str] = None,
    semantic_weight: float = 0.65,
    keyword_weight: float = 0.35,
    rrf_k: int = 60,
    record_history: bool = True,
) -> List[Dict[str, Any]]:
    """
    Executes hybrid retrieval combining dense semantic search and sparse keyword search.
    Applies Reciprocal Rank Fusion (RRF), table evidence grounding bonus, and diversity re-ranking.
    """
    clean_query = query.strip()
    candidate_k = max(top_k * 3, 15)

    from services.intent import classify_intent
    intent_info = classify_intent(clean_query)
    augmented_query = clean_query
    if intent_info.get("extracted_search_terms"):
        augmented_query = f"{clean_query} {' '.join(intent_info['extracted_search_terms'])}"

    semantic_results = semantic_search(
        query=augmented_query,
        top_k=candidate_k,
        document_id=document_id,
        category=category,
        organization=organization,
        fiscal_year=fiscal_year,
    )

    keyword_results = keyword_search(
        query=augmented_query,
        top_k=candidate_k,
        document_id=document_id,
        category=category,
        organization=organization,
        fiscal_year=fiscal_year,
    )

    # Detect if query targets tabular / numeric figures
    numeric_keywords = {"dispatch", "production", "target", "actual", "achievement", "mt", "crore", "pbt", "pat", "fatality", "fatalities", "accident", "seismic", "table"}
    query_tokens = set(clean_query.lower().split())
    has_numeric_intent = bool(query_tokens.intersection(numeric_keywords)) or (intent_info.get("intent") == "NUMERICAL_FACT")

    # Combine candidates by unique key: (document_name, chunk_index)
    combined: Dict[str, Dict[str, Any]] = {}

    # 1. Process semantic ranks
    for rank, item in enumerate(semantic_results, start=1):
        key = f"{item['document_name']}_{item['chunk_index']}"
        rrf_score = 1.0 / (rrf_k + rank)
        combined[key] = {
            "document_id": item["document_id"],
            "document_name": item["document_name"],
            "document_category": item["document_category"],
            "organization": item.get("organization", "All India"),
            "fiscal_year": item.get("fiscal_year", "2024-25"),
            "chunk_index": item["chunk_index"],
            "page_number": item["page_number"],
            "text": item["text"],
            "is_table": item.get("is_table", False),
            "semantic_score": item["similarity_score"],
            "keyword_score": 0.0,
            "rrf_score": rrf_score,
            "semantic_rank": rank,
            "keyword_rank": None,
        }

    # 2. Process keyword ranks
    for rank, item in enumerate(keyword_results, start=1):
        key = f"{item['document_name']}_{item['chunk_index']}"
        rrf_score = 1.0 / (rrf_k + rank)
        if key in combined:
            combined[key]["keyword_score"] = item.get("normalized_keyword_score", 0.5)
            combined[key]["rrf_score"] += rrf_score
            combined[key]["keyword_rank"] = rank
            if item.get("is_table"):
                combined[key]["is_table"] = True
        else:
            combined[key] = {
                "document_id": item["document_id"],
                "document_name": item["document_name"],
                "document_category": item["document_category"],
                "organization": item.get("organization", "All India"),
                "fiscal_year": item.get("fiscal_year", "2024-25"),
                "chunk_index": item["chunk_index"],
                "page_number": item["page_number"],
                "text": item["text"],
                "is_table": item.get("is_table", False),
                "semantic_score": 0.0,
                "keyword_score": item.get("normalized_keyword_score", 0.5),
                "rrf_score": rrf_score,
                "semantic_rank": None,
                "keyword_rank": rank,
            }

    target_category = intent_info.get("target_category")

    # 3. Calculate final hybrid score with grounding bonuses
    ranked_list = []
    for item in combined.values():
        sem_score = item["semantic_score"]
        kw_score = item["keyword_score"]
        
        # Dual-retrieval agreement bonus
        both_match_bonus = 0.10 if (sem_score > 0.38 and kw_score > 0.05) else 0.0
        
        # Table evidence grounding bonus for numeric/statistical queries
        table_bonus = 0.08 if (has_numeric_intent and item.get("is_table")) else 0.0

        # Category relevance boost (only applied when query exhibits genuine domain relevance)
        category_bonus = 0.0
        if target_category and (sem_score > 0.30 or kw_score > 0.10):
            doc_cat = (item.get("document_category") or "").lower()
            doc_name = (item.get("document_name") or "").lower()
            tc_lower = target_category.lower()
            if tc_lower in doc_cat or tc_lower in doc_name:
                category_bonus = 0.12
            elif target_category == "Mine Safety" and "safety" in doc_name:
                category_bonus = 0.12
            elif target_category == "CMPDI" and "cmpdi" in doc_name:
                category_bonus = 0.12
            elif target_category == "Coal & Lignite Production" and ("production" in doc_name or "dispatch" in doc_name):
                category_bonus = 0.12
            elif target_category == "CIL" and "cil" in doc_name:
                category_bonus = 0.08

        hybrid_score = (semantic_weight * sem_score) + (keyword_weight * kw_score) + both_match_bonus + table_bonus + category_bonus
        item["hybrid_score"] = round(float(hybrid_score), 4)
        ranked_list.append(item)

    # 4. Sort primarily by hybrid_score
    ranked_list.sort(key=lambda x: x["hybrid_score"], reverse=True)

    # 5. Page diversity filter: ensure diverse pages if multiple relevant pages exist
    final_results = []
    page_counts: Dict[Any, int] = {}
    overflow = []

    for item in ranked_list:
        doc_page_key = (item["document_name"], item["page_number"])
        current_count = page_counts.get(doc_page_key, 0)
        if current_count < 2:
            final_results.append(item)
            page_counts[doc_page_key] = current_count + 1
        else:
            overflow.append(item)

        if len(final_results) >= top_k:
            break

    # If diverse selection is smaller than top_k, fill from overflow
    if len(final_results) < top_k and overflow:
        final_results.extend(overflow[:top_k - len(final_results)])

    results_to_return = final_results[:top_k]

    # Record search history telemetry
    if record_history and clean_query:
        try:
            from database.mongodb import search_history_collection
            from datetime import datetime, timezone
            search_history_collection.insert_one({
                "query": clean_query,
                "filters": {
                    "document_id": document_id,
                    "category": category,
                    "organization": organization,
                    "fiscal_year": fiscal_year,
                },
                "organization": organization,
                "fiscal_year": fiscal_year,
                "category": category,
                "results_count": len(results_to_return),
                "top_result": results_to_return[0]["document_name"] if results_to_return else None,
                "created_at": datetime.now(timezone.utc),
            })
        except Exception:
            pass

    return results_to_return
