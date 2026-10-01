import requests

url = 'http://127.0.0.1:11434/api/generate'
context = """--- SOURCE 1: CMPDIL_Annual_Report_2024-25.pdf (Page 15) [Relevance: 0.911] ---
CENTRAL MINE PLANNING & DESIGN INSTITUTE LIMITED
(A Subsidiary of Coal India Limited)
9
been granted by DGO, Orissa for implementation through NMET funding. 
Seismic survey activities saw significant growth in 2024-25. CMPDIL carried out about 438 line km of 
2D seismic surveys in 2024-25, resulting in an impressive 87% year-on-year growth which included 
about 300 line km of 2D surveys using departmental resources, reflecting a 46% increase compared 
to the previous year. 
Adding on to it, a total of 230 reports including 31 Geological reports, 33 Project reports, 90 Ground 
Water Modeling (GWM) reports, 88 Comprehensive Hydrogeological reports, 26 EIA/ EMP reports 
(hydrogeological part) and 26 other reports were prepared during the financial year 2024–25.
"""

prompt_template = """You are CoalIntel, an expert AI analyst for the Indian Coal and Mining Sector (Ministry of Coal, CIL, CMPDI).

Answer the user's question using ONLY the facts and figures provided in the CONTEXT below. Note that CMPDI and CMPDIL refer to the same organization (Central Mine Planning & Design Institute Limited).

STRICT ACCURACY RULES:
1. Do not fabricate, extrapolate, or guess any facts, numbers, dates, or units.
2. Answer based directly on the provided context. Preserve exact numbers, fiscal years, and units (e.g., MT, Crore, line km, %).
3. State the source document and page number explicitly in your answer when citing figures.
4. If the provided CONTEXT does not contain any facts to answer the question, answer EXACTLY:
"Insufficient evidence was found in the indexed documents."

QUESTION:
{question}

CONTEXT:
{context}

GROUNDED FACTUAL ANSWER:"""

for q in [
    "What was CMPDI's 2D seismic exploration progress in 2024-25?",
    "What was the total copper export of Argentina in 1890?"
]:
    p = prompt_template.format(question=q, context=context)
    resp = requests.post(url, json={'model': 'qwen3:1.7b', 'prompt': p, 'stream': False, 'think': False, 'options': {'temperature': 0.0}}).json()
    print(f"=== Q: {q} ===")
    print(resp.get('response'))
    print()
