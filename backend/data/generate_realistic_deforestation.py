"""
Generates visually compelling, realistic, high-resolution satellite imagery for before and after passes.
Ensures that the deforestation, wetland infill, quarrying, and burn scars are starkly,
unmistakably visible inside the red perimeter border.
"""

import math
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
from scipy.ndimage import gaussian_filter

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_ALERTS_BACKEND = BASE_DIR / "static" / "alerts"
STATIC_ALERTS_FRONTEND = BASE_DIR.parent / "frontend" / "public" / "static" / "alerts"

STATIC_ALERTS_BACKEND.mkdir(parents=True, exist_ok=True)
STATIC_ALERTS_FRONTEND.mkdir(parents=True, exist_ok=True)

# Configuration for alerts
ALERTS_DATA = [
    {
        "id": "alt-mng-001",
        "name": "Gurupura Estuary Tannirbhavi Mangrove Clearing",
        "district": "Dakshina Kannada (Mangaluru)",
        "coords": "12.8980° N, 74.8210° E",
        "dist_type": "mangrove_clearing",
        "area_ha": 2.8,
        "trees_felled": 1260,
        "delta_ndvi": "-0.62",
        "pass_t1": "2026-10-15 (Historical Pass)",
        "pass_t2": "2026-11-18 (Current Pass)",
        "poly": [
            (256 - 70, 256 - 80),
            (256 + 85, 256 - 95),
            (256 + 125, 256 + 30),
            (256 + 55, 256 + 115),
            (256 - 55, 256 + 85),
            (256 - 85, 256 - 5),
        ],
    },
    {
        "id": "alt-mng-002",
        "name": "Kavoor Lake Shoreline Wetland Infill",
        "district": "Dakshina Kannada (Mangaluru)",
        "coords": "12.9350° N, 74.8580° E",
        "dist_type": "lake_infill",
        "area_ha": 1.5,
        "trees_felled": 0,
        "delta_ndvi": "ΔNDWI: -0.48",
        "pass_t1": "2026-10-12 (Historical Pass)",
        "pass_t2": "2026-11-18 (Current Pass)",
        "poly": [
            (256 - 30, 256 - 95),
            (256 + 115, 256 - 75),
            (256 + 130, 256 + 55),
            (256 + 15, 256 + 75),
            (256 - 40, 256 + 15),
        ],
    },
    {
        "id": "alt-mng-003",
        "name": "Pilikula Nisargadhama Eco-Park Laterite Quarry",
        "district": "Dakshina Kannada (Mangaluru)",
        "coords": "12.9280° N, 74.9020° E",
        "dist_type": "laterite_quarry",
        "area_ha": 3.2,
        "trees_felled": 1440,
        "delta_ndvi": "-0.68",
        "pass_t1": "2026-09-30 (Historical Pass)",
        "pass_t2": "2026-11-18 (Current Pass)",
        "poly": [
            (256 - 95, 256 - 70),
            (256 + 80, 256 - 85),
            (256 + 125, 256 + 55),
            (256 + 40, 256 + 120),
            (256 - 70, 256 + 100),
            (256 - 115, 256 + 15),
        ],
    },
    {
        "id": "alt-001",
        "name": "Kudremukh South Ridge Clearing",
        "district": "Chikkamagaluru",
        "coords": "13.2215° N, 75.2548° E",
        "dist_type": "forest_clearing",
        "area_ha": 2.4,
        "trees_felled": 1080,
        "delta_ndvi": "-0.65",
        "pass_t1": "2026-10-18 (Historical Pass)",
        "pass_t2": "2026-11-18 (Current Pass)",
        "poly": [
            (256 - 75, 256 - 75),
            (256 + 85, 256 - 65),
            (256 + 100, 256 + 75),
            (256 + 20, 256 + 105),
            (256 - 80, 256 + 75),
        ],
    },
    {
        "id": "alt-002",
        "name": "Eastern Grassland Burn Scar",
        "district": "Kudremukh Shola Range",
        "coords": "13.1942° N, 75.2810° E",
        "dist_type": "fire_scar",
        "area_ha": 5.1,
        "trees_felled": 0,
        "delta_ndvi": "dNBR: -0.72",
        "pass_t1": "2026-11-01 (Historical Pass)",
        "pass_t2": "2026-11-18 (Current Pass)",
        "poly": [
            (256 - 100, 256 - 85),
            (256 + 105, 256 - 65),
            (256 + 130, 256 + 70),
            (256 + 30, 256 + 125),
            (256 - 85, 256 + 90),
            (256 - 125, 256 - 15),
        ],
    },
    {
        "id": "alt-003",
        "name": "Northwest Buffer Road Encroachment",
        "district": "Kudremukh Wildlife Division",
        "coords": "13.2450° N, 75.2390° E",
        "dist_type": "road_clearing",
        "area_ha": 1.8,
        "trees_felled": 810,
        "delta_ndvi": "-0.54",
        "pass_t1": "2026-10-25 (Historical Pass)",
        "pass_t2": "2026-11-18 (Current Pass)",
        "poly": [
            (256 - 110, 256 - 40),
            (256 + 110, 256 - 60),
            (256 + 115, 256 + 15),
            (256 - 105, 256 + 35),
        ],
    },
]


