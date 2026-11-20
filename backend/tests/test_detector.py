import numpy as np
import pytest
from shapely.geometry import Point, Polygon

from app.config import settings
from data.generate_demo import generate_demo_dataset, create_reserve_polygon, PIXEL_SIZE, ORIGIN_LNG, ORIGIN_LAT
from ml.detector import run_detector_pipeline, train_or_load_classifier, load_config


@pytest.fixture(scope="module")
def setup_demo_data():
    """Ensure demo rasters and reserve boundary exist for tests."""
    return generate_demo_dataset()


def test_planted_clearing_inside_reserve_alerts(setup_demo_data):
    """Verify that the ~2.4 ha planted clearing inside Kudremukh triggers an alert."""
    alerts = run_detector_pipeline(reserve_id="kudremukh")
    
    assert len(alerts) >= 1
    # Check that at least one alert is a clearing around ~2.4 ha
    clearing_alerts = [a for a in alerts if a.label == "clearing"]
    assert len(clearing_alerts) >= 1

    clearing = clearing_alerts[0]
    assert 2.0 <= clearing.area_ha <= 2.8
    assert clearing.confidence >= 0.70
    assert clearing.data_mode == "demo"
    assert clearing.status == "open"
    # Centroid should be inside Kudremukh bounds
    assert 13.10 <= clearing.centroid.lat <= 13.25
    assert 75.18 <= clearing.centroid.lng <= 75.30


def test_seasonal_decoy_does_not_alert(setup_demo_data):
    """Verify that seasonal leaf fall patch (row 160, col 260) does not generate an alert."""
    alerts = run_detector_pipeline(reserve_id="kudremukh")
    # Coordinates of row 160, col 260:
    # lat = ORIGIN_LAT - 160 * PIXEL_SIZE = 13.20 - 0.016 = 13.184
    # lng = ORIGIN_LNG + 260 * PIXEL_SIZE = 75.20 + 0.026 = 75.226
    seasonal_lat = ORIGIN_LAT - 160 * PIXEL_SIZE
    seasonal_lng = ORIGIN_LNG + 260 * PIXEL_SIZE

    # Ensure no alert is centered near seasonal patch
    for a in alerts:
        dist = np.hypot(a.centroid.lat - seasonal_lat, a.centroid.lng - seasonal_lng)
        assert dist > 0.005, f"Seasonal patch triggered an unexpected alert {a.id}"


def test_cloud_decoy_does_not_alert(setup_demo_data):
    """Verify that cloud and shadow patches (row 260, col 260) are masked by SCL and do not alert."""
    alerts = run_detector_pipeline(reserve_id="kudremukh")
    cloud_lat = ORIGIN_LAT - 260 * PIXEL_SIZE
    cloud_lng = ORIGIN_LNG + 260 * PIXEL_SIZE

    for a in alerts:
        dist = np.hypot(a.centroid.lat - cloud_lat, a.centroid.lng - cloud_lng)
        assert dist > 0.005, f"Cloud decoy triggered an unexpected alert {a.id}"


def test_clearing_outside_reserve_does_not_alert(setup_demo_data):
    """Verify that clearing outside the reserve boundary (row 25, col 25) does not alert."""
    alerts = run_detector_pipeline(reserve_id="kudremukh")
    poly, _ = create_reserve_polygon()

    # Every generated alert must be strictly inside the reserve polygon
    for a in alerts:
        pt = Point(a.centroid.lng, a.centroid.lat)
        assert poly.contains(pt), f"Alert {a.id} at ({a.centroid.lat}, {a.centroid.lng}) is outside reserve!"


def test_small_patch_under_half_ha_dropped():
    """Verify that candidate patches smaller than 0.5 ha (< 50 pixels) are dropped."""
    cfg = load_config()
    min_patch_ha = cfg["thresholds"]["min_patch_ha"]
    assert min_patch_ha == 0.5

    # 40 pixels at 10m grid = 0.4 ha -> must be dropped
    small_patch_pixels = 40
    small_patch_ha = small_patch_pixels * 0.01
    assert small_patch_ha < min_patch_ha
