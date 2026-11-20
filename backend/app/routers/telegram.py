"""
Telegram Router - Prakriti-Netra
Endpoint: POST /api/alerts/{id}/telegram
Reads the specified alert via `from app.db import get_alert` and dispatches an immediate notification to Telegram.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.telegram import send_telegram_alert

logger = logging.getLogger("prakriti.routers.telegram")

router = APIRouter(prefix="/api/alerts", tags=["Alert Notifications"])


class TelegramDispatchResponse(BaseModel):
    sent: bool = Field(..., description="Whether the notification was successfully sent")
    detail: str = Field(..., description="Status summary or explanation if unconfigured")


try:
    from app.db import get_alert
except ImportError:
    logger.info("[TELEGRAM ROUTER] 'from app.db import get_alert' unavailable; using fallback stub.")

    def get_alert(alert_id: str):
        return {
            "id": alert_id,
            "reserve_id": "kudremukh_reserve_01",
            "status": "open",
            "label": "clearing",
            "area_ha": 3.85,
            "confidence": 0.92,
            "centroid": {
                "lat": 13.2245,
                "lng": 75.2412
            },
            "polygon": {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [75.240, 13.223],
                            [75.243, 13.223],
                            [75.243, 13.226],
                            [75.240, 13.226],
                            [75.240, 13.223]
                        ]
                    ]
                },
                "properties": {"alert_id": alert_id}
            },
            "detected_at": "2026-11-20T06:15:00Z",
            "pass_t1": "2026-11-10T05:30:00Z",
            "pass_t2": "2026-11-20T05:30:00Z",
            "before_image_url": f"/static/alerts/{alert_id}_before.png",
            "after_image_url": f"/static/alerts/{alert_id}_after.png",
            "data_mode": "demo"
        }


@router.post("/{id}/telegram", response_model=TelegramDispatchResponse)
def dispatch_alert_to_telegram(id: str):
    """
    Dispatch alert notification to Telegram channel.
    Reads alert details, constructs GPS navigation link, and transmits via bot.
    """
    alert = get_alert(id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{id}' not found")

    result = send_telegram_alert(alert)
    return result
