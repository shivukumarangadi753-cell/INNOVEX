import heapq
import math
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from shapely.geometry import LineString, mapping

# ---------------------------------------------------------------------------
# Kudremukh Digital Elevation Model (DEM) Parameters
# Grid covers ~13.08°N to 13.26°N and 75.16°E to 75.32°E
# ---------------------------------------------------------------------------
ORIGIN_LAT = 13.2600
ORIGIN_LNG = 75.1600
GRID_ROWS = 120
GRID_COLS = 120
CELL_DEG = 0.0015  # ~165 meters per cell
CELL_M = 165.0     # Horizontal ground distance in meters


def generate_kudremukh_dem() -> np.ndarray:
    """Generate a realistic Digital Elevation Model (DEM) for Kudremukh National Park.

    Includes:
    - Kudremukh Peak (1,894m) in South-Central area
    - Shola grassland high ridges (1,200m - 1,600m)
    - River valleys and gorges (Bhadra basin) dropping to 600m
    - Planted impassable steep cliffs (>38° slope) on direct northern ridgeline
    """
    dem = np.zeros((GRID_ROWS, GRID_COLS), dtype=np.float32)

    # Base elevation: rolling foothills ~ 700m
    y, x = np.mgrid[0:GRID_ROWS, 0:GRID_COLS]

    # Kudremukh Peak Massif (centered around row 75, col 65)
    dist_peak = np.sqrt((y - 75) ** 2 + (x - 65) ** 2)
    peak_elevation = 1894.0 * np.exp(-(dist_peak ** 2) / (2 * (25 ** 2)))

    # Northern Ridge Massif (centered around row 30, col 50)
    dist_north = np.sqrt((y - 30) ** 2 + (x - 50) ** 2)
    north_elevation = 1450.0 * np.exp(-(dist_north ** 2) / (2 * (20 ** 2)))

    # River gorge drainage running West to East through row 55
    river_valley = 250.0 * np.exp(-((y - 55) ** 2) / 12.0)

    dem = 650.0 + peak_elevation * 0.65 + north_elevation * 0.40 - river_valley
    # Natural minor ruggedness
    np.random.seed(42)
    noise = np.random.normal(0, 4.0, (GRID_ROWS, GRID_COLS))
    dem = np.clip(dem + noise, 550.0, 1894.0)

    # Plant a steep cliff zone (>40° slope) directly between row 45..52, col 48..56
    # An abrupt 160m vertical wall over 1 cell (~165m) creates a 44° impassable cliff
    dem[45:52, 48:56] += 160.0

    return dem.astype(np.float32)


# Pre-computed cached DEM
_GLOBAL_DEM = generate_kudremukh_dem()


def latlng_to_grid(lat: float, lng: float) -> Tuple[int, int]:
    """Convert WGS84 geographic coordinates to DEM grid row, col."""
    row = int(round((ORIGIN_LAT - lat) / CELL_DEG))
    col = int(round((lng - ORIGIN_LNG) / CELL_DEG))
    row = max(0, min(GRID_ROWS - 1, row))
    col = max(0, min(GRID_COLS - 1, col))
    return row, col


def grid_to_latlng(row: int, col: int) -> Tuple[float, float]:
    """Convert DEM grid row, col to WGS84 geographic coordinates."""
    lat = round(ORIGIN_LAT - row * CELL_DEG, 6)
    lng = round(ORIGIN_LNG + col * CELL_DEG, 6)
    return lat, lng


# ---------------------------------------------------------------------------
# Tobler's Hiking Velocity Function & Slope Physics
# ---------------------------------------------------------------------------

def tobler_hiking_velocity(slope_gradient: float) -> float:
    """Calculate walking speed (km/h) given slope gradient tan(theta) = dz / dx.

    Waldo Tobler's empirical formula:
        W = 6.0 * exp(-3.5 * abs(slope_gradient + 0.05))
    - Flat ground (gradient 0): ~5.03 km/h
    - Gentle downhill (-0.05): ~6.0 km/h (optimal human pacing)
    - Steep uphill (+0.36 = 20°): ~1.41 km/h
    """
    velocity = 6.0 * math.exp(-3.5 * abs(slope_gradient + 0.05))
    return max(0.1, min(6.0, velocity))


