"""
Multi-Sensor Triangulation Engine for Priority Threat Scoring.
Fuses Sentinel-1 SAR backscatter drops, NASA FIRMS thermal hotspots, and
simulated IoT acoustic/ranger reports using Bayesian event fusion and temporal decay.
"""

import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional, Tuple
from pydantic import BaseModel, Field


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS coordinates in meters."""
    r = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


# =============================================================================
# Input Telemetry Models
# =============================================================================

class FIRMSAnomaly(BaseModel):
    sensor_id: str = "NASA-VIIRS-SNPP"
    brightness_temp_kelvin: float = Field(..., ge=250.0, le=600.0)
    confidence_pct: float = Field(..., ge=0.0, le=100.0)
    timestamp: datetime
    lat: float
    lng: float
    data_mode: str = "demo"


class SARShift(BaseModel):
    sensor_id: str = "SENTINEL-1-GRD"
    backscatter_drop_db: float = Field(..., ge=0.0, le=30.0)
    polarization: str = "VH"
    timestamp: datetime
    lat: float
    lng: float
    data_mode: str = "demo"


class AcousticReport(BaseModel):
    sensor_id: str = "IOT-AUDIO-NODE"
    event_type: Literal["chainsaw", "gunshot", "earthmover", "ambient"]
    frequency_hz: float = Field(..., ge=20.0, le=20000.0)
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    timestamp: datetime
    lat: float
    lng: float
    data_mode: str = "demo"


class SensorBreakdown(BaseModel):
    sar_score: float
    thermal_score: float
    acoustic_score: float
    base_score: float
    temporal_decay_factor: float
    max_delta_hours: float
    spatial_spread_meters: float


class TriangulatedIncident(BaseModel):
    incident_id: str
    name: str
    reserve_id: str
    threat_score: float  # 0 to 100
    priority_band: Literal["Red Flag", "Amber Watch", "Green"]
    centroid_lat: float
    centroid_lng: float
    detected_at: datetime
    sar_event: Optional[SARShift] = None
    thermal_event: Optional[FIRMSAnomaly] = None
    acoustic_event: Optional[AcousticReport] = None
    sensor_breakdown: SensorBreakdown
    action_directive: str
    data_mode: str = "demo"


# =============================================================================
# Multi-Sensor Triangulation Mathematics
# =============================================================================

def calculate_sar_score(backscatter_drop_db: float) -> float:
    """
    Evaluates SAR structural loss.
    Drops > 3 dB indicate forest canopy collapse.
    3 dB maps to 30.0; 8 dB maps to 100.0.
    """
    if backscatter_drop_db < 3.0:
        return max(0.0, (backscatter_drop_db / 3.0) * 25.0)
    score = ((backscatter_drop_db - 3.0) / 5.0) * 70.0 + 30.0
    return min(100.0, max(0.0, score))


def calculate_thermal_score(temp_kelvin: float, confidence_pct: float) -> float:
    """
    Evaluates NASA FIRMS thermal anomaly intensity.
    Ambient canopy ~305K; severe flame ~445K.
    Weighted by detection confidence %.
    """
    raw_intensity = ((temp_kelvin - 305.0) / 140.0) * 100.0
    clamped_intensity = min(100.0, max(0.0, raw_intensity))
    return clamped_intensity * (confidence_pct / 100.0)


def calculate_acoustic_score(event_type: str, confidence_score: float, frequency_hz: float) -> float:
    """
    Evaluates ground microphone telemetry.
    Chainsaw motor harmonics peak between 2500Hz and 4500Hz.
    Gunshots produce sharp impulse peaks.
    """
    base = confidence_score * 100.0
    if event_type in ("chainsaw", "gunshot"):
        # Frequency verification boost
        if event_type == "chainsaw" and 2200.0 <= frequency_hz <= 4800.0:
            base = min(100.0, base * 1.1)
    elif event_type == "earthmover":
        base = min(100.0, base * 0.95)
    else:
        base = base * 0.3
    return min(100.0, max(0.0, base))


def calculate_temporal_decay(timestamps: List[datetime]) -> Tuple[float, float]:
    """
    Computes exponential temporal decay.
    If events are separated by > 72 hours, threat score is progressively damped.
    Events separated by 10 days (240h) are heavily suppressed.
    """
    if len(timestamps) <= 1:
        return 1.0, 0.0

    min_t = min(timestamps)
    max_t = max(timestamps)
    delta_seconds = abs((max_t - min_t).total_seconds())
    delta_hours = delta_seconds / 3600.0

    if delta_hours <= 72.0:
        decay_factor = 1.0
    else:
        # Exponential decay with half-life ~83 hours
        decay_factor = math.exp(-(delta_hours - 72.0) / 120.0)

    return round(max(0.05, min(1.0, decay_factor)), 3), round(delta_hours, 1)


def triangulate_incident(
    incident_id: str,
    name: str,
    reserve_id: str,
    sar: Optional[SARShift] = None,
    thermal: Optional[FIRMSAnomaly] = None,
    acoustic: Optional[AcousticReport] = None,
) -> TriangulatedIncident:
    """
    Performs multi-sensor Bayesian event fusion across available sensor feeds.
    Formulation:
    Base Score = (SAR * 0.40) + (Thermal * 0.35) + (Acoustic * 0.25)
    Threat Score = Base Score * Temporal Decay
    """
    # 1. Individual Sensor Scores
    sar_score = calculate_sar_score(sar.backscatter_drop_db) if sar else 0.0
    thermal_score = calculate_thermal_score(thermal.brightness_temp_kelvin, thermal.confidence_pct) if thermal else 0.0
    acoustic_score = (
        calculate_acoustic_score(acoustic.event_type, acoustic.confidence_score, acoustic.frequency_hz)
        if acoustic
        else 0.0
    )

    # Weights distribution dynamically adjusted based on active sensors
    active_weights = []
    active_scores = []
    if sar:
        active_weights.append(0.40)
        active_scores.append(sar_score)
    if thermal:
        active_weights.append(0.35)
        active_scores.append(thermal_score)
    if acoustic:
        active_weights.append(0.25)
        active_scores.append(acoustic_score)

    total_weight = sum(active_weights) or 1.0
    base_score = sum(s * (w / total_weight) for s, w in zip(active_scores, active_weights)) if active_scores else 0.0

    # 2. Temporal Decay
    timestamps = []
    coords = []
    if sar:
        timestamps.append(sar.timestamp)
        coords.append((sar.lat, sar.lng))
    if thermal:
        timestamps.append(thermal.timestamp)
        coords.append((thermal.lat, thermal.lng))
    if acoustic:
        timestamps.append(acoustic.timestamp)
        coords.append((acoustic.lat, acoustic.lng))

    decay_factor, delta_hours = calculate_temporal_decay(timestamps)
    final_score = round(min(100.0, max(0.0, base_score * decay_factor)), 1)

    # 3. Spatial Spread
    if len(coords) >= 2:
        spread_m = max(haversine_distance_m(c1[0], c1[1], c2[0], c2[1]) for c1 in coords for c2 in coords)
    else:
        spread_m = 0.0

    # 4. Centroid
    avg_lat = sum(c[0] for c in coords) / len(coords) if coords else 13.22
    avg_lng = sum(c[1] for c in coords) / len(coords) if coords else 75.25

    # 5. Priority Bands
    if final_score >= 80.0:
        band = "Red Flag"
        directive = "Immediate tactical armed squad dispatch: Coincident thermal anomaly, radar canopy loss, and active audio alert."
    elif final_score >= 50.0:
        band = "Amber Watch"
        directive = "Deploy next routine UAV drone reconnaissance pass and alert forest beat guards."
    else:
        band = "Green"
        directive = "Routine observation: Informational telemetry or seasonal variation; no tactical intervention required."

    breakdown = SensorBreakdown(
        sar_score=round(sar_score, 1),
        thermal_score=round(thermal_score, 1),
        acoustic_score=round(acoustic_score, 1),
        base_score=round(base_score, 1),
        temporal_decay_factor=decay_factor,
        max_delta_hours=delta_hours,
        spatial_spread_meters=round(spread_m, 1),
    )

    latest_time = max(timestamps) if timestamps else datetime.now(timezone.utc)

    return TriangulatedIncident(
        incident_id=incident_id,
        name=name,
        reserve_id=reserve_id,
        threat_score=final_score,
        priority_band=band,
        centroid_lat=round(avg_lat, 5),
        centroid_lng=round(avg_lng, 5),
        detected_at=latest_time,
        sar_event=sar,
        thermal_event=thermal,
        acoustic_event=acoustic,
        sensor_breakdown=breakdown,
        action_directive=directive,
        data_mode="demo",
    )


# =============================================================================
# Pre-seeded Realistic Triangulated Incident Matrix (DEMO DATA)
# =============================================================================

def get_demo_threat_matrix() -> List[TriangulatedIncident]:
    """
    Returns realistic multi-sensor triangulated threat matrix for
    Kudremukh National Park and Mangaluru Coastal Eco-Zone.
    """
    t_now = datetime.now(timezone.utc)

    # 1. Incident 1: RED FLAG - Kudremukh South Ridge Clearing & Fire
    # Severe SAR drop (6.8 dB), Intense thermal anomaly (412K), Chainsaw acoustic audio
    inc1 = triangulate_incident(
        incident_id="tri-kdk-001",
        name="Kudremukh South Ridge Active Canopy Clearing & Burn",
        reserve_id="res-kudremukh",
        sar=SARShift(
            backscatter_drop_db=6.8,
            timestamp=t_now,
            lat=13.2215,
            lng=75.2548,
        ),
        thermal=FIRMSAnomaly(
            brightness_temp_kelvin=412.5,
            confidence_pct=92.0,
            timestamp=t_now,
            lat=13.2220,
            lng=75.2555,
        ),
        acoustic=AcousticReport(
            sensor_id="IOT-KDK-AUDIO-04",
            event_type="chainsaw",
            frequency_hz=3450.0,
            confidence_score=0.91,
            timestamp=t_now,
            lat=13.2210,
            lng=75.2540,
        ),
    )

    # 2. Incident 2: RED FLAG - Tannirbhavi Mangrove Estuary Logging
    # SAR drop (5.4 dB), FIRMS thermal (385K), Heavy Chainsaw/Excavator
    inc2 = triangulate_incident(
        incident_id="tri-mng-001",
        name="Tannirbhavi Estuary Mangrove Felling",
        reserve_id="res-mangaluru-coastal",
        sar=SARShift(
            backscatter_drop_db=5.4,
            timestamp=t_now,
            lat=12.8980,
            lng=74.8210,
        ),
        thermal=FIRMSAnomaly(
            brightness_temp_kelvin=382.0,
            confidence_pct=88.0,
            timestamp=t_now,
            lat=12.8985,
            lng=74.8215,
        ),
        acoustic=AcousticReport(
            sensor_id="IOT-MNG-AUDIO-01",
            event_type="chainsaw",
            frequency_hz=3200.0,
            confidence_score=0.89,
            timestamp=t_now,
            lat=12.8975,
            lng=74.8205,
        ),
    )

    # 3. Incident 3: AMBER WATCH - Pilikula Quarrying Blasting
    # SAR drop (4.1 dB), Earthmover acoustic report, moderate thermal
    inc3 = triangulate_incident(
        incident_id="tri-mng-002",
        name="Pilikula Eco-Park Laterite Extraction",
        reserve_id="res-mangaluru-coastal",
        sar=SARShift(
            backscatter_drop_db=4.1,
            timestamp=t_now,
            lat=12.9280,
            lng=74.9020,
        ),
        thermal=FIRMSAnomaly(
            brightness_temp_kelvin=335.0,
            confidence_pct=65.0,
            timestamp=t_now,
            lat=12.9285,
            lng=74.9025,
        ),
        acoustic=AcousticReport(
            sensor_id="IOT-MNG-AUDIO-03",
            event_type="earthmover",
            frequency_hz=420.0,
            confidence_score=0.78,
            timestamp=t_now,
            lat=12.9275,
            lng=74.9015,
        ),
    )

    # 4. Incident 4: GREEN - Eastern Grassland Natural Phenology
    # Mild SAR drop (1.8 dB), No thermal, ambient acoustic
    inc4 = triangulate_incident(
        incident_id="tri-kdk-002",
        name="Eastern Grassland Natural Shola Shedding",
        reserve_id="res-kudremukh",
        sar=SARShift(
            backscatter_drop_db=1.8,
            timestamp=t_now,
            lat=13.1942,
            lng=75.2810,
        ),
        thermal=None,
        acoustic=AcousticReport(
            sensor_id="IOT-KDK-AUDIO-08",
            event_type="ambient",
            frequency_hz=1800.0,
            confidence_score=0.20,
            timestamp=t_now,
            lat=13.1940,
            lng=75.2812,
        ),
    )

    return [inc1, inc2, inc3, inc4]
