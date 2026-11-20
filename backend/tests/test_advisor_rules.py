"""
Unit Tests for Smart Water Use Rules: Irrigation Advisory & Jal-Score
Tests boundary conditions, edge cases, band assignments, and rule-based outcomes.
"""

from app.routers.advisor import compute_irrigation_advice, compute_jal_score


def test_irrigation_rain_overrides_all():
    res = compute_irrigation_advice(
        ndvi=0.25,
        rain_forecast_mm=22.0,
        soil_moisture_pct=20.0,
        crop="Coffee"
    )
    assert res.advice == "wait"
    assert "Significant rainfall" in res.reason


def test_irrigation_soil_optimal():
    res = compute_irrigation_advice(
        ndvi=0.6,
        rain_forecast_mm=2.0,
        soil_moisture_pct=65.0,
        crop="Arecanut"
    )
    assert res.advice == "wait"
    assert "optimal holding range" in res.reason


def test_irrigation_stress_triggers_irrigate_now():
    res = compute_irrigation_advice(
        ndvi=0.45,
        rain_forecast_mm=0.0,
        soil_moisture_pct=28.0,
        crop="Paddy"
    )
    assert res.advice == "irrigate_now"
    assert "moisture stress" in res.reason


def test_irrigation_canopy_deficit_triggers_irrigate_now():
    res = compute_irrigation_advice(
        ndvi=0.38,
        rain_forecast_mm=3.0,
        soil_moisture_pct=40.0,
        crop="Pepper"
    )
    assert res.advice == "irrigate_now"


def test_irrigation_moderate_moisture_waits():
    res = compute_irrigation_advice(
        ndvi=0.65,
        rain_forecast_mm=4.0,
        soil_moisture_pct=50.0,
        crop="Cardamom"
    )
    assert res.advice == "wait"


def test_jal_score_good_rating():
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
    assert any("leak" in tip.lower() for tip in res.tips)


def test_jal_score_watch_rating():
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