def load_or_create_base_satellite(alert_id: str, dist_type: str) -> Image.Image:
    """Loads the high-resolution base satellite tile from existing files if available."""
    candidates = [
        STATIC_ALERTS_FRONTEND / f"{alert_id}_before.png",
        STATIC_ALERTS_FRONTEND / f"{alert_id.replace('alt-', 'alert-')}_before.png",
        STATIC_ALERTS_BACKEND / f"{alert_id}_before.png",
    ]
    for c in candidates:
        if c.exists():
            img = Image.open(c).convert("RGB")
            # Crop away the previous HUD banners if present (lines 28..488)
            if img.size == (512, 512):
                cropped = img.crop((0, 28, 512, 488))
                # Resize back to 512x512
                return cropped.resize((512, 512), Image.Resampling.LANCZOS)
            return img.resize((512, 512), Image.Resampling.LANCZOS)

    # Fallback procedural realistic base if file is absent
    arr = np.zeros((512, 512, 3), dtype=np.uint8)
    if "mangrove" in dist_type:
        arr[:, :] = [25, 65, 40]
    elif "lake" in dist_type:
        arr[:, :] = [30, 75, 95]
    else:
        arr[:, :] = [35, 75, 42]
    return Image.fromarray(arr)


def generate_cleared_ground_texture(dist_type: str, seed: int = 42) -> np.ndarray:
    """
    Generates authentic sub-meter satellite textures for cleared terrain:
    - mangrove_clearing: Exposed dark saline silt, muddy excavator tracks, felled stumps.
    - lake_infill: Packed dry clay/gravel infill, earthmoving scraper lines, debris.
    - laterite_quarry: Intense red-orange laterite stone pit, stepped benches, stone dust.
    - forest_clearing: Exposed reddish-brown earth, tractor ruts, stripped canopy.
    - fire_scar: Pitch charcoal black ash, carbonized residue, scorched soil.
    - road_clearing: Graded gravel/dirt swath, linear bulldozer tracks.
    """
    np.random.seed(seed)
    h, w = 512, 512

    # Multiscale procedural noise for realistic satellite earth texture
    n1 = gaussian_filter(np.random.randn(h, w), sigma=12.0)
    n2 = gaussian_filter(np.random.randn(h, w), sigma=4.0)
    n3 = gaussian_filter(np.random.randn(h, w), sigma=1.5)
    noise = (n1 * 0.5 + n2 * 0.35 + n3 * 0.15)
    noise = (noise - noise.min()) / (noise.max() - noise.min() + 1e-6)

    # Base RGB for different clearing types
    if dist_type == "laterite_quarry":
        # Mangalore laterite: High-reflectance vivid terracotta red-orange stone
        r = 210 + noise * 40
        g = 95 + noise * 30
        b = 55 + noise * 25

        # Stepped bench lines (horizontal excavation tiers & white quarry rock exposed)
        tiers = (np.sin(np.linspace(0, 36, h)[:, None]) > 0.5).astype(float)
        r += tiers * 35
        g += tiers * 25
        b += tiers * 20

    elif dist_type == "mangrove_clearing":
        # Mangrove felling & tidal clearing: Bright exposed saline silt, light sandy mud & vehicle ruts
        r = 175 + noise * 45
        g = 145 + noise * 35
        b = 115 + noise * 30

        # Linear wheel/excavator ruts cutting through the cleared flat
        track = np.abs(np.sin(np.linspace(0, 22, w)[None, :] + np.linspace(0, 14, h)[:, None]))
        r[track > 0.82] *= 0.70
        g[track > 0.82] *= 0.68
        b[track > 0.82] *= 0.65

    elif dist_type == "lake_infill":
        # Kavoor lake reclamation: Bright dry construction landfill & ochre clay encroaching water
        r = 195 + noise * 45
        g = 175 + noise * 35
        b = 135 + noise * 30

        # Bulldozer grading tracks
        grading = (np.sin(np.linspace(0, 30, h)[:, None] * 1.5) > 0.35).astype(float)
        r -= grading * 20
        g -= grading * 18
        b -= grading * 15

    elif dist_type == "fire_scar":
        # Burnt charcoal & ash: Deep pitch carbon black with bright grey ash streaks
        r = 22 + noise * 20
        g = 20 + noise * 18
        b = 20 + noise * 18

        ash = (np.abs(np.sin(np.linspace(0, 18, w)[None, :] * 2.0)) > 0.75).astype(float)
        r += ash * 40
        g += ash * 40
        b += ash * 42

    elif dist_type == "road_clearing":
        # Graded bright dirt/gravel road swath
        r = 185 + noise * 40
        g = 165 + noise * 35
        b = 130 + noise * 30

    else:  # forest_clearing
        # Kudremukh clear-cut: Exposed bright red-brown loam, felled log debris, bare subsoil
        r = 185 + noise * 45
        g = 120 + noise * 35
        b = 75 + noise * 25
        
        # Drag tracks and logging scars
        logging_lines = (np.sin(np.linspace(0, 26, w)[None, :] - np.linspace(0, 16, h)[:, None]) > 0.65).astype(float)
        r -= logging_lines * 25
        g -= logging_lines * 18
        b -= logging_lines * 12

    # Optical sensor grain
    sensor_grain = np.random.normal(0, 4.0, (h, w, 3))
    rgb = np.stack([r, g, b], axis=-1) + sensor_grain
    return np.clip(rgb, 0, 255).astype(np.uint8)


