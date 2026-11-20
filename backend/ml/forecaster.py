"""
Predictive Spatial AI: Future Encroachment Forecaster Engine.
Computes 45-day forward spatial clearing probabilities using a multivariate
spatial decay model (road proximity, cluster diffusion, and slope accessibility).
"""

import math
from typing import Any, Dict, List, Optional, Tuple


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
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


def compute_road_decay(dist_meters: float, lambda_r: float = 300.0) -> float:
    """Exponential decay of road accessibility risk over distance."""
    return math.exp(-max(0.0, dist_meters) / lambda_r)


def compute_cluster_decay(dist_meters: float, lambda_c: float = 500.0) -> float:
    """Exponential decay of encroachment diffusion risk from known clusters."""
    return math.exp(-max(0.0, dist_meters) / lambda_c)


def compute_slope_accessibility(slope_degrees: float) -> float:
    """
    Logistic accessibility based on terrain slope.
    Slopes < 10° allow heavy earthmovers and tractors (high accessibility).
    Slopes > 25° severely inhibit clearing and road building.
    """
    # Sigmoid centered around 14 degrees with slope steepness 3.0
    return 1.0 / (1.0 + math.exp((slope_degrees - 14.0) / 3.0))


def compute_clearing_probability(
    dist_road_m: float,
    dist_cluster_m: float,
    slope_deg: float,
    dist_water_m: float = 400.0,
) -> Tuple[float, Dict[str, float]]:
    """
    Computes calibrated 45-day clearing probability P in [0.0, 1.0] and factor scores.
    """
    r_score = compute_road_decay(dist_road_m)
    c_score = compute_cluster_decay(dist_cluster_m)
    s_score = compute_slope_accessibility(slope_deg)
    w_score = math.exp(-max(0.0, dist_water_m) / 600.0)

    # Multivariate linear combination
    z = 0.38 * r_score + 0.32 * c_score + 0.20 * s_score + 0.10 * w_score - 0.22

    # Scaled sigmoid mapping into probability
    prob = 1.0 / (1.0 + math.exp(-5.5 * (z - 0.40)))
    prob = round(max(0.05, min(0.98, prob)), 3)

    factors = {
        "road_proximity_score": round(r_score, 2),
        "cluster_diffusion_score": round(c_score, 2),
        "slope_accessibility_score": round(s_score, 2),
        "watercourse_proximity_score": round(w_score, 2),
        "dist_road_meters": int(dist_road_m),
        "slope_degrees": round(slope_deg, 1),
    }

    return prob, factors


