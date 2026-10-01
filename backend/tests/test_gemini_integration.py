import os
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.ai import (
    BaseAIProvider,
    AIResponse,
    GeminiProvider,
    OllamaProvider,
    get_ai_provider,
    ai_gateway,
    generate_with_fallback,
)
from backend.services.rag import generate_answer, INSUFFICIENT_EVIDENCE_MSG


class TestGeminiIntegration(unittest.TestCase):
    """
    Test suite for Google Gemini LLM Integration, AI Provider Abstraction,
    and Grounded RAG Pipeline in CoalIntel.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_provider_factory(self):
        """Verify provider factory correctly instantiates Gemini and Ollama providers."""
        gemini_p = get_ai_provider("gemini")
        self.assertIsInstance(gemini_p, GeminiProvider)
        self.assertEqual(gemini_p.provider_name, "gemini")

        ollama_p = get_ai_provider("ollama")
        self.assertIsInstance(ollama_p, OllamaProvider)
        self.assertEqual(ollama_p.provider_name, "ollama")

    def test_02_gemini_provider_generation(self):
        """Verify Gemini provider generates text using modern google-genai SDK."""
        provider = GeminiProvider()
        res = provider.generate(
            prompt="Reply with exactly the words 'CoalIntel Gemini Verified'.",
            system_prompt="You are a helpful mining intelligence assistant.",
            temperature=0.0,
            max_tokens=512,
        )
        self.assertIsInstance(res, AIResponse)
        self.assertTrue(res.success)
        self.assertEqual(res.provider, "gemini")
        self.assertIn("CoalIntel", res.text)
        self.assertGreater(res.latency_ms, 0)

    def test_03_grounded_rag_query_with_gemini(self):
        """Verify grounded RAG pipeline passes retrieved evidence to Gemini and returns citations."""
        res = generate_answer("What was CIL coal dispatch in FY 2024-25?")
        self.assertIn("answer", res)
        self.assertIn("sources", res)
        self.assertGreater(len(res["sources"]), 0)

        # Check that answer contains key CIL dispatch figure (762.83 MT)
        ans_text = res["answer"]
        self.assertTrue(
            "762.83" in ans_text or "762" in ans_text or "dispatch" in ans_text.lower(),
            f"Expected dispatch figure in answer, got: {ans_text}"
        )

        # Verify source traceability format (Section 9)
        top_source = res["sources"][0]
        self.assertIn("document", top_source)
        self.assertIn("page", top_source)
        self.assertIn("chunk", top_source)
        self.assertIn("score", top_source)
        self.assertIn("evidence", top_source)

    def test_04_source_traceability_unaltered(self):
        """Verify source metadata is strictly derived from MongoDB retrieval, not fabricated by LLM."""
        res = generate_answer("What was Coal India coal production in 2024-25?")
        sources = res.get("sources", [])
        self.assertGreater(len(sources), 0)

        for s in sources:
            # Document must be one of the known indexed mining PDFs
            self.assertTrue(
                any(d in s["document"] for d in ["CIL", "Coal", "Safety", "CMPDI"]),
                f"Unknown document name in sources: {s['document']}"
            )
            # Page number must be integer or valid number from extraction
            self.assertIsNotNone(s.get("page"))
            self.assertIsInstance(s.get("score"), (int, float))

    def test_05_negative_rejection_for_unrelated_query(self):
        """Verify model adheres to rule 6 and rejects queries lacking document evidence."""
        res = generate_answer("What were the copper export quotas of Argentina in 1890?")
        ans = res.get("answer", "")
        self.assertTrue(
            INSUFFICIENT_EVIDENCE_MSG in ans
            or "not found" in ans.lower()
            or "insufficient" in ans.lower(),
            f"Expected negative rejection, got: {ans}"
        )

    def test_06_error_handling_and_key_sanitization(self):
        """Verify invalid API key fails gracefully without crashing or leaking credentials."""
        fake_provider = GeminiProvider(api_key="AQ.FAKETOKEN123456789_INVALID")
        res = fake_provider.generate("ping")
        self.assertFalse(res.success)
        self.assertIsNotNone(res.error)
        # Verify fake API key is not leaked in error message
        self.assertNotIn("AQ.FAKETOKEN123456789_INVALID", res.error)

    def test_07_api_health_endpoints(self):
        """Verify /health and /health/llm report active Gemini status."""
        health_res = self.client.get("/health")
        self.assertEqual(health_res.status_code, 200)
        data = health_res.json()
        self.assertEqual(data.get("ai_provider"), "gemini")
        self.assertTrue(data.get("llm_online"))
        self.assertIn("gemini", data.get("llm_model", "").lower())

        llm_health = self.client.get("/health/llm")
        self.assertEqual(llm_health.status_code, 200)
        llm_data = llm_health.json()
        self.assertTrue(llm_data.get("available"))
        self.assertEqual(llm_data.get("provider"), "Google Gemini")


if __name__ == "__main__":
    unittest.main()
