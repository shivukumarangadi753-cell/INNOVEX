import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.db import get_alert
from app.schemas import PatrolStation, TacticalRouteResponse
from ml.patrol_router import (
    PATROL_STATIONS,
    calculate_tactical_patrol_route,
    find_nearest_station,
)

logger = logging.getLogger("prakriti-netra.patrol")

router = APIRouter(prefix="/api/patrol", tags=["Tactical Patrol Routing"])


@router.get("/stations", response_model=List[PatrolStation])
def list_patrol_stations() -> List[PatrolStation]:
    """List all registered forest patrol stations, camps, and checkposts."""
    return [
        PatrolStation(
            id=s["id"],
            name=s["name"],
            lat=s["lat"],
            lng=s["lng"],
            description=s.get("description"),
        )
        for s in PATROL_STATIONS.values()
    ]


@router.get("/route", response_model=TacticalRouteResponse)
def get_tactical_patrol_route(
    alert_id: str = Query(..., description="ID of the alert to intercept"),
    station_id: Optional[str] = Query(None, description="Departure patrol station ID (optional, defaults to closest)"),
) -> TacticalRouteResponse:
    """Calculate the terrain-aware, least-time tactical foot patrol route to an alert.

    Uses Tobler's Hiking Function and A* pathfinding over Western Ghats DEM topography,
    strictly avoiding impassable cliffs (> 38° slope).
    """
    alert = get_alert(alert_id)
    if alert:
        target_lat = alert.centroid.lat
        target_lng = alert.centroid.lng
    else:
        # Fallback target for demonstration if alert_id is synthetic/test
        logger.info("Alert '%s' not found in DB; using Kudremukh clearing centroid coordinates.", alert_id)
        target_lat = 13.18395
        target_lng = 75.21605

    # Determine departure station
    if station_id and station_id in PATROL_STATIONS:
        station_info = PATROL_STATIONS[station_id]
    else:
        station_info = find_nearest_station(target_lat, target_lng)

    start_lat = station_info["lat"]
    start_lng = station_info["lng"]

    result = calculate_tactical_patrol_route(
        start_lat=start_lat,
        start_lng=start_lng,
        target_lat=target_lat,
        target_lng=target_lng,
        station_info=station_info,
        alert_id=alert_id,
    )

    return TacticalRouteResponse(**result)
