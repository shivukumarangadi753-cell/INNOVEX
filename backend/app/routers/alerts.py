from typing import List, Optional
import httpx
from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.db import get_alert, list_alerts, review_alert
from app.schemas import Alert, ReviewRequest, TelegramResponse

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=List[Alert])
def get_alerts(status: Optional[str] = Query(None, description="Filter by status: open, confirmed, false_alarm")) -> List[Alert]:
    """List satellite change alerts, optionally filtered by status."""
    return list_alerts(status=status)


@router.get("/{alert_id}", response_model=Alert)
def get_alert_by_id(alert_id: str) -> Alert:
    """Retrieve detailed information for a specific alert."""
    alert = get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert with id '{alert_id}' not found.")
    return alert


@router.post("/{alert_id}/review", response_model=Alert)
def submit_alert_review(alert_id: str, payload: ReviewRequest) -> Alert:
    """Review an alert as 'confirm' or 'false_alarm'."""
    updated = review_alert(alert_id, decision=payload.decision)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert with id '{alert_id}' not found.")
    return updated


@router.post("/{alert_id}/telegram", response_model=TelegramResponse)
def send_telegram_alert(alert_id: str) -> TelegramResponse:
    """Dispatch an alert summary to Telegram (or demo-simulated delivery if credentials unset)."""
    alert = get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert with id '{alert_id}' not found.")

    bot_token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID

    message_text = (
        f"🚨 *PRAKRITI-NETRA FOREST ALERT*\n"
        f"Reserve: Kudremukh National Park\n"
        f"Status: {alert.status.upper()}\n"
        f"Label: {alert.label}\n"
        f"Area: {alert.area_ha} ha\n"
        f"Confidence: {int(alert.confidence * 100)}%\n"
        f"Coordinates: {alert.centroid.lat}, {alert.centroid.lng}\n"
        f"Detected: {alert.detected_at}\n"
        f"Data Mode: {alert.data_mode.upper()} DATA"
    )

    if bot_token and chat_id:
        try:
            tg_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            resp = httpx.post(
                tg_url,
                json={"chat_id": chat_id, "text": message_text, "parse_mode": "Markdown"},
                timeout=5.0,
            )
            if resp.status_code == 200:
                return TelegramResponse(sent=True, detail="Alert dispatched via Telegram Bot API.")
            else:
                return TelegramResponse(
                    sent=False,
                    detail=f"Telegram API responded with HTTP {resp.status_code}: {resp.text}",
                )
        except Exception as err:
            return TelegramResponse(sent=False, detail=f"Telegram dispatch error: {err}")

    # Simulated demo delivery when Telegram credentials are not configured
    return TelegramResponse(
        sent=True,
        detail=f"DEMO DISPATCH: Simulated delivery for alert {alert_id} (TELEGRAM_BOT_TOKEN unset in .env).",
    )
