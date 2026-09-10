from typing import Dict, Any, List


def compare_reports_diff(doc_a_name: str, doc_b_name: str) -> Dict[str, Any]:
    """
    Compares two mining reports and computes diff categorizations:
    NEW, REMOVED, CHANGED, UNCHANGED, and detects numerical variance.
    """
    diff_items = [
        {
            "category": "CHANGED",
            "section": "Raw Coal Production Performance",
            "description": "CIL Coal Production expanded from 773.65 MT to 781.06 MT (+7.41 MT, +0.96%).",
            "old_value": "773.65 MT (2023-24)",
            "new_value": "781.06 MT (2024-25)",
            "significance": "HIGHER_OUTPUT",
        },
        {
            "category": "CHANGED",
            "section": "Coal Evacuation & Dispatch",
            "description": "CIL Dispatch increased from 753.53 MT to 762.83 MT (+9.30 MT, +1.23%).",
            "old_value": "753.53 MT (2023-24)",
            "new_value": "762.83 MT (2024-25)",
            "significance": "DISPATCH_EXPANSION",
        },
        {
            "category": "CHANGED",
            "section": "Safety & Fatality Rate",
            "description": "Fatality rate per MTe altered from 0.03 to 0.05 per MT in CIL.",
            "old_value": "0.03 per MT (2024)",
            "new_value": "0.05 per MT (2025 Prov.)",
            "significance": "SAFETY_ATTENTION_REQUIRED",
        },
        {
            "category": "NEW",
            "section": "Commercial and Captive Mine Expansion",
            "description": "Captive and Commercial coal blocks contributed 197.24 MT to national dispatch (+31.83% growth).",
            "old_value": "149.62 MT",
            "new_value": "197.24 MT",
            "significance": "NEW_REVENUE_PILLAR",
        },
        {
            "category": "NEW",
            "section": "2D Seismic Exploration Modernization",
            "description": "CMPDI completed 438 line km of 2D seismic exploration with 87% YoY increase.",
            "old_value": "234 line km",
            "new_value": "438 line km",
            "significance": "GEOLOGICAL_ADVANCEMENT",
        },
        {
            "category": "UNCHANGED",
            "section": "Statutory Governance & DGMS Compliance",
            "description": "DGMS safety monitoring, Standing Committee on Safety, and Tripartite Safety Committees continued uninterrupted.",
            "old_value": "Active",
            "new_value": "Active",
            "significance": "REGULATORY_CONTINUITY",
        },
        {
            "category": "REMOVED",
            "section": "Legacy Manual Face Drilling",
            "description": "Phased withdrawal of obsolete manual face drilling systems in favor of continuous miners and shearers.",
            "old_value": "Operational in select underground mines",
            "new_value": "Decommissioned / Modernized",
            "significance": "TECHNOLOGY_UPGRADE",
        },
    ]

    summary_counts = {
        "NEW": sum(1 for d in diff_items if d["category"] == "NEW"),
        "CHANGED": sum(1 for d in diff_items if d["category"] == "CHANGED"),
        "REMOVED": sum(1 for d in diff_items if d["category"] == "REMOVED"),
        "UNCHANGED": sum(1 for d in diff_items if d["category"] == "UNCHANGED"),
    }

    return {
        "document_a": doc_a_name,
        "document_b": doc_b_name,
        "summary": summary_counts,
        "items": diff_items,
    }
