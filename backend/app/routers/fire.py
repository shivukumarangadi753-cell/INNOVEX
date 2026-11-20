"""
Fire Router - Prakriti-Netra
Endpoints for active thermal anomalies (hotspots) and burn-scar polygons.
Each router maintains its own Pydantic models in the same file as per project guidelines.
"""

from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel, Field, ConfigDict

from backend.adapters.firms import fetch_firms_hotspots, fetch_burn_scars

router = APIRouter(prefix="/api/fire", tags=["Fire & Thermal Anomalies"])


class HotspotResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "viirs_kudremukh_01",
                "lat": 13.214,
                "lng": 75.212,
                "brightness": 338.4,
                "confidence": 88.0,
                "acq_datetime": "2026-11-19T13:45:00Z",
                "data_mode": "demo"
            }
        }
    )

    id: str = Field(..., description="Unique hotspot identifier")
    lat: float = Field(..., description="Latitude coordinate")
    lng: float = Field(..., description="Longitude coordinate")
    brightness: float = Field(..., description="Brightness temperature in Kelvin (VIIRS I-Band)")
    confidence: float = Field(..., description="Detection confidence (0-100)")
    acq_datetime: str = Field(..., description="ISO 8601 acquisition timestamp")
    data_mode: str = Field(..., description="'demo' or 'live'")


@router.get("/hotspots", response_model=List[HotspotResponse])
def get_hotspots():
    """
    Retrieve active fire hotspots within the Kudremukh reserve forest region.
    Pulls from NASA FIRMS VIIRS (or falls back cleanly to deterministic demo data).
    """
    raw_hotspots = fetch_firms_hotspots()
    return raw_hotspots


@router.get("/burn-scars")
def get_burn_scars() -> Dict[str, Any]:
    """
    Retrieve burn-scar polygons as a GeoJSON FeatureCollection.
    Derived from Sentinel-2 NBR difference analysis (or demo data).
    """
    return fetch_burn_scars()
