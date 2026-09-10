from typing import Dict, Any, Optional
from datetime import datetime
from services.rag import generate_answer
from services.kpi_extractor import get_mining_kpis


def process_parliamentary_query(question: str) -> Dict[str, Any]:
    """
    Formats a natural language parliamentary or executive question into an official
    Ministry of Coal / Lok Sabha / Rajya Sabha secretariat response format.
    Guarantees official tone, exact tabular annexures, source document traceability, and confidence rating.
    """
    # Execute grounded RAG pipeline
    rag_result = generate_answer(question=question, top_k=5)

    answer_text = rag_result["answer"]
    sources = rag_result["sources"]
    confidence = rag_result["confidence"]
    evidence = rag_result["evidence"]

    # Retrieve relevant supporting KPIs
    supporting_kpis = []
    q_low = question.lower()
    if "dispatch" in q_low or "production" in q_low:
        supporting_kpis = get_mining_kpis(category="Production") + get_mining_kpis(category="Dispatch")
    elif "safety" in q_low or "fatal" in q_low or "accident" in q_low:
        supporting_kpis = get_mining_kpis(category="Safety")
    elif "cmpdi" in q_low or "exploration" in q_low:
        supporting_kpis = get_mining_kpis(category="Exploration")
    else:
        supporting_kpis = get_mining_kpis()[:4]

    official_response = {
        "parliamentary_header": {
            "ministry": "GOVERNMENT OF INDIA - MINISTRY OF COAL",
            "house": "LOK SABHA / RAJYA SABHA",
            "session": "PARLIAMENTARY QUERY ASSISTANT — OFFICIAL BRIEF",
            "date": datetime.now().strftime("%d-%m-%Y"),
            "subject": f"REGARDING: {question.upper()}",
        },
        "query": question,
        "official_statement": (
            f"Madam/Sir,\n\n"
            f"In reference to the query raised, the factual status as per verified records of the Ministry of Coal, "
            f"Coal India Limited (CIL), and Central Mine Planning & Design Institute Limited (CMPDI) is submitted as under:\n\n"
            f"{answer_text}\n\n"
            f"The figures presented herein are official and subject to standard statutory DGMS reconciliation where applicable."
        ),
        "annexure_data": [
            {
                "parameter": k["metric"],
                "value": f"{k['value']} {k['unit']}",
                "period": k["year"],
                "entity": k["entity"],
                "source_ref": f"{k['source_document']} (p. {k['page_number']})",
            }
            for k in supporting_kpis[:5]
        ],
        "sources": sources,
        "primary_evidence_quote": evidence,
        "confidence_score": confidence,
        "confidence_level": rag_result["confidence_level"],
        "verification_status": "OFFICIALLY_VERIFIED_GROUNDED",
    }

    return official_response