def create_feathered_mask(poly: List[Tuple[int, int]], size: Tuple[int, int] = (512, 512)) -> np.ndarray:
    """Creates a soft, feathered alpha mask along tree canopy crowns."""
    mask_img = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask_img)
    draw.polygon(poly, fill=255)

    # Apply Gaussian blur for natural optical blending into tree crowns
    blurred = mask_img.filter(ImageFilter.GaussianBlur(radius=3.5))
    mask_arr = np.array(blurred, dtype=np.float32) / 255.0
    return mask_arr


def draw_crisp_red_border(base_img: Image.Image, poly: List[Tuple[int, int]]) -> Image.Image:
    """
    Draws a clean, high-visibility red border with hairline dark contrast outline
    and corner node markers. ABSOLUTELY NO OVERLAY TINT OR OPACITY FILL.
    """
    res = base_img.convert("RGBA")
    overlay = Image.new("RGBA", res.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # 1. Dark outer/inner hairline halo for contrast on both dark forest and bright dirt
    draw.polygon(poly, outline=(15, 23, 42, 230), width=5)

    # 2. Main bright alert red stroke (#EF4444)
    draw.polygon(poly, outline=(239, 68, 68, 255), width=3)

    # 3. Corner coordinate node markers
    for pt in poly:
        draw.ellipse([pt[0] - 4, pt[1] - 4, pt[0] + 4, pt[1] + 4], fill=(255, 255, 255, 255), outline=(239, 68, 68, 255))
        draw.ellipse([pt[0] - 2, pt[1] - 2, pt[0] + 2, pt[1] + 2], fill=(239, 68, 68, 255))

    return Image.alpha_composite(res, overlay).convert("RGB")


def add_forensic_hud(img: Image.Image, is_after: bool, cfg: dict) -> Image.Image:
    """Adds clear, professional satellite HUD telemetry bars at top and bottom."""
    res = img.copy()

    # Top banner (tactical dark slate)
    top_bar = Image.new("RGBA", (512, 28), (15, 23, 42, 235))
    res.paste(top_bar, (0, 0), top_bar)

    # Bottom banner
    bottom_bar = Image.new("RGBA", (512, 26), (15, 23, 42, 235))
    res.paste(bottom_bar, (0, 486), bottom_bar)

    draw = ImageDraw.Draw(res)

    if is_after:
        mode_text = "AFTER • CURRENT OBSERVATION [ENCROACHMENT DETECTED]"
        mode_color = (252, 165, 165)  # Soft bright red
        source_tag = "SENTINEL-2 / HIGH-RES"
        stat_text = f"FELLED: {cfg['area_ha']} ha | ΔNDVI: {cfg['delta_ndvi']}"
        stat_color = (254, 202, 202)
    else:
        mode_text = "BEFORE • HISTORICAL SATELLITE PASS [CANOPY INTACT]"
        mode_color = (187, 247, 208)  # Soft emerald green
        source_tag = "HISTORICAL BASELINE"
        stat_text = f"CANOPY STATUS: INTACT HEALTHY"
        stat_color = (187, 247, 208)

    # Render top banner
    draw.text((10, 7), mode_text, fill=mode_color)
    draw.text((330, 7), source_tag, fill=(203, 213, 225))

    # Render bottom banner
    date_str = cfg["pass_t2"] if is_after else cfg["pass_t1"]
    draw.text((10, 492), f"{date_str} • {cfg['name'][:28]}", fill=(226, 232, 240))
    draw.text((320, 492), stat_text, fill=stat_color)

    return res


def generate_all_realistic_comparisons():
    print("=" * 70)
    print("GENERATING VISUALLY STRIKING SATELLITE DEFORESTATION COMPARISONS")
    print("=" * 70)

    for i, cfg in enumerate(ALERTS_DATA, 1):
        alert_id = cfg["id"]
        dist_type = cfg["dist_type"]
        poly = cfg["poly"]
        print(f"[{i}/{len(ALERTS_DATA)}] Processing {alert_id} ({cfg['name']})...")

        # 1. Base Before Satellite Image (Intact forest / water)
        base_before = load_or_create_base_satellite(alert_id, dist_type)

        # Enhance contrast slightly to ensure lush vegetation vibrancy
        enhancer = ImageEnhance.Color(base_before)
        base_before = enhancer.enhance(1.15)

        # Add HUD to Before image
        before_final = add_forensic_hud(base_before, is_after=False, cfg=cfg)

        # 2. Base After Satellite Image:
        # Outside polygon: Identical untouched forest/water
        # Inside polygon: REALISTIC cleared ground texture (bare soil, mudflat, laterite quarry, etc.)
        cleared_texture_arr = generate_cleared_ground_texture(dist_type, seed=100 + i)
        base_before_arr = np.array(base_before, dtype=np.float32)

        # Soft feathered mask
        mask = create_feathered_mask(poly, (512, 512))[:, :, None]

        # Blend: (1 - mask) * untouched_forest + mask * cleared_ground
        after_arr = (1.0 - mask) * base_before_arr + mask * cleared_texture_arr.astype(np.float32)
        after_blended_img = Image.fromarray(np.clip(after_arr, 0, 255).astype(np.uint8))

        # 3. Add clean red perimeter border ONLY (NO OVERLAY)
        after_with_border = draw_crisp_red_border(after_blended_img, poly)

        # 4. Add HUD to After image
        after_final = add_forensic_hud(after_with_border, is_after=True, cfg=cfg)

        # Save to both Backend and Frontend static directories with both alt- and alert- naming
        aliases = [
            (f"{alert_id}_before.png", f"{alert_id}_after.png"),
            (f"{alert_id.replace('alt-', 'alert-')}_before.png", f"{alert_id.replace('alt-', 'alert-')}_after.png"),
        ]

        for b_name, a_name in aliases:
            before_final.save(STATIC_ALERTS_BACKEND / b_name, "PNG", optimize=True)
            before_final.save(STATIC_ALERTS_FRONTEND / b_name, "PNG", optimize=True)
            after_final.save(STATIC_ALERTS_BACKEND / a_name, "PNG", optimize=True)
            after_final.save(STATIC_ALERTS_FRONTEND / a_name, "PNG", optimize=True)

        print(f"  ✓ Saved Before & After to backend/static/alerts and frontend/public/static/alerts")

    print("\nAll realistic before/after satellite passes generated successfully!")


if __name__ == "__main__":
    generate_all_realistic_comparisons()
