import requests

text = """Safety in Coal Mines Report 2025-26.pdf (Page 21)
Table 2: Overall Accident Statistics in 2025 (up to November) vis-a-vis 2024 in CIL
Columns: Parameters | 2025 | 2024
- Number of fatal accidents: 2025 = 25, 2024 = 22
- Number of fatalities: 2025 = 32, 2024 = 25
- Number of serious Accidents: 2025 = 26, 2024 = 31
- Number of serious injuries: 2025 = 29, 2024 = 37
- Fatality Rate per Mte. of coal production: 2025 = 0.05, 2024 = 0.03
- Fatality Rate per 3 lakh man-shift deployed: 2025 = 0.19, 2024 = 0.13"""

prompt = f"""You are CoalIntel, an expert AI analyst for the Indian Coal and Mining Sector.

Answer the question using ONLY the CONTEXT below. Cite the document and page number.

QUESTION:
What were the fatal accidents and fatality rate in CIL mines during 2024?

CONTEXT:
{text}

ANSWER:"""

res = requests.post(
    "http://127.0.0.1:11434/api/generate",
    json={
        "model": "qwen3:1.7b",
        "prompt": prompt,
        "stream": False,
        "think": False,
        "options": {"temperature": 0.0},
    }
)
print(res.json().get("response"))
