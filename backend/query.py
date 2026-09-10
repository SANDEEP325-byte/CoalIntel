from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.rag import generate_answer
from services.hybrid_search import hybrid_search
from services.intent import classify_intent

router = APIRouter(prefix="/query", tags=["Query"])


class QueryRequest(BaseModel):
    question: str
    top_k: int = 5
    document_id: Optional[str] = None
    category: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    document_id: Optional[str] = None
    category: Optional[str] = None


@router.post("")
@router.post("/")
def query_documents(request: QueryRequest):
    """Executes grounded AI chat answer with page citations, confidence rating, and evidence."""
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    try:
        return generate_answer(
            request.question,
            top_k=request.top_k,
            document_id=request.document_id,
            category=request.category,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Query failed: {exc}",
        )


@router.post("/search")
def search_documents(request: SearchRequest):
    """Executes hybrid retrieval (Dense Semantic + Full-Text Keyword) without calling the LLM."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    try:
        results = hybrid_search(
            query=request.query,
            top_k=request.top_k,
            document_id=request.document_id,
            category=request.category,
        )
        return {
            "query": request.query,
            "count": len(results),
            "results": results,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Search failed: {exc}")


@router.get("/intent")
def get_query_intent(q: str):
    """Classifies user query intent and extracts target mining entities."""
    return classify_intent(q)