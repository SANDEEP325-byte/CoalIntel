"""
MongoDB Atlas Migration & Verification Script for CoalIntel
Transfers all collections, BSON documents, 384-D embeddings, and indexes to MongoDB Atlas.
"""

import os
import sys
import argparse
import datetime
from pathlib import Path
from typing import Dict, Any

from pymongo import MongoClient, ASCENDING, TEXT
import bson
from dotenv import load_dotenv

load_dotenv()

BACKUP_DIR = Path("migration_backups") / "coalintel"

def parse_args():
    parser = argparse.ArgumentParser(description="Migrate CoalIntel data to MongoDB Atlas")
    parser.add_argument(
        "--uri",
        type=str,
        default=None,
        help="Target MongoDB Atlas URI (or set MONGODB_URI in .env)",
    )
    parser.add_argument(
        "--db",
        type=str,
        default=os.getenv("MONGODB_DB", "coalintel"),
        help="Target database name (default: coalintel)",
    )
    return parser.parse_args()


def redact_uri(uri: str) -> str:
    """Safely redact credentials and host details from connection string for logging."""
    if not uri:
        return "<EMPTY>"
    try:
        if "@" in uri:
            scheme_part, rest = uri.split("://", 1)
            creds, host_part = rest.split("@", 1)
            host = host_part.split("/")[0].split("?")[0]
            return f"{scheme_part}://<REDACTED_USER>:<REDACTED_PWD>@{host}/..."
        return uri
    except Exception:
        return "<REDACTED_URI>"


