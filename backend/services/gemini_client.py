import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv

try:
    from backend.services.ai.gemini import GeminiProvider
    from backend.services.ai.gateway import ai_gateway
except ModuleNotFoundError:
    from services.ai.gemini import GeminiProvider
    from services.ai.gateway import ai_gateway

load_dotenv()

# Centralized configuration purely from environment
PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.7-flash"]


def generate_text(
    prompt: str,
    temperature: float = 0.0,
    system_instruction: Optional[str] = None,
    max_output_tokens: Optional[int] = 2048,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Backward-compatible wrapper delegating to modern Gemini Provider via AI Gateway.
    Returns a dict with {"text": str, "model_used": str, "latency_ms": int, "success": bool}.
    """
    if model:
        provider = GeminiProvider(model=model)
        res = provider.generate(
            prompt=prompt,
            system_prompt=system_instruction,
            temperature=temperature,
            max_tokens=max_output_tokens,
        )
    else:
        res = ai_gateway.generate(
            prompt=prompt,
            system_prompt=system_instruction,
            temperature=temperature,
            max_tokens=max_output_tokens,
            provider="gemini",
        )

    if not res.success and not res.text:
        raise RuntimeError(f"Gemini generation failed: {res.error}")

    return {
        "text": res.text,
        "model_used": res.model_used,
        "latency_ms": res.latency_ms,
        "success": res.success,
    }


def check_gemini_status() -> Dict[str, Any]:
    """Checks the health and availability of the Gemini API service."""
    provider = GeminiProvider()
    return provider.check_health()
