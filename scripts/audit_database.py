import os
from pymongo import MongoClient

cli = MongoClient("mongodb://127.0.0.1:27017", serverSelectionTimeoutMS=2000)
db = cli["coalintel"]

stats = db.command("dbStats")
print("=== DB STATS ===")
print(f"Database: {stats.get('db')}")
print(f"Collections: {stats.get('collections')}")
print(f"Objects (Documents): {stats.get('objects')}")
print(f"Avg Obj Size: {stats.get('avgObjSize', 0):.1f} bytes")
print(f"Data Size: {stats.get('dataSize', 0) / (1024*1024):.2f} MB")
print(f"Storage Size: {stats.get('storageSize', 0) / (1024*1024):.2f} MB")
print(f"Indexes: {stats.get('indexes')}")
print(f"Index Size: {stats.get('indexSize', 0) / (1024*1024):.2f} MB")
print(f"Total Size: {(stats.get('storageSize', 0) + stats.get('indexSize', 0)) / (1024*1024):.2f} MB")

print("\n=== COLLECTION STATS ===")
colls = sorted(db.list_collection_names())
for cname in colls:
    c = db[cname]
    cstats = db.command("collStats", cname)
    count = cstats.get("count", 0)
    size_mb = cstats.get("size", 0) / (1024 * 1024)
    storage_mb = cstats.get("storageSize", 0) / (1024 * 1024)
    idx_mb = cstats.get("totalIndexSize", 0) / (1024 * 1024)
    indexes = list(c.index_information().keys())
    print(f"{cname:<24} | Docs: {count:<6} | Data: {size_mb:.2f} MB | Storage: {storage_mb:.2f} MB | Idx: {idx_mb:.2f} MB | Indexes: {indexes}")

# Check embeddings
chunks_col = db["document_chunks"] if "document_chunks" in colls else db["chunks"]
sample_chunk = chunks_col.find_one({"embedding": {"$exists": True}})
if sample_chunk:
    emb = sample_chunk.get("embedding")
    emb_count = chunks_col.count_documents({"embedding": {"$exists": True}})
    total_chunks = chunks_col.count_documents({})
    print(f"\nChunks with embeddings: {emb_count}/{total_chunks}")
    if isinstance(emb, list):
        print(f"Embedding type: list of floats, dimension: {len(emb)}")
    else:
        print(f"Embedding type: {type(emb)}")