def compute_segment_cost(
    r1: int, c1: int, z1: float,
    r2: int, c2: int, z2: float
) -> Tuple[float, float, float]:
    """Calculate travel time (minutes), slope in degrees, and distance (meters) between adjacent cells.

    Returns: (time_minutes, slope_degrees, horizontal_dist_meters)
    If slope exceeds 38°, returns infinity (impassable cliff barrier).
    """
    dr = abs(r2 - r1)
    dc = abs(c2 - c1)

    if dr == 1 and dc == 1:
        d_horiz = CELL_M * math.sqrt(2.0)  # Diagonal step ~233.3m
    else:
        d_horiz = CELL_M                  # Orthogonal step ~165.0m

    dz = z2 - z1
    gradient = dz / d_horiz
    slope_deg = math.degrees(math.atan(abs(gradient)))

    # HARD CONSTRAINT: Slopes > 38 degrees are impassable cliffs in Western Ghats
    if slope_deg > 38.0:
        return float("inf"), slope_deg, d_horiz

    # Tobler velocity in km/h
    vel_kmh = tobler_hiking_velocity(gradient)
    d_km = d_horiz / 1000.0
    time_minutes = (d_km / vel_kmh) * 60.0

    return time_minutes, slope_deg, d_horiz


# ---------------------------------------------------------------------------
# Forest Patrol Bases & Checkposts
# ---------------------------------------------------------------------------

PATROL_STATIONS = {
    "kudremukh_hq": {
        "id": "kudremukh_hq",
        "name": "Kudremukh Forest Range HQ (Kalasa Road)",
        "lat": 13.2050,
        "lng": 75.2450,
        "description": "Primary range headquarters with vehicle depot and field patrol barracks",
    },
    "mullodi_camp": {
        "id": "mullodi_camp",
        "name": "Mullodi Base Camp & Peak Trailhead",
        "lat": 13.1520,
        "lng": 75.2850,
        "description": "High-altitude anti-poaching camp positioned along eastern mountain saddle",
    },
    "kerekatte_post": {
        "id": "kerekatte_post",
        "name": "Kerekatte Wildlife Anti-Poaching Camp",
        "lat": 13.2350,
        "lng": 75.1950,
        "description": "North-western river crossing patrol post monitoring riparian elephant corridor",
    },
}


def find_nearest_station(target_lat: float, target_lng: float) -> dict:
    """Find the closest patrol station to target coordinates by Euclidean distance."""
    best_station = None
    min_dist = float("inf")
    for station in PATROL_STATIONS.values():
        d = math.hypot(station["lat"] - target_lat, station["lng"] - target_lng)
        if d < min_dist:
            min_dist = d
            best_station = station
    return best_station or list(PATROL_STATIONS.values())[0]


# ---------------------------------------------------------------------------
# A* Pathfinding Engine
# ---------------------------------------------------------------------------

