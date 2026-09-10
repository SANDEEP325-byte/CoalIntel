"""
CoalIntel Comprehensive Automated Test Suite
Smart India Hackathon 2026 - Problem Statement SIH26023
"AI-Powered Geological, Mining and other Reporting Solution for CMPDI/CIL subsidiaries"

Tests:
1. System Health & Database Connection
2. Batch Embeddings (384-dim normalized)
3. Page-Aware Chunking & Table Preservation
4. Hybrid Search (Dense Vector + Full-Text RRF)
5. Multi-Factor Confidence Scoring
6. Grounded RAG with Page Citations (CIL Coal Dispatch FY 2024-25 -> 762.83 MT)
7. Strict Anti-Hallucination Policy (Out-of-domain query rejection)
8. KPI Extraction & Data Lineage Traceability
9. Cross-Document Contradiction Detection
10. 9-Section Report Generation & Microsoft Word (.docx) Export
11. Parliamentary Q&A Secretariat Briefing
12. Mining Topics, Word Cloud, and Timeline
"""

import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from database.mongodb import check_database_connection, chunks_collection
from services.embedding import generate_embeddings_batch, generate_embedding
from services.confidence import calculate_confidence
from services.rag import generate_grounded_answer
from services.hybrid_search import hybrid_search
import numpy as np


class TestCoalIntelSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db_connected = check_database_connection()
        print(f"\n[SETUP] Database connected: {cls.db_connected}")

    def test_01_health_and_status(self):
        """Test system health and API status endpoints."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["database_connected"])
        self.assertGreater(data["indexed_chunks"], 1000)

        res_status = self.client.get("/api/status")
        self.assertEqual(res_status.status_code, 200)
        status_data = res_status.json()
        self.assertEqual(status_data["sih_problem_statement"], "SIH26023")
        self.assertEqual(status_data["llm_model"], "Ollama / qwen3:1.7b")

    def test_02_batch_embeddings(self):
        """Test batch embedding generation for 384-dim vectors."""
        texts = [
            "Coal India Limited raw coal production reached 781.06 MT.",
            "CMPDI completed 438 line km of 2D seismic exploration survey.",
            "Safety in coal mines: zero fatal accidents in underground operations."
        ]
        embeddings = generate_embeddings_batch(texts, batch_size=32)
        self.assertEqual(len(embeddings), 3)
        for emb in embeddings:
            self.assertEqual(len(emb), 384)
            norm = np.linalg.norm(emb)
            # Embeddings should be unit normalized
            self.assertAlmostEqual(norm, 1.0, places=3)

    def test_03_hybrid_search(self):
        """Test hybrid search combining vector similarity and text search."""
        results = hybrid_search("coal dispatch 762.83", top_k=5)
        self.assertGreater(len(results), 0)
        top = results[0]
        self.assertIn("page_number", top)
        self.assertIn("document_name", top)
        self.assertTrue("hybrid_score" in top or "semantic_score" in top)
        # Check that page 4 of the production report is retrieved
        found_page_4 = any(
            r.get("page_number") == 4 and "Production" in r.get("document_name", "")
            for r in results
        )
        self.assertTrue(found_page_4, "Expected Page 4 of Coal & Lignite Production report in top hybrid results")

    def test_04_confidence_engine(self):
        """Test multi-factor confidence scoring calculation."""
        # High match test
        retrieved_chunks = [
            {
                "hybrid_score": 0.85,
                "text": "Coal dispatch of Coal India Limited in 2024-25 was 762.83 MT.",
                "page_number": 4,
                "document_name": "Coal & Lignite Production Report 2025-26.pdf"
            }
        ]
        conf_score, conf_level, conf_details = calculate_confidence(
            question="What was CIL coal dispatch in 2024-25?",
            answer="In FY 2024-25, Coal India Limited achieved a coal dispatch of 762.83 MT.",
            sources=retrieved_chunks,
        )
        self.assertGreaterEqual(conf_score, 0.70)
        self.assertIn(conf_level, ["HIGH", "MEDIUM"])

        # Insufficient evidence test
        conf_score_low, conf_level_low, _ = calculate_confidence(
            question="Unknown query",
            answer="Insufficient evidence was found in the indexed documents.",
            sources=[],
        )
        self.assertGreaterEqual(conf_score_low, 0.80)
        self.assertEqual(conf_level_low, "HIGH")

    def test_05_grounded_rag_dispatch(self):
        """Test grounded RAG answering CIL dispatch accurately (762.83 MT)."""
        query = "What was CIL's coal dispatch in FY 2024-25?"
        rag_output = generate_grounded_answer(query)
        answer = rag_output["answer"]
        print(f"\n[RAG DISPATCH ANSWER]: {answer[:160]}...")
        
        # Verify accurate metric
        self.assertIn("762.83", answer)
        self.assertGreater(len(rag_output["sources"]), 0)
        top_source = rag_output["sources"][0]
        self.assertEqual(top_source["page_number"], 4)
        self.assertIn("Production Report", top_source["filename"])
        self.assertGreaterEqual(rag_output["confidence"], 0.70)

    def test_06_anti_hallucination_out_of_domain(self):
        """Test that out-of-domain queries are rejected with zero hallucination."""
        query = "What was the total gold and diamond production of Australia in 1850?"
        rag_output = generate_grounded_answer(query)
        answer = rag_output["answer"]
        print(f"\n[ANTI-HALLUCINATION ANSWER]: {answer}")
        
        self.assertIn("Insufficient evidence was found in the indexed documents.", answer)

    def test_07_kpis_and_data_lineage(self):
        """Test KPI extraction endpoint and data provenance lineage."""
        res = self.client.get("/analytics/kpis")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total_kpis"], 5)
        
        # Test specific KPI
        kpi_map = {k["metric_id"]: k for k in data["kpis"]}
        self.assertIn("kpi_dispatch_cil_2024_25", kpi_map)
        self.assertEqual(kpi_map["kpi_dispatch_cil_2024_25"]["value"], 762.83)
        self.assertEqual(kpi_map["kpi_dispatch_cil_2024_25"]["unit"], "MT")

        # Test Lineage
        res_lineage = self.client.get("/analytics/lineage/kpi_dispatch_cil_2024_25")
        self.assertEqual(res_lineage.status_code, 200)
        lineage = res_lineage.json()
        self.assertEqual(lineage["metric_id"], "kpi_dispatch_cil_2024_25")
        self.assertEqual(lineage["provenance"]["page_number"], 4)
        self.assertIn("762.83", lineage["provenance"]["verbatim_text"])

    def test_08_contradiction_detection(self):
        """Test cross-document contradiction and data anomaly detection."""
        res = self.client.get("/analytics/contradictions")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total_discrepancies_found"], 1)
        disc = data["discrepancies"][0]
        # Verify the 773.64 vs 773.65 MT discrepancy is detected
        self.assertIn("773.64", disc["source_a"]["value"])
        self.assertIn("773.65", disc["source_b"]["value"])
        self.assertIn("LOW", disc["severity"])

    def test_09_cil_cmpdi_comparison(self):
        """Test CIL vs CMPDI operational comparison matrix."""
        res = self.client.get("/comparison/cil-cmpdi?fiscal_year=2024-25")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("matrix", data)
        self.assertGreaterEqual(len(data["matrix"]), 4)
        m0 = data["matrix"][0]
        self.assertIn("dimension", m0)
        self.assertIn("cil", m0)
        self.assertIn("cmpdi", m0)
        self.assertIn("analytical_summary", data)

    def test_10_structured_report_generation_and_docx(self):
        """Test 9-section report generation and Word document export."""
        res_report = self.client.post("/reports/generate", json={"report_type": "Executive Mining Intelligence Brief"})
        self.assertEqual(res_report.status_code, 200)
        report_data = res_report.json()
        self.assertEqual(report_data["sections_count"], 9)
        self.assertIn("sections", report_data)

        # Test DOCX Export
        res_docx = self.client.get("/reports/export-docx")
        self.assertEqual(res_docx.status_code, 200)
        self.assertEqual(
            res_docx.headers.get("content-type"), 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        self.assertGreater(len(res_docx.content), 1000)

    def test_11_parliamentary_qa(self):
        """Test Government of India Lok Sabha / Rajya Sabha parliamentary briefing."""
        payload = {"question": "What was Coal India Limited coal dispatch in FY 2024-25?"}
        res = self.client.post("/reports/parliamentary", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["parliamentary_header"]["ministry"], "GOVERNMENT OF INDIA - MINISTRY OF COAL")
        self.assertIn("official_statement", data)
        self.assertGreaterEqual(len(data["annexure_data"]), 1)
        has_dispatch = any("762.83" in str(ann.get("value", "")) for ann in data["annexure_data"]) or "762.83" in data["official_statement"]
        self.assertTrue(has_dispatch, "Expected 762.83 MT dispatch metric in parliamentary response")

    def test_12_topics_and_timeline(self):
        """Test mining domain topic distribution, word cloud, and historical timeline."""
        res_topics = self.client.get("/topics")
        self.assertEqual(res_topics.status_code, 200)
        topics_data = res_topics.json()
        self.assertGreaterEqual(len(topics_data["topics"]), 5)

        res_timeline = self.client.get("/topics/timeline")
        self.assertEqual(res_timeline.status_code, 200)
        timeline_data = res_timeline.json()
        self.assertGreaterEqual(timeline_data["count"], 5)


if __name__ == "__main__":
    unittest.main(verbosity=2)
