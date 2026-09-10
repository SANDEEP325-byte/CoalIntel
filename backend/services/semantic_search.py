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


def semantic_search(
    query: str,
    top_k: int = 5,
    document_id: str | None = None,
    category: str | None = None,
):
    query_embedding = np.array(generate_embedding(query), dtype=np.float32)
    q_norm = np.linalg.norm(query_embedding)
    if q_norm > 0:
        query_embedding /= q_norm

    filter_criteria: dict[str, Any] = {}
    if document_id:
        if ObjectId.is_valid(document_id):
            filter_criteria["document_id"] = ObjectId(document_id)
        else:
            filter_criteria["document_id"] = document_id
    if category:
        filter_criteria["document_category"] = category

    chunks = list(chunks_collection.find(
        filter_criteria,
        {
            "document_id": 1,
            "document_name": 1,
            "document_category": 1,
            "chunk_index": 1,
            "page_number": 1,
            "text": 1,
            "embedding": 1,
        },
    ))

    if not chunks:
        return []

    # Vectorized batch cosine similarity
    embeddings = []
    valid_chunks = []
    for chunk in chunks:
        emb = chunk.get("embedding")
        if emb and len(emb) == 384:
            embeddings.append(emb)
            valid_chunks.append(chunk)

    if not valid_chunks:
        return []

    matrix = np.array(embeddings, dtype=np.float32)
    # Vectors are pre-normalized, so dot product is cosine similarity
    scores = np.dot(matrix, query_embedding)

    results = []
    for i, score in enumerate(scores):
        chunk = valid_chunks[i]
        results.append({
            "document_id": str(chunk.get("document_id", "")),
            "document_name": chunk.get("document_name") or "Unknown document",
            "document_category": chunk.get("document_category") or "Uncategorized",
            "chunk_index": chunk.get("chunk_index", 0),
            "page_number": chunk.get("page_number"),
            "text": chunk.get("text", ""),
            "similarity_score": float(score),
        })

    results.sort(
        key=lambda item: item["similarity_score"],
        reverse=True,
    )

    return results[:top_k]