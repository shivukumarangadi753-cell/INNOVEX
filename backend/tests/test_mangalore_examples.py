"""
Tests for Mangalore before/after comparison examples and alert workflows.
"""

from pathlib import Path
from PIL import Image
import pytest

from app.db import get_alert, list_alerts, list_reserves, review_alert
from app.routers.alerts import send_telegram_alert

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"


def test_mangalore_reserve_and_alerts_exist():
    """Verify Mangalore reserve and all 3 Mangalore alerts exist with valid coordinates."""
    reserves = list_reserves()
    mng_reserve = next((r for r in reserves if r.id == "res-mangaluru-coastal"), None)
    assert mng_reserve is not None, "Mangalore coastal reserve must be registered"
    assert "Mangaluru" in mng_reserve.name or "Mangalore" in mng_reserve.name

    alerts = list_alerts()
    mng_alert_ids = {"alt-mng-001", "alt-mng-002", "alt-mng-003"}
    found_ids = {a.id for a in alerts if a.id in mng_alert_ids}
    assert found_ids == mng_alert_ids, f"Expected {mng_alert_ids}, but found {found_ids}"

    for a in alerts:
        if a.id in mng_alert_ids:
            # Must be inside Mangaluru geographic bounding box
            assert 12.80 <= a.centroid.lat <= 13.00, f"Latitude {a.centroid.lat} outside Mangalore bounds"
            assert 74.75 <= a.centroid.lng <= 74.98, f"Longitude {a.centroid.lng} outside Mangalore bounds"
            assert a.area_ha > 0.0
            assert 0.0 < a.confidence <= 1.0
            assert a.label == "clearing"
            assert a.data_mode == "demo"


def test_mangalore_comparison_images_exist_and_valid():
    """Verify all 6 before and after PNG images exist in both backend and frontend."""
    image_names = [
        "alert-mng-001_before.png",
        "alert-mng-001_after.png",
        "alert-mng-002_before.png",
        "alert-mng-002_after.png",
        "alert-mng-003_before.png",
        "alert-mng-003_after.png",
    ]

    backend_dir = BASE_DIR / "static" / "alerts"
    frontend_dir = FRONTEND_DIR / "public" / "static" / "alerts"

    for name in image_names:
        b_path = backend_dir / name
        f_path = frontend_dir / name

        assert b_path.exists(), f"Backend image {b_path} must exist"
        assert f_path.exists(), f"Frontend image {f_path} must exist"

        # Verify images can be opened and have positive dimensions
        with Image.open(b_path) as img:
            assert img.format == "PNG"
            assert img.size == (512, 512)

        with Image.open(f_path) as img:
            assert img.format == "PNG"
            assert img.size == (512, 512)


def test_mangalore_review_and_dispatch():
    """Verify review decision and Telegram alert simulation on Mangalore alert."""
    alert_id = "alt-mng-001"
    alert_before = get_alert(alert_id)
    assert alert_before is not None

    # Review as confirmed
    reviewed = review_alert(alert_id, "confirm")
    assert reviewed is not None
    assert reviewed.status == "confirmed"

    # Telegram dispatch simulation
    resp = send_telegram_alert(alert_id)
    assert resp.sent is True
    assert "DISPATCH" in resp.detail or "dispatched" in resp.detail.lower()

    # Revert back to open for fresh UI state
    review_alert(alert_id, "open")
