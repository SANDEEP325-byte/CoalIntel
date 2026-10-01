import sys
from pathlib import Path

# Ensure root and backend directories are in sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = Path(__file__).resolve().parent
for p in [str(root_dir), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from services.rag import generate_answer

question = "What was CIL's coal dispatch in FY 2024-25?"

result = generate_answer(
    question,
    top_k=5,
)

print("\n" + "=" * 60)
print("QUESTION:", result["question"])
print("INTENT:", result["intent"])
print(f"CONFIDENCE: {result['confidence']} ({result['confidence_level']})")
print("=" * 60)

print("\nANSWER:")
print(result["answer"])

print("\nSUPPORTING EVIDENCE SNIPPET:")
print(result.get("evidence"))

print("\nSOURCES & PAGE CITATIONS:")
for source in result["sources"]:
    print(
        f"  - Document: {source['filename']} | "
        f"Category: {source.get('document_category')} | "
        f"Page: {source['page_number']} | "
        f"Chunk: {source['chunk_index']} | "
        f"Hybrid Score: {source.get('hybrid_score', source['similarity_score'])}"
    )
print("=" * 60)