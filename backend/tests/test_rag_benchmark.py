"""
CoalIntel RAG Pipeline Benchmark Test Suite
Smart India Hackathon 2026 - Problem Statement SIH26023

Tests all 5 mandatory benchmark evaluation queries:
1. CIL coal dispatch FY 2024-25 (762.83 MT, Page 4)
2. India's coal production (1025.33 MT / 997.25 MT, Page 3-4)
3. Coal mine safety (22 fatal accidents, 25 fatalities, 0.03 fatality rate, Page 21)
4. CMPDI-related information (438 line km 2D seismic surveys, Page 15)
5. Out-of-domain unanswerable question ("Insufficient evidence was found in the indexed documents.")

Also verifies:
- Table linearization for multi-column PDF tables
- Exact source, page number, chunk index, and relevance score citations
- Anti-hallucination guarantee (0 false citations for unanswerable questions)
"""

import sys
import unittest
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.rag import generate_grounded_answer, linearize_chunk_text, INSUFFICIENT_EVIDENCE_MSG
from services.hybrid_search import hybrid_search, keyword_search


class TestRagBenchmark(unittest.TestCase):

    def test_01_cil_coal_dispatch(self):
        """Benchmark 1: CIL coal dispatch FY 2024-25 must cite 762.83 MT from Page 4."""
        query = "What was CIL coal dispatch in FY 2024-25?"
        res = generate_grounded_answer(query, top_k=5)

        self.assertEqual(res["status"], "success")
        self.assertIn("762.83", res["answer"])
        self.assertGreaterEqual(res["confidence"], 0.85)

        # Citations check
        self.assertGreater(len(res["sources"]), 0)
        top_source = res["sources"][0]
        self.assertIn("Coal & Lignite Production Report", top_source["filename"])
        self.assertEqual(top_source["page_number"], 4)
        self.assertGreaterEqual(top_source["relevance_score"], 0.80)
        self.assertIn("chunk_index", top_source)

    def test_02_india_coal_production(self):
        """Benchmark 2: India's coal production must cite official production/dispatch figures."""
        query = "What was India's total coal production in FY 2024-25?"
        res = generate_grounded_answer(query, top_k=5)

        self.assertEqual(res["status"], "success")
        # Should cite either 1025.33 MT (dispatch/production) or 997.25 MT (prov)
        has_expected_figure = ("1025.33" in res["answer"]) or ("997.25" in res["answer"]) or ("1025" in res["answer"])
        self.assertTrue(has_expected_figure, f"Expected production figure not found in: {res['answer']}")
        self.assertGreaterEqual(res["confidence"], 0.85)

        # Citations check
        self.assertGreater(len(res["sources"]), 0)
        doc_names = [s["filename"] for s in res["sources"]]
        self.assertTrue(any("Coal & Lignite Production Report" in name for name in doc_names))

    def test_03_coal_mine_safety(self):
        """Benchmark 3: Coal mine safety in CIL mines during 2024 must cite Table 2 Page 21."""
        query = "What were the fatal accidents and fatality rate in CIL mines during 2024?"
        res = generate_grounded_answer(query, top_k=5)

        self.assertEqual(res["status"], "success")
        # 2024 official DGMS stats: 22 fatal accidents, 25 fatalities, 0.03 fatality rate per MT
        has_stats = ("22" in res["answer"]) and ("0.03" in res["answer"] or "25" in res["answer"])
        self.assertTrue(has_stats, f"Safety metrics (22 fatal accidents / 0.03 rate) not found in: {res['answer']}")
        self.assertGreaterEqual(res["confidence"], 0.85)

        # Verify exact source citation
        self.assertGreater(len(res["sources"]), 0)
        top_source = res["sources"][0]
        self.assertIn("Safety in Coal Mines Report", top_source["filename"])
        self.assertEqual(top_source["page_number"], 21)

    def test_04_cmpdi_related_information(self):
        """Benchmark 4: CMPDI exploration must cite 438 line km 2D seismic exploration from Page 15."""
        query = "What was CMPDI's 2D seismic exploration progress in 2024-25?"
        res = generate_grounded_answer(query, top_k=5)

        self.assertEqual(res["status"], "success")
        self.assertIn("438", res["answer"])
        self.assertGreaterEqual(res["confidence"], 0.85)

        # Verify exact CMPDIL source citation
        self.assertGreater(len(res["sources"]), 0)
        top_source = res["sources"][0]
        self.assertIn("CMPDIL_Annual_Report", top_source["filename"])
        self.assertEqual(top_source["page_number"], 15)

    def test_05_unanswerable_out_of_domain(self):
        """Benchmark 5: Out-of-domain query must return exact rejection with 0 false citations."""
        query = "What was the total copper export of Argentina in 1890?"
        res = generate_grounded_answer(query, top_k=5)

        self.assertEqual(res["status"], "insufficient_evidence")
        self.assertEqual(res["answer"], INSUFFICIENT_EVIDENCE_MSG)
        self.assertEqual(len(res["sources"]), 0)  # Zero false citations!
        self.assertEqual(res["evidence"], "None")
        self.assertGreaterEqual(res["confidence"], 0.90)

    def test_06_table_linearization(self):
        """Test that linearize_chunk_text converts vertically-interleaved table lines into markdown tables."""
        raw_vertical_table = (
            "SN\nParameters\n2025\n2024\n"
            "1\nNumber of fatal accidents\n25\n22\n"
            "2\nNumber of fatalities\n32\n25\n"
            "5\nFatality Rate per Mte. of coal production\n0.05\n0.03\n"
        )
        linearized = linearize_chunk_text(raw_vertical_table)

        self.assertIn("| SN | Parameters | 2025 | 2024 |", linearized)
        self.assertIn("| 1 | Number of fatal accidents | 25 | 22 |", linearized)
        self.assertIn("| 2 | Number of fatalities | 32 | 25 |", linearized)
        self.assertIn("Summary:", linearized)

    def test_07_keyword_search_stopword_filtering(self):
        """Test that keyword search correctly suppresses stop words and matches content words."""
        # Non-mining query with zero matching content words should produce 0 keyword results
        non_matching = keyword_search("pterodactyl ornithology xenomorph", top_k=5)
        self.assertEqual(len(non_matching), 0)

        # In-domain query should produce high-scoring results
        in_domain = keyword_search("CIL coal dispatch 2024-25", top_k=5)
        self.assertGreater(len(in_domain), 0)
        self.assertGreaterEqual(in_domain[0]["normalized_keyword_score"], 0.50)


if __name__ == "__main__":
    unittest.main()
