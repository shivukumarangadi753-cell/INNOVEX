"""
Telegram Alert Dispatch Service - Prakriti-Netra
Formats deforestation / fire alert notifications with:
- Reserve designation and alert ID
- Estimated impacted area in hectares
- Confidence rating
- Google Maps link to centroid coordinates
- Satellite pass timestamps and before/after references
Gracefully handles missing credentials, returning {sent: False, detail: "Telegram not configured"}.
"""

import json
import logging
import os
from typing import Any, Dict
import urllib.request
import urllib.parse
import urllib.error

logger = logging.getLogger("prakriti.services.telegram")


def send_telegram_alert(alert: Any) -> Dict[str, Any]:
    """
    Dispatch satellite alert summary to Telegram channel / chat.
    Safe failure: never raises an exception to the caller.
    Accepts either an Alert Pydantic model or dict.
    """
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()

    if not bot_token or not chat_id:
        logger.info("[TELEGRAM] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.")
        return {
            "sent": False,
            "detail": "Telegram not configured"
        }

    # Extract fields safely from Pydantic model or dict
    if hasattr(alert, "id"):
        alert_id = getattr(alert, "id", "UNKNOWN")
        reserve_id = getattr(alert, "reserve_id", "kudremukh_reserve")
        label = getattr(alert, "label", "clearing")
        area_ha = getattr(alert, "area_ha", 0.0)
        confidence = getattr(alert, "confidence", 0.0)
        detected_at = getattr(alert, "detected_at", "N/A")
        data_mode = getattr(alert, "data_mode", "demo")
        centroid = getattr(alert, "centroid", {})
        if hasattr(centroid, "lat"):
            lat = centroid.lat
            lng = centroid.lng
        elif isinstance(centroid, dict):
            lat = centroid.get("lat", 0.0)
            lng = centroid.get("lng", 0.0)
        else:
            lat, lng = 0.0, 0.0
        before_url = getattr(alert, "before_image_url", "")
        after_url = getattr(alert, "after_image_url", "")
    else:
        alert_id = alert.get("id", "UNKNOWN")
        reserve_id = alert.get("reserve_id", "kudremukh_reserve")
        label = alert.get("label", "clearing")
        area_ha = alert.get("area_ha", 0.0)
        confidence = alert.get("confidence", 0.0)
        detected_at = alert.get("detected_at", "N/A")
        data_mode = alert.get("data_mode", "demo")
        centroid = alert.get("centroid", {})
        lat = centroid.get("lat", 0.0) if isinstance(centroid, dict) else 0.0
        lng = centroid.get("lng", 0.0) if isinstance(centroid, dict) else 0.0
        before_url = alert.get("before_image_url", "")
        after_url = alert.get("after_image_url", "")

    maps_link = f"https://www.google.com/maps?q={lat},{lng}"

    message_text = (
        f"🌿 *PRAKRITI-NETRA SATELLITE ALERT* [{str(data_mode).upper()} DATA]\n\n"
        f"🚨 *Type:* `{str(label).replace('_', ' ').upper()}`\n"
        f"📍 *Reserve:* `{reserve_id}`\n"
        f"📐 *Affected Area:* *{area_ha:.2f} ha*\n"
        f"🎯 *Confidence:* *{confidence * 100:.1f}%*\n"
        f"🕒 *Detected At:* {detected_at}\n"
        f"📌 *GPS Coordinates:* [{lat:.4f}, {lng:.4f}]({maps_link})\n\n"
        f"🗺 *Google Maps Navigation:*\n{maps_link}\n"
    )

    if before_url or after_url:
        message_text += f"\n🛰 *Satellite Imagery:*\n- Before: {before_url}\n- After: {after_url}\n"

    telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    payload = {
        "chat_id": chat_id,
        "text": message_text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": False
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            telegram_url,
            data=data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            if res_body.get("ok"):
                return {
                    "sent": True,
                    "detail": f"Alert successfully delivered to chat {chat_id}"
                }
            else:
                return {
                    "sent": False,
                    "detail": f"Telegram API error: {res_body.get('description', 'Unknown')}"
                }
    except Exception as exc:
        logger.error(f"[TELEGRAM] Failed to send message: {exc}")
        return {
            "sent": False,
            "detail": f"Telegram dispatch failed: {str(exc)}"
        }
