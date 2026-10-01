import unittest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from database.mongodb import (
    documents_collection,
    chunks_collection,
    conversations_collection,
    search_history_collection
)
from services.mining_knowledge import (
    get_mining_glossary,
    get_safety_rules,
    compute_production_vs_dispatch,
    compare_coal_producers,
    extract_verified_document_statistics,
    summarize_mining_report
)

client = TestClient(app)


class TestPlatformTransformation(unittest.TestCase):
    """
    Comprehensive test suite verifying the 25 transformation features:
    Core document intelligence, conversation history, multi-tier RAG,
    and mining-specific decision-support tools.
    """

    def test_01_health_and_document_status(self):
        """Feature 11 & 13: System health, document status and metadata check."""
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data.get("status"), ["healthy", "ok"])
        self.assertTrue(data.get("database_connected"))
        self.assertGreater(data.get("indexed_chunks", 0), 0)
        self.assertIn(data.get("llm_model"), ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite", "qwen3:1.7b"])

    def test_02_document_management_and_duplicate_detection(self):
        """Feature 10 & 12: Verify document listing, hash, and duplicate detection API."""
        response = client.get("/documents")
        self.assertEqual(response.status_code, 200)
        resp_data = response.json()
        docs = resp_data.get("documents", []) if isinstance(resp_data, dict) else resp_data
        self.assertIsInstance(docs, list)
        self.assertGreater(len(docs), 0)
        for doc in docs:
            self.assertIn("filename", doc)
            self.assertIn("content_hash", doc)
            self.assertIn("organization", doc)
            self.assertIn("fiscal_year", doc)

        # Check duplicate check endpoint
        sample_hash = docs[0].get("content_hash", "")
        if sample_hash:
            dup_res = client.get(f"/documents/check-duplicate?content_hash={sample_hash}")
            self.assertEqual(dup_res.status_code, 200)
            self.assertTrue(dup_res.json().get("exists"))

    def test_03_enhanced_chunk_metadata(self):
        """Feature 14 & 25: Verify chunk metadata includes character_count, token_estimate, org, year, and table flag."""
        chunk = chunks_collection.find_one()
        self.assertIsNotNone(chunk, "At least one chunk must exist in MongoDB")
        self.assertIn("document_name", chunk)
        self.assertIn("page_number", chunk)
        self.assertIn("chunk_index", chunk)
        self.assertIn("character_count", chunk)
        self.assertIn("token_estimate", chunk)
        self.assertIn("organization", chunk)
        self.assertIn("fiscal_year", chunk)
        self.assertIn("is_table", chunk)

    def test_04_multi_doc_search_with_filters_and_history(self):
        """Features 1, 5, 6, 7, 9: Hybrid multi-doc search with category, org, fiscal_year, and search history."""
        payload = {
            "query": "coal production FY 2024-25 CIL",
            "top_k": 3,
            "organization": "CIL",
            "fiscal_year": "2024-25"
        }
        response = client.post("/query/search", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertGreater(len(data["results"]), 0)

        # Verify search history logging
        history_entry = search_history_collection.find_one(
            {"query": "coal production FY 2024-25 CIL"},
            sort=[("created_at", -1)]
        )
        self.assertIsNotNone(history_entry)
        self.assertEqual(history_entry.get("organization"), "CIL")

        # Test search history API
        hist_res = client.get("/query/search/history")
        self.assertEqual(hist_res.status_code, 200)
        self.assertGreater(hist_res.json().get("count", 0), 0)

    def test_05_conversation_history_persistence(self):
        """Feature 8: Multi-turn conversation sessions and message persistence."""
        test_session_id = "test-session-sih-2026"
        # 1. Ask a question with session_id
        req = {
            "question": "What is CIL's total coal dispatch?",
            "session_id": test_session_id,
            "organization": "CIL"
        }
        res = client.post("/query", json=req)
        self.assertEqual(res.status_code, 200)
        resp_data = res.json()
        self.assertIn("answer", resp_data)

        # 2. Retrieve conversation sessions list
        sessions_res = client.get("/query/conversations")
        self.assertEqual(sessions_res.status_code, 200)
        convs = sessions_res.json().get("conversations", [])
        session_list = [c.get("session_id") for c in convs]
        self.assertIn(test_session_id, session_list)

        # 3. Retrieve conversation message history for this session
        msg_res = client.get(f"/query/conversations/{test_session_id}")
        self.assertEqual(msg_res.status_code, 200)
        messages = msg_res.json().get("messages", [])
        self.assertGreater(len(messages), 0)
        self.assertEqual(messages[0].get("role"), "user")

    def test_06_three_tier_separation_in_rag(self):
        """Distinguish factual info, model explanation, and calculated values."""
        req = {
            "question": "Compare CIL coal production and dispatch in FY 2024-25"
        }
        res = client.post("/query", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        # Check that the 3-tier fields exist
        self.assertIn("factual_evidence", data)
        self.assertIn("model_explanation", data)
        self.assertIn("calculated_metrics", data)
        self.assertIn("sources", data)

        # Evidence must have document and page citations
        if data["factual_evidence"]:
            first_fact = data["factual_evidence"][0]
            self.assertIn("source_document", first_fact)
            self.assertIn("page_number", first_fact)

    def test_07_mining_glossary_system(self):
        """Feature 21: Mining terminology / explanation system with statutory references."""
        # 1. Full glossary
        res = client.get("/mining/glossary")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data.get("count", 0), 20)

        # 2. Query specific term 'OMS'
        oms_res = client.get("/mining/glossary/OMS")
        self.assertEqual(oms_res.status_code, 200)
        oms_data = oms_res.json()
        self.assertEqual(oms_data.get("term"), "OMS")
        self.assertIn("statutory_ref", oms_data)
        self.assertIn("hindi_term", oms_data)

    def test_08_mine_safety_rules_retrieval(self):
        """Features 20 & 22: Mine safety assistant and CMR 2017 safety rule retrieval."""
        res = client.get("/mining/safety-rules")
        self.assertEqual(res.status_code, 200)
        rules = res.json().get("rules", [])
        self.assertGreater(len(rules), 0)

        # Search for ventilation rule
        vent_res = client.get("/mining/safety-rules?query=ventilation")
        self.assertEqual(vent_res.status_code, 200)
        vent_rules = vent_res.json().get("rules", [])
        self.assertGreater(len(vent_rules), 0)
        self.assertTrue(any("129" in r.get("reg_no", "") or "Ventilation" in r.get("title", "") for r in vent_rules))

    def test_09_production_vs_dispatch_calculator(self):
        """Features 15, 16, 17, 18: Coal production vs dispatch and pithead inventory accretion calculation."""
        res = client.get("/mining/production-vs-dispatch")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("national_production_mt"), 1047.52)
        self.assertEqual(data.get("national_dispatch_mt"), 1025.33)
        self.assertEqual(data.get("net_pithead_inventory_accretion_mt"), 22.19)
        self.assertIn("derived_formula", data)
        self.assertIn("comparison_table", data)
        self.assertIn("source_citation", data)

    def test_10_producer_comparison_matrix(self):
        """Feature 19: CIL vs SCCL vs Captive/Commercial multi-producer comparison matrix."""
        res = client.get("/mining/producers-comparison")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("matrix", data)
        self.assertIn("summary", data)
        self.assertIn("source", data)
        matrix = data["matrix"]
        self.assertGreater(len(matrix), 3)

    def test_11_extracted_verified_statistics(self):
        """Features 24 & 25: Automatic extraction of verified numerical stats with table awareness."""
        res = client.get("/mining/extracted-statistics")
        self.assertEqual(res.status_code, 200)
        stats = res.json().get("statistics", [])
        self.assertGreater(len(stats), 5)
        for s in stats:
            self.assertIn("metric", s)
            self.assertIn("value", s)
            self.assertIn("document_name", s)
            self.assertIn("page_number", s)
            self.assertIn("is_table", s)
            self.assertIn("confidence", s)

    def test_12_mining_report_summarization(self):
        """Feature 23: Mining report structured summarizer (Executive, Operational, Safety, Financial)."""
        # Test summarizer service
        summary = summarize_mining_report("Coal & Lignite Production Report 2025-26.pdf")
        self.assertIn("executive_summary", summary)
        self.assertIn("operational_highlights", summary)
        self.assertIn("sections", summary)
        self.assertIn("key_takeaways", summary)
        self.assertIn("executive_summary", summary["sections"])
        self.assertIn("operational_highlights", summary["sections"])
        self.assertIn("safety_and_compliance", summary["sections"])


if __name__ == "__main__":
    unittest.main()
