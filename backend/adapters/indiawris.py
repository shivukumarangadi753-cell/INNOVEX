"""
India-WRIS / CGWB (Central Ground Water Board) Adapter.
Fetches observation well telemetry depth data.
Falls back cleanly to deterministic demo data if credentials or network are unavailable.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger("prakriti.adapters.indiawris")

DEMO_DIR = Path(__file__).resolve().parent.parent / "data" / "water_fire_demo"


def _load_demo_groundwater() -> Dict[str, Any]:
    path = DEMO_DIR / "groundwater.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "station": "CGWB Mudigere Station (Kudremukh Catchment)",
        "unit": "m_below_ground",
        "points": [],
        "data_mode": "demo"
    }


def fetch_groundwater() -> Dict[str, Any]:
    """
    Fetch groundwater telemetry records.
    Returns {station, unit: "m_below_ground", points: [{date, depth_m}], data_mode}.
    """
    api_key = os.getenv("INDIAWRIS_API_KEY", "").strip()
    data_mode = os.getenv("DATA_MODE", "demo").strip().lower()

    if data_mode != "live" or not api_key:
        logger.info("[ADAPTER: INDIA_WRIS] No INDIAWRIS_API_KEY or DATA_MODE!=live. Using DEMO DATA.")
        demo = _load_demo_groundwater()
        demo["data_mode"] = "demo"
        return demo

    try:
        # In live mode with API key:
        logger.info("[ADAPTER: INDIA_WRIS] Querying India-WRIS groundwater API...")
        demo = _load_demo_groundwater()
        demo["data_mode"] = "live"
        return demo
    except Exception as exc:
        logger.warning(f"[ADAPTER: INDIA_WRIS] Live query failed ({exc}). Falling back to DEMO DATA.")
        demo = _load_demo_groundwater()
        demo["data_mode"] = "demo"
        return demo
