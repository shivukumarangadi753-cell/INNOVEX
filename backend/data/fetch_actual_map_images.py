"""
Fetches actual real-world satellite map imagery for all PRAKRITI-NETRA alerts
(Mangalore & Kudremukh) and creates authentic Before and After comparison image pairs:
- Before: Shows intact green trees, vegetation, and water bodies.
- After: The trees are visibly cleared/removed to bare ground/soil, with ONLY a prominent red boundary outline (NO tint/overlay).
"""

import io
import math
import sys
from pathlib import Path
from typing import Dict, List, Tuple

import httpx
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_ALERTS_BACKEND = BASE_DIR / "static" / "alerts"
STATIC_ALERTS_FRONTEND = BASE_DIR.parent / "frontend" / "public" / "static" / "alerts"

STATIC_ALERTS_BACKEND.mkdir(parents=True, exist_ok=True)
STATIC_ALERTS_FRONTEND.mkdir(parents=True, exist_ok=True)

# ESRI World Imagery Tile Server
TILE_URL_TEMPLATE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

# Alert targets with exact coordinates, zoom, and disturbance metadata
ALERTS_CONFIG = [
    {
        "id": "alt-mng-001",
        "name": "Gurupura Estuary Tannirbhavi Mangrove Clearing",
        "lat": 12.8980,
        "lng": 74.8210,
        "zoom": 16,
        "type": "mangrove_clearing",
        "t1": "15 OCT 2025",
        "t2": "18 NOV 2025",
        "metric": "TREES FELLED: 2.8 ha | ΔNDVI: -0.60",
    },
    {
        "id": "alt-mng-002",
        "name": "Kavoor Lake Shoreline Wetland Infill",
        "lat": 12.9350,
        "lng": 74.8580,
        "zoom": 16,
        "type": "lake_infill",
        "t1": "20 SEP 2025",
        "t2": "15 NOV 2025",
        "metric": "WETLAND CLEARED: 1.5 ha | ΔNDWI: -0.48",
    },
    {
        "id": "alt-mng-003",
        "name": "Pilikula Nisargadhama Eco-Park Canopy Clearing",
        "lat": 12.9280,
        "lng": 74.9020,
        "zoom": 16,
        "type": "laterite_quarry",
        "t1": "02 OCT 2025",
        "t2": "18 NOV 2025",
        "metric": "FOREST CLEARED: 3.2 ha | LATERITE EXPOSED",
    },
    {
        "id": "alt-001",
        "name": "Kudremukh South Ridge Clearing",
        "lat": 13.2215,
        "lng": 75.2548,
        "zoom": 16,
        "type": "forest_clearing",
        "t1": "06 NOV 2025",
        "t2": "18 NOV 2025",
        "metric": "CANOPY LOSS: 2.4 ha | ΔNDVI: -0.65",
    },
    {
        "id": "alt-002",
        "name": "Eastern Grassland Burn Scar",
        "lat": 13.1942,
        "lng": 75.2810,
        "zoom": 16,
        "type": "fire_scar",
        "t1": "05 NOV 2025",
        "t2": "17 NOV 2025",
        "metric": "GRASSLAND BURNED: 5.1 ha | dNBR: -0.72",
    },
    {
        "id": "alt-003",
        "name": "Northwest Buffer Road Encroachment",
        "lat": 13.2450,
        "lng": 75.2390,
        "zoom": 16,
        "type": "road_clearing",
        "t1": "02 NOV 2025",
        "t2": "14 NOV 2025",
        "metric": "ROADSIDE BUFFER FELLED: 1.8 ha",
    },
]


def deg2tile(lat_deg: float, lon_deg: float, zoom: int) -> Tuple[float, float]:
    """Calculate continuous tile coordinates (float) for given lat/lon/zoom."""
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = (lon_deg + 180.0) / 360.0 * n
    ytile = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n
    return (xtile, ytile)


