"""
Multi-Sensor Triangulation Router.
Exposes endpoints for real-time multi-sensor threat priority matrix
fusing Sentinel-1 SAR, NASA FIRMS thermal, and IoT acoustic telemetry.
"""

from typing import List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

from ml.triangulator import (
    TriangulatedIncident,
    get_demo_threat_matrix,
)

router = APIRouter(prefix="/api/triangulation", tags=["Multi-Sensor Triangulation"])


class TriangulationSummaryResponse(BaseModel):
    total_incidents: int
    red_flag_count: int
    amber_watch_count: int
    green_count: int
    avg_threat_score: float
    data_mode: str = "demo"


@router.get("/threat-matrix", response_model=List[TriangulatedIncident])
def get_threat_matrix(
    reserve_id: Optional[str] = Query(None, description="Optional reserve ID filter"),
    min_score: float = Query(0.0, ge=0.0, le=100.0, description="Minimum threat score threshold"),
) -> List[TriangulatedIncident]:
    """
    Returns list of triangulated multi-sensor incidents with full sensor
    breakdown, temporal decay metrics, and unified threat scores.
    """
    matrix = get_demo_threat_matrix()
    clean_res = reserve_id if isinstance(reserve_id, str) and reserve_id.strip() else None
    clean_score = float(min_score) if isinstance(min_score, (int, float)) else 0.0

    filtered = matrix
    if clean_res:
        filtered = [inc for inc in filtered if inc.reserve_id == clean_res]
    if clean_score > 0.0:
        filtered = [inc for inc in filtered if inc.threat_score >= clean_score]

    return filtered


@router.get("/summary", response_model=TriangulationSummaryResponse)
def get_triangulation_summary() -> TriangulationSummaryResponse:
    """
    Returns aggregate summary of triangulated threats across all priority bands.
    """
    matrix = get_demo_threat_matrix()
    total = len(matrix)
    red = sum(1 for inc in matrix if inc.priority_band == "Red Flag")
    amber = sum(1 for inc in matrix if inc.priority_band == "Amber Watch")
    green = sum(1 for inc in matrix if inc.priority_band == "Green")
    avg_score = round(sum(inc.threat_score for inc in matrix) / max(1, total), 1)

    return TriangulationSummaryResponse(
        total_incidents=total,
        red_flag_count=red,
        amber_watch_count=amber,
        green_count=green,
        avg_threat_score=avg_score,
        data_mode="demo",
    )
