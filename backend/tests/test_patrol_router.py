import math
import pytest
from app.routers.patrol import list_patrol_stations, get_tactical_patrol_route
from ml.patrol_router import (
    PATROL_STATIONS,
    _GLOBAL_DEM,
    calculate_tactical_patrol_route,
    compute_segment_cost,
    latlng_to_grid,
    tobler_hiking_velocity,
)


def test_tobler_hiking_function_physics():
    """Verify Tobler's Hiking Velocity Function respects biomechanical physics."""
    # Flat ground: gradient 0 -> ~5.03 km/h
    v_flat = tobler_hiking_velocity(0.0)
    assert 4.8 <= v_flat <= 5.2

    # Gentle downhill: gradient -0.05 (~-2.9 deg) -> peak speed 6.0 km/h
    v_gentle_down = tobler_hiking_velocity(-0.05)
    assert math.isclose(v_gentle_down, 6.0, rel_tol=1e-3)

    # Steep uphill: gradient +0.35 (~19.3 deg) -> speed drops dramatically
    v_steep_up = tobler_hiking_velocity(0.35)
    assert v_steep_up < 1.6

    # Steep uphill takes more than 3x the time of flat ground
    time_flat = (1.0 / v_flat) * 60
    time_uphill = (1.0 / v_steep_up) * 60
    assert time_uphill > 3.0 * time_flat


def test_cliff_barrier_impassability():
    """Verify that slopes exceeding 38 degrees act as hard impassable barriers."""
    # 165m horizontal, 150m vertical elevation difference -> tan(theta) = 0.909 -> ~42.3 degrees
    time_cliff, slope_deg, _ = compute_segment_cost(0, 0, 800.0, 0, 1, 950.0)
    assert slope_deg > 38.0
    assert math.isinf(time_cliff), "Slopes > 38 deg must return infinite cost barrier"

    # Moderate slope: 165m horizontal, 30m vertical difference -> ~10.3 degrees
    time_mod, slope_mod, _ = compute_segment_cost(0, 0, 800.0, 0, 1, 830.0)
    assert slope_mod < 15.0
    assert not math.isinf(time_mod)
    assert time_mod > 0.0


def test_patrol_route_generation_and_cliff_avoidance():
    """Verify A* pathfinding generates valid 3D route avoiding cliff zone."""
    station = PATROL_STATIONS["kudremukh_hq"]
    # Target coordinates in central Kudremukh
    target_lat = 13.1840
    target_lng = 75.2160

    result = calculate_tactical_patrol_route(
        start_lat=station["lat"],
        start_lng=station["lng"],
        target_lat=target_lat,
        target_lng=target_lng,
        station_info=station,
        alert_id="alt_test_001",
    )

    assert result["alert_id"] == "alt_test_001"
    assert result["total_distance_km"] > 0.5
    assert result["estimated_time_mins"] > 5.0
    assert result["data_mode"] == "demo"

    # GeoJSON Feature verification
    geojson = result["route_geojson"]
    assert geojson["type"] == "Feature"
    assert geojson["geometry"]["type"] == "LineString"

    coords = geojson["geometry"]["coordinates"]
    assert len(coords) >= 5

    # Every coordinate has [lng, lat, elevation]
    for pt in coords:
        assert len(pt) == 3
        lng, lat, elev = pt
        assert 75.10 <= lng <= 75.35
        assert 13.05 <= lat <= 13.30
        assert 500.0 <= elev <= 1900.0

    # Ensure no step in the traversed path exceeds 38 degrees
    slope_summary = result["slope_summary"]
    assert slope_summary["max_slope_deg"] <= 38.0, "Path traversed an illegal cliff barrier!"

    # Tactical advice
    assert len(result["tactical_advice"]) >= 3
    assert any("bearing" in a.lower() for a in result["tactical_advice"])


def test_patrol_api_endpoints():
    """Test /api/patrol/stations and /api/patrol/route endpoints."""
    stations = list_patrol_stations()
    assert len(stations) >= 3
    station_ids = [s.id for s in stations]
    assert "kudremukh_hq" in station_ids
    assert "mullodi_camp" in station_ids
    assert "kerekatte_post" in station_ids

    # Route endpoint
    res = get_tactical_patrol_route(alert_id="alt_sample", station_id="kudremukh_hq")
    assert res.alert_id == "alt_sample"
    assert res.station.id == "kudremukh_hq"
    assert res.total_distance_km > 0
    assert res.estimated_time_mins > 0
    assert res.slope_summary.max_slope_deg <= 38.0
    assert len(res.tactical_advice) >= 3
