"""
Unit tests for Explore a Place Router (OpenStreetMap Nominatim search
and bi-temporal Copernicus Sentinel-2 satellite imagery exploration).
"""

from unittest.mock import MagicMock, patch
import httpx
import pytest
from fastapi import HTTPException

from app.routers.explore import (
    search_places,
    get_explore_imagery,
    validate_search_query,
    bbox_from_point_radius,
    ExploreImageryResponse,
)
from adapters.copernicus import CopernicusClient


# =============================================================================
# PART 1 TESTS: Place Search
# =============================================================================

def test_search_places_valid_mocked():
    """Verify Nominatim search returns up to 5 results with name, lat, lng."""
    mock_data = [
        {"display_name": "Kudremukh Peak, Chikkamagaluru, Karnataka", "lat": "13.2215", "lon": "75.2548"},
        {"display_name": "Kudremukh National Park", "lat": "13.2500", "lon": "75.2800"},
    ]
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_data

    with patch("httpx.Client.get", return_value=mock_resp):
        results = search_places(q="Kudremukh Peak")
        assert len(results) == 2
        assert results[0].name == "Kudremukh Peak, Chikkamagaluru, Karnataka"
        assert results[0].lat == 13.2215
        assert results[0].lng == 75.2548


def test_search_places_invalid_query():
    """Verify short query or control characters are rejected with HTTP 400."""
    with pytest.raises(HTTPException) as exc:
        search_places(q="a")
    assert exc.value.status_code == 400
    assert "between 2 and 100" in exc.value.detail

    with pytest.raises(HTTPException) as exc:
        search_places(q="Kudremukh\x00Peak")
    assert exc.value.status_code == 400
    assert "control characters" in exc.value.detail


def test_search_places_timeout_handling():
    """Verify timeout is caught and returns safe HTTP 504."""
    with patch("httpx.Client.get", side_effect=httpx.TimeoutException("Mocked timeout")):
        with pytest.raises(HTTPException) as exc:
            search_places(q="Timeout Test Place")
        assert exc.value.status_code == 504


# =============================================================================
# PART 2 TESTS: Before and After Satellite Imagery
# =============================================================================

def test_bbox_from_point_radius():
    """Verify bounding box calculation geometry."""
    bbox = bbox_from_point_radius(lat=13.0, lng=75.0, radius_km=2.0)
    assert len(bbox) == 4
    min_lng, min_lat, max_lng, max_lat = bbox
    assert min_lng < 75.0 < max_lng
    assert min_lat < 13.0 < max_lat


def test_explore_imagery_valid_demo():
    """Verify valid request returns complete imagery metadata and URLs."""
    resp = get_explore_imagery(
        lat=13.2215,
        lng=75.2548,
        radius_km=2.0,
        before="2024-01-15",
        after="2024-06-15",
    )
    assert resp.status == "ok"
    assert resp.before_image_url is not None
    assert resp.after_image_url is not None
    assert resp.observation_dates["before"] == "2024-01-15"
    assert resp.observation_dates["after"] == "2024-06-15"
    assert resp.ndvi_mean_before is not None
    assert resp.ndvi_mean_after is not None
    assert resp.vegetation_change_pct_points is not None


def test_explore_imagery_bad_dates():
    """Verify after date earlier than before date or >365 days apart is rejected."""
    # After earlier than before
    with pytest.raises(HTTPException) as exc:
        get_explore_imagery(
            lat=13.0,
            lng=75.0,
            radius_km=2.0,
            before="2024-06-15",
            after="2024-01-15",
        )
    assert exc.value.status_code == 400
    assert "'after' date must be later" in exc.value.detail

    # > 365 days apart
    with pytest.raises(HTTPException) as exc:
        get_explore_imagery(
            lat=13.0,
            lng=75.0,
            radius_km=2.0,
            before="2022-01-15",
            after="2024-01-15",
        )
    assert exc.value.status_code == 400
    assert "cannot exceed 365 days" in exc.value.detail


def test_explore_imagery_cloudy_scene_returns_no_clear_scene():
    """Verify cloudy scenes result in status 'no_clear_scene' without fake substitution."""
    mock_client = MagicMock(spec=CopernicusClient)
    mock_client.client_id = "test_id"
    mock_client.client_secret = "test_secret"
    # Returns empty scene list because cloud cover > 20%
    mock_client.search_sentinel2_scenes.return_value = []

    resp = get_explore_imagery(
        lat=13.0,
        lng=75.0,
        radius_km=2.0,
        before="2024-01-15",
        after="2024-03-15",
        client=mock_client,
    )
    assert resp.status == "no_clear_scene"
    assert resp.searched_window is not None
    assert "No clear Sentinel-2 scene found" in resp.message


def test_explore_imagery_missing_credentials_data_unavailable(monkeypatch):
    """Verify missing credentials in live mode return 'data_unavailable' with zero secrets."""
    mock_client = MagicMock(spec=CopernicusClient)
    mock_client.client_id = ""
    mock_client.client_secret = ""

    from app.config import settings
    monkeypatch.setattr(settings, "DATA_MODE", "live")

    resp = get_explore_imagery(
        lat=13.0,
        lng=75.0,
        radius_km=2.0,
        before="2024-01-15",
        after="2024-03-15",
        client=mock_client,
    )
    assert resp.status == "data_unavailable"
    assert "credentials are not configured" in resp.message
    # Confirm no secret strings leaked
    assert "secret" not in resp.message.lower()
    assert "key" not in resp.message.lower()


def test_atmospheric_metrics_dynamic_by_location_and_season():
    """Verify valid pixel rate and cloud cover change dynamically with coordinates and dates."""
    from app.routers.explore import compute_atmospheric_metrics

    # Kudremukh Ghats vs Tannirbhavi Coast
    kudremukh_jan = compute_atmospheric_metrics(13.2215, 75.2548, 2.0, "2024-01-15")
    kudremukh_monsoon = compute_atmospheric_metrics(13.2215, 75.2548, 2.0, "2024-07-15")
    coastal_jan = compute_atmospheric_metrics(12.8980, 74.8210, 2.0, "2024-01-15")

    # Monsoon has higher cloud cover and lower valid pixel rate than dry season
    assert kudremukh_monsoon["cloud_cover"] > kudremukh_jan["cloud_cover"]
    assert kudremukh_monsoon["valid_pixels"] < kudremukh_jan["valid_pixels"]

    # Different geographic coordinates produce distinct metrics
    assert (kudremukh_jan["cloud_cover"] != coastal_jan["cloud_cover"]) or (kudremukh_jan["valid_pixels"] != coastal_jan["valid_pixels"])

    # Explore imagery response incorporates the dynamic metrics
    resp_kud = get_explore_imagery(13.2215, 75.2548, 2.0, "2024-01-15", "2024-07-15")
    resp_coast = get_explore_imagery(12.8980, 74.8210, 2.0, "2024-01-15", "2024-07-15")

    assert resp_kud.cloud_cover_pct != resp_coast.cloud_cover_pct
    assert resp_kud.valid_pixel_pct != resp_coast.valid_pixel_pct
