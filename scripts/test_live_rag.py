import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from services.rag import generate_grounded_answer

queries = [
    ("1. CIL coal dispatch FY 2024-25", "What was CIL coal dispatch in FY 2024-25?"),
    ("2. India's coal production", "What was India's total coal production in FY 2024-25?"),
    ("3. Coal mine safety", "What were the fatal accidents and fatality rate in CIL mines during 2024?"),
    ("4. CMPDI-related information", "What was CMPDI's 2D seismic exploration progress in 2024-25?"),
    ("5. Question whose answer does NOT exist", "What was the total copper export of Argentina in 1890?")
]

print("\n" + "=" * 80)
print("CoalIntel RAG Pipeline Benchmark Evaluation")
print("Local Model: Qwen3:1.7b | Embeddings: all-MiniLM-L6-v2 (384D)")
print("=" * 80 + "\n")

for label, q in queries:
    print("=" * 80, flush=True)
    print(f"BENCHMARK: {label}", flush=True)
    print(f"QUESTION: {q}", flush=True)
    res = generate_grounded_answer(q, top_k=5)
    print(f"STATUS: {res.get('status')} | CONFIDENCE: {res['confidence']:.2f} ({res['confidence_level']})", flush=True)
    print(f"LATENCY: Retrieval: {res.get('latency', {}).get('retrieval_ms', 0)}ms | LLM: {res.get('latency', {}).get('llm_ms', 0)}ms | Total: {res.get('latency', {}).get('total_ms', 0)}ms", flush=True)
    print(f"\nANSWER:\n{res['answer']}", flush=True)
    print("\nCITATIONS:", flush=True)
    if not res.get("sources"):
        print("  (No supporting citations — Information not found in indexed documents)", flush=True)
    else:
        for s in res["sources"]:
            doc_name = s.get("filename") or s.get("document_name")
            p_num = s.get("page_number")
            c_idx = s.get("chunk_index")
            rel_score = s.get("relevance_score", 0.0)
            is_tbl = s.get("is_table", False)
            print(f"  - [{doc_name}, Page {p_num}, Chunk {c_idx}] (Relevance: {rel_score:.3f}, Table: {is_tbl})", flush=True)
    print("", flush=True)
