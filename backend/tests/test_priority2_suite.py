"""
CoalIntel Priority 2 Automated Test Suite
Smart India Hackathon 2026 - Problem Statement SIH26023

Tests:
1. Mining KPI Extraction & Subsidiary Coverage (MCL, SECL, NCL, CCL, WCL, ECL, BCCL)
2. Multi-Dimensional Historical & Category Filtering
3. Subsidiary Production Rankings (#1 MCL)
4. KPI Executive Summary & Aggregation
5. Multi-Subsidiary Cross-Document Comparison (/comparison/subsidiaries)
6. Year-over-Year (YoY) Multi-Period Analysis (/analytics/yoy-analysis)
7. Natural Language Analytics Query Execution (/analytics/query via local Qwen3:1.7B)
"""

import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from services.kpi_extractor import get_mining_kpis, get_subsidiary_ranking, get_kpi_summary_stats
from services.comparison import compare_subsidiaries, get_yoy_analysis
from services.rag import generate_analytics_answer


class TestCoalIntelPriority2Suite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_subsidiary_kpi_coverage(self):
        """Test that all 7 major CIL coal-producing subsidiaries are present in KPIs."""
        kpis = get_mining_kpis()
        self.assertGreaterEqual(len(kpis), 20)

        entities_found = set(k["entity"] for k in kpis)
        required_subs = {"MCL", "SECL", "NCL", "CCL", "WCL", "ECL", "BCCL"}
        for sub in required_subs:
            self.assertIn(sub, entities_found, f"Missing subsidiary KPI for {sub}")

        # Check MCL production
        mcl_kpis = [k for k in kpis if k["entity"] == "MCL" and k["category"] == "Production"]
        self.assertGreater(len(mcl_kpis), 0)
        self.assertEqual(mcl_kpis[0]["value"], 225.17)
        self.assertEqual(mcl_kpis[0]["unit"], "MT")

    def test_02_historical_and_category_filtering(self):
        """Test multi-dimensional filtering by category, entity, and year."""
        # 1. Category Filter
        res_prod = self.client.get("/analytics/kpis?category=Production")
        self.assertEqual(res_prod.status_code, 200)
        prod_kpis = res_prod.json()["kpis"]
        self.assertTrue(all(k["category"] == "Production" for k in prod_kpis))

        # 2. Entity Filter
        res_secl = self.client.get("/analytics/kpis?entity=SECL")
        self.assertEqual(res_secl.status_code, 200)
        secl_kpis = res_secl.json()["kpis"]
        self.assertTrue(all("SECL" in k["entity"] for k in secl_kpis))

        # 3. Year Filter
        res_year = self.client.get("/analytics/kpis?year=2024-25")
        self.assertEqual(res_year.status_code, 200)
        year_kpis = res_year.json()["kpis"]
        self.assertTrue(all("2024-25" in k["year"] for k in year_kpis))

    def test_03_subsidiary_rankings(self):
        """Test subsidiary production ranking leaderboard."""
        res = self.client.get("/analytics/rankings?metric=production&year=2024-25")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        rankings = data["rankings"]
        self.assertGreaterEqual(len(rankings), 7)

        # MCL must be #1, SECL #2, NCL #3
        self.assertEqual(rankings[0]["rank"], 1)
        self.assertEqual(rankings[0]["entity"], "MCL")
        self.assertEqual(rankings[0]["value"], 225.17)

        self.assertEqual(rankings[1]["rank"], 2)
        self.assertEqual(rankings[1]["entity"], "SECL")

        self.assertEqual(rankings[2]["rank"], 3)
        self.assertEqual(rankings[2]["entity"], "NCL")

    def test_04_kpi_summary_stats(self):
        """Test executive aggregated KPI analytics endpoint."""
        res = self.client.get("/analytics/summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["all_india_production_mt"], 1047.52)
        self.assertEqual(data["cil_production_mt"], 781.06)
        self.assertEqual(data["cil_dispatch_mt"], 762.83)
        self.assertEqual(data["cmpdi_pbt_crore"], 882.14)
        self.assertEqual(data["cil_fatality_rate_per_mt"], 0.03)
        self.assertEqual(data["top_producing_subsidiary"]["entity"], "MCL")

    def test_05_multi_subsidiary_comparison(self):
        """Test cross-document subsidiary comparison matrix endpoint."""
        # All subsidiaries
        res_all = self.client.get("/comparison/subsidiaries")
        self.assertEqual(res_all.status_code, 200)
        data_all = res_all.json()
        self.assertEqual(data_all["subsidiaries_count"], 7)

        # Filtered subsidiaries
        res_filtered = self.client.get("/comparison/subsidiaries?subsidiaries=MCL,SECL,NCL")
        self.assertEqual(res_filtered.status_code, 200)
        data_filtered = res_filtered.json()
        self.assertEqual(data_filtered["subsidiaries_count"], 3)
        entities = [s["entity"] for s in data_filtered["subsidiaries"]]
        self.assertIn("MCL", entities)
        self.assertIn("SECL", entities)
        self.assertIn("NCL", entities)

    def test_06_yoy_multi_period_analysis(self):
        """Test comprehensive Year-over-Year (YoY) operational analysis."""
        res = self.client.get("/analytics/yoy-analysis")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total_metrics"], 5)

        categories = set(m["category"] for m in data["metrics"])
        self.assertIn("Production", categories)
        self.assertIn("Dispatch", categories)
        self.assertIn("Safety", categories)
        self.assertIn("Financial", categories)

        # Verify CIL production metric in YoY
        cil_m = next(m for m in data["metrics"] if "Coal India Limited" in m["metric"])
        self.assertEqual(cil_m["fy_2024_25"], 781.06)
        self.assertEqual(cil_m["trend"], "UP")
        self.assertIn("Coal & Lignite Production Report", cil_m["source"])

    def test_07_natural_language_analytics_query(self):
        """Test POST /analytics/query generating structured analytical brief via local Ollama."""
        query_payload = {
            "query": "Compare CIL coal production and coal dispatch in FY 2024-25"
        }
        res = self.client.post("/analytics/query", json=query_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["intent"], "ANALYTICS")
        self.assertIn("answer", data)
        self.assertGreater(len(data["answer"]), 50)
        self.assertGreaterEqual(data["confidence"], 0.70)
        self.assertIn("latency", data)
        self.assertIn("sources", data)
        print(f"\n[ANALYTICS QUERY BRIEF]:\n{data['answer'][:250]}...\n")


if __name__ == "__main__":
    unittest.main()
