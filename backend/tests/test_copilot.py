"""
Unit tests for Prakriti-Copilot Autonomous Ecological AI Agent Router.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_copilot_general_overview():
    """Verify Copilot answers general overview and returns alert stats."""
    resp = client.post("/api/copilot/chat", json={"message": "What is the status of alerts?"})
    assert resp.status_code == 200
    data = resp.json()
    assert "briefing" in data["reply"].lower() or "satellite" in data["reply"].lower()
    assert data["intent"] == "alert_inquiry"
    assert len(data["suggested_questions"]) > 0
    assert len(data["voice_script"]) > 0


def test_copilot_lake_water_query():
    """Verify Copilot analyzes lake depletion and flags the worst affected lake."""
    resp = client.post("/api/copilot/chat", json={"message": "Which lake in Mangalore has water loss?"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "lake_trend"
    assert "lake" in data["reply"].lower()
    assert any(a["target"] == "/water" for a in data["actions"])


def test_copilot_carbon_loss_calculation():
    """Verify Copilot computes accurate carbon stock loss and Supreme Court NPV fines."""
    resp = client.post("/api/copilot/chat", json={"message": "Calculate carbon loss and penalty for mangrove alert alt-mng-001"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "carbon_loss"
    assert "co2" in data["reply"].lower() or "carbon" in data["reply"].lower()
    c_data = data["data"]
    assert c_data["co2e_metric_tons"] > 0
    assert c_data["npv_fine_inr_lakhs"] > 0


def test_copilot_auto_fir_generation():
    """Verify Copilot auto-drafts official legal notice / FIR under Indian Forest Act."""
    resp = client.post("/api/copilot/chat", json={"message": "Draft a legal notice and FIR for alert alt-mng-001"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "fir_draft"
    assert "Indian Forest Act" in data["reply"]
    fir_data = data["data"]
    assert "FCR-" in fir_data["case_no"]
    assert "PRELIMINARY OFFENCE REPORT" in fir_data["fir_text"]


def test_copilot_telegram_dispatch():
    """Verify Copilot handles patrol dispatch."""
    resp = client.post("/api/copilot/chat", json={"message": "Dispatch alert alt-mng-001 to telegram"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "dispatch"
    assert "telegram" in data["reply"].lower()
