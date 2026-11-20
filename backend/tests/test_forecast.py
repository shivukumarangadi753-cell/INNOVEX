"""
Unit tests for Predictive Spatial AI Forecaster Engine and API Router.
"""

import pytest
from ml.forecaster import (
    compute_clearing_probability,
    compute_road_decay,
    compute_slope_accessibility,
    generate_forecast_geojson,
)
from app.routers.forecast import get_risk_zones, get_forecast_summary


def test_probability_model_math():
    """Verify probability model sensitivity to roads and slopes."""
    # Near flat road (high risk)
    p_high, factors_high = compute_clearing_probability(
        dist_road_m=50.0,
        dist_cluster_m=200.0,
        slope_deg=4.0,
        dist_water_m=100.0,
    )
    assert 0.70 <= p_high <= 1.0
    assert factors_high["road_proximity_score"] > 0.8
    assert factors_high["slope_accessibility_score"] > 0.8

    # Distant steep mountain (low risk)
    p_low, factors_low = compute_clearing_probability(
        dist_road_m=2500.0,
        dist_cluster_m=3000.0,
        slope_deg=35.0,
        dist_water_m=1500.0,
    )
    assert p_low < 0.25
    assert factors_low["road_proximity_score"] < 0.1
    assert factors_low["slope_accessibility_score"] < 0.1

    # Monotonicity: Closer roads must yield higher risk
    assert p_high > p_low


def test_generate_forecast_geojson():
    """Verify GeoJSON FeatureCollection structure and properties."""
    data = generate_forecast_geojson(min_probability=0.30)
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 3

    for feature in data["features"]:
        assert feature["type"] == "Feature"
        geom = feature["geometry"]
        assert geom["type"] == "Polygon"
        assert len(geom["coordinates"][0]) >= 4

        props = feature["properties"]
        assert "Zone " in props["code"]
        assert 0.0 <= props["probability"] <= 1.0
        assert props["probability_pct"] == int(props["probability"] * 100)
        assert props["risk_tier"] in ("CRITICAL", "HIGH", "MODERATE")
        assert props["projected_horizon_days"] == 45
        assert len(props["primary_driver"]) > 0
        assert len(props["recommended_action"]) > 0


def test_forecast_router_endpoints():
    """Verify GET /api/forecast/risk-zones and GET /api/forecast/summary."""
    zones_resp = get_risk_zones(min_probability=0.20)
    assert zones_resp["type"] == "FeatureCollection"
    assert len(zones_resp["features"]) > 0

    summary_resp = get_forecast_summary()
    assert summary_resp.total_zones >= 3
    assert summary_resp.critical_zones >= 1
    assert summary_resp.forecast_horizon_days == 45
    assert 40 <= summary_resp.average_probability_pct <= 95
