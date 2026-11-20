"""
Unit tests for Copernicus CDSE adapter (Phase 1).
Tests token authentication, scene searching, cloud-filtering, band downloading,
and seamless fallback to deterministic DEMO DATA.
"""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from adapters.copernicus import CopernicusClient, get_satellite_pair


class MockResponse:
    def __init__(self, status_code: int, json_data: dict, content: bytes = b""):
        self.status_code = status_code
        self._json_data = json_data
        self.content = content
        self.text = str(json_data)

    def json(self):
        return self._json_data


def test_invalid_credentials_fallback(monkeypatch):
    """
    Test 1: When CDSE credentials are empty or invalid, the adapter must not crash.
    It returns None for token and get_satellite_pair cleanly returns deterministic demo data.
    """
    client = CopernicusClient(client_id="", client_secret="")
    token = client.get_token()
    assert token is None

    result = get_satellite_pair("kudremukh", client=client)
    assert result["status"] == "success"
    assert result["data_mode"] == "demo"
    assert result["reserve_id"] == "kudremukh"
    assert Path(result["s2_t1_path"]).exists()
    assert Path(result["s2_t2_path"]).exists()
    assert Path(result["s1_t1_path"]).exists()
    assert Path(result["s1_t2_path"]).exists()
    assert "observation_dates" in result


def test_empty_search_results_handling(monkeypatch):
    """
    Test 2: When OData catalogue returns zero scenes for the specified bbox/dates,
    search_sentinel2_scenes returns empty list, and get_satellite_pair safely falls back.
    """
    client = CopernicusClient(client_id="dummy_id", client_secret="dummy_secret")
    client._access_token = "mock_token"
    client._token_expires_at = 9999999999.0

    empty_odata_response = MockResponse(200, {"value": []})

    with patch("httpx.Client.get", return_value=empty_odata_response):
        scenes = client.search_sentinel2_scenes(
            bbox=[75.20, 13.10, 75.35, 13.25],
            start_date="2024-01-01",
            end_date="2024-01-10",
        )
        assert scenes == []

    # get_satellite_pair should also gracefully fall back to demo
    with patch.object(client, "search_sentinel2_scenes", return_value=[]):
        monkeypatch.setattr("adapters.copernicus.settings.DATA_MODE", "live")
        result = get_satellite_pair("kudremukh", client=client)
        assert result["status"] == "success"
        assert result["data_mode"] == "demo"
        assert "insufficient cloud-free" in result.get("warning", "").lower()
        assert Path(result["s2_t1_path"]).exists()


def test_cloudy_scene_rejection():
    """
    Test 3: Reject scenes whose cloud cover exceeds max_cloud (e.g. 20%).
    Only scenes meeting the cloud cover criteria are returned.
    """
    client = CopernicusClient(client_id="dummy_id", client_secret="dummy_secret")
    client._access_token = "mock_token"
    client._token_expires_at = 9999999999.0

    mock_scenes_response = MockResponse(
        200,
        {
            "value": [
                {
                    "Id": "scene-cloudy-45",
                    "Name": "S2A_MSIL2A_20240115_45pct",
                    "Attributes": [{"Name": "cloudCover", "Value": 45.2}],
                    "ContentDate": {"Start": "2024-01-15T05:10:00Z", "End": "2024-01-15T05:15:00Z"},
                },
                {
                    "Id": "scene-clear-5",
                    "Name": "S2A_MSIL2A_20240120_5pct",
                    "Attributes": [{"Name": "cloudCover", "Value": 5.1}],
                    "ContentDate": {"Start": "2024-01-20T05:10:00Z", "End": "2024-01-20T05:15:00Z"},
                },
                {
                    "Id": "scene-borderline-25",
                    "Name": "S2A_MSIL2A_20240125_25pct",
                    "Attributes": [{"Name": "cloudCover", "Value": 25.0}],
                    "ContentDate": {"Start": "2024-01-25T05:10:00Z", "End": "2024-01-25T05:15:00Z"},
                },
            ]
        },
    )

    with patch("httpx.Client.get", return_value=mock_scenes_response):
        scenes = client.search_sentinel2_scenes(
            bbox=[75.20, 13.10, 75.35, 13.25],
            start_date="2024-01-01",
            end_date="2024-01-30",
            max_cloud=20.0,
        )

        assert len(scenes) == 1
        assert scenes[0]["id"] == "scene-clear-5"
        assert scenes[0]["cloud_cover"] == 5.1


def test_missing_band_handling(tmp_path):
    """
    Test 4: When a requested band (e.g. B12) is missing from the product node assets,
    download_band_subset raises FileNotFoundError, and get_satellite_pair catches it
    and safely falls back to demo rasters.
    """
    client = CopernicusClient(client_id="dummy_id", client_secret="dummy_secret")
    client._access_token = "mock_token"
    client._token_expires_at = 9999999999.0

    # Only B04 and B08 exist in product nodes; B12 is missing
    mock_nodes_response = MockResponse(
        200,
        {
            "value": [
                {"Name": "B04.jp2"},
                {"Name": "B08.jp2"},
            ]
        },
    )

    with patch("httpx.Client.get", return_value=mock_nodes_response):
        with pytest.raises(FileNotFoundError, match="Requested band 'B12' not found"):
            client.download_band_subset("test-prod-123", ["B04", "B12"], target_dir=tmp_path)

    # Verify that get_satellite_pair gracefully catches any download error and returns demo
    with patch.object(client, "search_sentinel2_scenes", return_value=[{"id": "p1", "cloud_cover": 2.0}]):
        with patch.object(client, "download_band_subset", side_effect=FileNotFoundError("Band B12 missing")):
            result = get_satellite_pair("kudremukh", client=client)
            assert result["status"] == "success"
            assert result["data_mode"] == "demo"
            assert Path(result["s2_t1_path"]).exists()
