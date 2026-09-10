from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.topics import get_topic_distribution, generate_word_cloud
from services.timeline import get_historical_timeline
from services.document_health import get_all_documents_health

router = APIRouter(prefix="/topics", tags=["Topics & Intelligence"])


@router.get("")
@router.get("/")
def fetch_topic_distribution(
    document_name: Optional[str] = Query(None, description="Filter by document filename"),
    category: Optional[str] = Query(None, description="Filter by document category"),
):
    """Returns mining topic classification and chunk coverage percentages."""
    try:
        return get_topic_distribution(document_name=document_name, category=category)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/wordcloud")
def fetch_word_cloud(
    document_name: Optional[str] = Query(None, description="Filter by document filename"),
    category: Optional[str] = Query(None, description="Filter by document category"),
    limit: int = Query(60, ge=10, le=150),
):
    """Generates word frequencies with mining-specific stopword filtering for word cloud rendering."""
    try:
        words = generate_word_cloud(document_name=document_name, category=category, max_words=limit)
        return {"count": len(words), "words": words}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/timeline")
def fetch_timeline(year: Optional[str] = Query(None, description="Filter by year (e.g. 2024)")):
    """Returns chronological timeline of historical milestones from 1975 to present."""
    try:
        events = get_historical_timeline(year_filter=year)
        return {"count": len(events), "events": events}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/health")
def fetch_system_health():
    """Returns deep diagnostic health scores for all ingested documents."""
    try:
        return get_all_documents_health()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
