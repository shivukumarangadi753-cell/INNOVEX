"""
Unit tests for Multi-Sensor Triangulation Engine (backend/ml/triangulator.py)
and Triangulation API Router (backend/app/routers/triangulation.py).
"""

from datetime import datetime, timedelta, timezone
import pytest

from ml.triangulator import (
    FIRMSAnomaly,
    SARShift,
    AcousticReport,
    calculate_sar_score,
    calculate_thermal_score,
    calculate_acoustic_score,
    calculate_temporal_decay,
    triangulate_incident,
    get_demo_threat_matrix,
)
from app.routers.triangulation import get_threat_matrix, get_triangulation_summary


def test_high_threat_score_coincidence():
    """
    Verify high threat score (>= 85) when a NASA FIRMS thermal hotspot
    coincides with Sentinel-1 SAR backscatter drop (> 6 dB) and chainsaw audio.
    """
    t_now = datetime.now(timezone.utc)

    # Coincident multi-sensor detection within 1 hour and 150m
    sar = SARShift(
        backscatter_drop_db=7.2,
        timestamp=t_now,
        lat=13.2215,
        lng=75.2548,
    )
    thermal = FIRMSAnomaly(
        brightness_temp_kelvin=425.0,
        confidence_pct=95.0,
        timestamp=t_now - timedelta(minutes=25),
        lat=13.2220,
        lng=75.2550,
    )
    acoustic = AcousticReport(
        sensor_id="IOT-KDK-AUDIO-01",
        event_type="chainsaw",
        frequency_hz=3400.0,
        confidence_score=0.94,
        timestamp=t_now - timedelta(minutes=45),
        lat=13.2212,
        lng=75.2545,
    )

    incident = triangulate_incident(
        incident_id="test-red-flag",
        name="Coincident Felling and Thermal Hotspot",
        reserve_id="res-kudremukh",
        sar=sar,
        thermal=thermal,
        acoustic=acoustic,
    )

    assert incident.threat_score >= 85.0
    assert incident.priority_band == "Red Flag"
    assert incident.sensor_breakdown.temporal_decay_factor == 1.0
    assert "armed squad" in incident.action_directive.lower()


def test_temporal_decay_ten_days_apart():
    """
    Verify temporal decay drastically reduces the threat score when events
    are 10 days apart (240 hours).
    """
    t_now = datetime.now(timezone.utc)
    t_old = t_now - timedelta(days=10)  # 240 hours prior

    decay_factor, delta_hours = calculate_temporal_decay([t_old, t_now])
    assert delta_hours == 240.0
    assert decay_factor < 0.30, f"Expected strong decay (<0.30), got {decay_factor}"

    # Same high-intensity sensors, but 10 days apart
    sar = SARShift(
        backscatter_drop_db=7.0,
        timestamp=t_now,
        lat=13.2215,
        lng=75.2548,
    )
    thermal = FIRMSAnomaly(
        brightness_temp_kelvin=420.0,
        confidence_pct=90.0,
        timestamp=t_old,
        lat=13.2218,
        lng=75.2550,
    )
    acoustic = AcousticReport(
        sensor_id="IOT-KDK-AUDIO-02",
        event_type="chainsaw",
        frequency_hz=3400.0,
        confidence_score=0.90,
        timestamp=t_old,
        lat=13.2210,
        lng=75.2545,
    )

    incident = triangulate_incident(
        incident_id="test-decayed",
        name="Stale Asynchronous Events",
        reserve_id="res-kudremukh",
        sar=sar,
        thermal=thermal,
        acoustic=acoustic,
    )

    # Base score was ~90, but damped by ~0.246 -> threat score < 30 (Green/Amber)
    assert incident.threat_score < 50.0
    assert incident.priority_band in ("Green", "Amber Watch")
    assert incident.sensor_breakdown.max_delta_hours >= 240.0


def test_triangulation_router_endpoints():
    """Verify GET /api/triangulation/threat-matrix and GET /api/triangulation/summary."""
    matrix = get_threat_matrix()
    assert len(matrix) >= 3
    assert any(inc.priority_band == "Red Flag" for inc in matrix)
    assert any(inc.priority_band == "Amber Watch" for inc in matrix)

    for inc in matrix:
        assert 0.0 <= inc.threat_score <= 100.0
        assert inc.data_mode == "demo"
        assert len(inc.action_directive) > 0
        assert inc.sensor_breakdown.base_score >= 0.0

    summary = get_triangulation_summary()
    assert summary.total_incidents >= 3
    assert summary.red_flag_count >= 1
    assert summary.amber_watch_count >= 1
    assert summary.data_mode == "demo"