# Baseline Spatial Risk Sectors (Mangaluru Coastal & Kudremukh National Park)
KNOWN_RISK_ZONES_CONFIG = [
    {
        "id": "zone-b-4",
        "code": "Zone B-4",
        "name": "Tannirbhavi North Estuary Fringe",
        "reserve_id": "res-mangaluru-coastal",
        "centroid": {"lat": 12.9035, "lng": 74.8235},
        "dist_road_m": 120.0,
        "dist_cluster_m": 350.0,
        "slope_deg": 6.0,
        "dist_water_m": 90.0,
        "polygon_coords": [
            [74.8210, 12.9015],
            [74.8265, 12.9020],
            [74.8270, 12.9055],
            [74.8220, 12.9050],
            [74.8210, 12.9015],
        ],
        "primary_driver": "Proximity to newly graded unpaved dirt track (120m) & flat coastal wetland",
        "recommended_action": "Establish Forest Checkpoint & dispatch daily UAV drone patrol",
    },
    {
        "id": "zone-m-2",
        "code": "Zone M-2",
        "name": "Kavoor Lake South Wetland Extension",
        "reserve_id": "res-mangaluru-coastal",
        "centroid": {"lat": 12.9315, "lng": 74.8610},
        "dist_road_m": 180.0,
        "dist_cluster_m": 290.0,
        "slope_deg": 3.5,
        "dist_water_m": 40.0,
        "polygon_coords": [
            [74.8585, 12.9295],
            [74.8635, 12.9300],
            [74.8640, 12.9335],
            [74.8590, 12.9330],
            [74.8585, 12.9295],
        ],
        "primary_driver": "Active debris infill diffusion along vulnerable lake shoreline boundary",
        "recommended_action": "Deploy concrete boundary pillars and issue stop-work injunction",
    },
    {
        "id": "zone-p-1",
        "code": "Zone P-1",
        "name": "Pilikula Western Ridge Seam",
        "reserve_id": "res-mangaluru-coastal",
        "centroid": {"lat": 12.9250, "lng": 74.8970},
        "dist_road_m": 150.0,
        "dist_cluster_m": 310.0,
        "slope_deg": 8.0,
        "dist_water_m": 550.0,
        "polygon_coords": [
            [74.8940, 12.9230],
            [74.9000, 12.9235],
            [74.9005, 12.9270],
            [74.8945, 12.9265],
            [74.8940, 12.9230],
        ],
        "primary_driver": "Laterite bedrock seam exposed adjacent to commercial quarry access lane",
        "recommended_action": "Install seismic vibration sensors and night patrol trail cameras",
    },
    {
        "id": "zone-k-1",
        "code": "Zone K-1",
        "name": "Kudremukh South Ridge Flank",
        "reserve_id": "res-kudremukh",
        "centroid": {"lat": 13.2260, "lng": 75.2585},
        "dist_road_m": 240.0,
        "dist_cluster_m": 410.0,
        "slope_deg": 11.0,
        "dist_water_m": 620.0,
        "polygon_coords": [
            [75.2560, 13.2240],
            [75.2615, 13.2245],
            [75.2620, 13.2280],
            [75.2565, 13.2275],
            [75.2560, 13.2240],
        ],
        "primary_driver": "Spillover logging progression from historical clearing alt-001",
        "recommended_action": "Range Forest Officer boundary transect and satellite cadence boost",
    },
    {
        "id": "zone-k-3",
        "code": "Zone K-3",
        "name": "Eastern Shola Meadow Basin",
        "reserve_id": "res-kudremukh",
        "centroid": {"lat": 13.1905, "lng": 75.2860},
        "dist_road_m": 380.0,
        "dist_cluster_m": 480.0,
        "slope_deg": 14.5,
        "dist_water_m": 710.0,
        "polygon_coords": [
            [75.2830, 13.1885],
            [75.2890, 13.1890],
            [75.2895, 13.1925],
            [75.2835, 13.1920],
            [75.2830, 13.1885],
        ],
        "primary_driver": "Combustible dry shola grassland adjacent to recent burn scar alt-002",
        "recommended_action": "Clear 10m firebreak buffer line and station mobile mist blower unit",
    },
]


def generate_forecast_geojson(reserve_id: Optional[str] = None, min_probability: float = 0.30) -> Dict[str, Any]:
    """
    Generates a GeoJSON FeatureCollection of all predicted risk zones,
    dynamically calculating probabilities and risk factors.
    """
    features = []

    for cfg in KNOWN_RISK_ZONES_CONFIG:
        if reserve_id and cfg["reserve_id"] != reserve_id:
            continue

        prob, factors = compute_clearing_probability(
            dist_road_m=cfg["dist_road_m"],
            dist_cluster_m=cfg["dist_cluster_m"],
            slope_deg=cfg["slope_deg"],
            dist_water_m=cfg["dist_water_m"],
        )

        if prob < min_probability:
            continue

        if prob >= 0.75:
            tier = "CRITICAL"
            color = "#EF4444"
        elif prob >= 0.50:
            tier = "HIGH"
            color = "#F59E0B"
        else:
            tier = "MODERATE"
            color = "#EAB308"

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [cfg["polygon_coords"]],
            },
            "properties": {
                "id": cfg["id"],
                "code": cfg["code"],
                "name": cfg["name"],
                "reserve_id": cfg["reserve_id"],
                "probability": prob,
                "probability_pct": int(prob * 100),
                "risk_tier": tier,
                "color": color,
                "projected_horizon_days": 45,
                "primary_driver": cfg["primary_driver"],
                "recommended_action": cfg["recommended_action"],
                "centroid": cfg["centroid"],
                "factors": factors,
            },
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "model": "Prakriti Multivariate Spatial Hazard Kernel v2.4",
            "forecast_horizon_days": 45,
            "total_zones": len(features),
            "critical_count": sum(1 for f in features if f["properties"]["risk_tier"] == "CRITICAL"),
            "data_mode": "demo",
        },
    }
