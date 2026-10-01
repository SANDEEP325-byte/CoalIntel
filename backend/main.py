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
from routes.mining import router as mining_router
from database.mongodb import check_database_connection, documents_collection, chunks_collection

app = FastAPI(
    title="CoalIntel API",
    description="AI-Powered Mining Knowledge, Reporting and Decision Intelligence Platform (SIH26023)",
    version="1.0.0",
)

# Enable CORS for frontend development and demo
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
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
app.include_router(mining_router)


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
        "ai_provider": ai_gateway.get_active_provider_name(),
        "llm_model": f"{ai_gateway.get_active_provider_name().capitalize()} / {ai_gateway.get_active_model_name()}",
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
    }


import requests
from backend.services.ai import ai_gateway


def check_ollama_status() -> dict:
    try:
        res = requests.get("http://127.0.0.1:11434/api/tags", timeout=3)
        if res.status_code == 200:
            models = [m.get("name") for m in res.json().get("models", [])]
            return {
                "available": True,
                "model": "qwen3:1.7b",
                "model_loaded": any("qwen3" in m for m in models),
                "installed_models": models,
            }
    except Exception as exc:
        return {"available": False, "model": "qwen3:1.7b", "model_loaded": False, "error": str(exc)}
    return {"available": False, "model": "qwen3:1.7b", "model_loaded": False}


@app.get("/health")
def health_check():
    db_ok = check_database_connection()
    llm_info = ai_gateway.check_health()
    overall_ok = db_ok and llm_info.get("available", False)

    return {
        "status": "healthy" if overall_ok else ("partial_degraded" if db_ok else "database_disconnected"),
        "service": "CoalIntel Backend",
        "database_connected": db_ok,
        "indexed_documents": documents_collection.count_documents({}) if db_ok else 0,
        "indexed_chunks": chunks_collection.count_documents({}) if db_ok else 0,
        "ai_provider": ai_gateway.get_active_provider_name(),
        "llm_online": llm_info.get("available", False),
        "llm_model": ai_gateway.get_active_model_name(),
        "llm_model_ready": llm_info.get("model_loaded", False),
        "llm_info": llm_info,
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
    }


@app.get("/health/llm")
def llm_health_check():
    """Detailed health check of active AI provider and model."""
    return ai_gateway.check_health()


# Mount frontend build if built; otherwise provide fallback JSON root
dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="static_frontend")
else:
    @app.get("/")
    def root():
        return api_status()