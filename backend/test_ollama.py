import requests

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

payload = {
    "model": "qwen3:1.7b",
    "prompt": "Explain coal mining in one short sentence.",
    "stream": False,
}


response = requests.post(
    OLLAMA_URL,
    json=payload,
    timeout=120,
)

response.raise_for_status()

data = response.json()

print("Qwen3:1.7b response:")
print(data["response"])