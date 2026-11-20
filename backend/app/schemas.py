from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Core Engine Models (LANE OWNED: Source of Truth)
# ---------------------------------------------------------------------------

class LatLng(BaseModel):
    lat: float
    lng: float


class HealthResponse(BaseModel):
    status: str = "ok"
    data_mode: Literal["demo", "live"] = "demo"


class Reserve(BaseModel):
    id: str
    name: str
    boundary: Dict[str, Any] = Field(description="GeoJSON Feature representing boundary")
    is_official: bool = False


class Alert(BaseModel):
    id: str
    reserve_id: str
    status: Literal["open", "confirmed", "false_alarm"]
    label: Literal["clearing", "fire_scar", "seasonal", "cloud_error"]
    area_ha: float
    confidence: float = Field(ge=0.0, le=1.0)
    centroid: LatLng
    polygon: Dict[str, Any] = Field(description="GeoJSON Feature representing alert polygon")
    detected_at: str
    pass_t1: str
    pass_t2: str
    before_image_url: str
    after_image_url: str
    data_mode: Literal["demo", "live"] = "demo"


class ReviewRequest(BaseModel):
    decision: Literal["confirm", "false_alarm"]


class TelegramResponse(BaseModel):
    sent: bool
    detail: str


class DetectRunResponse(BaseModel):
    alerts_created: int
    run_id: str
    data_mode: str


class RetrainResponse(BaseModel):
    samples_used: int
    accuracy: Optional[float] = None


# ---------------------------------------------------------------------------
# Teammate Contract Models (Exported for shared consistency)
# ---------------------------------------------------------------------------

class FireHotspot(BaseModel):
    id: str
    lat: float
    lng: float
    brightness: float
    confidence: float
    acq_datetime: str
    data_mode: Literal["demo", "live"] = "demo"


class Lake(BaseModel):
    id: str
    name: str
    centroid: LatLng
    data_mode: Literal["demo", "live"] = "demo"


class LakeTrendPoint(BaseModel):
    date: str
    area_ha: float


class LakeTrend(BaseModel):
    lake_id: str
    name: str
    points: List[LakeTrendPoint]
    change_pct: float
    warning: bool
    data_mode: Literal["demo", "live"] = "demo"


class GroundwaterPoint(BaseModel):
    date: str
    depth_m: float


class Groundwater(BaseModel):
    station: str
    unit: str = "m_below_ground"
    points: List[GroundwaterPoint]
    data_mode: Literal["demo", "live"] = "demo"


class IrrigationAdviceRequest(BaseModel):
    ndvi: float
    rain_forecast_mm: float
    soil_moisture_pct: float
    crop: Optional[str] = None


class IrrigationAdviceResponse(BaseModel):
    advice: Literal["irrigate_now", "wait"]
    reason: str
    confidence_note: str


class JalScoreRequest(BaseModel):
    sector: Literal["town", "industry", "farm"]
    monthly_usage_kl: float
    recycled_pct: float
    leakage_pct: float
    rainwater_harvesting: bool


class JalScoreResponse(BaseModel):
    score: float = Field(ge=0.0, le=100.0)
    band: Literal["good", "watch", "critical"]
    tips: List[str]
