from services.semantic_search import semantic_search


results = semantic_search("coal production in India", 5)

print("Results:", len(results))

for i, result in enumerate(results, start=1):
    print(f"\n--- Result {i} ---")
    print("Score:", round(result["similarity_score"], 4))
    print("Document ID:", result["document_id"])
    print("Chunk:", result["chunk_index"])
    print("Text:")
    print(result["text"][:500].replace("\n", " "))