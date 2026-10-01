import sys
from pathlib import Path

# Ensure root and backend folder are on sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = Path(__file__).resolve().parent
for p in [str(root_dir), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.services.ai import ai_gateway

print("==================================================")
print(" CoalIntel AI Gateway Verification (Google Gemini)")
print("==================================================")

provider = ai_gateway.get_active_provider_name()
model = ai_gateway.get_active_model_name()
print(f"Active Provider : {provider}")
print(f"Active Model    : {model}")

print("\nChecking Provider Health...")
health = ai_gateway.check_health()
print(f"Health Result   : {health}")

if not health.get("available"):
    print("\n[WARNING] Health probe indicated provider unavailable:", health.get("error"))

print("\nTesting Text Generation...")
prompt = "Explain the role of CMPDI in the Indian Coal Sector in two clear, factual sentences."
res = ai_gateway.generate(
    prompt=prompt,
    temperature=0.0,
    max_tokens=256,
)

print(f"\nStatus      : {'SUCCESS' if res.success else 'FAILED'}")
print(f"Model Used  : {res.model_used}")
print(f"Latency     : {res.latency_ms} ms")
if res.success:
    print(f"\nResponse:\n{res.text}")
else:
    print(f"\nError: {res.error}")

print("==================================================")
