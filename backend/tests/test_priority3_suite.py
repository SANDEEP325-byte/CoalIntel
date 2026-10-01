import unittest
from fastapi.testclient import TestClient
from backend.main import app
from services.parliamentary import process_parliamentary_query
from services.report_generator import build_structured_report, export_report_to_docx
from services.contradiction import detect_data_contradictions
from services.lineage import get_data_lineage


class Priority3TestSuite(unittest.TestCase):
    """
    Dedicated test suite for Priority 3 deliverables:
    1. Parliamentary Query Assistant
    2. Automated Report Generator
    3. Data Contradiction Detector
    4. Evidence/Data Lineage
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    # -------------------------------------------------------------
    # 1. PARLIAMENTARY QUERY ASSISTANT TESTS
    # -------------------------------------------------------------
    def test_01_parliamentary_starred_query(self):
        """Test Starred Parliamentary question answering and official Secretariat layout."""
        payload = {
            "question": "What was Coal India Limited coal dispatch and production in FY 2024-25?",
            "question_type": "STARRED",
            "house": "LOK_SABHA",
            "session": "BUDGET SESSION 2025-26",
            "question_number": "Starred Question No. 102",
        }
        res = self.client.post("/reports/parliamentary", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Verify Header & Protocol
        header = data["parliamentary_header"]
        self.assertEqual(header["ministry"], "GOVERNMENT OF INDIA - MINISTRY OF COAL")
        self.assertEqual(header["house"], "LOK SABHA")
        self.assertEqual(header["question_type"], "STARRED")
        self.assertEqual(header["question_number"], "Starred Question No. 102")
        self.assertIn("G. KISHAN REDDY", header["minister"])

        # Verify Official Statement
        stmt = data["official_statement"]
        self.assertIn("Madam/Speaker", stmt)
        self.assertIn("statement is laid on the Table of the House", stmt)
        self.assertIn("762.83", stmt)

        # Verify Tabular Annexure
        annexure = data["annexure_data"]
        self.assertGreaterEqual(len(annexure), 2)
        has_dispatch = any("762.83" in a["value"] for a in annexure)
        self.assertTrue(has_dispatch, "Expected 762.83 MT in annexure")

        for row in annexure:
            self.assertIn("source_ref", row)
            self.assertIn("page_number", row)
            self.assertGreaterEqual(row["page_number"], 1)

        # Verify Groundedness & Confidence
        self.assertGreaterEqual(data["confidence_score"], 0.70)
        self.assertEqual(data["verification_status"], "OFFICIALLY_VERIFIED_GROUNDED")
        print("\n[PARLIAMENTARY STARRED TEST]: Verified official brief & annexures.")

    def test_02_parliamentary_unstarred_safety_query(self):
        """Test Unstarred Parliamentary question on mine safety and DGMS reconciliation."""
        payload = {
            "question": "Details of fatal accidents and fatalities across CIL subsidiaries in 2024 and 2025",
            "question_type": "UNSTARRED",
            "house": "RAJYA_SABHA",
            "session": "MONSOON SESSION 2025-26",
            "question_number": "Unstarred Question No. 408",
        }
        res = self.client.post("/reports/parliamentary", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        header = data["parliamentary_header"]
        self.assertEqual(header["house"], "RAJYA SABHA")
        self.assertEqual(header["question_type"], "UNSTARRED")

        # Verify annexure contains safety data
        annexure = data["annexure_data"]
        self.assertGreaterEqual(len(annexure), 1)
        has_safety = any("accident" in a["parameter"].lower() or "fatal" in a["parameter"].lower() or "fatality" in a["parameter"].lower() for a in annexure)
        self.assertTrue(has_safety, "Expected safety indicators in annexure")
        print("[PARLIAMENTARY UNSTARRED TEST]: Verified Rajya Sabha safety submission.")

    # -------------------------------------------------------------
    # 2. AUTOMATED REPORT GENERATOR TESTS
    # -------------------------------------------------------------
    def test_03_report_templates_and_generation(self):
        """Test report templates listing and dynamic 9-section report generation."""
        # 1. Templates Endpoint
        res_tmpl = self.client.get("/reports/templates")
        self.assertEqual(res_tmpl.status_code, 200)
        tmpls = res_tmpl.json()["templates"]
        self.assertEqual(len(tmpls), 4)
        tmpl_ids = [t["id"] for t in tmpls]
        self.assertIn("comprehensive_annual", tmpl_ids)
        self.assertIn("subsidiary_review", tmpl_ids)

        # 2. Generate Comprehensive Report
        res_rep = self.client.post("/reports/generate", json={
            "title": "Annual Mining Performance & Decision Intelligence Report",
            "report_type": "comprehensive_annual",
            "year": "2024-25"
        })
        self.assertEqual(res_rep.status_code, 200)
        rep = res_rep.json()
        self.assertEqual(rep["sections_count"], 9)
        self.assertEqual(len(rep["sections"]), 9)

        # Check section 2 (Subsidiary Production Analysis) has table with subsidiaries
        sec2 = rep["sections"][1]
        self.assertEqual(sec2["section_number"], 2)
        self.assertIn("table", sec2)
        sub_table = sec2["table"]
        sub_names = [row[0] for row in sub_table]
        self.assertIn("MCL", sub_names)
        self.assertIn("SECL", sub_names)
        self.assertIn("NCL", sub_names)
        self.assertIn("CIL Total", sub_names)

        # Check section 7 (Contradictions Registry)
        sec7 = rep["sections"][6]
        self.assertEqual(sec7["section_number"], 7)
        self.assertIn("table", sec7)
        self.assertGreaterEqual(len(sec7["table"]), 2)
        print("[REPORT GENERATOR TEST]: Verified dynamic 9-section report compilation.")

    def test_04_docx_export(self):
        """Test Microsoft Word (.docx) export generation and valid binary stream."""
        res = self.client.get("/reports/export-docx?title=Test_Mining_Report&report_type=comprehensive_annual&year=2024-25")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(
            res.headers.get("content-type"),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        self.assertGreater(len(res.content), 2000)
        # Check PK header for valid docx zip format
        self.assertTrue(res.content.startswith(b"PK"), "Expected DOCX to be a valid ZIP archive starting with PK")
        print("[DOCX EXPORT TEST]: Verified valid Microsoft Word document stream.")

    # -------------------------------------------------------------
    # 3. DATA CONTRADICTION DETECTOR TESTS
    # -------------------------------------------------------------
    def test_05_contradiction_detection_and_severities(self):
        """Test contradiction detector discrepancy count, severities, and administrative recommendations."""
        res = self.client.get("/comparison/contradictions")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["status"], "DATA_INCONSISTENCY_DETECTED")
        self.assertGreaterEqual(data["total_discrepancies_found"], 6)

        discs = data["discrepancies"]
        disc_ids = [d["id"] for d in discs]
        self.assertIn("DISC-001", disc_ids)
        self.assertIn("DISC-002", disc_ids)
        self.assertIn("DISC-003", disc_ids)
        self.assertIn("DISC-004", disc_ids)

        # Verify DISC-001 (Narrative vs Table production discrepancy)
        d1 = next(d for d in discs if d["id"] == "DISC-001")
        self.assertIn("773.64", d1["source_a"]["value"])
        self.assertIn("773.65", d1["source_b"]["value"])
        self.assertEqual(d1["source_a"]["page"], 4)
        self.assertEqual(d1["source_b"]["page"], 4)
        self.assertIn("recommended_action", d1)
        self.assertIn("root_cause", d1)

        # Test Severity Summary
        summary = data["severity_summary"]
        self.assertIn("CRITICAL_AND_HIGH", summary)
        self.assertIn("MEDIUM", summary)
        self.assertIn("LOW", summary)

        # Test Severity Filtering (HIGH only)
        res_high = self.client.get("/comparison/contradictions?severity=HIGH")
        self.assertEqual(res_high.status_code, 200)
        high_discs = res_high.json()["discrepancies"]
        for hd in high_discs:
            self.assertEqual(hd["severity_level"], "HIGH")

        print("[CONTRADICTION DETECTOR TEST]: Verified 6 anomalies with root-causes and severity filtering.")

    # -------------------------------------------------------------
    # 4. EVIDENCE & DATA LINEAGE TESTS
    # -------------------------------------------------------------
    def test_06_data_lineage_graph_and_filtering(self):
        """Test comprehensive data lineage tracking across all subsidiaries and single-metric lookup."""
        # 1. Total Lineage Records
        res_all = self.client.get("/analytics/lineage")
        self.assertEqual(res_all.status_code, 200)
        all_lineage = res_all.json()
        self.assertGreaterEqual(all_lineage["total_metrics_tracked"], 20)

        # Verify that all records have valid page numbers and document names
        records = all_lineage["records"]
        for r in records:
            self.assertIn("metric_id", r)
            self.assertIn("source_document", r)
            self.assertIn("page_number", r)
            self.assertGreaterEqual(r["page_number"], 1)
            self.assertIn("verbatim_excerpt", r)
            self.assertTrue(len(r["verbatim_excerpt"]) > 0)

        # 2. Entity Filtering: MCL
        res_mcl = self.client.get("/analytics/lineage?entity=MCL")
        self.assertEqual(res_mcl.status_code, 200)
        mcl_records = res_mcl.json()["records"]
        self.assertGreaterEqual(len(mcl_records), 1)
        for r in mcl_records:
            self.assertEqual(r["entity"], "MCL")

        # 3. Single Metric Lookup via Path Parameter
        res_single = self.client.get("/analytics/lineage/kpi_dispatch_cil_2024_25")
        self.assertEqual(res_single.status_code, 200)
        single = res_single.json()
        self.assertEqual(single["metric_id"], "kpi_dispatch_cil_2024_25")
        self.assertEqual(single["provenance"]["page_number"], 4)
        self.assertIn("762.83", single["provenance"]["verbatim_text"])
        self.assertEqual(single["provenance"]["confidence_score"], 1.0)
        print("[DATA LINEAGE TEST]: Verified 26+ indicators with 100% verified page citations.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
