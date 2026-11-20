import json
import logging
from pathlib import Path
from typing import Tuple

import numpy as np
import rasterio
from rasterio.transform import from_origin
from shapely.geometry import Point, Polygon, mapping

from app.config import settings
from app.db import save_reserve
from app.schemas import Reserve

logger = logging.getLogger("prakriti-netra.generator")

# Grid definition near Kudremukh National Park, Karnataka
# Centroid: ~13.13°N, 75.25°E
ORIGIN_LNG = 75.2000
ORIGIN_LAT = 13.2000
PIXEL_SIZE = 0.0001  # ~10 meters per pixel in WGS84
HEIGHT = 400         # 400 pixels = ~4 km
WIDTH = 400          # 400 pixels = ~4 km

TRANSFORM = from_origin(ORIGIN_LNG, ORIGIN_LAT, PIXEL_SIZE, PIXEL_SIZE)
CRS = "EPSG:4326"


def create_reserve_polygon() -> Tuple[Polygon, dict]:
    """Create Kudremukh reserve boundary polygon and GeoJSON feature (flagged is_official: false)."""
    # Reserve covers rows 60 to 340, cols 60 to 340 in pixel coordinates
    min_x = ORIGIN_LNG + 60 * PIXEL_SIZE
    max_x = ORIGIN_LNG + 340 * PIXEL_SIZE
    max_y = ORIGIN_LAT - 60 * PIXEL_SIZE
    min_y = ORIGIN_LAT - 340 * PIXEL_SIZE

    poly = Polygon([
        (min_x, min_y),
        (max_x, min_y),
        (max_x, max_y),
        (min_x, max_y),
        (min_x, min_y),
    ])

    geojson_feature = {
        "type": "Feature",
        "properties": {
            "id": "kudremukh",
            "name": "Kudremukh National Park & Reserve Forest",
            "state": "Karnataka",
            "note": "DEMO DATA: Simplified boundary for demo purposes",
            "area_ha": round((poly.area / (PIXEL_SIZE ** 2)) * 0.01, 2),
        },
        "geometry": mapping(poly),
    }
    return poly, geojson_feature


