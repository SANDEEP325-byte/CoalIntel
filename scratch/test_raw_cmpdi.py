import sys
from pathlib import Path
import requests

sys.stdout.reconfigure(encoding='utf-8')

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from services.hybrid_search import hybrid_search
from services.rag import linearize_chunk_text, MODEL_NAME, OLLAMA_URL

q = "What was CMPDI's 2D seismic exploration progress in 2024-25?"
search_results = hybrid_search(q, top_k=4)

context_parts = []
for idx, res in enumerate(search_results[:4], start=1):
    doc_name = res.get('document_name') or 'Mining Document'
    page_num = res.get('page_number')
    page_str = f"Page {page_num}" if page_num is not None else "Page Unknown"
    chunk_idx = res.get('chunk_index', 0)
    score_val = res.get('hybrid_score', 0.0)
    chunk_text = linearize_chunk_text(res.get('text', ''))
    context_parts.append(f"--- SOURCE {idx}: {doc_name} ({page_str}, Chunk {chunk_idx}) [Relevance: {score_val:.3f}] ---\n{chunk_text}\n")
context = "\n".join(context_parts)
print("=== CONTEXT SENT TO OLLAMA ===")
print(context)
print("================================")

prompt = f"""You are CoalIntel, an expert AI analyst for the Indian Coal and Mining Sector (Ministry of Coal, CIL, CMPDI).

Answer the user's question using ONLY the facts and figures provided in the CONTEXT below. Note that CMPDI and CMPDIL refer to the same organization (Central Mine Planning & Design Institute Limited); CIL refers to Coal India Limited.

STRICT ACCURACY RULES:
1. Do not fabricate, extrapolate, or guess any facts, numbers, dates, or units.
2. Answer based directly on the provided context. Preserve exact numbers, fiscal years, and units (e.g., MT, Crore, line km, %).
3. State the source document and page number explicitly in your answer when citing figures.
4. If the provided CONTEXT does not contain any facts to answer the question, answer EXACTLY:
"Insufficient evidence was found in the indexed documents."

QUESTION:
{q}

CONTEXT:
{context}

GROUNDED FACTUAL ANSWER:"""

resp = requests.post(OLLAMA_URL, json={'model': MODEL_NAME, 'prompt': prompt, 'stream': False, 'think': False, 'options': {'temperature': 0.0}}).json()
print("RAW RESPONSE:\n", repr(resp.get('response')))
