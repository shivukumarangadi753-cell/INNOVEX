from typing import List
from fastapi import APIRouter
from app.db import list_reserves, save_reserve
from app.schemas import Reserve

router = APIRouter(prefix="/api", tags=["Reserves"])


@router.get("/reserves", response_model=List[Reserve])
def get_reserves() -> List[Reserve]:
    """List monitored forest reserves (with boundary GeoJSON and official status)."""
    reserves = list_reserves()
    if not reserves:
        # Default fallback for Kudremukh if DB hasn't been seeded yet
        default_kudremukh = Reserve(
            id="kudremukh",
            name="Kudremukh National Park & Reserve Forest",
            boundary={
                "type": "Feature",
                "properties": {
                    "name": "Kudremukh Reserve",
                    "state": "Karnataka",
                    "note": "DEMO DATA: Simplified boundary for demo purposes",
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [75.18, 13.08],
                        [75.32, 13.08],
                        [75.32, 13.22],
                        [75.18, 13.22],
                        [75.18, 13.08],
                    ]],
                },
            },
            is_official=False,
        )
        save_reserve(default_kudremukh)
        reserves = [default_kudremukh]
    return reserves
