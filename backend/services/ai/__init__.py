try:
    from backend.services.ai.base import BaseAIProvider, AIResponse
    from backend.services.ai.gemini import GeminiProvider
    from backend.services.ai.ollama import OllamaProvider
    from backend.services.ai.factory import get_ai_provider, generate_with_fallback
    from backend.services.ai.gateway import ai_gateway, AIGateway
except ModuleNotFoundError:
    from services.ai.base import BaseAIProvider, AIResponse
    from services.ai.gemini import GeminiProvider
    from services.ai.ollama import OllamaProvider
    from services.ai.factory import get_ai_provider, generate_with_fallback
    from services.ai.gateway import ai_gateway, AIGateway

__all__ = [
    "BaseAIProvider",
    "AIResponse",
    "GeminiProvider",
    "OllamaProvider",
    "get_ai_provider",
    "generate_with_fallback",
    "ai_gateway",
    "AIGateway",
]
