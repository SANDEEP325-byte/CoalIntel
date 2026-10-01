from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime, timezone

from services.rag import generate_answer
from services.hybrid_search import hybrid_search
from services.intent import classify_intent
from database.mongodb import conversations_collection, search_history_collection

router = APIRouter(prefix="/query", tags=["Query & Conversations"])


class QueryRequest(BaseModel):
    question: str
    top_k: int = 5
    document_id: Optional[str] = None
    category: Optional[str] = None
    organization: Optional[str] = None
    fiscal_year: Optional[str] = None
    session_id: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    document_id: Optional[str] = None
    category: Optional[str] = None
    organization: Optional[str] = None
    fiscal_year: Optional[str] = None


@router.post("")
@router.post("/")
def query_documents(request: QueryRequest):
    """Executes grounded AI chat answer with three-tier output separation, page citations, and conversation history."""
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
            organization=request.organization,
            fiscal_year=request.fiscal_year,
            session_id=request.session_id,
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
            organization=request.organization,
            fiscal_year=request.fiscal_year,
            record_history=True,
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
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' cannot be empty")
    return classify_intent(q)


# ---------------------------------------------------------------------------
# CONVERSATION SESSION MANAGEMENT (Feature 8)
# ---------------------------------------------------------------------------
@router.get("/conversations")
def list_conversations(limit: int = Query(20, le=100)):
    """Lists all active conversation sessions with title, message count, and timestamps."""
    try:
        convs = list(conversations_collection.find({}, {"messages": 0}).sort("updated_at", -1).limit(limit))
        result = []
        for c in convs:
            session_id = c.get("session_id", str(c["_id"]))
            # Count messages
            full = conversations_collection.find_one({"_id": c["_id"]}, {"messages": 1})
            msg_count = len(full.get("messages", [])) if full else 0
            result.append({
                "session_id": session_id,
                "title": c.get("title", "New Conversation"),
                "message_count": msg_count,
                "created_at": c.get("created_at", datetime.now(timezone.utc)).isoformat() if isinstance(c.get("created_at"), datetime) else str(c.get("created_at")),
                "updated_at": c.get("updated_at", datetime.now(timezone.utc)).isoformat() if isinstance(c.get("updated_at"), datetime) else str(c.get("updated_at")),
            })
        return {"count": len(result), "conversations": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/conversations/{session_id}")
def get_conversation_history(session_id: str):
    """Retrieves full message turn history for a conversation session."""
    conv = conversations_collection.find_one({"session_id": session_id}, {"_id": 0})
    if not conv:
        return {"session_id": session_id, "title": "New Session", "messages": []}
    return conv


@router.delete("/conversations/{session_id}")
def delete_conversation_session(session_id: str):
    """Deletes a specific conversation session."""
    res = conversations_collection.delete_one({"session_id": session_id})
    return {"message": f"Session '{session_id}' deleted", "deleted": res.deleted_count > 0}


@router.delete("/conversations")
def clear_all_conversations():
    """Clears all conversation sessions."""
    res = conversations_collection.delete_many({})
    return {"message": f"Cleared {res.deleted_count} conversation sessions"}


# ---------------------------------------------------------------------------
# SEARCH HISTORY TELEMETRY (Feature 9)
# ---------------------------------------------------------------------------
@router.get("/search/history")
def get_search_history(limit: int = Query(25, le=100)):
    """Retrieves recent searches with timestamps, filters, and result counts."""
    try:
        items = list(search_history_collection.find({}, {"_id": 0}).sort("created_at", -1).limit(limit))
        for item in items:
            if isinstance(item.get("created_at"), datetime):
                item["created_at"] = item["created_at"].isoformat()
        return {"count": len(items), "history": items}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/search/history")
def clear_search_history():
    """Clears all search history records."""
    res = search_history_collection.delete_many({})
    return {"message": f"Cleared {res.deleted_count} search history records"}
