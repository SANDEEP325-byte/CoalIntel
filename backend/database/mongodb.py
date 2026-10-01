import os
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, TEXT

load_dotenv()

MONGO_URI = (
    os.getenv("MONGODB_URI")
    or os.getenv("MONGO_URI")
    or "mongodb://127.0.0.1:27017"
).rstrip("/")

DB_NAME = os.getenv("MONGODB_DB", "coalintel")

def _init_client():
    uris_to_try = [MONGO_URI]
    if "localhost" in MONGO_URI:
        uris_to_try.append(MONGO_URI.replace("localhost", "127.0.0.1"))
    elif "127.0.0.1" in MONGO_URI:
        uris_to_try.append(MONGO_URI.replace("127.0.0.1", "localhost"))

    last_exc = None
    for uri in uris_to_try:
        try:
            cli = MongoClient(uri, serverSelectionTimeoutMS=2000)
            cli.admin.command("ping")
            return cli
        except Exception as e:
            last_exc = e

    # Fallback to standard client even if offline at init
    return MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)

client = _init_client()
db = client[DB_NAME]

documents_collection = db["documents"]
chunks_collection = db["document_chunks"]
document_chunks_collection = chunks_collection
kpis_collection = db["mining_kpis"]
contradictions_collection = db["data_contradictions"]
conversations_collection = db["conversations"]
search_history_collection = db["search_history"]
mining_glossary_collection = db["mining_glossary"]
safety_rules_collection = db["safety_rules"]

def ensure_indexes():
    """Ensure essential indexes exist for fast hybrid retrieval and queries."""
    try:
        # Document chunks indexes
        chunks_collection.create_index([("document_id", ASCENDING)])
        chunks_collection.create_index([("document_name", ASCENDING)])
        chunks_collection.create_index([("document_category", ASCENDING)])
        chunks_collection.create_index([("organization", ASCENDING)])
        chunks_collection.create_index([("fiscal_year", ASCENDING)])
        chunks_collection.create_index([("page_number", ASCENDING)])
        chunks_collection.create_index([("is_table", ASCENDING)])
        chunks_collection.create_index([("document_name", ASCENDING), ("chunk_index", ASCENDING)], name="chunk_doc_idx")
        
        # Check if text index exists, create if not
        index_info = chunks_collection.index_information()
        has_text_index = any("text" in idx.get("weights", {}) for idx in index_info.values())
        if not has_text_index:
            chunks_collection.create_index([("text", TEXT)], name="chunk_text_fulltext")

        # Documents indexes
        documents_collection.create_index([("filename", ASCENDING)])
        documents_collection.create_index([("document_category", ASCENDING)])
        documents_collection.create_index([("organization", ASCENDING)])
        documents_collection.create_index([("fiscal_year", ASCENDING)])
        documents_collection.create_index([("content_hash", ASCENDING)])

        # Conversations indexes
        conversations_collection.create_index([("session_id", ASCENDING)], unique=True)
        conversations_collection.create_index([("updated_at", ASCENDING)])

        # Search history indexes
        search_history_collection.create_index([("created_at", ASCENDING)])

        # Mining glossary and safety rules
        mining_glossary_collection.create_index([("term", ASCENDING)], unique=True)
        mining_glossary_collection.create_index([("category", ASCENDING)])
        safety_rules_collection.create_index([("regulation_number", ASCENDING)], unique=True)
        safety_rules_collection.create_index([("act_or_rule", ASCENDING)])
    except Exception as e:
        print(f"Index initialization warning: {e}")

# Run index initialization
try:
    ensure_indexes()
except Exception:
    pass

def check_database_connection():
    global client, db
    try:
        client.admin.command("ping")
        return True
    except Exception:
        try:
            client = _init_client()
            db = client[DB_NAME]
            client.admin.command("ping")
            return True
        except Exception:
            return False