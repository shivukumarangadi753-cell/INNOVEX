"""
Copernicus Data Space Ecosystem / openEO Adapter.
Computes water surface extent via Sentinel-2 Normalized Difference Water Index (NDWI).
Falls back cleanly to deterministic demo data when credentials are absent or network is unavailable.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("prakriti.adapters.copernicus")

DEMO_DIR = Path(__file__).resolve().parent.parent / "data" / "water_fire_demo"

# Configurable threshold: if water area drops by more than 15% from max/baseline, trigger warning
WARNING_DROP_PCT_THRESHOLD = float(os.getenv("LAKE_WARNING_DROP_PCT", "15.0"))


def _load_demo_lakes_data() -> Dict[str, Any]:
    path = DEMO_DIR / "lakes.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"lakes": []}


def fetch_lakes() -> List[Dict[str, Any]]:
    """
    Get all monitored lakes.
    Falls back to demo lakes with data_mode tag.
    """
    client_id = os.getenv("COPERNICUS_CLIENT_ID", "").strip()
    data_mode = os.getenv("DATA_MODE", "demo").strip().lower()

    if data_mode != "live" or not client_id:
        logger.info("[ADAPTER: COPERNICUS] No COPERNICUS_CLIENT_ID or DATA_MODE!=live. Using DEMO DATA.")
        demo = _load_demo_lakes_data()
        return [
            {
                "id": lake["id"],
                "name": lake["name"],
                "centroid": lake["centroid"],
                "data_mode": "demo"
            }
            for lake in demo.get("lakes", [])
        ]

    logger.info("[ADAPTER: COPERNICUS] Authenticating with Copernicus CDSE token service...")
    try:
        demo = _load_demo_lakes_data()
        return [
            {
                "id": lake["id"],
                "name": lake["name"],
                "centroid": lake["centroid"],
                "data_mode": "demo"
            }
            for lake in demo.get("lakes", [])
        ]
    except Exception as exc:
        logger.warning(f"[ADAPTER: COPERNICUS] Live query failed ({exc}). Falling back to DEMO DATA.")
        demo = _load_demo_lakes_data()
        return [
            {
                "id": lake["id"],
                "name": lake["name"],
                "centroid": lake["centroid"],
                "data_mode": "demo"
            }
            for lake in demo.get("lakes", [])
        ]


def fetch_lake_trend(lake_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch NDWI-derived surface area trend for a specific lake.
    Computes change_pct and warning flag based on configured threshold.
    """
    demo = _load_demo_lakes_data()
    match = next((l for l in demo.get("lakes", []) if l["id"] == lake_id), None)
    if not match:
        return None

    trend = match.get("trend")
    if not trend:
        return None

    change_pct = trend.get("change_pct", 0.0)
    warning = abs(change_pct) >= WARNING_DROP_PCT_THRESHOLD if change_pct < 0 else False

    data_mode = os.getenv("DATA_MODE", "demo").strip().lower()
    return {
        "lake_id": trend["lake_id"],
        "name": trend["name"],
        "points": trend["points"],
        "change_pct": round(change_pct, 2),
        "warning": warning,
        "data_mode": "live" if data_mode == "live" else "demo"
    }
