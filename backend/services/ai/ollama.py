import os
import time
import requests
from typing import Optional, Dict, Any
from dotenv import load_dotenv

from .base import BaseAIProvider, AIResponse

load_dotenv()


class OllamaProvider(BaseAIProvider):
    """
    Local Ollama AI Provider for CoalIntel (Qwen3:1.7b local RAG).
    Provides offline fallback and zero-cost local LLM inference.
    """

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self._base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")).rstrip("/")
        self._model = model or os.getenv("OLLAMA_MODEL", "qwen3:1.7b")

    @property
    def provider_name(self) -> str:
        return "ollama"

    @property
    def model_name(self) -> str:
        return self._model

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: Optional[int] = 2048,
    ) -> AIResponse:
        start_time = time.perf_counter()
        url = f"{self._base_url}/api/generate"

        payload: Dict[str, Any] = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
            }
        }
        if system_prompt:
            payload["system"] = system_prompt
        if max_tokens:
            payload["options"]["num_predict"] = max_tokens

        try:
            res = requests.post(url, json=payload, timeout=60)
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            if res.status_code == 200:
                text_out = res.json().get("response", "").strip()
                return AIResponse(
                    text=text_out,
                    model_used=self._model,
                    provider=self.provider_name,
                    latency_ms=latency_ms,
                    success=True,
                )
            return AIResponse(
                text="",
                model_used=self._model,
                provider=self.provider_name,
                latency_ms=latency_ms,
                success=False,
                error=f"Ollama returned HTTP {res.status_code}: {res.text}",
            )
        except Exception as exc:
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            return AIResponse(
                text="",
                model_used=self._model,
                provider=self.provider_name,
                latency_ms=latency_ms,
                success=False,
                error=f"Failed to communicate with local Ollama runtime: {exc}",
            )

    def check_health(self) -> Dict[str, Any]:
        """Checks if local Ollama daemon is running and model is loaded."""
        try:
            res = requests.get(f"{self._base_url}/api/tags", timeout=3)
            if res.status_code == 200:
                models = [m.get("name") for m in res.json().get("models", [])]
                model_loaded = any(self._model.split(":")[0] in m for m in models)
                return {
                    "available": True,
                    "provider": "Ollama",
                    "model": self._model,
                    "model_loaded": model_loaded,
                    "installed_models": models,
                    "status": "ready" if model_loaded else "model_missing",
                }
        except Exception as exc:
            return {
                "available": False,
                "provider": "Ollama",
                "model": self._model,
                "model_loaded": False,
                "error": str(exc),
            }
        return {
            "available": False,
            "provider": "Ollama",
            "model": self._model,
            "model_loaded": False,
        }
