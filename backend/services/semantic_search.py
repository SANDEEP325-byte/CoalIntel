import numpy as np
from database.mongodb import chunks_collection, documents_collection
from services.embedding import generate_embedding
from typing import Any
from bson import ObjectId


def cosine_similarity(vector_a, vector_b):
    a = np.array(vector_a)
    b = np.array(vector_b)

    denominator = np.linalg.norm(a) * np.linalg.norm(b)
    if denominator == 0:
        return 0.0

    return float(np.dot(a, b) / denominator)


# Global in-memory cache for ultra-fast vectorized search
_EMBEDDING_CACHE = {
    "matrix": None,          # np.ndarray of shape (N, 384)
    "chunks_meta": [],       # list of dicts with chunk metadata
    "count": 0,
}


def invalidate_embedding_cache():
    """Invalidates the in-memory embedding cache, forcing a reload on next search."""
    global _EMBEDDING_CACHE
    _EMBEDDING_CACHE["matrix"] = None
    _EMBEDDING_CACHE["chunks_meta"] = []
    _EMBEDDING_CACHE["count"] = 0


def _load_cache():
    """Populates the in-memory cache from MongoDB."""
    global _EMBEDDING_CACHE
    chunks = list(chunks_collection.find(
        {},
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
            "embedding": 1,
        },
    ))

    embeddings = []
    meta = []
    for chunk in chunks:
        emb = chunk.get("embedding")
        if emb and len(emb) == 384:
            embeddings.append(emb)
            meta.append({
                "document_id": str(chunk.get("document_id", "")),
                "document_name": chunk.get("document_name") or "Unknown document",
                "document_category": chunk.get("document_category") or "Uncategorized",
                "organization": chunk.get("organization") or "All India",
                "fiscal_year": chunk.get("fiscal_year") or "2024-25",
                "chunk_index": chunk.get("chunk_index", 0),
                "page_number": chunk.get("page_number"),
                "text": chunk.get("text", ""),
                "is_table": chunk.get("is_table", False),
            })

    if embeddings:
        mat = np.array(embeddings, dtype=np.float32)
        # Normalize rows to ensure cosine similarity equals dot product
        norms = np.linalg.norm(mat, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        mat = mat / norms
        _EMBEDDING_CACHE["matrix"] = mat
        _EMBEDDING_CACHE["chunks_meta"] = meta
        _EMBEDDING_CACHE["count"] = len(meta)


def semantic_search(
    query: str,
    top_k: int = 5,
    document_id: str | None = None,
    category: str | None = None,
    organization: str | None = None,
    fiscal_year: str | None = None,
):
    query_embedding = np.array(generate_embedding(query), dtype=np.float32)
    q_norm = np.linalg.norm(query_embedding)
    if q_norm > 0:
        query_embedding /= q_norm

    global _EMBEDDING_CACHE
    if _EMBEDDING_CACHE["matrix"] is None:
        _load_cache()

    mat = _EMBEDDING_CACHE["matrix"]
    chunks_meta = _EMBEDDING_CACHE["chunks_meta"]

    if mat is None or len(chunks_meta) == 0:
        return []

    # Fast dot product in memory (<5ms)
    scores = np.dot(mat, query_embedding)

    # Filter indices if filters are specified
    target_doc = str(document_id).strip() if document_id else None
    target_cat = category.strip().lower() if category else None
    target_org = organization.strip().lower() if organization else None
    target_yr = fiscal_year.strip() if fiscal_year else None

    if target_doc or target_cat or target_org or target_yr:
        valid_indices = [
            i for i, c in enumerate(chunks_meta)
            if (not target_doc or c["document_id"] == target_doc)
            and (not target_cat or c["document_category"].lower() == target_cat)
            and (not target_org or target_org in c["organization"].lower())
            and (not target_yr or c["fiscal_year"] == target_yr)
        ]
        if not valid_indices:
            return []
        scores_subset = scores[valid_indices]
        sorted_subset_idx = np.argsort(-scores_subset)
        sorted_indices = [valid_indices[i] for i in sorted_subset_idx]
    else:
        sorted_indices = np.argsort(-scores)

    # Sort descending by similarity score with deduplication
    results = []
    seen = set()

    for idx in sorted_indices:
        chunk = chunks_meta[idx]
        doc_name = chunk["document_name"]
        c_idx = chunk["chunk_index"]
        dedup_key = (doc_name, c_idx)
        if dedup_key in seen:
            continue
        seen.add(dedup_key)

        results.append({
            "document_id": chunk["document_id"],
            "document_name": doc_name,
            "document_category": chunk["document_category"],
            "organization": chunk["organization"],
            "fiscal_year": chunk["fiscal_year"],
            "chunk_index": c_idx,
            "page_number": chunk["page_number"],
            "text": chunk["text"],
            "is_table": chunk["is_table"],
            "similarity_score": float(scores[idx]),
        })

        if len(results) >= top_k:
            break

    return results

    return results
