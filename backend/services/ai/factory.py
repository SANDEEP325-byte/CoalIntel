import os
from typing import Optional
from dotenv import load_dotenv

from .base import BaseAIProvider, AIResponse
from .gemini import GeminiProvider
from .ollama import OllamaProvider

load_dotenv()

_cached_providers = {}


def get_ai_provider(provider_name: Optional[str] = None) -> BaseAIProvider:
    """
    Factory function returning the configured AI Provider instance.
    Reads 'AI_PROVIDER' from environment if not explicitly specified.
    Supported values: 'gemini', 'ollama'.
    """
    name = (provider_name or os.getenv("AI_PROVIDER", "gemini")).lower().strip()

    if name in _cached_providers:
        return _cached_providers[name]

    if name == "gemini":
        provider = GeminiProvider()
    elif name == "ollama":
        provider = OllamaProvider()
    else:
        # Default to Gemini if unknown
        provider = GeminiProvider()

    _cached_providers[name] = provider
    return provider


def generate_with_fallback(
    prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.0,
    max_tokens: Optional[int] = 2048,
    preferred_provider: Optional[str] = None,
) -> AIResponse:
    """
    Executes text generation using the primary provider.
    If the primary provider fails (e.g. quota, network, or server issue),
    seamlessly falls back to the alternate provider to guarantee service uptime.
    """
    primary_name = (preferred_provider or os.getenv("AI_PROVIDER", "gemini")).lower().strip()
    primary = get_ai_provider(primary_name)

    res = primary.generate(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=temperature,
        max_tokens=max_tokens,
    )

    if res.success:
        return res

    # Attempt fallback to the other provider
    secondary_name = "ollama" if primary_name == "gemini" else "gemini"
    try:
        secondary = get_ai_provider(secondary_name)
        fallback_res = secondary.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if fallback_res.success:
            return fallback_res
    except Exception:
        pass

    # Return primary failure if fallback also failed or unavailable
    return res
