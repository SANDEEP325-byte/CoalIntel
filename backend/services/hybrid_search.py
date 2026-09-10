from typing import List, Dict, Any, Optional
from bson import ObjectId
from database.mongodb import chunks_collection
from services.semantic_search import semantic_search
import re


def keyword_search(
    query: str,
    top_k: int = 15,
    document_id: Optional[str] = None,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Performs full-text keyword search using MongoDB text index with fallback regex."""
    clean_query = query.strip()
    if not clean_query:
        return []

    filter_criteria: Dict[str, Any] = {}
    if document_id:
        filter_criteria["document_id"] = ObjectId(document_id) if ObjectId.is_valid(document_id) else document_id
    if category:
        filter_criteria["document_category"] = category

    results = []
    try:
        # MongoDB $text search
        text_query = dict(filter_criteria)
        text_query["$text"] = {"$search": clean_query}

        cursor = chunks_collection.find(
            text_query,
            {
                "document_id": 1,
                "document_name": 1,
                "document_category": 1,
                "chunk_index": 1,
                "page_number": 1,
                "text": 1,
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
                "keyword_score": float(doc.get("score", 1.0)),
            })
    except Exception as exc:
        print(f"Text index search warning: {exc}, using regex fallback")

    # Fallback to regex if $text yielded few results or failed
    if len(results) < top_k:
        words = [re.escape(w) for w in clean_query.split() if len(w) > 2 and w.isalnum()]
        if words:
            pattern = "|".join(words)
            regex_query = dict(filter_criteria)
            regex_query["text"] = {"$regex": pattern, "$options": "i"}

            existing_chunk_ids = {r["chunk_index"] for r in results}
            cursor = chunks_collection.find(
                regex_query,
                {
                    "document_id": 1,
                    "document_name": 1,
                    "document_category": 1,
                    "chunk_index": 1,
                    "page_number": 1,
                    "text": 1,
                },
            ).limit(top_k * 2)

            for doc in cursor:
                c_idx = doc.get("chunk_index", 0)
                if c_idx not in existing_chunk_ids:
                    # Simple frequency score
                    txt_lower = doc.get("text", "").lower()
                    hits = sum(txt_lower.count(w.lower()) for w in clean_query.split())
                    results.append({
                        "document_id": str(doc.get("document_id", "")),
                        "document_name": doc.get("document_name") or "Unknown document",
                        "document_category": doc.get("document_category") or "Uncategorized",
                        "chunk_index": c_idx,
                        "page_number": doc.get("page_number"),
                        "text": doc.get("text", ""),
                        "keyword_score": float(hits),
                    })
                    existing_chunk_ids.add(c_idx)

    # Normalize keyword scores
    if results:
        max_score = float(max(r["keyword_score"] for r in results) or 1.0)
        for r in results:
            r["normalized_keyword_score"] = float(r["keyword_score"]) / max_score
    return results[:top_k]


def hybrid_search(
    query: str,
    top_k: int = 5,
    document_id: Optional[str] = None,
    category: Optional[str] = None,
    semantic_weight: float = 0.65,
    keyword_weight: float = 0.35,
    rrf_k: int = 60,
) -> List[Dict[str, Any]]:
    """
    Executes hybrid retrieval combining dense semantic search and sparse keyword search.
    Applies Reciprocal Rank Fusion (RRF) and weighted confidence blending.
    """
    candidate_k = max(top_k * 3, 15)

    semantic_results = semantic_search(
        query=query,
        top_k=candidate_k,
        document_id=document_id,
        category=category,
    )

    keyword_results = keyword_search(
        query=query,
        top_k=candidate_k,
        document_id=document_id,
        category=category,
    )

    # Combine candidates by unique key: (document_id, chunk_index)
    combined: Dict[str, Dict[str, Any]] = {}

    # 1. Process semantic ranks
    for rank, item in enumerate(semantic_results, start=1):
        key = f"{item['document_id']}_{item['chunk_index']}"
        rrf_score = 1.0 / (rrf_k + rank)
        combined[key] = {
            "document_id": item["document_id"],
            "document_name": item["document_name"],
            "document_category": item["document_category"],
            "chunk_index": item["chunk_index"],
            "page_number": item["page_number"],
            "text": item["text"],
            "semantic_score": item["similarity_score"],
            "keyword_score": 0.0,
            "rrf_score": rrf_score,
            "semantic_rank": rank,
            "keyword_rank": None,
        }

    # 2. Process keyword ranks
    for rank, item in enumerate(keyword_results, start=1):
        key = f"{item['document_id']}_{item['chunk_index']}"
        rrf_score = 1.0 / (rrf_k + rank)
        if key in combined:
            combined[key]["keyword_score"] = item.get("normalized_keyword_score", 0.5)
            combined[key]["rrf_score"] += rrf_score
            combined[key]["keyword_rank"] = rank
        else:
            combined[key] = {
                "document_id": item["document_id"],
                "document_name": item["document_name"],
                "document_category": item["document_category"],
                "chunk_index": item["chunk_index"],
                "page_number": item["page_number"],
                "text": item["text"],
                "semantic_score": 0.0,
                "keyword_score": item.get("normalized_keyword_score", 0.5),
                "rrf_score": rrf_score,
                "semantic_rank": None,
                "keyword_rank": rank,
            }

    # Calculate final hybrid score
    ranked_list = []
    for item in combined.values():
        sem_score = item["semantic_score"]
        kw_score = item["keyword_score"]
        # Weighted hybrid score with bonus if matched in both
        both_match_bonus = 0.1 if (sem_score > 0.4 and kw_score > 0.1) else 0.0
        hybrid_score = (semantic_weight * sem_score) + (keyword_weight * kw_score) + both_match_bonus
        item["hybrid_score"] = round(float(hybrid_score), 4)
        ranked_list.append(item)

    # Sort primarily by hybrid_score
    ranked_list.sort(key=lambda x: x["hybrid_score"], reverse=True)
    return ranked_list[:top_k]
