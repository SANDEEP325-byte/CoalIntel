import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from services.hybrid_search import hybrid_search

query = "fatal accidents and fatality rate in CIL mines 2024"
results = hybrid_search(query, top_k=5)
for i, r in enumerate(results):
    doc = r.get("document_name")
    page = r.get("page_number")
    c_idx = r.get("chunk_index")
    h_score = r.get("hybrid_score")
    s_score = r.get("semantic_score")
    k_score = r.get("keyword_score")
    is_tab = r.get("is_table")
    print(f"=== CHUNK {i+1}: {doc} (Page {page}, Chunk {c_idx}, Table: {is_tab}) [Hybrid: {h_score:.3f}, Sem: {s_score:.3f}, KW: {k_score:.3f}] ===")
    print(r["text"][:350])
    print("-" * 60)