def fetch_tile(x: int, y: int, z: int, client: httpx.Client) -> Image.Image:
    """Download single 256x256 map tile from ESRI World Imagery."""
    url = TILE_URL_TEMPLATE.format(x=x, y=y, z=z)
    try:
        resp = client.get(url, headers={"User-Agent": "PrakritiNetra/1.0"})
        if resp.status_code == 200:
            return Image.open(io.BytesIO(resp.content)).convert("RGB")
    except Exception as exc:
        print(f"Failed to fetch tile {z}/{y}/{x}: {exc}")
    return Image.new("RGB", (256, 256), color=(34, 60, 42))


def fetch_centered_satellite_map(lat: float, lng: float, zoom: int, client: httpx.Client) -> Image.Image:
    """
    Stitches a 3x3 grid of actual satellite tiles and precisely crops
    a 512x512 image centered on (lat, lng).
    """
    fx, fy = deg2tile(lat, lng, zoom)
    center_x = int(math.floor(fx))
    center_y = int(math.floor(fy))

    stitched = Image.new("RGB", (256 * 3, 256 * 3))
    for i, dx in enumerate([-1, 0, 1]):
        for j, dy in enumerate([-1, 0, 1]):
            tile_x = center_x + dx
            tile_y = center_y + dy
            tile_img = fetch_tile(tile_x, tile_y, zoom, client)
            stitched.paste(tile_img, (i * 256, j * 256))

    pixel_x = int((fx - (center_x - 1)) * 256)
    pixel_y = int((fy - (center_y - 1)) * 256)

    left = max(0, min(pixel_x - 256, 768 - 512))
    top = max(0, min(pixel_y - 256, 768 - 512))
    return stitched.crop((left, top, left + 512, top + 512))


def get_disturbance_polygon(dist_type: str) -> List[Tuple[int, int]]:
    """Returns the precise disturbance perimeter polygon coordinates."""
    cx, cy = 256, 256

    if dist_type == "mangrove_clearing":
        return [
            (cx - 65, cy - 75),
            (cx + 85, cy - 95),
            (cx + 125, cy + 30),
            (cx + 55, cy + 115),
            (cx - 55, cy + 85),
            (cx - 85, cy - 5),
        ]
    elif dist_type == "lake_infill":
        return [
            (cx - 25, cy - 95),
            (cx + 115, cy - 75),
            (cx + 130, cy + 55),
            (cx + 15, cy + 75),
            (cx - 35, cy + 15),
        ]
    elif dist_type == "laterite_quarry":
        return [
            (cx - 95, cy - 70),
            (cx + 80, cy - 85),
            (cx + 125, cy + 55),
            (cx + 40, cy + 120),
            (cx - 70, cy + 100),
            (cx - 115, cy + 15),
        ]
    elif dist_type == "fire_scar":
        return [
            (cx - 100, cy - 85),
            (cx + 105, cy - 65),
            (cx + 130, cy + 70),
            (cx + 30, cy + 125),
            (cx - 85, cy + 90),
            (cx - 125, cy - 15),
        ]
    elif dist_type == "road_clearing":
        return [
            (cx - 110, cy - 40),
            (cx + 110, cy - 60),
            (cx + 115, cy + 15),
            (cx - 105, cy + 35),
        ]
    else:
        # Standard forest clearing
        return [
            (cx - 75, cy - 75),
            (cx + 85, cy - 65),
            (cx + 100, cy + 75),
            (cx + 20, cy + 105),
            (cx - 80, cy + 75),
        ]


