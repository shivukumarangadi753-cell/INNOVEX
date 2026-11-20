"""
Unit Tests for Smart Water Use Rules: Irrigation Advisory & Jal-Score
Tests boundary conditions, edge cases, band assignments, and rule-based outcomes.
"""

from backend.app.routers.advisor import compute_irrigation_advice, compute_jal_score


def test_irrigation_rain_overrides_all():
    # If high rain is predicted (>= 15mm), advice MUST be 'wait'
    res = compute_irrigation_advice(
        ndvi=0.25,  # stressed vegetation
        rain_forecast_mm=22.0,  # heavy rain incoming
        soil_moisture_pct=20.0,  # dry soil
        crop="Coffee"
    )
    assert res.advice == "wait"
    assert "Significant rainfall" in res.reason


def test_irrigation_soil_optimal():
    # If soil moisture is high (>= 55%), advice MUST be 'wait'
    res = compute_irrigation_advice(
        ndvi=0.6,
        rain_forecast_mm=2.0,
        soil_moisture_pct=65.0,
        crop="Arecanut"
    )
    assert res.advice == "wait"
    assert "optimal holding range" in res.reason


def test_irrigation_stress_triggers_irrigate_now():
    # If soil moisture is low (< 35%), advice MUST be 'irrigate_now'
    res = compute_irrigation_advice(
        ndvi=0.45,
        rain_forecast_mm=0.0,
        soil_moisture_pct=28.0,
        crop="Paddy"
    )
    assert res.advice == "irrigate_now"
    assert "moisture stress" in res.reason


def test_irrigation_canopy_deficit_triggers_irrigate_now():
    # Low NDVI (< 0.45) with depleted moisture (< 45%) triggers 'irrigate_now'
    res = compute_irrigation_advice(
        ndvi=0.38,
        rain_forecast_mm=3.0,
        soil_moisture_pct=40.0,
        crop="Pepper"
    )
    assert res.advice == "irrigate_now"


def test_irrigation_moderate_moisture_waits():
    # Moderate moisture (between 45% and 55%) with healthy NDVI (>= 0.45) waits
    res = compute_irrigation_advice(
        ndvi=0.65,
        rain_forecast_mm=4.0,
        soil_moisture_pct=50.0,
        crop="Cardamom"
    )
    assert res.advice == "wait"


def test_jal_score_good_rating():
    # High recycling, rainwater harvesting active, low leakage -> score >= 70 ('good')
    res = compute_jal_score(
        sector="farm",
        monthly_usage_kl=1000.0,
        recycled_pct=60.0,
        leakage_pct=5.0,
        rainwater_harvesting=True
    )
    assert res.score >= 70
    assert res.band == "good"
    assert len(res.tips) == 3


def test_jal_score_critical_rating():
    # Zero recycling, no rainwater harvesting, severe leakage (45%) -> score < 40 ('critical')
    res = compute_jal_score(
        sector="town",
        monthly_usage_kl=5000.0,
        recycled_pct=0.0,
        leakage_pct=45.0,
        rainwater_harvesting=False
    )
    assert res.score < 40
    assert res.band == "critical"
    assert len(res.tips) == 3
    # Check that leakage tip is prioritized
    assert any("leak" in tip.lower() for tip in res.tips)


def test_jal_score_watch_rating():
    # Medium performance -> 40 <= score < 70 ('watch')
    res = compute_jal_score(
        sector="industry",
        monthly_usage_kl=2500.0,
        recycled_pct=25.0,
        leakage_pct=18.0,
        rainwater_harvesting=True
    )
    assert 40 <= res.score < 70
    assert res.band == "watch"
    assert len(res.tips) == 3
