import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from database.mongodb import documents_collection, chunks_collection
from documents import detect_organization, detect_fiscal_year, calculate_content_hash

docs = list(documents_collection.find())
print(f"Found {len(docs)} documents to backfill.")

for d in docs:
    filename = d.get("filename", "")
    org = detect_organization(filename)
    f_yr = detect_fiscal_year(filename)
    
    # Check physical file for hash
    content_hash = d.get("content_hash", "")
    file_path = d.get("file_path")
    if not content_hash and file_path and Path(file_path).exists():
        try:
            content_hash = calculate_content_hash(Path(file_path).read_bytes())
        except Exception:
            pass

    documents_collection.update_one(
        {"_id": d["_id"]},
        {"$set": {"organization": org, "fiscal_year": f_yr, "content_hash": content_hash}}
    )
    
    # Update chunks for this document
    chunks_collection.update_many(
        {"document_id": d["_id"]},
        {"$set": {"organization": org, "fiscal_year": f_yr}}
    )
    print(f"  Updated '{filename}': Organization='{org}', FiscalYear='{f_yr}'")

sample = chunks_collection.find_one({}, {"text": 0, "embedding": 0})
print("\nBackfill complete! Sample chunk metadata:")
print(sample)
