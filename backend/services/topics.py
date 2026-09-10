import re
from collections import Counter
from typing import List, Dict, Any, Optional
from database.mongodb import chunks_collection


MINING_TOPICS = [
    {
        "id": "topic_production",
        "name": "Coal Production",
        "keywords": ["production", "raw coal", "target", "achievement", "mt", "opencast", "underground", "subsidiary"],
        "color": "#3B82F6",
    },
    {
        "id": "topic_safety",
        "name": "Mine Safety & Health",
        "keywords": ["safety", "fatality", "fatalities", "accident", "injury", "dgms", "rescue", "protective"],
        "color": "#EF4444",
    },
    {
        "id": "topic_dispatch",
        "name": "Coal Dispatch & Offtake",
        "keywords": ["dispatch", "offtake", "power", "utility", "railway", "rakes", "evacuation", "siding"],
        "color": "#10B981",
    },
    {
        "id": "topic_exploration",
        "name": "Exploration & Geology",
        "keywords": ["exploration", "seismic", "drilling", "geological", "cmpdi", "nmet", "survey", "borehole"],
        "color": "#8B5CF6",
    },
    {
        "id": "topic_financials",
        "name": "Financial Performance",
        "keywords": ["profit", "pbt", "pat", "revenue", "crore", "dividend", "sales", "expenditure"],
        "color": "#F59E0B",
    },
    {
        "id": "topic_environment",
        "name": "Environment & Sustainability",
        "keywords": ["environment", "reclamation", "saplings", "plantation", "water", "eia", "emp", "green"],
        "color": "#059669",
    },
    {
        "id": "topic_technology",
        "name": "Technology & Digitization",
        "keywords": ["technology", "drone", "modeling", "software", "continuous miner", "mechanization", "digital"],
        "color": "#6366F1",
    },
    {
        "id": "topic_manpower",
        "name": "Manpower & Welfare",
        "keywords": ["manpower", "employee", "personnel", "welfare", "training", "wage", "industrial relations"],
        "color": "#EC4899",
    },
]

COMMON_STOPWORDS = {
    "the", "and", "of", "to", "in", "for", "is", "on", "that", "by", "this", "with", "from", "at", "as",
    "an", "be", "are", "it", "was", "were", "or", "have", "has", "had", "not", "their", "which", "will",
    "been", "also", "per", "its", "all", "such", "during", "under", "total", "crore", "lakh", "no", "upto",
    "year", "years", "report", "company", "limited", "india", "coal", "ministry", "page", "table", "annexure",
    "government", "chapter", "annual", "rs", "mt", "figures", "particulars", "dated", "sl", "fig"
}


def get_topic_distribution(
    document_name: Optional[str] = None,
    category: Optional[str] = None,
) -> Dict[str, Any]:
    """Computes the distribution of mining topics across indexed documents."""
    filter_criteria = {}
    if document_name:
        filter_criteria["document_name"] = document_name
    if category:
        filter_criteria["document_category"] = category

    chunks = list(chunks_collection.find(filter_criteria, {"text": 1}))
    total_chunks = len(chunks) or 1

    topic_counts = {t["name"]: 0 for t in MINING_TOPICS}

    for chk in chunks:
        txt = chk.get("text", "").lower()
        for t in MINING_TOPICS:
            if any(k in txt for k in t["keywords"]):
                topic_counts[t["name"]] += 1

    distribution = []
    for t in MINING_TOPICS:
        cnt = topic_counts[t["name"]]
        pct = round((cnt / total_chunks) * 100, 1)
        distribution.append({
            "id": t["id"],
            "name": t["name"],
            "count": cnt,
            "percentage": pct,
            "color": t["color"],
        })

    distribution.sort(key=lambda x: x["count"], reverse=True)
    return {
        "total_chunks_analyzed": len(chunks),
        "topics": distribution,
    }


def generate_word_cloud(
    document_name: Optional[str] = None,
    category: Optional[str] = None,
    max_words: int = 60,
) -> List[Dict[str, Any]]:
    """Generates word frequencies for visualization in the frontend word cloud."""
    filter_criteria = {}
    if document_name:
        filter_criteria["document_name"] = document_name
    if category:
        filter_criteria["document_category"] = category

    chunks = list(chunks_collection.find(filter_criteria, {"text": 1}))
    word_counter = Counter()

    for chk in chunks:
        txt = chk.get("text", "").lower()
        # Extract alphanumeric words
        words = re.findall(r'\b[a-z]{3,15}\b', txt)
        for w in words:
            if w not in COMMON_STOPWORDS and not w.isdigit():
                word_counter[w] += 1

    top_words = word_counter.most_common(max_words)
    if not top_words:
        return []

    max_freq = top_words[0][1]
    result = []
    for word, count in top_words:
        weight = max(12, int((count / max_freq) * 36) + 12)
        result.append({
            "text": word.capitalize(),
            "value": count,
            "size": weight,
        })

    return result
