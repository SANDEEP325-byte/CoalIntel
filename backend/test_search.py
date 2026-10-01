import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from services.semantic_search import semantic_search

results = semantic_search("coal production in India", 5)

print("Results found:", len(results))

for i, result in enumerate(results, start=1):
    print(f"\n--- Result {i} ---")
    print("Score:", round(result.get("similarity_score", 0.0), 4))
    print("Document ID:", result.get("document_id"))
    print("Document Name:", result.get("document_name"))
    print("Page:", result.get("page_number"))
    print("Chunk:", result.get("chunk_index"))
    print("Text:")
    print(result.get("text", "")[:300].replace("\n", " "))