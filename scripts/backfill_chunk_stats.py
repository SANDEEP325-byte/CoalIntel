import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from database.mongodb import chunks_collection

print("Backfilling character_count and token_estimate for chunks...")
updated = 0
for chunk in chunks_collection.find({"character_count": {"$exists": False}}, {"_id": 1, "text": 1}):
    txt = chunk.get("text", "")
    chunks_collection.update_one(
        {"_id": chunk["_id"]},
        {"$set": {
            "character_count": len(txt),
            "token_estimate": max(1, len(txt) // 4)
        }}
    )
    updated += 1

print(f"Updated {updated} chunks with character_count and token_estimate.")

# Verify sample
sample = chunks_collection.find_one({}, {"embedding": 0, "text": 0})
print("Sample chunk:", sample)
