"""
Wildlife Router - Prakriti-Netra
Endpoints for wildlife movement corridors and ecological fragmentation risk ratings.
Each router maintains its own Pydantic models in the same file as per project guidelines.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Literal
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/wildlife", tags=["Wildlife Corridors"])

DEMO_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "water_fire_demo"


class CorridorProperties(BaseModel):
    name: str = Field(..., description="Corridor name")
    risk: Literal["low", "medium", "high"] = Field(..., description="Threat/fragmentation level")
    reason: str = Field(..., description="Plain-language justification for risk status")


def _load_corridors_geojson() -> Dict[str, Any]:
    path = DEMO_DIR / "corridors.geojson"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "type": "FeatureCollection",
        "features": []
    }


@router.get("/corridors")
def get_corridors() -> Dict[str, Any]:
    """
    Retrieve key wildlife corridors in the Kudremukh-Western Ghats landscape.
    Returns a GeoJSON FeatureCollection where each feature property contains:
    - name: Corridor designation
    - risk: 'low' | 'medium' | 'high'
    - reason: Contextual plain-language reasoning
    """
    return _load_corridors_geojson()
