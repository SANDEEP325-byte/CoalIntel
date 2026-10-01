import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from services.rag import generate_grounded_answer

q = "What was the total copper export of Argentina in 1890?"
res = generate_grounded_answer(q, top_k=5)
print("STATUS:", res.get("status"))
print("CONFIDENCE:", res.get("confidence"), res.get("confidence_level"))
print("ANSWER:\n", res.get("answer"))
print("SOURCES COUNT:", len(res.get("sources", [])))
print("EVIDENCE:", res.get("evidence"))
print("LATENCY:", res.get("latency"))
