import pytest
from app.db import get_alert, list_alerts, list_reserves, save_alert
from app.routers.health import get_health
from app.routers.reserves import get_reserves
from app.routers.alerts import get_alerts, get_alert_by_id, submit_alert_review, send_telegram_alert
from app.routers.detect import trigger_detection_run, trigger_model_retrain
from app.schemas import ReviewRequest
from data.generate_demo import generate_demo_dataset


@pytest.fixture(scope="module", autouse=True)
def init_data():
    generate_demo_dataset()


def test_health_api():
    """Test GET /api/health matches contract."""
    res = get_health()
    assert res.status == "ok"
    assert res.data_mode in ("demo", "live")


def test_reserves_api():
    """Test GET /api/reserves returns Kudremukh with is_official: false."""
    res = get_reserves()
    assert len(res) >= 1
    kudremukh = next((r for r in res if r.id == "kudremukh"), None)
    assert kudremukh is not None
    assert kudremukh.is_official is False
    assert kudremukh.boundary["type"] == "Feature"
    assert "geometry" in kudremukh.boundary


def test_detect_run_api():
    """Test POST /api/detect/run creates alerts."""
    res = trigger_detection_run()
    assert res.alerts_created >= 1
    assert res.run_id.startswith("run_")
    assert res.data_mode in ("demo", "live")


def test_alerts_list_and_detail():
    """Test GET /api/alerts and GET /api/alerts/{id}."""
    alerts = get_alerts(status=None)
    assert len(alerts) >= 1
    first_alert = alerts[0]

    detail = get_alert_by_id(first_alert.id)
    assert detail.id == first_alert.id
    assert detail.reserve_id == "kudremukh"
    assert detail.status in ("open", "confirmed", "false_alarm")
    assert detail.label in ("clearing", "fire_scar", "seasonal", "cloud_error")
    assert detail.area_ha > 0
    assert 0.0 <= detail.confidence <= 1.0
    assert detail.before_image_url.startswith("/static/alerts/")
    assert detail.after_image_url.startswith("/static/alerts/")


def test_alert_review_flow():
    """Test POST /api/alerts/{id}/review confirms or flags false alarm."""
    alerts = get_alerts(status=None)
    assert len(alerts) >= 1
    target_id = alerts[0].id

    # Review as confirmed
    reviewed = submit_alert_review(target_id, ReviewRequest(decision="confirm"))
    assert reviewed.status == "confirmed"

    # Query filtered by confirmed
    confirmed_alerts = get_alerts(status="confirmed")
    assert any(a.id == target_id for a in confirmed_alerts)

    # Review as false_alarm
    re_reviewed = submit_alert_review(target_id, ReviewRequest(decision="false_alarm"))
    assert re_reviewed.status == "false_alarm"


def test_alert_telegram_dispatch():
    """Test POST /api/alerts/{id}/telegram handles delivery."""
    alerts = get_alerts(status=None)
    assert len(alerts) >= 1
    target_id = alerts[0].id

    res = send_telegram_alert(target_id)
    assert isinstance(res.sent, bool)
    assert "DEMO" in res.detail or "Telegram" in res.detail


def test_model_retrain_endpoint():
    """Test POST /api/model/retrain returns accuracy: null when samples are few."""
    res = trigger_model_retrain()
    assert isinstance(res.samples_used, int)
    # If samples are fewer than 5, accuracy must be None according to contract
    if res.samples_used < 5:
        assert res.accuracy is None
    else:
        assert isinstance(res.accuracy, float)
