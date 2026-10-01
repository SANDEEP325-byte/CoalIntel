import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

import requests
from services.hybrid_search import hybrid_search

query = "What were the fatal accidents and fatality rate in CIL mines during 2024?"
search_results = hybrid_search(query, top_k=3)

context_parts = []
for idx, res in enumerate(search_results[:3], start=1):
    doc_name = res.get("document_name") or "Mining Document"
    page_num = res.get("page_number")
    page_str = f"Page {page_num}" if page_num is not None else "Page Unknown"
    score_val = res.get("hybrid_score", 0.0)
    context_parts.append(
        f"--- SOURCE {idx}: {doc_name} ({page_str}) [Relevance: {score_val:.3f}] ---\n{res['text']}\n"
    )
context = "\n".join(context_parts)

prompt = f"""You are CoalIntel, an expert AI analyst for the Indian Coal and Mining Sector (Ministry of Coal, CIL, CMPDI).

Answer the user's question using ONLY the CONTEXT provided below.

STRICT ACCURACY RULES:
1. Do not fabricate, extrapolate, or guess any facts, numbers, dates, or units.
2. Preserve exact numbers, fiscal years, and units.
3. State the source document and page number explicitly in your answer when citing figures.
4. If the required information is NOT present in the CONTEXT below, respond with EXACTLY:
"Insufficient evidence was found in the indexed documents."

QUESTION:
{query}

CONTEXT:
{context}

GROUNDED FACTUAL ANSWER:"""

res = requests.post(
    "http://127.0.0.1:11434/api/generate",
    json={
        "model": "qwen3:1.7b",
        "prompt": prompt,
        "stream": False,
        "think": False,
        "options": {"temperature": 0.0, "num_ctx": 4096},
    },
    timeout=60
)
print("RAW RESPONSE:")
print(res.json().get("response"))
