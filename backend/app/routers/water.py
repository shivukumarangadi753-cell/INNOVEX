"""
Water Watch Router - Prakriti-Netra
Endpoints for satellite-derived lake water surface areas, multi-temporal drying trends,
and groundwater observation well telemetry.
Each router maintains its own Pydantic models in the same file as per project guidelines.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from adapters.copernicus import fetch_lakes, fetch_lake_trend
from adapters.indiawris import fetch_groundwater

router = APIRouter(prefix="/api/water", tags=["Water Watch & Lakes"])


class Centroid(BaseModel):
    lat: float = Field(..., description="Latitude of lake center")
    lng: float = Field(..., description="Longitude of lake center")


class LakeSummary(BaseModel):
    id: str = Field(..., description="Unique lake identifier")
    name: str = Field(..., description="Official or local water body name")
    centroid: Centroid
    data_mode: str = Field(..., description="'demo' or 'live'")


class WaterPoint(BaseModel):
    date: str = Field(..., description="ISO 8601 acquisition date")
    area_ha: float = Field(..., description="Water surface extent in hectares")


class LakeTrendResponse(BaseModel):
    lake_id: str = Field(..., description="Unique lake identifier")
    name: str = Field(..., description="Lake name")
    points: List[WaterPoint] = Field(..., description="Time-series surface area measurements")
    change_pct: float = Field(..., description="Percentage change in surface area (negative denotes shrinkage)")
    warning: bool = Field(..., description="True if drying drop crosses critical threshold")
    data_mode: str = Field(..., description="'demo' or 'live'")


class GroundwaterPoint(BaseModel):
    date: str = Field(..., description="ISO 8601 observation date")
    depth_m: float = Field(..., description="Depth to water table in meters below ground level")


class GroundwaterResponse(BaseModel):
    station: str = Field(..., description="Observation station name")
    unit: str = Field(default="m_below_ground", description="Measurement unit")
    points: List[GroundwaterPoint] = Field(..., description="Historical depth telemetry points")
    data_mode: str = Field(..., description="'demo' or 'live'")


@router.get("/lakes", response_model=List[LakeSummary])
def get_lakes():
    """
    List monitored water bodies in the Kudremukh reserve forest catchment.
    """
    return fetch_lakes()


@router.get("/lakes/{id}/trend", response_model=LakeTrendResponse)
def get_lake_trend(id: str):
    """
    Retrieve satellite NDWI surface area trend over time.
    Calculates change percentage and flags warning=True if shrinking past threshold.
    """
    trend = fetch_lake_trend(id)
    if not trend:
        raise HTTPException(status_code=404, detail=f"Lake '{id}' not found in registry")
    return trend


@router.get("/groundwater", response_model=GroundwaterResponse)
def get_groundwater():
    """
    Retrieve groundwater depth telemetry from regional monitoring well (CGWB / India-WRIS).
    """
    return fetch_groundwater()
