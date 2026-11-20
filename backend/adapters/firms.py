"""
NASA FIRMS (Fire Information for Resource Management System) Adapter.
Queries VIIRS thermal anomalies for the target bounding box (Kudremukh region).
Falls back safely to deterministic demo data if FIRMS_MAP_KEY is missing or network fails.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List
import urllib.request
import urllib.error

logger = logging.getLogger("prakriti.adapters.firms")

DEMO_DIR = Path(__file__).resolve().parent.parent / "data" / "water_fire_demo"

# Kudremukh bounding box [min_lng, min_lat, max_lng, max_lat]
KUDREMUKH_BBOX = [75.05, 13.05, 75.45, 13.45]


def load_demo_hotspots() -> List[Dict[str, Any]]:
    path = DEMO_DIR / "hotspots.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def load_demo_burn_scars() -> Dict[str, Any]:
    path = DEMO_DIR / "burn_scars.geojson"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"type": "FeatureCollection", "features": []}


def fetch_firms_hotspots() -> List[Dict[str, Any]]:
    """
    Fetch active fire hotspots from NASA FIRMS API.
    If FIRMS_MAP_KEY is unset or query fails, logs explanation and returns demo data.
    """
    map_key = os.getenv("FIRMS_MAP_KEY", "").strip()
    data_mode = os.getenv("DATA_MODE", "demo").strip().lower()

    if data_mode != "live" or not map_key:
        logger.info("[ADAPTER: FIRMS] No FIRMS_MAP_KEY or DATA_MODE!=live. Using DEMO DATA.")
        return load_demo_hotspots()

    # NASA FIRMS API: /api/area/csv/[MAP_KEY]/VIIRS_SNPP_NRT/[BBOX]/1
    bbox_str = f"{KUDREMUKH_BBOX[0]},{KUDREMUKH_BBOX[1]},{KUDREMUKH_BBOX[2]},{KUDREMUKH_BBOX[3]}"
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/VIIRS_SNPP_NRT/{bbox_str}/1"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Prakriti-Netra/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            content = response.read().decode("utf-8")

        lines = [line.strip() for line in content.strip().split("\n") if line.strip()]
        if len(lines) <= 1:
            logger.info("[ADAPTER: FIRMS] Empty live results from FIRMS API. Falling back to DEMO DATA.")
            return load_demo_hotspots()

        headers = [h.strip() for h in lines[0].split(",")]
        hotspots = []
        for idx, row in enumerate(lines[1:]):
            parts = [p.strip() for p in row.split(",")]
            row_dict = dict(zip(headers, parts))
            hotspots.append({
                "id": f"firms_{idx+1}",
                "lat": float(row_dict.get("latitude", 0.0)),
                "lng": float(row_dict.get("longitude", 0.0)),
                "brightness": float(row_dict.get("bright_ti4", 300.0)),
                "confidence": float(row_dict.get("confidence", 80)) if row_dict.get("confidence", "").isdigit() else 80.0,
                "acq_datetime": f"{row_dict.get('acq_date', '2026-11-20')}T{row_dict.get('acq_time', '0000')[:2]}:{row_dict.get('acq_time', '0000')[2:]}:00Z",
                "data_mode": "live"
            })
        return hotspots
    except Exception as exc:
        logger.warning(f"[ADAPTER: FIRMS] Live query failed ({exc}). Falling back to DEMO DATA.")
        return load_demo_hotspots()


def fetch_burn_scars() -> Dict[str, Any]:
    """
    Fetch burn scar polygons. Sentinel-2 burn scar detection requires processing pipeline;
    falls back cleanly to demo GeoJSON data.
    """
    data_mode = os.getenv("DATA_MODE", "demo").strip().lower()
    if data_mode != "live":
        logger.info("[ADAPTER: BURN_SCARS] DATA_MODE!=live. Using DEMO DATA.")
    else:
        logger.info("[ADAPTER: BURN_SCARS] Live NBR burn-scar pipeline offline. Using DEMO DATA.")
    return load_demo_burn_scars()
