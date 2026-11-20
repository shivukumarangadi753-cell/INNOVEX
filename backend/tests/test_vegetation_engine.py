"""
Unit tests for Engine 1: Vegetation Change Detection & Multispectral Analysis (backend/ml/vegetation.py).
Tests mathematical accuracy, SCL cloud masking, SAR radar structural loss, and RGB photo segmentation.
"""

import numpy as np
import pytest

from ml.vegetation import (
    compute_ndvi,
    compute_dndvi,
    compute_nbr,
    compute_dnbr,
    compute_ndwi,
    compute_radar_vh_drop,
    create_scl_validity_mask,
    extract_vegetation_loss_mask,
    segment_rgb_photo,
)


def test_ndvi_and_dndvi_math():
    """Verify NDVI and dNDVI mathematical correctness and zero-division stability."""
    # 1. Healthy Western Ghats dense canopy (high NIR, low Red)
    b4_healthy = np.array([[0.04]], dtype=np.float32)
    b8_healthy = np.array([[0.50]], dtype=np.float32)
    ndvi_healthy = compute_ndvi(b4_healthy, b8_healthy)
    assert 0.84 <= ndvi_healthy[0, 0] <= 0.86

    # 2. Cleared bare ground / soil (moderate Red, low NIR)
    b4_soil = np.array([[0.20]], dtype=np.float32)
    b8_soil = np.array([[0.22]], dtype=np.float32)
    ndvi_soil = compute_ndvi(b4_soil, b8_soil)
    assert 0.03 <= ndvi_soil[0, 0] <= 0.06

    # 3. Water body (low NIR absorption, higher Red)
    b4_water = np.array([[0.08]], dtype=np.float32)
    b8_water = np.array([[0.02]], dtype=np.float32)
    ndvi_water = compute_ndvi(b4_water, b8_water)
    assert ndvi_water[0, 0] < 0.0

    # 4. Zero division safety (all zeros)
    b4_zero = np.zeros((2, 2), dtype=np.float32)
    b8_zero = np.zeros((2, 2), dtype=np.float32)
    ndvi_zero = compute_ndvi(b4_zero, b8_zero)
    assert not np.isnan(ndvi_zero).any()
    assert not np.isinf(ndvi_zero).any()

    # 5. dNDVI (loss from healthy to cleared)
    dndvi = compute_dndvi(ndvi_healthy, ndvi_soil)
    assert dndvi[0, 0] < -0.70  # Massive canopy collapse


def test_nbr_and_dnbr_math():
    """Verify NBR (Normalized Burn Ratio) and dNBR burn severity calculation."""
    # Healthy unburned canopy (high NIR, low SWIR-2)
    b8_unburned = np.array([[0.52]], dtype=np.float32)
    b12_unburned = np.array([[0.11]], dtype=np.float32)
    nbr_unburned = compute_nbr(b8_unburned, b12_unburned)
    assert nbr_unburned[0, 0] > 0.60

    # Burn scar with charcoal/ash (collapsed NIR, high SWIR-2)
    b8_burned = np.array([[0.10]], dtype=np.float32)
    b12_burned = np.array([[0.38]], dtype=np.float32)
    nbr_burned = compute_nbr(b8_burned, b12_burned)
    assert nbr_burned[0, 0] < -0.50

    # dNBR
    dnbr = compute_dnbr(nbr_unburned, nbr_burned)
    assert dnbr[0, 0] < -1.0  # High burn severity difference


def test_ndwi_water_index():
    """Verify McFeeters NDWI for waterbody delineation."""
    # Clear water (high green, low NIR)
    b3_green = np.array([[0.18]], dtype=np.float32)
    b8_nir = np.array([[0.03]], dtype=np.float32)
    ndwi_water = compute_ndwi(b3_green, b8_nir)
    assert ndwi_water[0, 0] > 0.50

    # Dense forest (high NIR, moderate green)
    b3_forest = np.array([[0.06]], dtype=np.float32)
    b8_forest = np.array([[0.48]], dtype=np.float32)
    ndwi_forest = compute_ndwi(b3_forest, b8_forest)
    assert ndwi_forest[0, 0] < 0.0


def test_scl_cloud_masking():
    """Verify SCL cloud, cloud shadow, and snow masking."""
    # SCL array with mixed classes
    # 4: vegetation, 5: bare soil, 6: water
    # 3: cloud shadow, 8: med cloud, 9: high cloud, 10: cirrus, 11: snow
    scl = np.array([
        [4, 5, 6],
        [3, 8, 9],
        [10, 11, 4],
    ], dtype=np.uint8)

    valid_mask = create_scl_validity_mask(scl, cloud_classes=[3, 8, 9, 10, 11])

    # Row 0 (veg, soil, water) must all be True
    assert valid_mask[0, 0] and valid_mask[0, 1] and valid_mask[0, 2]

    # Row 1 (shadow, cloud med, cloud high) must all be False
    assert not valid_mask[1, 0] and not valid_mask[1, 1] and not valid_mask[1, 2]

    # Row 2 (cirrus, snow, veg)
    assert not valid_mask[2, 0]
    assert not valid_mask[2, 1]
    assert valid_mask[2, 2]


def test_radar_vh_drop_and_disturbance_mask():
    """Verify Sentinel-1 SAR backscatter drop and fusion loss mask."""
    # Patch 1: clear-cut forest (severe backscatter volume drop)
    vh_t1 = np.array([[-12.0, -12.0]], dtype=np.float32)
    vh_t2 = np.array([[-17.5, -12.2]], dtype=np.float32)
    drop = compute_radar_vh_drop(vh_t1, vh_t2)

    assert drop[0, 0] == pytest.approx(5.5, abs=0.01)  # Clear loss
    assert drop[0, 1] == pytest.approx(0.2, abs=0.01)  # Stable

    # Loss mask fusion
    dndvi = np.array([[-0.60, -0.05]], dtype=np.float32)
    valid_mask = np.array([[True, True]], dtype=bool)

    loss_mask = extract_vegetation_loss_mask(
        dndvi=dndvi,
        dvh_drop=drop,
        valid_mask=valid_mask,
        dndvi_threshold=-0.25,
        vh_drop_threshold=3.0,
    )
    assert loss_mask[0, 0] is np.True_  # Flagged by both optical and radar
    assert loss_mask[0, 1] is np.False_  # Stable patch


def test_rgb_photo_segmentation():
    """Verify citizen/drone RGB photo segmentation (ExG & GLI)."""
    # 1. Lush green canopy image (high Green, low Red/Blue)
    green_img = np.zeros((100, 100, 3), dtype=np.uint8)
    green_img[:, :, 0] = 30   # Red
    green_img[:, :, 1] = 160  # Green
    green_img[:, :, 2] = 40   # Blue

    res_green = segment_rgb_photo(green_img)
    assert res_green["vegetation_fraction"] > 0.90
    assert res_green["status"] == "healthy_canopy"
    assert res_green["exg_mean"] > 0.20

    # 2. Bare muddy/laterite soil image (high Red, moderate Green, low Blue)
    soil_img = np.zeros((100, 100, 3), dtype=np.uint8)
    soil_img[:, :, 0] = 180  # Red
    soil_img[:, :, 1] = 90   # Green
    soil_img[:, :, 2] = 50   # Blue

    res_soil = segment_rgb_photo(soil_img)
    assert res_soil["vegetation_fraction"] < 0.10
    assert res_soil["status"] == "severe_clearing_or_bare_soil"
    assert res_soil["exg_mean"] < 0.0
