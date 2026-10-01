import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from services.rag import generate_grounded_answer

test_questions = [
    ("1. CIL coal dispatch FY 2024-25", "What was CIL coal dispatch in FY 2024-25?"),
    ("2. India's coal production", "What was India's total coal production in FY 2024-25?"),
    ("3. Coal mine safety", "What were the fatal accidents and fatality rate in CIL mines during 2024?"),
    ("4. CMPDI-related information", "What was CMPDI's 2D seismic exploration progress in 2024-25?"),
    ("5. Information not found", "What was the total copper export of Argentina in 1890?")
]

for label, q in test_questions:
    print("=" * 80)
    print(f"TEST: {label}")
    print(f"QUESTION: {q}")
    res = generate_grounded_answer(q, top_k=6)
    print(f"STATUS: {res.get('status')} | CONFIDENCE: {res.get('confidence'):.2f} ({res.get('confidence_level')})")
    print(f"LATENCY: Retrieval={res.get('latency', {}).get('retrieval_ms')}ms, LLM={res.get('latency', {}).get('llm_ms')}ms, Total={res.get('latency', {}).get('total_ms')}ms")
    print("ANSWER:\n" + res.get("answer", ""))
    print("\nCITATIONS:")
    for s in res.get("sources", []):
        print(f"  - [{s.get('filename')}, Page {s.get('page_number')}, Chunk {s.get('chunk_index')}] (Relevance: {s.get('relevance_score'):.3f}, Table: {s.get('is_table')})")
    print()
