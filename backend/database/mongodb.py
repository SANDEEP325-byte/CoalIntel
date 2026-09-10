from pymongo import MongoClient, ASCENDING, TEXT

MONGO_URI = "mongodb://localhost:27017"

client = MongoClient(MONGO_URI)

db = client["coalintel"]

documents_collection = db["documents"]
chunks_collection = db["document_chunks"]
kpis_collection = db["mining_kpis"]
contradictions_collection = db["data_contradictions"]

def ensure_indexes():
    """Ensure essential indexes exist for fast hybrid retrieval and queries."""
    try:
        # Document chunks indexes
        chunks_collection.create_index([("document_id", ASCENDING)])
        chunks_collection.create_index([("document_name", ASCENDING)])
        chunks_collection.create_index([("document_category", ASCENDING)])
        chunks_collection.create_index([("page_number", ASCENDING)])
        
        # Check if text index exists, create if not
        index_info = chunks_collection.index_information()
        has_text_index = any("text" in idx.get("weights", {}) for idx in index_info.values())
        if not has_text_index:
            chunks_collection.create_index([("text", TEXT)], name="chunk_text_fulltext")

        # Documents indexes
        documents_collection.create_index([("filename", ASCENDING)])
        documents_collection.create_index([("document_category", ASCENDING)])
    except Exception as e:
        print(f"Index initialization warning: {e}")

# Run index initialization
try:
    ensure_indexes()
except Exception:
    pass

def check_database_connection():
    try:
        client.admin.command("ping")
        return True
    except Exception:
        return False