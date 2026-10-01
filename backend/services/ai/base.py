from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any


@dataclass
class AIResponse:
    """Standardized response from any AI provider."""
    text: str
    model_used: str
    provider: str
    latency_ms: int
    success: bool
    error: Optional[str] = None


class BaseAIProvider(ABC):
    """Abstract base class for LLM providers in CoalIntel."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g., 'gemini', 'ollama')."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Name of the primary model."""
        pass

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: Optional[int] = 2048,
    ) -> AIResponse:
        """
        Generates text completion using the provider.
        Must return an AIResponse.
        """
        pass

    @abstractmethod
    def check_health(self) -> Dict[str, Any]:
        """
        Probes the provider and model health.
        Must return a dict with at least:
        {"available": bool, "provider": str, "model": str, "model_loaded": bool}
        """
        pass
