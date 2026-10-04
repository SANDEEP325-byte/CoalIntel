import os
import json
from pathlib import Path
from pymongo import MongoClient
import bson

BACKUP_DIR = Path("migration_backups") / "coalintel"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

cli = MongoClient("mongodb://127.0.0.1:27017", serverSelectionTimeoutMS=3000)
db = cli["coalintel"]

colls = sorted(db.list_collection_names())
metadata = {
    "database": "coalintel",
    "collections": {},
    "timestamp": None,
}

import datetime
metadata["timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

print(f"Starting BSON backup of database 'coalintel' to {BACKUP_DIR}...")

total_docs = 0
for cname in colls:
    coll = db[cname]
    doc_count = coll.count_documents({})
    total_docs += doc_count
    
    # Save BSON data
    bson_path = BACKUP_DIR / f"{cname}.bson"
    with open(bson_path, "wb") as f:
        for doc in coll.find():
            f.write(bson.encode(doc))
            
    # Record metadata and indexes
    indexes = coll.index_information()
    file_size_bytes = bson_path.stat().st_size
    metadata["collections"][cname] = {
        "count": doc_count,
        "bson_file": f"{cname}.bson",
        "file_size_bytes": file_size_bytes,
        "indexes": indexes,
    }
    print(f"  [OK] Backed up '{cname}': {doc_count} documents ({file_size_bytes / (1024*1024):.2f} MB)")

# Save metadata json
with open(BACKUP_DIR / "backup_metadata.json", "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2)

print(f"\n[SUCCESS] Local database backup complete! Total {total_docs} documents backed up into {BACKUP_DIR}.")
