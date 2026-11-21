"""
Predictive Spatial AI: Future Encroachment Forecaster Router.
Provides REST API endpoints for 45-day forward spatial risk heatmaps and summary telemetry.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from ml.forecaster import generate_forecast_geojson

router = APIRouter(prefix="/api/forecast", tags=["Predictive Spatial AI"])


class ForecastSummaryResponse(BaseModel):
    total_zones: int
    critical_zones: int
    high_zones: int
    average_probability_pct: int
    forecast_horizon_days: int
    primary_threat_reserve: str
    data_mode: str = "demo"


@router.get("/risk-zones")
def get_risk_zones(
    reserve_id: Optional[str] = Query(None, description="Optional filter by reserve ID"),
    min_probability: float = Query(0.30, ge=0.0, le=1.0, description="Minimum risk probability threshold"),
) -> Dict[str, Any]:
    """
    Returns a GeoJSON FeatureCollection containing predictive spatial hazard zones
    with 45-day encroachment clearing probabilities.
    """
    clean_res = reserve_id if isinstance(reserve_id, str) else None
    clean_prob = float(min_probability) if isinstance(min_probability, (int, float)) else 0.30
    return generate_forecast_geojson(reserve_id=clean_res, min_probability=clean_prob)


@router.get("/summary", response_model=ForecastSummaryResponse)
def get_forecast_summary() -> ForecastSummaryResponse:
    """
    Returns high-level predictive spatial risk analytics across all monitored reserves.
    """
    geojson = generate_forecast_geojson(min_probability=0.0)
    features = geojson.get("features", [])

    total = len(features)
    critical = sum(1 for f in features if f["properties"]["risk_tier"] == "CRITICAL")
    high = sum(1 for f in features if f["properties"]["risk_tier"] == "HIGH")
    avg_pct = int(sum(f["properties"]["probability_pct"] for f in features) / max(1, total))

    return ForecastSummaryResponse(
        total_zones=total,
        critical_zones=critical,
        high_zones=high,
        average_probability_pct=avg_pct,
        forecast_horizon_days=45,
        primary_threat_reserve="Mangaluru Coastal Eco-Zone & Kudremukh National Park",
        data_mode="demo",
    )
