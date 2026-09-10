from typing import List, Dict, Any, Optional


def get_historical_timeline(year_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Returns verified chronological timeline of mining milestones, production records,
    and policy shifts from 1975 to 2025-26.
    """
    events = [
        {
            "year": "1975",
            "period": "November 1975",
            "title": "Establishment of Coal India Limited (CIL)",
            "category": "Corporate Milestone",
            "description": "CIL formed as an organized state-owned mining corporate following government takeover of private mines, producing 79 MT in its inception year.",
            "source": "CIL Annual Report 2024-25 (p. 3)",
            "impact": "Foundation of nationalized organized coal production in India.",
        },
        {
            "year": "2019-20",
            "period": "FY 2019-20",
            "title": "CIL PBT Reaches Rs. 24,071.32 Crore",
            "category": "Financial",
            "description": "Consolidated CIL Profit Before Tax reached Rs. 24,071.32 Crore; overall demand for steel and power expanded.",
            "source": "CIL Annual Report 2024-25 (p. 15)",
            "impact": "Established sustained profitability threshold for dividend payouts.",
        },
        {
            "year": "2020-21",
            "period": "FY 2020-21",
            "title": "Resilience During Global Pandemic",
            "category": "Operational",
            "description": "CIL achieved Rs. 18,009.24 Crore PBT; supply to essential critical thermal plants maintained uninterrupted.",
            "source": "CIL Annual Report 2024-25 (p. 15)",
            "impact": "Demonstrated national energy security capability under supply chain disruptions.",
        },
        {
            "year": "2021-22",
            "period": "FY 2021-22",
            "title": "Post-Pandemic Demand Surge & Rebound",
            "category": "Market Demand",
            "description": "Power sector coal consumption jumped to 673.35 MT; CIL PBT recovered sharply to Rs. 23,616.28 Crore.",
            "source": "Coal & Lignite Production Report 2025-26 (p. 3)",
            "impact": "Triggered rapid capacity augmentation plans for 1 Billion Ton target.",
        },
        {
            "year": "2022-23",
            "period": "FY 2022-23",
            "title": "All-India Production Crosses 893 MT",
            "category": "Production",
            "description": "All-India coal production reached 893.19 MT; CIL dispatched 694.54 MT with fatality rate dropping to 0.04.",
            "source": "Coal & Lignite Production Report 2025-26 (p. 4)",
            "impact": "Major leap in domestic production capacity.",
        },
        {
            "year": "2023-24",
            "period": "FY 2023-24",
            "title": "Historic Coal Production Milestone (997.25 MT)",
            "category": "Production",
            "description": "Country witnessed highest ever production up to that year (997.25 MT, +11.65% growth). CIL produced 773.65 MT and recorded record PBT of Rs. 48,812.61 Crore.",
            "source": "Coal & Lignite Production Report 2025-26 (p. 4), CIL Annual Report (p. 15)",
            "impact": "All-India production approached the coveted 1 Billion Ton mark.",
        },
        {
            "year": "2024-25",
            "period": "FY 2024-25",
            "title": "India Crosses 1 Billion Tonnes Coal Production (1047.52 MT)",
            "category": "National Milestone",
            "description": "All-India coal production officially exceeded 1 Billion Tonnes (1047.52 MT). CIL achieved 781.06 MT production and 762.83 MT dispatch. CMPDI achieved record PBT of Rs. 882.14 Crore.",
            "source": "Coal & Lignite Production Report 2025-26 (p. 4), CMPDIL Annual Report (p. 45)",
            "impact": "Historic domestic energy self-reliance milestone.",
        },
        {
            "year": "2025-26",
            "period": "FY 2025-26",
            "title": "Target Set at 1150 MT & Modernized Safety Mandate",
            "category": "Strategy & Safety",
            "description": "All-India annual production target elevated to 1150.63 MT. Mandatory digital Safety Management Plans and enhanced 2D seismic exploration initiated.",
            "source": "Coal & Lignite Production Report 2025-26 (p. 4), Safety Report (p. 21)",
            "impact": "Transition toward mechanized, zero-accident, environmentally sustainable mining.",
        },
    ]

    if year_filter:
        return [e for e in events if year_filter in e["year"]]
    return events
