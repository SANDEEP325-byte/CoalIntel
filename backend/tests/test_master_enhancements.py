import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend folder is on python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from main import app
from services.semantic_search import semantic_search, invalidate_embedding_cache, _EMBEDDING_CACHE
from services.intent import classify_intent
from services.report_generator import generate_subsidiary_kpi_csv


class TestMasterEnhancements(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_in_memory_embedding_cache(self):
        """Verifies that in-memory cache populates, accelerates searches, and invalidates properly."""
        invalidate_embedding_cache()
        self.assertIsNone(_EMBEDDING_CACHE["matrix"])

        # First search populates cache
        results = semantic_search("CIL coal production target", top_k=3)
        self.assertTrue(len(results) > 0)
        self.assertIsNotNone(_EMBEDDING_CACHE["matrix"])
        self.assertGreater(_EMBEDDING_CACHE["count"], 1000)

        # Second search runs directly from in-memory cache
        results_cached = semantic_search("CIL coal production target", top_k=3)
        self.assertEqual(len(results_cached), len(results))
        self.assertEqual(results_cached[0]["document_id"], results[0]["document_id"])

        # Invalidate cache
        invalidate_embedding_cache()
        self.assertIsNone(_EMBEDDING_CACHE["matrix"])

    def test_02_empty_query_validation(self):
        """Verifies that empty queries return HTTP 400 with clean error message instead of 500."""
        res = self.client.post("/query", json={"question": "   "})
        self.assertEqual(res.status_code, 400)
        self.assertIn("cannot be empty", res.json()["detail"].lower())

        res_intent = self.client.get("/query/intent?q=")
        self.assertEqual(res_intent.status_code, 400)

    def test_03_pdf_magic_byte_security(self):
        """Verifies that uploading a non-PDF file with a .pdf extension is rejected by magic byte check."""
        fake_pdf_content = b"This is a malicious shell script pretending to be a pdf file."
        files = {"file": ("malicious.pdf", fake_pdf_content, "application/pdf")}
        res = self.client.post("/documents/upload", files=files)
        self.assertEqual(res.status_code, 400)
        self.assertIn("header signature", res.json()["detail"].lower())

    def test_04_csv_export_endpoint(self):
        """Verifies that /reports/export/csv returns valid CSV containing all 7 subsidiaries."""
        res = self.client.get("/reports/export/csv")
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/csv", res.headers["content-type"])
        text = res.text
        self.assertIn("Subsidiary Performance Matrix", text)
        self.assertIn("MCL", text)
        self.assertIn("SECL", text)
        self.assertIn("781.06", text)
        self.assertIn("Historical Multi-Year Trajectory", text)

    def test_05_bilingual_hindi_intent_and_keyword_translation(self):
        """Verifies that Hindi and Hinglish queries are detected and mapped to English domain keywords."""
        # Devanagari Hindi
        res_hi = classify_intent("कोयला उत्पादन 2024-25 कितना था?")
        self.assertEqual(res_hi["language"], "HINDI")
        self.assertIn("coal", res_hi["extracted_search_terms"])
        self.assertIn("production", res_hi["extracted_search_terms"])
        self.assertEqual(res_hi["intent"], "NUMERICAL_FACT")

        # Hinglish query
        res_hinglish = classify_intent("MCL ka coal utpadan kitna tha?")
        self.assertEqual(res_hinglish["language"], "HINGLISH")
        self.assertIn("production", res_hinglish["extracted_search_terms"])

    def test_06_dgms_statutory_compliance_endpoint(self):
        """Verifies that /analytics/dgms-compliance returns statutory CMR 2017 audits."""
        res = self.client.get("/analytics/dgms-compliance")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "COMPLIANT_WITH_MONITORED_ACTIONS")
        self.assertGreaterEqual(len(data["audits"]), 5)
        params = [a["parameter"] for a in data["audits"]]
        regulations = [a["regulation"] for a in data["audits"]]
        self.assertTrue(any("Continuous Environmental Monitoring" in p for p in params))
        self.assertTrue(any("Fatal" in p for p in params) or any("Fatality Rate" in r for r in regulations))



if __name__ == "__main__":
    unittest.main()
