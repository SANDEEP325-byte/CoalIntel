import requests

url = 'http://127.0.0.1:11434/api/generate'
context = """--- SOURCE 1: Safety in Coal Mines Report 2025-26.pdf (Page 21) [Relevance: 0.952] ---
Safety in Coal Mines
187
Table - 2: Overall Accident Statistics in 2025 (up to November) vis-a-vis 2024 in CIL

| SN | Parameters | 2025 | 2024 |
| --- | --- | --- | --- |
| 1 | Number of fatal accidents | 25 | 22 |
| 2 | Number of fatalities | 32 | 25 |
| 3 | Number of serious Accidents | 26 | 31 |
| 4 | Number of serious injuries | 29 | 37 |
| 5 | Fatality Rate per Mte. of coal production | 0.05 | 0.03 |
| 6 | Fatality Rate per 3 lakh man-shift deployed | 0.19 | 0.13 |

Summary: Number of fatal accidents (2025: 25, 2024: 22); Number of fatalities (2025: 32, 2024: 25); Number of serious Accidents (2025: 26, 2024: 31); Number of serious injuries (2025: 29, 2024: 37); Fatality Rate per Mte. of coal production (2025: 0.05, 2024: 0.03); Fatality Rate per 3 lakh man-shift deployed (2025: 0.19, 2024: 0.13)
Note: Accident Statistics are maintained calendar year wise in conformity with DGMS practice & figures subject to reconciliation with DGMS.
"""

prompt = f"""You are CoalIntel, an expert AI analyst for the Indian Coal and Mining Sector (Ministry of Coal, CIL, CMPDI).

Answer the user's question using ONLY the CONTEXT provided below.

STRICT ACCURACY RULES:
1. Do not fabricate, extrapolate, or guess any facts, numbers, dates, or units.
2. Preserve exact numbers, fiscal years, and units (e.g., MT, Crore, MCum, %). Match the exact year column requested (e.g., FY 2024-25 is 762.83 MT for CIL coal dispatch; 545.74 MT is FY 2025-26 provisional).
3. CAREFULLY DISTINGUISH between "Coal Production" (raw coal mined) and "Coal Dispatch" (offtake/transported). In CMPDI/CIL reports, DO NOT confuse Coal Dispatch/Offtake (e.g., 762.83 MT for FY 2024-25 CIL dispatch/offtake) with Raw Coal Production (e.g., 781.06 MT for FY 2024-25 CIL production). Always inspect the exact table title and row heading (e.g. 'Table 1: Off-take / Dispatch' vs 'Table 2: Coal Production').
4. State the source document and page number explicitly in your answer when citing figures.
5. If the required information is NOT present in the CONTEXT below, respond with EXACTLY:
"Insufficient evidence was found in the indexed documents."
6. If the user asks in Hindi or Hinglish, provide the grounded factual response in formal Hindi or bilingual format while maintaining exact numbers, units, and page citations.

QUESTION:
What were the fatal accidents and fatality rate in CIL mines during 2024?

CONTEXT:
{context}

GROUNDED FACTUAL ANSWER:"""

resp = requests.post(url, json={'model': 'qwen3:1.7b', 'prompt': prompt, 'stream': False, 'think': False, 'options': {'temperature': 0.0}}).json()
print("RESPONSE:\n", resp.get('response'))