def generate_demo_dataset():
    """Generate synthetic Sentinel-2 and Sentinel-1 rasters with 5 ground-truth patches."""
    settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
    np.random.seed(42)

    poly, reserve_geojson = create_reserve_polygon()

    # Save reserve to GeoJSON file and DB
    reserve_path = settings.DATA_DIR / "kudremukh_reserve.geojson"
    with open(reserve_path, "w", encoding="utf-8") as f:
        json.dump(reserve_geojson, f, indent=2)

    save_reserve(Reserve(
        id="kudremukh",
        name="Kudremukh National Park & Reserve Forest",
        boundary=reserve_geojson,
        is_official=False,
    ))

    # Base Healthy Western Ghats Dense Forest
    # Sentinel-2 Bands: B4 (Red ~0.04), B8 (NIR ~0.50), B12 (SWIR ~0.12), SCL (4: Vegetation)
    # NDVI = (0.50 - 0.04) / (0.50 + 0.04) = 0.85
    # Sentinel-1 VH: ~ -12.0 dB
    s2_t1_b4 = np.random.normal(0.045, 0.005, (HEIGHT, WIDTH)).astype(np.float32)
    s2_t1_b8 = np.random.normal(0.500, 0.015, (HEIGHT, WIDTH)).astype(np.float32)
    s2_t1_b12 = np.random.normal(0.120, 0.008, (HEIGHT, WIDTH)).astype(np.float32)
    s2_t1_scl = np.full((HEIGHT, WIDTH), 4, dtype=np.uint8)  # 4 = Vegetation
    s1_t1_vh = np.random.normal(-12.0, 0.5, (HEIGHT, WIDTH)).astype(np.float32)

    # Pass T2 initially clones T1 with slight natural variation
    s2_t2_b4 = s2_t1_b4 + np.random.normal(0.002, 0.003, (HEIGHT, WIDTH)).astype(np.float32)
    s2_t2_b8 = s2_t1_b8 + np.random.normal(-0.005, 0.005, (HEIGHT, WIDTH)).astype(np.float32)
    s2_t2_b12 = s2_t1_b12 + np.random.normal(0.002, 0.004, (HEIGHT, WIDTH)).astype(np.float32)
    s2_t2_scl = np.full((HEIGHT, WIDTH), 4, dtype=np.uint8)
    s1_t2_vh = s1_t1_vh + np.random.normal(0.0, 0.3, (HEIGHT, WIDTH)).astype(np.float32)

    # Helper to create circular/elliptical mask with exact pixel count
    y_idx, x_idx = np.ogrid[:HEIGHT, :WIDTH]

    def make_patch_mask(center_r: int, center_c: int, target_pixels: int) -> np.ndarray:
        radius = np.sqrt(target_pixels / np.pi)
        mask = (y_idx - center_r) ** 2 + (x_idx - center_c) ** 2 <= radius ** 2
        return mask

    # -------------------------------------------------------------------------
    # PATCH 1: Planted Clearing INSIDE Reserve (~2.4 ha = 240 pixels) -> MUST ALERT
    # -------------------------------------------------------------------------
    # Row 160, Col 160 (well inside reserve: 60..340)
    p1_mask = make_patch_mask(160, 160, 240)
    s2_t2_b4[p1_mask] = np.random.normal(0.20, 0.015, np.count_nonzero(p1_mask))   # High red reflectance
    s2_t2_b8[p1_mask] = np.random.normal(0.24, 0.020, np.count_nonzero(p1_mask))   # Collapsed NIR
    s2_t2_b12[p1_mask] = np.random.normal(0.30, 0.020, np.count_nonzero(p1_mask))  # Exposed soil SWIR
    s2_t2_scl[p1_mask] = 5  # Bare soil
    # SAR VH drops drastically due to canopy loss (> 3 dB loss)
    s1_t2_vh[p1_mask] = np.random.normal(-17.8, 0.6, np.count_nonzero(p1_mask))

    # -------------------------------------------------------------------------
    # PATCH 2: Fire Scar INSIDE Reserve (~1.6 ha = 160 pixels)
    # -------------------------------------------------------------------------
    # Row 260, Col 160 (inside reserve)
    p2_mask = make_patch_mask(260, 160, 160)
    s2_t2_b4[p2_mask] = np.random.normal(0.13, 0.01, np.count_nonzero(p2_mask))
    s2_t2_b8[p2_mask] = np.random.normal(0.12, 0.01, np.count_nonzero(p2_mask))
    s2_t2_b12[p2_mask] = np.random.normal(0.38, 0.02, np.count_nonzero(p2_mask))  # High SWIR char
    s2_t2_scl[p2_mask] = 5
    s1_t2_vh[p2_mask] = np.random.normal(-14.8, 0.5, np.count_nonzero(p2_mask))

    # -------------------------------------------------------------------------
    # PATCH 3: Seasonal Leaf-fall Patch INSIDE Reserve (~2.0 ha = 200 pixels) -> MUST NOT ALERT
    # -------------------------------------------------------------------------
    # Row 160, Col 260 (inside reserve)
    # Deciduous canopy thinning: slight NDVI drop, but SAR VH stays high (trees still present)
    p3_mask = make_patch_mask(160, 260, 200)
    s2_t2_b4[p3_mask] = np.random.normal(0.07, 0.005, np.count_nonzero(p3_mask))
    s2_t2_b8[p3_mask] = np.random.normal(0.42, 0.015, np.count_nonzero(p3_mask))  # NDVI ~0.71 (change < 0.20)
    s2_t2_b12[p3_mask] = np.random.normal(0.14, 0.008, np.count_nonzero(p3_mask))
    s2_t2_scl[p3_mask] = 4  # Still vegetation
    s1_t2_vh[p3_mask] = np.random.normal(-12.1, 0.4, np.count_nonzero(p3_mask))    # Tree structure intact!

    # -------------------------------------------------------------------------
    # PATCH 4: Cloud & Shadow Patch INSIDE Reserve (~3.0 ha = 300 pixels) -> MUST NOT ALERT
    # -------------------------------------------------------------------------
    # Row 260, Col 260 (inside reserve)
    # Cloud core: high reflectance in all bands, SCL = 9 (high prob cloud)
    p4_cloud_mask = make_patch_mask(255, 255, 180)
    s2_t2_b4[p4_cloud_mask] = np.random.normal(0.65, 0.03, np.count_nonzero(p4_cloud_mask))
    s2_t2_b8[p4_cloud_mask] = np.random.normal(0.70, 0.03, np.count_nonzero(p4_cloud_mask))
    s2_t2_b12[p4_cloud_mask] = np.random.normal(0.60, 0.03, np.count_nonzero(p4_cloud_mask))
    s2_t2_scl[p4_cloud_mask] = 9  # High prob cloud
    # Cloud shadow adjacent: SCL = 3 (cloud shadow)
    p4_shadow_mask = make_patch_mask(270, 270, 120)
    s2_t2_b4[p4_shadow_mask] = np.random.normal(0.02, 0.005, np.count_nonzero(p4_shadow_mask))
    s2_t2_b8[p4_shadow_mask] = np.random.normal(0.08, 0.010, np.count_nonzero(p4_shadow_mask))
    s2_t2_b12[p4_shadow_mask] = np.random.normal(0.03, 0.005, np.count_nonzero(p4_shadow_mask))
    s2_t2_scl[p4_shadow_mask] = 3  # Cloud shadow

    # -------------------------------------------------------------------------
    # PATCH 5: Clearing OUTSIDE Reserve (~2.5 ha = 250 pixels) -> MUST NOT ALERT
    # -------------------------------------------------------------------------
    # Row 25, Col 25 (outside reserve: reserve starts at row 60, col 60)
    p5_mask = make_patch_mask(25, 25, 250)
    s2_t2_b4[p5_mask] = np.random.normal(0.20, 0.015, np.count_nonzero(p5_mask))
    s2_t2_b8[p5_mask] = np.random.normal(0.22, 0.015, np.count_nonzero(p5_mask))
    s2_t2_b12[p5_mask] = np.random.normal(0.31, 0.020, np.count_nonzero(p5_mask))
    s2_t2_scl[p5_mask] = 5
    s1_t2_vh[p5_mask] = np.random.normal(-17.5, 0.6, np.count_nonzero(p5_mask))

    # -------------------------------------------------------------------------
    # Write GeoTIFF files
    # -------------------------------------------------------------------------
    # Sentinel-2 T1 (4 bands: B4, B8, B12, SCL)
    s2_t1_path = settings.DATA_DIR / "sentinel2_t1.tif"
    with rasterio.open(
        s2_t1_path,
        "w",
        driver="GTiff",
        height=HEIGHT,
        width=WIDTH,
        count=4,
        dtype=np.float32,
        crs=CRS,
        transform=TRANSFORM,
    ) as dst:
        dst.write(s2_t1_b4, 1)
        dst.write(s2_t1_b8, 2)
        dst.write(s2_t1_b12, 3)
        dst.write(s2_t1_scl.astype(np.float32), 4)
        dst.set_band_description(1, "B4_Red")
        dst.set_band_description(2, "B8_NIR")
        dst.set_band_description(3, "B12_SWIR")
        dst.set_band_description(4, "SCL")

    # Sentinel-2 T2 (4 bands: B4, B8, B12, SCL)
    s2_t2_path = settings.DATA_DIR / "sentinel2_t2.tif"
    with rasterio.open(
        s2_t2_path,
        "w",
        driver="GTiff",
        height=HEIGHT,
        width=WIDTH,
        count=4,
        dtype=np.float32,
        crs=CRS,
        transform=TRANSFORM,
    ) as dst:
        dst.write(s2_t2_b4, 1)
        dst.write(s2_t2_b8, 2)
        dst.write(s2_t2_b12, 3)
        dst.write(s2_t2_scl.astype(np.float32), 4)
        dst.set_band_description(1, "B4_Red")
        dst.set_band_description(2, "B8_NIR")
        dst.set_band_description(3, "B12_SWIR")
        dst.set_band_description(4, "SCL")

    # Sentinel-1 T1 (1 band: VH in dB)
    s1_t1_path = settings.DATA_DIR / "sentinel1_vh_t1.tif"
    with rasterio.open(
        s1_t1_path,
        "w",
        driver="GTiff",
        height=HEIGHT,
        width=WIDTH,
        count=1,
        dtype=np.float32,
        crs=CRS,
        transform=TRANSFORM,
    ) as dst:
        dst.write(s1_t1_vh, 1)
        dst.set_band_description(1, "VH_dB")

    # Sentinel-1 T2 (1 band: VH in dB)
    s1_t2_path = settings.DATA_DIR / "sentinel1_vh_t2.tif"
    with rasterio.open(
        s1_t2_path,
        "w",
        driver="GTiff",
        height=HEIGHT,
        width=WIDTH,
        count=1,
        dtype=np.float32,
        crs=CRS,
        transform=TRANSFORM,
    ) as dst:
        dst.write(s1_t2_vh, 1)
        dst.set_band_description(1, "VH_dB")

    logger.info("Demo synthetic dataset created successfully at %s", settings.DATA_DIR)
    return {
        "s2_t1": str(s2_t1_path),
        "s2_t2": str(s2_t2_path),
        "s1_t1": str(s1_t1_path),
        "s1_t2": str(s1_t2_path),
        "reserve": str(reserve_path),
    }


if __name__ == "__main__":
    generate_demo_dataset()
