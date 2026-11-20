"""
Generates 3 realistic real-time before & after satellite comparison examples
for the Mangalore (Mangaluru), Karnataka region:
1. Gurupura River Estuary & Tannirbhavi Mangroves (Mangrove canopy felling)
2. Kavoor Lake Shoreline Encroachment (Lake infill & shoreline shrinkage)
3. Pilikula Nisargadhama Eco-Park Corridor (Hillside forest quarrying & clearing)

Creates high-resolution visual comparison PNGs for ImageSlider and seeds
both the SQLite database and static assets directories.
"""

import json
import os
import shutil
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

STATIC_ALERTS_BACKEND = BASE_DIR / "static" / "alerts"
STATIC_ALERTS_FRONTEND = BASE_DIR.parent / "frontend" / "public" / "static" / "alerts"
DB_PATH = BASE_DIR / "prakriti_netra.db"

STATIC_ALERTS_BACKEND.mkdir(parents=True, exist_ok=True)
STATIC_ALERTS_FRONTEND.mkdir(parents=True, exist_ok=True)


def _create_mangrove_images() -> tuple[Image.Image, Image.Image]:
    """
    1. Tannirbhavi / Gurupura Estuary Mangrove Forest (12.8980°N, 74.8210°E)
    Before: Estuary tidal waterway (deep blue-gray) flanked by dense emerald mangrove forest canopy.
    After: Tidal canal remains, but a 2.8 ha mangrove patch is bulldozed into exposed wet mud/sand fill.
    """
    width, height = 512, 512
    np.random.seed(101)

    # Base estuarine tidal water background
    base_water = np.zeros((height, width, 3), dtype=np.uint8)
    base_water[:, :] = [35, 65, 85]  # Coastal brackish water

    # Winding tidal river / estuary channel running through
    img_before = Image.fromarray(base_water)
    draw_before = ImageDraw.Draw(img_before)

    # Draw dense mangrove islands & banks
    # Dense mangrove canopy texture: dark olive & emerald greens
    for x in range(0, width, 4):
        for y in range(0, height, 4):
            # Distance from tidal channel: curve through middle
            channel_x = 240 + int(60 * np.sin(y / 70.0))
            dist = abs(x - channel_x)
            if dist > 35:
                # Mangrove swamp forest
                noise = np.random.randint(-15, 15)
                g = int(np.clip(110 + noise - (dist * 0.1), 70, 150))
                r = int(np.clip(35 + noise // 2, 20, 65))
                b = int(np.clip(45 + noise // 2, 25, 75))
                draw_before.rectangle([x, y, x + 4, y + 4], fill=(r, g, b))

    # Add realistic canopy texture blur
    img_before = img_before.filter(ImageFilter.GaussianBlur(radius=1.2))

    # AFTER: Clone before, but clear a large 2.8 ha polygonal patch on the east bank
    img_after = img_before.copy()
    draw_after = ImageDraw.Draw(img_after)

    # Clearing polygon (dredged sand and exposed muddy silt)
    clearing_poly = [
        (285, 180),
        (430, 160),
        (460, 310),
        (380, 380),
        (290, 320),
        (280, 240),
    ]

    # Muddy tan/gray dredged silt fill
    for x in range(260, 480, 3):
        for y in range(140, 400, 3):
            # Point in clearing polygon test
            if draw_after._image.getpixel((x, y)):
                # Inside bbox check
                from shapely.geometry import Point, Polygon
                poly_shp = Polygon(clearing_poly)
                if poly_shp.contains(Point(x, y)):
                    n = np.random.randint(-12, 12)
                    r = int(np.clip(165 + n, 130, 200))
                    g = int(np.clip(145 + n, 115, 180))
                    b = int(np.clip(120 + n, 95, 155))
                    draw_after.rectangle([x, y, x + 3, y + 3], fill=(r, g, b))

    # Bulldozer track lines and dredge berm
    draw_after.line([(310, 200), (430, 320)], fill=(130, 110, 90), width=3)
    draw_after.line([(340, 180), (410, 350)], fill=(140, 120, 100), width=2)
    img_after = img_after.filter(ImageFilter.GaussianBlur(radius=0.8))

    return img_before, img_after


def _create_kavoor_lake_images() -> tuple[Image.Image, Image.Image]:
    """
    2. Kavoor Lake Wetland Zone (12.9350°N, 74.8580°E)
    Before: Blue-green lake water body surrounded by green wetland marsh and reeds.
    After: Debris dumping & construction infill encroaches into the lake's north bay,
           shrinking the lake water spread by 1.5 ha.
    """
    width, height = 512, 512
    np.random.seed(202)

    # Base surrounding urban greenery & settlement
    base = np.zeros((height, width, 3), dtype=np.uint8)
    for y in range(height):
        for x in range(width):
            base[y, x] = [70 + np.random.randint(0, 15), 110 + np.random.randint(0, 20), 65 + np.random.randint(0, 15)]

    img_before = Image.fromarray(base)
    draw_before = ImageDraw.Draw(img_before)

    # Lake body polygon
    lake_poly = [
        (120, 100), (280, 80), (400, 140), (440, 280),
        (380, 420), (220, 450), (110, 380), (80, 240)
    ]
    # Draw water spread
    draw_before.polygon(lake_poly, fill=(28, 92, 138), outline=(60, 140, 120))

    # Wetland reed fringe
    for pt in lake_poly:
        draw_before.ellipse([pt[0] - 15, pt[1] - 15, pt[0] + 15, pt[1] + 15], fill=(55, 125, 75))

    img_before = img_before.filter(ImageFilter.GaussianBlur(radius=1.5))

    # AFTER: Construction infill on the north-east arm
    img_after = img_before.copy()
    draw_after = ImageDraw.Draw(img_after)

    infill_poly = [
        (220, 85),
        (370, 95),
        (390, 220),
        (280, 230),
        (210, 170),
    ]
    # Fill with gray-tan rubble / concrete construction landfill
    for x in range(190, 410, 3):
        for y in range(75, 250, 3):
            from shapely.geometry import Point, Polygon
            if Polygon(infill_poly).contains(Point(x, y)):
                n = np.random.randint(-15, 15)
                r = int(np.clip(175 + n, 140, 210))
                g = int(np.clip(168 + n, 135, 200))
                b = int(np.clip(155 + n, 125, 190))
                draw_after.rectangle([x, y, x + 3, y + 3], fill=(r, g, b))

    # Perimeter retaining bund
    draw_after.line([(210, 170), (280, 230), (390, 220)], fill=(110, 95, 80), width=4)
    img_after = img_after.filter(ImageFilter.GaussianBlur(radius=0.9))

    return img_before, img_after


def _create_pilikula_images() -> tuple[Image.Image, Image.Image]:
    """
    3. Pilikula Nisargadhama Eco-Park Corridor (12.9280°N, 74.9020°E)
    Before: Dense Western Ghats foothill moist deciduous canopy (vibrant deep forest green).
    After: 3.2 ha hillside quarrying excavation with brilliant rust-red laterite exposed soil.
    """
    width, height = 512, 512
    np.random.seed(303)

    # Dense forest canopy texture
    base = np.zeros((height, width, 3), dtype=np.uint8)
    for y in range(height):
        for x in range(width):
            # Rich subtropical forest green with canopy shadows
            noise = np.random.randint(-20, 20)
            base[y, x] = [
                int(np.clip(32 + noise // 2, 15, 60)),
                int(np.clip(95 + noise, 65, 140)),
                int(np.clip(36 + noise // 2, 20, 65)),
            ]

    img_before = Image.fromarray(base)
    draw_before = ImageDraw.Draw(img_before)

    # Natural forest contour lines and canopy clusters
    for i in range(120):
        cx = np.random.randint(10, width - 10)
        cy = np.random.randint(10, height - 10)
        rad = np.random.randint(12, 35)
        g_val = np.random.randint(85, 135)
        draw_before.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(30, g_val, 32))

    img_before = img_before.filter(ImageFilter.GaussianBlur(radius=1.4))

    # AFTER: Cleared hillside quarry pit exposing vibrant Mangalore red laterite
    img_after = img_before.copy()
    draw_after = ImageDraw.Draw(img_after)

    quarry_poly = [
        (170, 150),
        (350, 130),
        (400, 290),
        (340, 390),
        (190, 370),
        (140, 260),
    ]

    for x in range(120, 420, 3):
        for y in range(110, 410, 3):
            from shapely.geometry import Point, Polygon
            if Polygon(quarry_poly).contains(Point(x, y)):
                n = np.random.randint(-18, 18)
                # Mangalore Laterite Red Soil: rich terracotta/rust
                r = int(np.clip(185 + n, 150, 225))
                g = int(np.clip(78 + n // 2, 55, 110))
                b = int(np.clip(52 + n // 2, 35, 80))
                draw_after.rectangle([x, y, x + 3, y + 3], fill=(r, g, b))

    # Excavation step benches / haul road
    draw_after.line([(180, 190), (320, 250), (210, 330)], fill=(210, 130, 95), width=4)
    img_after = img_after.filter(ImageFilter.GaussianBlur(radius=0.9))

    return img_before, img_after


def generate_all_mangalore_examples():
    """Generate all images and save to backend and frontend static directories."""
    print("Generating Mangalore before/after satellite images...")

    pairs = [
        ("alert-mng-001", _create_mangrove_images()),
        ("alert-mng-002", _create_kavoor_lake_images()),
        ("alert-mng-003", _create_pilikula_images()),
    ]

    for alert_id, (img_before, img_after) in pairs:
        b_name = f"{alert_id}_before.png"
        a_name = f"{alert_id}_after.png"

        # Save backend
        img_before.save(STATIC_ALERTS_BACKEND / b_name, "PNG")
        img_after.save(STATIC_ALERTS_BACKEND / a_name, "PNG")

        # Save frontend
        img_before.save(STATIC_ALERTS_FRONTEND / b_name, "PNG")
        img_after.save(STATIC_ALERTS_FRONTEND / a_name, "PNG")
        print(f"Saved {b_name} and {a_name}")

    print("Images successfully generated in backend and frontend static folders.")


def get_mangalore_alerts_data() -> list[dict]:
    """Return JSON-serializable list of the 3 Mangalore alert records."""
    return [
        {
            "id": "alt-mng-001",
            "reserve_id": "res-mangaluru-coastal",
            "status": "open",
            "label": "clearing",
            "area_ha": 2.8,
            "confidence": 0.94,
            "centroid": {"lat": 12.8980, "lng": 74.8210},
            "polygon": {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [74.8190, 12.8965],
                            [74.8235, 12.8960],
                            [74.8242, 12.8995],
                            [74.8215, 12.9005],
                            [74.8190, 12.8965],
                        ]
                    ],
                },
                "properties": {
                    "id": "alt-mng-001",
                    "label": "clearing",
                    "area_ha": 2.8,
                    "confidence": 0.94,
                    "name": "Gurupura Estuary Tannirbhavi Mangrove Clearing",
                    "district": "Dakshina Kannada (Mangaluru)",
                },
            },
            "detected_at": "2026-11-18T05:30:00Z",
            "pass_t1": "2026-10-15T05:30:00Z",
            "pass_t2": "2026-11-18T05:30:00Z",
            "before_image_url": "/static/alerts/alert-mng-001_before.png",
            "after_image_url": "/static/alerts/alert-mng-001_after.png",
            "data_mode": "demo",
        },
        {
            "id": "alt-mng-002",
            "reserve_id": "res-mangaluru-coastal",
            "status": "open",
            "label": "clearing",
            "area_ha": 1.5,
            "confidence": 0.91,
            "centroid": {"lat": 12.9350, "lng": 74.8580},
            "polygon": {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [74.8565, 12.9335],
                            [74.8600, 12.9338],
                            [74.8605, 12.9365],
                            [74.8572, 12.9368],
                            [74.8565, 12.9335],
                        ]
                    ],
                },
                "properties": {
                    "id": "alt-mng-002",
                    "label": "clearing",
                    "area_ha": 1.5,
                    "confidence": 0.91,
                    "name": "Kavoor Lake Shoreline Wetland Infill & Encroachment",
                    "district": "Dakshina Kannada (Mangaluru)",
                },
            },
            "detected_at": "2026-11-15T05:30:00Z",
            "pass_t1": "2026-09-20T05:30:00Z",
            "pass_t2": "2026-11-15T05:30:00Z",
            "before_image_url": "/static/alerts/alert-mng-002_before.png",
            "after_image_url": "/static/alerts/alert-mng-002_after.png",
            "data_mode": "demo",
        },
        {
            "id": "alt-mng-003",
            "reserve_id": "res-mangaluru-coastal",
            "status": "open",
            "label": "clearing",
            "area_ha": 3.2,
            "confidence": 0.93,
            "centroid": {"lat": 12.9280, "lng": 74.9020},
            "polygon": {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [74.8995, 12.9260],
                            [74.9050, 12.9265],
                            [74.9055, 12.9305],
                            [74.9002, 12.9300],
                            [74.8995, 12.9260],
                        ]
                    ],
                },
                "properties": {
                    "id": "alt-mng-003",
                    "label": "clearing",
                    "area_ha": 3.2,
                    "confidence": 0.93,
                    "name": "Pilikula Nisargadhama Eco-Park Hillside Canopy Clearing",
                    "district": "Dakshina Kannada (Mangaluru)",
                },
            },
            "detected_at": "2026-11-18T05:30:00Z",
            "pass_t1": "2026-10-02T05:30:00Z",
            "pass_t2": "2026-11-18T05:30:00Z",
            "before_image_url": "/static/alerts/alert-mng-003_before.png",
            "after_image_url": "/static/alerts/alert-mng-003_after.png",
            "data_mode": "demo",
        },
    ]


def get_mangalore_reserve_data() -> dict:
    """Return Mangalore Eco-Buffer & Coastal Reserve definition."""
    return {
        "id": "res-mangaluru-coastal",
        "name": "Mangaluru Coastal Zone & Western Ghats Foothills Buffer",
        "boundary": {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [74.7800, 12.8200],
                        [74.9400, 12.8200],
                        [74.9600, 12.9700],
                        [74.8000, 12.9700],
                        [74.7800, 12.8200],
                    ]
                ],
            },
            "properties": {
                "id": "res-mangaluru-coastal",
                "name": "Mangaluru Coastal Zone & Eco-Buffer",
                "state": "Karnataka",
                "district": "Dakshina Kannada",
                "area_sq_km": 280.5,
                "ecozone": "Coastal Plain & Western Ghats Foothill Ecotone",
            },
        },
        "is_official": False,
    }


def seed_database():
    """Seed the Mangalore reserve and alerts into SQLite DB."""
    from app.db import save_alert, save_reserve
    from app.schemas import Alert, Reserve

    print("Seeding Mangalore reserve and alerts into database...")
    res_data = get_mangalore_reserve_data()
    save_reserve(Reserve(**res_data))

    for alert_dict in get_mangalore_alerts_data():
        save_alert(Alert(**alert_dict))

    print("Database seeding completed.")


if __name__ == "__main__":
    generate_all_mangalore_examples()
    seed_database()
