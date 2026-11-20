"""
Smart Water Use Advisor Router - Prakriti-Netra
Provides rule-based irrigation advisory for farmers and
the Jal-Score water efficiency auditor for towns, industries, and farms.
Each router maintains its own Pydantic models in the same file as per project guidelines.
"""

from typing import List, Literal, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field, ConfigDict

router = APIRouter(prefix="/api", tags=["Smart Water Use & Advisor"])


# --- Irrigation Advisory Models ---

class IrrigationRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "ndvi": 0.42,
                "rain_forecast_mm": 2.5,
                "soil_moisture_pct": 28.0,
                "crop": "Arecanut"
            }
        }
    )

    ndvi: float = Field(..., ge=0.0, le=1.0, description="Normalized Difference Vegetation Index (0.0 to 1.0)")
    rain_forecast_mm: float = Field(..., ge=0.0, description="Forecasted precipitation over the next 48 hours in mm")
    soil_moisture_pct: float = Field(..., ge=0.0, le=100.0, description="Volumetric root-zone soil moisture percentage (0-100%)")
    crop: Optional[str] = Field(None, description="Optional crop variety (e.g., 'Arecanut', 'Coffee', 'Paddy')")


class IrrigationResponse(BaseModel):
    advice: Literal["irrigate_now", "wait"] = Field(..., description="Actionable recommendation")
    reason: str = Field(..., description="Plain-language explanation of the hydrological conditions")
    confidence_note: str = Field(..., description="Contextual note on data reliability and agro-climatic baseline")


# --- Jal-Score Models ---

class JalScoreRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "sector": "farm",
                "monthly_usage_kl": 850.0,
                "recycled_pct": 20.0,
                "leakage_pct": 18.0,
                "rainwater_harvesting": True
            }
        }
    )

    sector: Literal["town", "industry", "farm"] = Field(..., description="Consumer category")
    monthly_usage_kl: float = Field(..., ge=0.0, description="Monthly water volume consumed in kiloliters (kL)")
    recycled_pct: float = Field(..., ge=0.0, le=100.0, description="Percentage of consumed water recycled or reused (0-100%)")
    leakage_pct: float = Field(..., ge=0.0, le=100.0, description="Estimated distribution loss or leakage percentage (0-100%)")
    rainwater_harvesting: bool = Field(..., description="Whether functioning rainwater harvesting structures are installed")


