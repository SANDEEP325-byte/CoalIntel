import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv

from .base import AIResponse
from .factory import get_ai_provider, generate_with_fallback

load_dotenv()


class AIGateway:
    """
    Central AI Gateway for CoalIntel.
    Provides a decoupled, uniform interface between FastAPI services
    and underlying LLM providers (Google Gemini & Ollama).
    """

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: Optional[int] = 2048,
        provider: Optional[str] = None,
        allow_fallback: bool = True,
    ) -> AIResponse:
        """
        Dispatches prompt generation through the configured AI provider.
        Enables transparent fallback across Gemini and Ollama.
        """
        if allow_fallback:
            return generate_with_fallback(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                preferred_provider=provider,
            )
        else:
            p = get_ai_provider(provider)
            return p.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )

    def check_health(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """Queries health status of the active AI provider and model."""
        p = get_ai_provider(provider)
        return p.check_health()

    def get_active_provider_name(self) -> str:
        return os.getenv("AI_PROVIDER", "gemini").lower().strip()

    def get_active_model_name(self) -> str:
        p = get_ai_provider()
        return p.model_name


# Singleton gateway instance
ai_gateway = AIGateway()
