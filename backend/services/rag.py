import requests
import re
from typing import Dict, Any, List, Optional
from bson import ObjectId

from database.mongodb import documents_collection
from services.hybrid_search import hybrid_search
from services.confidence import calculate_confidence
from services.intent import classify_intent


OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "qwen3:1.7b"
INSUFFICIENT_EVIDENCE_MSG = "Insufficient evidence was found in the indexed documents."


def extract_best_evidence_snippet(query: str, sources: List[Dict[str, Any]]) -> str:
    """Finds the most relevant sentence or table row from the top retrieved sources."""
    if not sources:
        return "No supporting snippet found."

    query_words = set(w.lower() for w in re.findall(r'\w+', query) if len(w) > 2)
    top_chunk = sources[0].get("text", "")

    # If it's a table chunk, extract the best matching line
    lines = top_chunk.split("\n")
    best_line = ""
    best_overlap = -1

    for line in lines:
        line_clean = line.strip()
        if not line_clean or line_clean.startswith("---") or line_clean.startswith("| ---"):
            continue
        line_words = set(w.lower() for w in re.findall(r'\w+', line_clean))
        overlap = len(query_words.intersection(line_words))
        if overlap > best_overlap:
            best_overlap = overlap
            best_line = line_clean

    if best_line and best_overlap > 0:
        return best_line[:300]
    return top_chunk[:300].replace("\n", " ").strip()


def generate_answer(
    question: str,
    top_k: int = 5,
    document_id: Optional[str] = None,
    category: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes grounded RAG pipeline:
    1. Query Intent Classification
    2. Hybrid Retrieval (Semantic + Keyword)
    3. Anti-Hallucination Evidence Gate
    4. Grounded Synthesis via Local Qwen3:1.7B
    5. Post-generation Grounding and Confidence Scoring
    """
    clean_question = question.strip()
    intent_info = classify_intent(clean_question)

    # Step 1: Hybrid Search retrieval
    search_results = hybrid_search(
        query=clean_question,
        top_k=top_k,
        document_id=document_id,
        category=category,
    )

    # Step 2: Evidence Gate
    if not search_results:
        return {
            "question": clean_question,
            "answer": INSUFFICIENT_EVIDENCE_MSG,
            "confidence": 0.95,
            "confidence_level": "HIGH",
            "sources": [],
            "evidence": "None",
            "intent": intent_info["intent"],
            "status": "insufficient_evidence",
        }

    top_result = search_results[0]
    top_sem_score = top_result.get("semantic_score", 0.0)
    top_kw_score = top_result.get("keyword_score", 0.0)

    # If retrieval is completely irrelevant (e.g. asking about unrelated things)
    if top_sem_score < 0.28 and top_kw_score < 0.05:
        return {
            "question": clean_question,
            "answer": INSUFFICIENT_EVIDENCE_MSG,
            "confidence": 0.90,
            "confidence_level": "HIGH",
            "sources": [],
            "evidence": "None",
            "intent": intent_info["intent"],
            "status": "insufficient_evidence",
        }

    # Step 3: Build grounded context
    context_parts = []
    for idx, res in enumerate(search_results, start=1):
        doc_name = res.get("document_name") or "Mining Document"
        page_num = res.get("page_number")
        page_str = f"Page {page_num}" if page_num is not None else "Page Unknown"
        score_val = res.get("hybrid_score", 0.0)

        context_parts.append(
            f"--- SOURCE {idx}: {doc_name} ({page_str}) [Score: {score_val:.3f}] ---\n"
            f"{res['text']}\n"
        )

    context = "\n".join(context_parts)

    # Step 4: Strict Anti-Hallucination Prompt
    prompt = f"""You are CoalIntel, an expert AI analyst for the Indian Coal and Mining Sector (Ministry of Coal, CIL, CMPDI).

Answer the user's question using ONLY the CONTEXT provided below.

STRICT ACCURACY RULES:
1. Do not fabricate, extrapolate, or guess any facts, numbers, dates, or units.
2. Preserve exact numbers and units (e.g., MT, Crore, MCum, %).
3. CAREFULLY DISTINGUISH between "Coal Production" (raw coal mined) and "Coal Dispatch" (offtake/transported). Do NOT confuse them.
4. State the source document and page number explicitly in your answer when citing figures.
5. If the required information is NOT present in the CONTEXT below, respond with EXACTLY:
"{INSUFFICIENT_EVIDENCE_MSG}"

QUESTION:
{clean_question}

CONTEXT:
{context}

GROUNDED FACTUAL ANSWER:"""

    raw_answer = ""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "think": False,
                "options": {
                    "temperature": 0.05,
                    "num_ctx": 4096,
                },
            },
            timeout=90,
        )
        response.raise_for_status()
        raw_answer = response.json().get("response", "").strip()
    except Exception as exc:
        print(f"Ollama generation warning: {exc}")
        # Fallback to direct evidence extraction if LLM is offline or timed out
        evidence_line = extract_best_evidence_snippet(clean_question, search_results)
        raw_answer = f"Based on indexed records: {evidence_line}"

    # Normalize negative answers
    if "not found in the provided" in raw_answer.lower() or "not mentioned in the provided" in raw_answer.lower():
        raw_answer = INSUFFICIENT_EVIDENCE_MSG

    # Step 5: Format sources with document names & page numbers
    formatted_sources = []
    for res in search_results:
        formatted_sources.append({
            "document_id": res.get("document_id"),
            "filename": res.get("document_name") or "Unknown document",
            "document_category": res.get("document_category") or "Uncategorized",
            "page_number": res.get("page_number"),
            "chunk_index": res.get("chunk_index"),
            "similarity_score": round(res.get("semantic_score", 0.0), 4),
            "hybrid_score": round(res.get("hybrid_score", 0.0), 4),
            "text": res.get("text", "")[:400],
        })

    # Step 6: Confidence calculation & Evidence snippet
    conf_score, conf_level, conf_details = calculate_confidence(
        clean_question,
        raw_answer,
        formatted_sources,
    )
    evidence_snippet = extract_best_evidence_snippet(clean_question, formatted_sources)

    return {
        "question": clean_question,
        "answer": raw_answer,
        "confidence": conf_score,
        "confidence_level": conf_level,
        "confidence_details": conf_details,
        "sources": formatted_sources,
        "evidence": evidence_snippet,
        "intent": intent_info["intent"],
        "status": "success",
    }


generate_grounded_answer = generate_answer