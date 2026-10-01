import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from database.mongodb import chunks_collection

chunks = list(chunks_collection.find({
    "document_name": "Safety in Coal Mines Report 2025-26.pdf",
    "page_number": 21
}).sort("chunk_index", 1))

for c in chunks:
    print(f"--- CHUNK {c.get('chunk_index')} | is_table: {c.get('is_table')} ---")
    print(c.get("text"))
    print("=" * 60)
