import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure backend folder is on python path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from documents import router as documents_router
from query import router as query_router
from routes.analytics import router as analytics_router
from routes.comparison import router as comparison_router
from routes.reports import router as reports_router
from routes.topics import router as topics_router
from database.mongodb import check_database_connection, documents_collection, chunks_collection

app = FastAPI(
    title="CoalIntel API",
    description="AI-Powered Mining Knowledge, Reporting and Decision Intelligence Platform (SIH26023)",
    version="1.0.0",
)

# Enable CORS for frontend development and demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all feature routers
app.include_router(documents_router)
app.include_router(query_router)
app.include_router(analytics_router)
app.include_router(comparison_router)
app.include_router(reports_router)
app.include_router(topics_router)


@app.get("/api/status")
def api_status():
    return {
        "message": "CoalIntel — AI-Powered Mining Knowledge, Reporting and Decision Intelligence Platform",
        "status": "online",
        "version": "1.0.0",
        "sih_problem_statement": "SIH26023",
        "database": {
            "connected": check_database_connection(),
            "documents_count": documents_collection.count_documents({}),
            "chunks_count": chunks_collection.count_documents({}),
        },
        "llm_model": "Ollama / qwen3:1.7b",
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
    }


@app.get("/health")
def health_check():
    db_ok = check_database_connection()
    return {
        "status": "healthy" if db_ok else "database_disconnected",
        "service": "CoalIntel Backend",
        "database_connected": db_ok,
        "indexed_documents": documents_collection.count_documents({}),
        "indexed_chunks": chunks_collection.count_documents({}),
        "llm_model": "qwen3:1.7b",
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
    }


# Mount frontend build if built; otherwise provide fallback JSON root
dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="static_frontend")
else:
    @app.get("/")
    def root():
        return api_status()