def generate_cleared_after_image(base_img: Image.Image, dist_type: str) -> Image.Image:
    """
    Transforms the satellite image so the trees inside the polygon are visibly GONE
    (replaced by realistic bare earth, soil, dirt, and tire tracks), with ONLY
    a crisp red boundary line around the perimeter (NO color tint or overlay fill).
    """
    width, height = base_img.size
    poly = get_disturbance_polygon(dist_type)

    # Create binary mask for the disturbance polygon
    mask_img = Image.new("L", (width, height), 0)
    draw_mask = ImageDraw.Draw(mask_img)
    draw_mask.polygon(poly, fill=255)

    # Convert base satellite image to numpy array
    base_arr = np.array(base_img).astype(np.float32)
    mask_arr = np.array(mask_img) > 0

    # Extract satellite luminosity / brightness texture to preserve realistic terrain 3D contours
    gray_lum = 0.299 * base_arr[:, :, 0] + 0.587 * base_arr[:, :, 1] + 0.114 * base_arr[:, :, 2]
    # Normalize luminosity around 1.0
    norm_lum = gray_lum / (np.mean(gray_lum) + 1e-5)
    norm_lum = np.clip(norm_lum, 0.6, 1.4)

    np.random.seed(42)
    noise = np.random.normal(0, 8, (height, width))

    cleared_arr = base_arr.copy()

    # Generate realistic bare ground based on biome type
    if dist_type == "mangrove_clearing":
        # Wet tidal silt / muddy dredged sand (tan-gray-brown mud)
        target_r = np.clip(148 * norm_lum + noise, 70, 210)
        target_g = np.clip(132 * norm_lum + noise * 0.8, 60, 195)
        target_b = np.clip(110 * norm_lum + noise * 0.6, 50, 175)

    elif dist_type == "laterite_quarry":
        # Mangalore terracotta/rust-red laterite exposed subsoil
        target_r = np.clip(185 * norm_lum + noise * 1.2, 110, 235)
        target_g = np.clip(78 * norm_lum + noise * 0.5, 45, 125)
        target_b = np.clip(54 * norm_lum + noise * 0.4, 30, 95)

    elif dist_type == "lake_infill":
        # Compacted concrete/stone debris & construction landfill (neutral stone gray-tan)
        target_r = np.clip(168 * norm_lum + noise, 90, 220)
        target_g = np.clip(162 * norm_lum + noise, 85, 215)
        target_b = np.clip(152 * norm_lum + noise, 80, 205)

    elif dist_type == "fire_scar":
        # Charcoal black & dark ash gray ground
        target_r = np.clip(45 * norm_lum + noise * 0.4, 20, 85)
        target_g = np.clip(42 * norm_lum + noise * 0.4, 18, 80)
        target_b = np.clip(40 * norm_lum + noise * 0.4, 15, 78)

    else:
        # Western Ghats tropical forest clearing (dry brown topsoil and bare dirt)
        target_r = np.clip(155 * norm_lum + noise, 80, 215)
        target_g = np.clip(125 * norm_lum + noise * 0.7, 65, 185)
        target_b = np.clip(88 * norm_lum + noise * 0.5, 45, 140)

    # Apply cleared ground ONLY where mask is True (where trees were removed)
    cleared_arr[mask_arr, 0] = target_r[mask_arr]
    cleared_arr[mask_arr, 1] = target_g[mask_arr]
    cleared_arr[mask_arr, 2] = target_b[mask_arr]

    # Convert back to PIL image
    after_img = Image.fromarray(np.clip(cleared_arr, 0, 255).astype(np.uint8))

    # Add realistic haul tracks / bulldozer tread lines inside the cleared area
    track_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    track_draw = ImageDraw.Draw(track_layer)

    cx, cy = 256, 256
    track_color = (60, 50, 40, 160) if dist_type != "fire_scar" else (20, 20, 20, 180)
    track_draw.line([(cx - 45, cy - 35), (cx + 65, cy + 45)], fill=track_color, width=3)
    track_draw.line([(cx - 25, cy - 45), (cx + 75, cy + 15)], fill=track_color, width=2)
    after_img.paste(track_layer, (0, 0), track_layer)

    # Soften transition at polygon boundary slightly so it looks natural
    feathered_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=1.5))
    after_img = Image.composite(after_img, base_img, feathered_mask)

    # -------------------------------------------------------------------------
    # DRAW ONLY A CLEAN RED BOUNDARY LINE (NO FILL OVERLAY)
    # -------------------------------------------------------------------------
    boundary_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(boundary_layer)

    # Crisp red outline (#EF4444)
    # Draw double stroke: dark outer hairline for contrast + bright red main stroke
    b_draw.polygon(poly, outline=(0, 0, 0, 200), width=5)
    b_draw.polygon(poly, outline=(239, 68, 68, 255), width=3)

    # Corner marker crosshairs along the boundary
    for pt in poly:
        b_draw.ellipse([pt[0] - 3, pt[1] - 3, pt[0] + 3, pt[1] + 3], fill=(255, 255, 255, 255), outline=(239, 68, 68, 255))

    after_img = Image.alpha_composite(after_img.convert("RGBA"), boundary_layer).convert("RGB")
    return after_img