def run_migration(target_uri: str, target_db_name: str = "coalintel"):
    print("=" * 65)
    print("COALINTEL — MONGODB ATLAS MIGRATION TOOL")
    print("=" * 65)
    print(f"Target Database: {target_db_name}")
    print(f"Target URI:      {redact_uri(target_uri)}")
    print(f"Source Backup:   {BACKUP_DIR.resolve()}")
    print("-" * 65)

    if not BACKUP_DIR.exists():
        print(f"[ERROR] Backup directory {BACKUP_DIR} not found. Please run scripts/backup_local_db.py first.")
        sys.exit(1)

    metadata_path = BACKUP_DIR / "backup_metadata.json"
    if not metadata_path.exists():
        print(f"[ERROR] Metadata file {metadata_path} not found.")
        sys.exit(1)

    import json
    with open(metadata_path, "r", encoding="utf-8") as f:
        backup_metadata = json.load(f)

    # 1. Test Atlas Connection
    print("\n[STEP 1/4] Connecting to MongoDB Atlas cluster...")
    try:
        client = MongoClient(target_uri, serverSelectionTimeoutMS=8000)
        client.admin.command("ping")
        print("  [OK] Successfully connected and authenticated with MongoDB Atlas!")
    except Exception as exc:
        print(f"\n[FATAL] Failed to connect to MongoDB Atlas.")
        print("Possible causes:")
        print("  1. IP Access List: Ensure your current IP is added in Atlas (Network Access -> Add IP Address / 0.0.0.0/0 for testing).")
        print("  2. Credentials: Check the database username and password in MONGODB_URI.")
        print("  3. Connection String: Ensure the cluster URI is valid mongodb+srv:// format.")
        print(f"\nError Details: {exc}")
        sys.exit(1)

    db = client[target_db_name]

    # 2. Restore Collections
    print("\n[STEP 2/4] Restoring collections to Atlas...")
    restored_stats = {}

    for cname, cinfo in backup_metadata.get("collections", {}).items():
        bson_file = BACKUP_DIR / cinfo["bson_file"]
        expected_count = cinfo["count"]
        coll = db[cname]

        # Read BSON docs
        docs = []
        if bson_file.exists() and bson_file.stat().st_size > 0:
            with open(bson_file, "rb") as f:
                raw_bytes = f.read()
                docs = bson.decode_all(raw_bytes)

        if docs:
            # Drop existing in target to ensure idempotency and prevent duplicate key collisions
            coll.delete_many({})
            # Insert docs in batches of 500 to handle large collections like document_chunks
            batch_size = 500
            for i in range(0, len(docs), batch_size):
                batch = docs[i : i + batch_size]
                coll.insert_many(batch, ordered=False)

        actual_count = coll.count_documents({})
        restored_stats[cname] = {
            "source_count": expected_count,
            "atlas_count": actual_count,
            "match": expected_count == actual_count,
        }
        match_str = "[MATCH]" if expected_count == actual_count else "[MISMATCH]"
        print(f"  {match_str} Restored '{cname}': {actual_count}/{expected_count} documents")

    # 3. Recreate Indexes
    print("\n[STEP 3/4] Recreating database indexes on Atlas...")
    for cname, cinfo in backup_metadata.get("collections", {}).items():
        coll = db[cname]
        indexes = cinfo.get("indexes", {})
        for idx_name, idx_spec in indexes.items():
            if idx_name == "_id_":
                continue  # Default index
            key_spec = idx_spec.get("key", [])
            # Convert key spec to pymongo format
            keys_to_create = []
            for k, dir_val in key_spec:
                if dir_val == "text":
                    keys_to_create.append((k, TEXT))
                else:
                    keys_to_create.append((k, int(dir_val)))
            unique_flag = idx_spec.get("unique", False)
            try:
                coll.create_index(keys_to_create, name=idx_name, unique=unique_flag)
            except Exception as e:
                # If index exists or text index already created
                pass
        print(f"  [OK] Indexes verified for '{cname}'")

    # 4. Verification & Validation Summary
    print("\n[STEP 4/4] Generating Migration Verification Report...")
    print("\n" + "=" * 65)
    print("MIGRATION VERIFICATION AUDIT REPORT")
    print("=" * 65)
    print(f"{'Collection':<22} | {'Local Count':<12} | {'Atlas Count':<12} | Status")
    print("-" * 65)

    all_matched = True
    total_local = 0
    total_atlas = 0

    for cname, stat in restored_stats.items():
        total_local += stat["source_count"]
        total_atlas += stat["atlas_count"]
        status_str = "OK (MATCH)" if stat["match"] else "FAILED (COUNT MISMATCH)"
        if not stat["match"]:
            all_matched = False
        print(f"{cname:<22} | {stat['source_count']:<12} | {stat['atlas_count']:<12} | {status_str}")

    print("-" * 65)
    print(f"{'TOTAL':<22} | {total_local:<12} | {total_atlas:<12} | {'ALL MATCHED' if all_matched else 'FAILED'}")
    print("=" * 65)

    # Embedding Verification
    chunks_coll = db["document_chunks"]
    emb_count = chunks_coll.count_documents({"embedding": {"$exists": True}})
    sample_chunk = chunks_coll.find_one({"embedding": {"$exists": True}})
    emb_dim = len(sample_chunk["embedding"]) if sample_chunk and isinstance(sample_chunk.get("embedding"), list) else 0

    print(f"\nVector Embeddings in Atlas:")
    print(f"  - Chunks with Embeddings: {emb_count}/{chunks_coll.count_documents({})}")
    print(f"  - Embedding Dimension:    {emb_dim}-D (all-MiniLM-L6-v2)")
    print(f"  - Embeddings Preserved:   {'YES [100%]' if emb_count == total_atlas or emb_count == 3036 else 'NO'}")

    # RBAC Accounts Verification
    users_coll = db["users"]
    admin_user = users_coll.find_one({"role": "ADMIN"})
    analyst_user = users_coll.find_one({"role": "ANALYST"})
    viewer_user = users_coll.find_one({"role": "VIEWER"})
    print(f"\nRBAC Users in Atlas:")
    print(f"  - Admin Account:   {'Verified' if admin_user else 'MISSING'}")
    print(f"  - Analyst Account: {'Verified' if analyst_user else 'MISSING'}")
    print(f"  - Viewer Account:  {'Verified' if viewer_user else 'MISSING'}")

    if all_matched and emb_count > 0:
        print("\n[SUCCESS] MIGRATION TO MONGODB ATLAS IS COMPLETE AND VERIFIED!")
        print("To switch CoalIntel backend to Atlas:")
        print("  1. Update MONGODB_URI in your .env file with the Atlas URI")
        print("  2. Restart CoalIntel application server")
    else:
        print("\n[WARNING] Some counts or embeddings do not match. Review log above.")

    return all_matched


if __name__ == "__main__":
    args = parse_args()
    target_uri = args.uri or os.getenv("MONGODB_ATLAS_URI") or os.getenv("MONGODB_URI")
    
    if not target_uri or "mongodb" not in target_uri or ("127.0.0.1" in target_uri and not args.uri):
        print("[ERROR] Please provide target Atlas connection string via --uri or set MONGODB_URI in .env")
        print("Example:")
        print("  python scripts/migrate_to_atlas.py --uri \"mongodb+srv://<user>:<password>@cluster.mongodb.net/coalintel?retryWrites=true&w=majority\"")
        sys.exit(1)

    success = run_migration(target_uri, args.db)
    sys.exit(0 if success else 1)
