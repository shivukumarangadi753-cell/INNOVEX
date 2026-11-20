"""
Engine 1: Vegetation Change Detection & Multispectral Analysis.
Provides pure, modular functions for computing remote sensing indices (NDVI, NBR, NDWI, dNDVI, dNBR),
Sentinel-2 SCL cloud/shadow filtering, Sentinel-1 SAR radar backscatter drop,
and RGB field/drone photo vegetation segmentation.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np

logger = logging.getLogger("prakriti.ml.vegetation")

# Safe epsilon for zero-division avoidance
EPS = 1e-7


def compute_ndvi(b4_red: np.ndarray, b8_nir: np.ndarray) -> np.ndarray:
    """
    Compute Normalized Difference Vegetation Index (NDVI).
    Formula: (NIR - Red) / (NIR + Red + EPS)
    Values range from -1.0 to 1.0 (dense canopy > 0.6, water < 0, bare soil ~ 0.1-0.25).
    """
    red = b4_red.astype(np.float32)
    nir = b8_nir.astype(np.float32)
    denominator = nir + red + EPS
    ndvi = (nir - red) / denominator
    return np.clip(ndvi, -1.0, 1.0)


def compute_dndvi(ndvi_t1: np.ndarray, ndvi_t2: np.ndarray) -> np.ndarray:
    """
    Compute bi-temporal differential NDVI (dNDVI = NDVI_T2 - NDVI_T1).
    Negative values indicate canopy loss / vegetation clearing.
    """
    return (ndvi_t2.astype(np.float32) - ndvi_t1.astype(np.float32)).clip(-2.0, 2.0)


def compute_nbr(b8_nir: np.ndarray, b12_swir2: np.ndarray) -> np.ndarray:
    """
    Compute Normalized Burn Ratio (NBR).
    Formula: (NIR - SWIR2) / (NIR + SWIR2 + EPS)
    Healthy vegetation has high NBR, while freshly burned areas have low/negative NBR.
    """
    nir = b8_nir.astype(np.float32)
    swir = b12_swir2.astype(np.float32)
    denominator = nir + swir + EPS
    nbr = (nir - swir) / denominator
    return np.clip(nbr, -1.0, 1.0)


def compute_dnbr(nbr_t1: np.ndarray, nbr_t2: np.ndarray) -> np.ndarray:
    """
    Compute bi-temporal differential NBR (dNBR).
    Formula: NBR_T2 - NBR_T1 (negative values represent burn damage and char).
    """
    return (nbr_t2.astype(np.float32) - nbr_t1.astype(np.float32)).clip(-2.0, 2.0)


def compute_ndwi(b3_green: np.ndarray, b8_nir: np.ndarray) -> np.ndarray:
    """
    Compute McFeeters Normalized Difference Water Index (NDWI).
    Formula: (Green - NIR) / (Green + NIR + EPS)
    Positive values (> 0.0) generally represent open water surfaces.
    """
    green = b3_green.astype(np.float32)
    nir = b8_nir.astype(np.float32)
    denominator = green + nir + EPS
    ndwi = (green - nir) / denominator
    return np.clip(ndwi, -1.0, 1.0)


def compute_radar_vh_drop(vh_t1: np.ndarray, vh_t2: np.ndarray) -> np.ndarray:
    """
    Compute Sentinel-1 C-band SAR cross-polarization (VH) drop in decibels (dB).
    Formula: VH_T1 - VH_T2
    A positive drop (> 3.0 dB) indicates structural canopy volume loss (e.g., clear-cutting),
    which penetrates monsoonal cloud cover.
    """
    return (vh_t1.astype(np.float32) - vh_t2.astype(np.float32))


def create_scl_validity_mask(
    scl: np.ndarray,
    cloud_classes: Optional[List[int]] = None,
    valid_classes: Optional[List[int]] = None,
) -> np.ndarray:
    """
    Generate boolean mask indicating valid optical data pixels using Sentinel-2 Scene Classification Layer (SCL).
    Classes (ESA S2 L2A):
      0: NO_DATA, 1: SATURATED_OR_DEFECTIVE, 2: DARK_AREA_PIXELS,
      3: CLOUD_SHADOWS, 4: VEGETATION, 5: NOT_VEGETATED, 6: WATER,
      7: UNCLASSIFIED, 8: CLOUD_MEDIUM_PROBABILITY, 9: CLOUD_HIGH_PROBABILITY,
      10: THIN_CIRRUS, 11: SNOW_OR_ICE
    Returns:
      np.ndarray of bool (True = valid pixel, False = cloud, shadow, or defect)
    """
    invalid_targets = cloud_classes if cloud_classes is not None else [0, 1, 3, 8, 9, 10, 11]
    is_invalid = np.isin(scl, invalid_targets)

    if valid_classes is not None:
        is_valid = np.isin(scl, valid_classes)
        return is_valid & (~is_invalid)

    return ~is_invalid


def extract_vegetation_loss_mask(
    dndvi: np.ndarray,
    dvh_drop: Optional[np.ndarray],
    valid_mask: np.ndarray,
    dndvi_threshold: float = -0.25,
    vh_drop_threshold: float = 3.0,
) -> np.ndarray:
    """
    Extract candidate canopy loss pixels by combining optical vegetation drops
    and SAR radar structural volume drops on unclouded valid pixels.
    """
    loss_condition = dndvi < dndvi_threshold
    if dvh_drop is not None:
        loss_condition = loss_condition | (dvh_drop > vh_drop_threshold)

    return valid_mask & loss_condition


def segment_rgb_photo(image_rgb: np.ndarray) -> Dict[str, Any]:
    """
    Segment field, drone, or smartphone RGB photos for ground-truthing and citizen reporting.
    Computes Excess Green Index (ExG = 2G - R - B) and Green Leaf Index (GLI).
    Classifies pixels into green vegetation vs non-vegetated (bare soil, mud, rock, concrete).

    Args:
      image_rgb: np.ndarray of shape (H, W, 3) in uint8 [0, 255] or float32 [0.0, 1.0]

    Returns:
      Dict with vegetation_fraction, non_vegetated_fraction, exg_mean, status
    """
    if image_rgb.dtype == np.uint8:
        rgb = image_rgb.astype(np.float32) / 255.0
    else:
        rgb = image_rgb.astype(np.float32)

    r = rgb[:, :, 0]
    g = rgb[:, :, 1]
    b = rgb[:, :, 2]

    # Excess Green Index (ExG)
    exg = 2.0 * g - r - b

    # Green Leaf Index (GLI)
    gli_denom = 2.0 * g + r + b + EPS
    gli = (2.0 * g - r - b) / gli_denom

    # Threshold for healthy green foliage
    green_mask = (exg > 0.08) & (gli > 0.05) & (g > r) & (g > b)

    total_pixels = float(image_rgb.shape[0] * image_rgb.shape[1])
    veg_pixels = float(np.count_nonzero(green_mask))
    veg_fraction = veg_pixels / max(total_pixels, 1.0)
    non_veg_fraction = 1.0 - veg_fraction

    status = "healthy_canopy"
    if veg_fraction < 0.25:
        status = "severe_clearing_or_bare_soil"
    elif veg_fraction < 0.55:
        status = "partial_disturbance"

    return {
        "vegetation_fraction": round(veg_fraction, 4),
        "non_vegetated_fraction": round(non_veg_fraction, 4),
        "exg_mean": round(float(np.mean(exg)), 4),
        "gli_mean": round(float(np.mean(gli)), 4),
        "status": status,
        "green_mask": green_mask,
    }
