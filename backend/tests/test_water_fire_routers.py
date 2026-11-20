"""
Integration and Router Endpoint Tests for Water, Fire, Wildlife, and Telegram.
Verifies contract adherence, data shapes, status codes, and graceful fallback.
"""

import pytest
from fastapi import HTTPException

from app.routers.fire import get_hotspots, get_burn_scars, HotspotResponse
from app.routers.wildlife import get_corridors
from app.routers.water import (
    get_lakes,
    get_lake_trend,
    get_groundwater,
    LakeSummary,
    LakeTrendResponse,
    GroundwaterResponse
)
from app.routers.advisor import (
    get_irrigation_advice,
    calculate_jal_score,
    IrrigationRequest,
    JalScoreRequest
)
from app.routers.telegram import dispatch_alert_to_telegram, TelegramDispatchResponse


def test_fire_hotspots_endpoint():
    data = get_hotspots()
    assert isinstance(data, list)
    assert len(data) > 0
    for item in data:
        validated = HotspotResponse(**item)
        assert validated.data_mode in ["demo", "live"]
        assert 0.0 <= validated.confidence <= 100.0


def test_fire_burn_scars_endpoint():
    data = get_burn_scars()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) > 0
    props = data["features"][0]["properties"]
    assert "area_ha" in props
    assert "severity" in props
    assert props["data_mode"] in ["demo", "live"]


def test_wildlife_corridors_endpoint():
    data = get_corridors()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0
    for feature in data["features"]:
        props = feature["properties"]
        assert "name" in props
        assert props["risk"] in ["low", "medium", "high"]
        assert "reason" in props
        assert len(props["reason"]) > 5


def test_water_lakes_endpoint():
    data = get_lakes()
    assert isinstance(data, list)
    assert len(data) > 0
    for item in data:
        validated = LakeSummary(**item)
        assert validated.data_mode in ["demo", "live"]
        assert validated.centroid.lat > 0
        assert validated.centroid.lng > 0


def test_water_lake_trend_drying_warning():
    trend = get_lake_trend("lake_lakya_dam")
    validated = LakeTrendResponse(**trend)
    assert validated.lake_id == "lake_lakya_dam"
    assert len(validated.points) > 0
    assert validated.change_pct < 0.0
    assert validated.warning is True
    assert validated.data_mode in ["demo", "live"]


def test_water_lake_not_found():
    with pytest.raises(HTTPException) as exc_info:
        get_lake_trend("non_existent_lake")
    assert exc_info.value.status_code == 404


def test_water_groundwater_endpoint():
    gw = get_groundwater()
    validated = GroundwaterResponse(**gw)
    assert validated.unit == "m_below_ground"
    assert len(validated.points) > 0
    assert validated.data_mode in ["demo", "live"]


def test_advisor_irrigation_endpoint():
    payload = IrrigationRequest(
        ndvi=0.35,
        rain_forecast_mm=0.0,
        soil_moisture_pct=25.0,
        crop="Arecanut"
    )
    res = get_irrigation_advice(payload)
    assert res.advice == "irrigate_now"
    assert "moisture stress" in res.reason


def test_advisor_jal_score_endpoint():
    payload = JalScoreRequest(
        sector="industry",
        monthly_usage_kl=2000.0,
        recycled_pct=75.0,
        leakage_pct=8.0,
        rainwater_harvesting=True
    )
    res = calculate_jal_score(payload)
    assert 0 <= res.score <= 100
    assert res.band in ["good", "watch", "critical"]
    assert len(res.tips) == 3


def test_telegram_alert_dispatch_unconfigured_graceful():
    from app.db import list_alerts
    from data.generate_demo import generate_demo_dataset
    from ml.detector import run_detector_pipeline

    alerts = list_alerts()
    if not alerts:
        generate_demo_dataset()
        alerts = run_detector_pipeline()

    target_id = alerts[0].id
    res = dispatch_alert_to_telegram(target_id)
    validated = TelegramDispatchResponse(**res)
    assert validated.sent is False
    assert "Telegram not configured" in validated.detail or "failed" in validated.detail