def add_satellite_hud(img: Image.Image, is_after: bool, cfg: dict) -> Image.Image:
    """Adds subtle professional satellite HUD metadata ribbons to the image."""
    res = img.copy()

    # Top banner bar (semi-transparent dark navy)
    top_bar = Image.new("RGBA", (512, 28), (15, 23, 42, 210))
    res.paste(top_bar, (0, 0), top_bar)

    # Bottom telemetry bar
    bottom_bar = Image.new("RGBA", (512, 24), (15, 23, 42, 210))
    res.paste(bottom_bar, (0, 488), bottom_bar)

    draw = ImageDraw.Draw(res)
    # Header text
    mode_text = "PASS T2 (AFTER) • TREES CLEARED [RED BOUNDARY]" if is_after else "PASS T1 (BEFORE) • INTACT FOREST CANOPY"
    color = (252, 165, 165) if is_after else (187, 247, 208)

    draw.text((10, 7), mode_text, fill=color)
    draw.text((345, 7), "ESRI SATELLITE 16X", fill=(203, 213, 225))

    # Bottom telemetry
    date_str = cfg["t2"] if is_after else cfg["t1"]
    draw.text((10, 493), f"DATE: {date_str} • {cfg['name'][:35]}", fill=(226, 232, 240))
    if is_after:
        draw.text((320, 493), cfg["metric"][:26], fill=(254, 202, 202))

    return res


def generate_all_actual_map_images():
    """Main routine: fetches actual map tiles and outputs all before/after images."""
    print("Connecting to satellite tile service (ESRI World Imagery)...")
    with httpx.Client(timeout=25.0) as client:
        for cfg in ALERTS_CONFIG:
            alert_id = cfg["id"]
            lat = cfg["lat"]
            lng = cfg["lng"]
            zoom = cfg["zoom"]
            dist_type = cfg["type"]

            print(f"Generating realistic comparison for {alert_id} ({cfg['name']})...")

            # 1. Fetch pristine actual satellite map image (intact trees & canopy)
            base_map = fetch_centered_satellite_map(lat, lng, zoom, client)

            # 2. Before Image (Trees intact with clean HUD)
            before_img = add_satellite_hud(base_map, is_after=False, cfg=cfg)

            # 3. After Image (Trees cleared to bare earth + RED BOUNDARY ONLY + clean HUD)
            cleared_map = generate_cleared_after_image(base_map, dist_type)
            after_img = add_satellite_hud(cleared_map, is_after=True, cfg=cfg)

            # Save to both backend and frontend static folders with all naming aliases
            b_name = f"{alert_id}_before.png"
            a_name = f"{alert_id}_after.png"
            b_alias = f"{alert_id.replace('alt-', 'alert-')}_before.png"
            a_alias = f"{alert_id.replace('alt-', 'alert-')}_after.png"

            for name in [b_name, b_alias]:
                before_img.save(STATIC_ALERTS_BACKEND / name, "PNG")
                before_img.save(STATIC_ALERTS_FRONTEND / name, "PNG")

            for name in [a_name, a_alias]:
                after_img.save(STATIC_ALERTS_BACKEND / name, "PNG")
                after_img.save(STATIC_ALERTS_FRONTEND / name, "PNG")

            print(f"  ✓ Saved realistic comparison: {b_name} & {a_name}")

    print("\nAll actual satellite map images have been updated successfully!")


if __name__ == "__main__":
    generate_all_actual_map_images()
