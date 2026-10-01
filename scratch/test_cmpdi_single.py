import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from services.rag import generate_grounded_answer

res = generate_grounded_answer("What was CMPDI's 2D seismic exploration progress in 2024-25?", top_k=5)
print("STATUS:", res.get("status"))
print("ANSWER:\n", res.get("answer"))
print("\nSOURCES:")
for s in res.get("sources", []):
    print(f"  - [{s.get('filename')}, Page {s.get('page_number')}, Chunk {s.get('chunk_index')}] (Score: {s.get('relevance_score'):.3f})")
