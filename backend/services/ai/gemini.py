import os
import time
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

from google import genai
from google.genai import types
from google.genai.errors import ServerError, ClientError, APIError

from .base import BaseAIProvider, AIResponse

load_dotenv()


class GeminiProvider(BaseAIProvider):
    """
    Google Gemini AI Provider for CoalIntel using the modern google-genai SDK.
    Features candidate model fallback, automatic rate limit resilience, and sanitized error handling.
    """

    FALLBACK_MODELS: List[str] = ["gemini-3.5-flash-lite", "gemini-3.7-flash"]

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or os.getenv("GEMINI_API_KEY", "").strip()
        self._model = model or os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
        self._client: Optional[genai.Client] = None

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self._model

    def _get_client(self) -> genai.Client:
        if self._client is None:
            if not self._api_key:
                raise ValueError("GEMINI_API_KEY is missing. Please set it in your environment or .env file.")
            self._client = genai.Client(api_key=self._api_key)
        return self._client

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: Optional[int] = 2048,
    ) -> AIResponse:
        start_time = time.perf_counter()

        if not self._api_key:
            return AIResponse(
                text="",
                model_used=self._model,
                provider=self.provider_name,
                latency_ms=0,
                success=False,
                error="Gemini API Key is not configured in environment.",
            )

        try:
            client = self._get_client()
        except Exception as exc:
            return AIResponse(
                text="",
                model_used=self._model,
                provider=self.provider_name,
                latency_ms=0,
                success=False,
                error=f"Failed to initialize Gemini client: {self._sanitize_error(str(exc))}",
            )

        config_kwargs: Dict[str, Any] = {
            "temperature": temperature,
        }
        if system_prompt:
            config_kwargs["system_instruction"] = system_prompt
        if max_tokens:
            # Ensure at least 512 tokens so reasoning models (Gemini 3) don't exhaust budget before output
            config_kwargs["max_output_tokens"] = max(max_tokens, 512)

        config = types.GenerateContentConfig(**config_kwargs)

        candidate_models = [self._model]
        for fb in self.FALLBACK_MODELS:
            if fb not in candidate_models:
                candidate_models.append(fb)

        last_error = None
        for m in candidate_models:
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=prompt,
                    config=config,
                )
                latency_ms = int((time.perf_counter() - start_time) * 1000)
                text_out = response.text.strip() if response.text else ""
                return AIResponse(
                    text=text_out,
                    model_used=m,
                    provider=self.provider_name,
                    latency_ms=latency_ms,
                    success=True,
                )
            except (ServerError, ClientError, APIError, Exception) as exc:
                last_error = exc
                err_msg = str(exc).lower()
                # On 429 (rate limit), 503 (high demand), or quota exhaustion, try fallback candidate
                if any(k in err_msg for k in ["503", "demand", "429", "resource_exhausted", "unavailable", "rate limit"]):
                    continue
                # For invalid key or other fatal errors, stop immediately
                break

        latency_ms = int((time.perf_counter() - start_time) * 1000)
        sanitized = self._sanitize_error(str(last_error))
        return AIResponse(
            text="",
            model_used=self._model,
            provider=self.provider_name,
            latency_ms=latency_ms,
            success=False,
            error=sanitized,
        )

    def check_health(self) -> Dict[str, Any]:
        """Probes Gemini API connectivity and reports health."""
        if not self._api_key:
            return {
                "available": False,
                "provider": "Google Gemini",
                "model": self._model,
                "model_loaded": False,
                "error": "No GEMINI_API_KEY configured in environment",
            }

        try:
            client = self._get_client()
            cfg = types.GenerateContentConfig(temperature=0.0, max_output_tokens=5)
            candidate_models = [self._model]
            for fb in self.FALLBACK_MODELS:
                if fb not in candidate_models:
                    candidate_models.append(fb)

            last_exc = None
            for m in candidate_models:
                try:
                    client.models.generate_content(
                        model=m,
                        contents="ping",
                        config=cfg,
                    )
                    return {
                        "available": True,
                        "provider": "Google Gemini",
                        "model": m,
                        "model_loaded": True,
                        "status": "ready",
                    }
                except Exception as exc:
                    last_exc = exc
                    continue

            return {
                "available": False,
                "provider": "Google Gemini",
                "model": self._model,
                "model_loaded": False,
                "error": self._sanitize_error(str(last_exc)),
            }
        except Exception as exc:
            return {
                "available": False,
                "provider": "Google Gemini",
                "model": self._model,
                "model_loaded": False,
                "error": self._sanitize_error(str(exc)),
            }

    def _sanitize_error(self, raw_error: str) -> str:
        """Removes API keys or credentials from raw error messages for security."""
        if not raw_error:
            return "Unknown Gemini error."
        sanitized = raw_error
        if self._api_key and self._api_key in sanitized:
            sanitized = sanitized.replace(self._api_key, "[REDACTED_API_KEY]")
        # Standardize common error patterns
        lower = sanitized.lower()
        if "403" in lower or "api_key_invalid" in lower or "invalid api key" in lower:
            return "Google Gemini authentication failed: Invalid or expired API key."
        if "429" in lower or "resource_exhausted" in lower or "quota" in lower:
            return "Google Gemini API rate limit or quota exceeded. Please retry momentarily or check your tier."
        if "503" in lower or "overloaded" in lower or "high demand" in lower:
            return "Google Gemini service is temporarily experiencing high demand."
        if "404" in lower or "not_found" in lower:
            return f"Configured Gemini model '{self._model}' is unavailable or retired."
        return sanitized