class JalScoreResponse(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Efficiency score between 0 and 100")
    band: Literal["good", "watch", "critical"] = Field(..., description="Classification band")
    tips: List[str] = Field(..., min_length=3, max_length=3, description="3 prioritized water-saving recommendations")


# --- Business Logic / Decision Rules ---

def compute_irrigation_advice(ndvi: float, rain_forecast_mm: float, soil_moisture_pct: float, crop: Optional[str] = None) -> IrrigationResponse:
    crop_name = crop.strip() if crop else "Crops"

    if rain_forecast_mm >= 15.0:
        return IrrigationResponse(
            advice="wait",
            reason=f"Significant rainfall ({rain_forecast_mm:.1f} mm) is expected in the next 48 hours. Postpone irrigation to conserve water and prevent waterlogging.",
            confidence_note="High confidence: Rain forecast overrides irrigation needs for Western Ghats soils."
        )

    if soil_moisture_pct >= 55.0:
        return IrrigationResponse(
            advice="wait",
            reason=f"Current soil moisture ({soil_moisture_pct:.1f}%) is in the optimal holding range for {crop_name}. Immediate watering is not required.",
            confidence_note="Optimal moisture: Sensor and model readings indicate healthy root-zone water balance."
        )

    if soil_moisture_pct < 35.0 or (ndvi < 0.45 and soil_moisture_pct < 45.0):
        stress_detail = "low soil moisture" if soil_moisture_pct < 35.0 else "satellite vegetation stress with depleted moisture"
        return IrrigationResponse(
            advice="irrigate_now",
            reason=f"{crop_name} is experiencing moisture stress ({stress_detail} at {soil_moisture_pct:.1f}%). Irrigate now to maintain plant vigor and protect yield.",
            confidence_note="Critical action: Water deficit observed across both canopy index and soil sensors."
        )

    return IrrigationResponse(
        advice="wait",
        reason=f"Soil moisture ({soil_moisture_pct:.1f}%) is currently acceptable for {crop_name}. Hold off irrigation and re-check after 24 hours.",
        confidence_note="Routine monitoring: Moisture buffer is adequate for normal evapotranspiration."
    )


def compute_jal_score(
    sector: str,
    monthly_usage_kl: float,
    recycled_pct: float,
    leakage_pct: float,
    rainwater_harvesting: bool
) -> JalScoreResponse:
    score = 50.0
    score += (recycled_pct / 100.0) * 30.0

    if rainwater_harvesting:
        score += 15.0
    else:
        score -= 5.0

    score -= (leakage_pct / 100.0) * 50.0

    if sector == "industry":
        if recycled_pct >= 50.0:
            score += 10.0
        if leakage_pct > 15.0:
            score -= 10.0
    elif sector == "farm":
        if leakage_pct <= 10.0:
            score += 10.0
    elif sector == "town":
        if leakage_pct > 25.0:
            score -= 10.0

    final_score = int(max(0, min(100, round(score))))

    if final_score >= 70:
        band = "good"
    elif final_score >= 40:
        band = "watch"
    else:
        band = "critical"

    candidate_tips: List[str] = []

    if leakage_pct > 10.0:
        lost_kl = (leakage_pct / 100.0) * monthly_usage_kl
        candidate_tips.append(
            f"Fix distribution leaks and install acoustic flow loggers: reducing leakage could save ~{lost_kl:.1f} kL per month."
        )

    if not rainwater_harvesting:
        candidate_tips.append(
            "Install rooftop and catchment rainwater harvesting pits to recharge local groundwater and provide emergency dry-season storage."
        )

    if recycled_pct < 40.0:
        candidate_tips.append(
            "Implement decentralized greywater filtration or reed-bed recycling for secondary non-potable uses."
        )

    if sector == "farm":
        candidate_tips.append(
            "Upgrade to precision drip or sub-surface irrigation to cut evaporative and conveyance losses by up to 35%."
        )
    elif sector == "industry":
        candidate_tips.append(
            "Conduct a comprehensive water balance audit to capture steam condensate and cooling tower blowdown."
        )
    else:
        candidate_tips.append(
            "Deploy smart volumetric digital water meters to identify hidden household pipeline leaks and balance supply zones."
        )

    while len(candidate_tips) < 3:
        candidate_tips.append("Regularly calibrate flow meters and monitor monthly water balance trends.")
    tips = candidate_tips[:3]

    return JalScoreResponse(
        score=final_score,
        band=band,
        tips=tips
    )


@router.post("/advisor/irrigation", response_model=IrrigationResponse)
def get_irrigation_advice(payload: IrrigationRequest):
    """
    Evaluate crop root-zone moisture, vegetation vigor (NDVI), and rainfall forecast
    to provide a clear 'irrigate_now' or 'wait' advisory.
    """
    return compute_irrigation_advice(
        ndvi=payload.ndvi,
        rain_forecast_mm=payload.rain_forecast_mm,
        soil_moisture_pct=payload.soil_moisture_pct,
        crop=payload.crop
    )


@router.post("/jal-score", response_model=JalScoreResponse)
def calculate_jal_score(payload: JalScoreRequest):
    """
    Compute 0-100 Jal-Score water efficiency index for Town, Industry, or Farm sectors
    with band rating ('good', 'watch', 'critical') and 3 targeted saving tips.
    """
    return compute_jal_score(
        sector=payload.sector,
        monthly_usage_kl=payload.monthly_usage_kl,
        recycled_pct=payload.recycled_pct,
        leakage_pct=payload.leakage_pct,
        rainwater_harvesting=payload.rainwater_harvesting
    )