def calculate_tactical_patrol_route(
    start_lat: float,
    start_lng: float,
    target_lat: float,
    target_lng: float,
    station_info: dict,
    alert_id: str = "target",
) -> Dict[str, Any]:
    """Execute A* pathfinding using Tobler's slope cost and return full tactical route payload."""
    dem = _GLOBAL_DEM

    start_r, start_c = latlng_to_grid(start_lat, start_lng)
    goal_r, goal_c = latlng_to_grid(target_lat, target_lng)

    # 8-connectivity offsets
    neighbors = [
        (-1, 0), (1, 0), (0, -1), (0, 1),
        (-1, -1), (-1, 1), (1, -1), (1, 1)
    ]

    # Priority Queue for A*: (f_score, g_score, (r, c))
    start_pos = (start_r, start_c)
    goal_pos = (goal_r, goal_c)

    # Admissible Heuristic: Euclidean distance at max speed (6 km/h = 100 m/min)
    def heuristic(r: int, c: int) -> float:
        dist_m = math.hypot(r - goal_r, c - goal_c) * CELL_M
        return (dist_m / 1000.0 / 6.0) * 60.0

    g_score: Dict[Tuple[int, int], float] = {start_pos: 0.0}
    came_from: Dict[Tuple[int, int], Tuple[int, int]] = {}
    slope_records: Dict[Tuple[int, int], float] = {start_pos: 0.0}

    open_heap = [(heuristic(start_r, start_c), 0.0, start_pos)]
    visited = set()

    found = False
    while open_heap:
        _, current_g, current = heapq.heappop(open_heap)

        if current in visited:
            continue
        visited.add(current)

        if current == goal_pos:
            found = True
            break

        cr, cc = current
        cz = dem[cr, cc]

        for dr, dc in neighbors:
            nr, nc = cr + dr, cc + dc
            if 0 <= nr < GRID_ROWS and 0 <= nc < GRID_COLS:
                nz = dem[nr, nc]
                seg_time, slope_deg, _ = compute_segment_cost(cr, cc, cz, nr, nc, nz)

                if math.isinf(seg_time):
                    # Hard barrier (cliff > 38°)
                    continue

                tentative_g = current_g + seg_time
                neighbor = (nr, nc)

                if tentative_g < g_score.get(neighbor, float("inf")):
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    slope_records[neighbor] = slope_deg
                    f_score = tentative_g + heuristic(nr, nc)
                    heapq.heappush(open_heap, (f_score, tentative_g, neighbor))

    # Reconstruct path
    path_nodes = []
    if found:
        curr = goal_pos
        while curr in came_from:
            path_nodes.append(curr)
            curr = came_from[curr]
        path_nodes.append(start_pos)
        path_nodes.reverse()
    else:
        # Fallback linear waypoint interpolation if terrain completely walled off
        steps = 15
        path_nodes = [
            (int(start_r + (goal_r - start_r) * i / steps), int(start_c + (goal_c - start_c) * i / steps))
            for i in range(steps + 1)
        ]

    # Calculate route telemetry
    coords_3d = []
    total_dist_m = 0.0
    elev_gain = 0.0
    elev_loss = 0.0
    slopes = []

    for i, (r, c) in enumerate(path_nodes):
        lat, lng = grid_to_latlng(r, c)
        z = float(dem[r, c])
        coords_3d.append([lng, lat, round(z, 1)])

        if i > 0:
            prev_r, prev_c = path_nodes[i - 1]
            prev_z = float(dem[prev_r, prev_c])
            dz = z - prev_z
            if dz > 0:
                elev_gain += dz
            else:
                elev_loss += dz

            dr = abs(r - prev_r)
            dc = abs(c - prev_c)
            step_m = CELL_M * math.sqrt(2.0) if (dr == 1 and dc == 1) else CELL_M
            total_dist_m += step_m

            s_deg = slope_records.get((r, c), 0.0)
            slopes.append(s_deg)

    total_dist_km = round(total_dist_m / 1000.0, 2)
    total_time_mins = round(g_score.get(goal_pos, (total_dist_km / 4.0) * 60.0), 1)

    # Slope Breakdown
    flat_steps = sum(1 for s in slopes if s < 10.0)
    mod_steps = sum(1 for s in slopes if 10.0 <= s < 25.0)
    steep_steps = sum(1 for s in slopes if s >= 25.0)
    total_steps = max(1, len(slopes))

    max_slope = round(max(slopes) if slopes else 0.0, 1)

    slope_summary = {
        "flat_pct": round((flat_steps / total_steps) * 100, 1),
        "moderate_pct": round((mod_steps / total_steps) * 100, 1),
        "steep_pct": round((steep_steps / total_steps) * 100, 1),
        "max_slope_deg": max_slope,
    }

    # Final tactical approach bearing
    p_last = path_nodes[-1]
    p_prev = path_nodes[-2] if len(path_nodes) > 1 else path_nodes[0]
    d_lat = (ORIGIN_LAT - p_last[0] * CELL_DEG) - (ORIGIN_LAT - p_prev[0] * CELL_DEG)
    d_lng = (ORIGIN_LNG + p_last[1] * CELL_DEG) - (ORIGIN_LNG + p_prev[1] * CELL_DEG)
    bearing_deg = int((math.degrees(math.atan2(d_lng, d_lat)) + 360) % 360)

    # Tactical Advice Synthesizer
    advice = [
        f"Departure Point: {station_info['name']} (Elevation: {int(dem[start_r, start_c])}m MSL).",
        f"Calculated least-time march: {total_dist_km} km in ~{int(total_time_mins)} minutes using Tobler slope dynamics.",
    ]

    if max_slope > 25.0:
        advice.append(
            f"Caution: Encountered steep {max_slope}° incline on approach; A* router navigated around >38° cliff barrier."
        )
    else:
        advice.append("Terrain is predominantly moderate contour walking along ridgeline trail.")

    advice.append(
        f"Final approach vector: Infiltrate alert perimeter at bearing {bearing_deg}° using natural shola canopy for stealth."
    )

    if total_time_mins > 45:
        advice.append("Estimated round-trip > 90 mins: Ensure VHF radio repeater check and secondary water filtration pack.")

    # GeoJSON Feature LineString
    line_geom = LineString(coords_3d)
    route_geojson = {
        "type": "Feature",
        "properties": {
            "name": f"Tactical Patrol Route to {alert_id}",
            "station": station_info["name"],
            "distance_km": total_dist_km,
            "time_mins": total_time_mins,
            "elevation_gain_m": round(elev_gain, 1),
            "elevation_loss_m": round(elev_loss, 1),
        },
        "geometry": mapping(line_geom),
    }

    return {
        "alert_id": alert_id,
        "station": station_info,
        "target_centroid": {"lat": target_lat, "lng": target_lng},
        "total_distance_km": total_dist_km,
        "estimated_time_mins": total_time_mins,
        "elevation_gain_m": round(elev_gain, 1),
        "elevation_loss_m": round(elev_loss, 1),
        "slope_summary": slope_summary,
        "route_geojson": route_geojson,
        "tactical_advice": advice,
        "data_mode": "demo",
    }
