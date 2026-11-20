import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import uuid

import joblib
import numpy as np
from PIL import Image
import rasterio
from rasterio.features import shapes
from rasterio.transform import xy
from scipy.ndimage import label as nd_label
from shapely.geometry import Point, Polygon, shape, mapping
from sklearn.ensemble import RandomForestClassifier
import yaml

from app.config import settings
from app.db import get_alert, list_reserves, save_alert
from app.schemas import Alert, LatLng

logger = logging.getLogger("prakriti-netra.detector")


def load_config() -> dict:
    """Load detector configuration thresholds."""
    config_path = settings.ML_DIR / "config.yaml"
    if not config_path.exists():
        # Fallback defaults if file missing
        return {
            "thresholds": {
                "dndvi_threshold": -0.25,
                "vh_drop_db_threshold": 3.0,
                "dnbr_fire_threshold": -0.30,
                "min_patch_ha": 0.5,
                "filter_inside_reserve": True,
            },
            "scl": {
                "cloud_classes": [3, 8, 9, 10, 11],
                "valid_classes": [4, 5, 6, 7],
            },
        }
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def train_or_load_classifier(retrain: bool = False, extra_samples: Optional[List[Tuple[List[float], str]]] = None) -> Tuple[RandomForestClassifier, dict]:
    """Train or load the Random Forest patch classifier."""
    model_path = settings.ML_DIR / "model.joblib"

    if model_path.exists() and not retrain and not extra_samples:
        payload = joblib.load(model_path)
        return payload["model"], payload.get("feature_importances", {})

    np.random.seed(42)
    # Feature columns: [dNDVI, dNBR, dVH_drop_dB, B8_T2, B12_T2]
    X_list = []
    y_list = []

    # Class 0: clearing (logging, deforestation)
    for _ in range(120):
        dndvi = np.random.normal(-0.60, 0.08)
        dnbr = np.random.normal(-0.55, 0.08)
        dvh = np.random.normal(5.0, 0.8)       # Significant SAR drop
        b8 = np.random.normal(0.22, 0.03)
        b12 = np.random.normal(0.30, 0.03)
        X_list.append([dndvi, dnbr, dvh, b8, b12])
        y_list.append("clearing")

    # Class 1: fire_scar (burned forest)
    for _ in range(100):
        dndvi = np.random.normal(-0.70, 0.06)
        dnbr = np.random.normal(-1.00, 0.12)    # Massive drop in NBR
        dvh = np.random.normal(2.5, 0.6)
        b8 = np.random.normal(0.12, 0.02)
        b12 = np.random.normal(0.40, 0.03)     # High char SWIR
        X_list.append([dndvi, dnbr, dvh, b8, b12])
        y_list.append("fire_scar")

    # Class 2: seasonal (phenology / dry season leaf fall)
    for _ in range(120):
        dndvi = np.random.normal(-0.14, 0.04)   # Modest drop
        dnbr = np.random.normal(-0.08, 0.03)
        dvh = np.random.normal(0.1, 0.3)        # Tree structure intact (no SAR drop)
        b8 = np.random.normal(0.42, 0.03)
        b12 = np.random.normal(0.14, 0.02)
        X_list.append([dndvi, dndvi, dvh, b8, b12])
        y_list.append("seasonal")

    # Class 3: cloud_error (residual cloud/shadow distortion)
    for _ in range(100):
        dndvi = np.random.normal(-0.35, 0.15)
        dnbr = np.random.normal(-0.25, 0.10)
        dvh = np.random.normal(0.0, 0.4)        # Radar unchanged by clouds
        b8 = np.random.normal(0.68, 0.05)       # High cloud reflectance
        b12 = np.random.normal(0.58, 0.05)
        X_list.append([dndvi, dnbr, dvh, b8, b12])
        y_list.append("cloud_error")

    # Append any human feedback reviews
    if extra_samples:
        for feat, label in extra_samples:
            X_list.append(feat)
            y_list.append(label)

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list)

    rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf.fit(X, y)

    feature_names = ["dNDVI", "dNBR", "dVH_drop_dB", "B8_T2", "B12_T2"]
    importances = dict(zip(feature_names, [round(float(v), 4) for v in rf.feature_importances_]))

    joblib.dump({"model": rf, "feature_importances": importances}, model_path)
    logger.info("Random Forest classifier trained and saved. Importances: %s", importances)
    return rf, importances


def _render_rgb_crop(b4: np.ndarray, b8: np.ndarray, b12: np.ndarray, output_path: Path):
    """Render a false-color or natural composite RGB thumbnail from bands."""
    # False-color infrared (B8, B4, B12/Green) gives vivid vegetation representation
    r = np.clip(b8 * 255 / 0.7, 0, 255).astype(np.uint8)
    g = np.clip(b4 * 255 / 0.3, 0, 255).astype(np.uint8)
    b = np.clip(b12 * 255 / 0.4, 0, 255).astype(np.uint8)
    rgb = np.stack([r, g, b], axis=-1)
    img = Image.fromarray(rgb)
    img = img.resize((256, 256), Image.Resampling.BILINEAR)
    img.save(output_path, "PNG")


def crop_thumbnails(
    alert_id: str,
    bbox_rc: Tuple[int, int, int, int],
    t1_bands: Tuple[np.ndarray, np.ndarray, np.ndarray],
    t2_bands: Tuple[np.ndarray, np.ndarray, np.ndarray],
) -> Tuple[str, str]:
    """Extract before and after thumbnail images and save to static/alerts."""
    min_r, max_r, min_c, max_c = bbox_rc
    # Add 25-pixel margin around the patch
    pad = 25
    H, W = t1_bands[0].shape
    r1 = max(0, min_r - pad)
    r2 = min(H, max_r + pad)
    c1 = max(0, min_c - pad)
    c2 = min(W, max_c + pad)

    settings.ALERTS_STATIC_DIR.mkdir(parents=True, exist_ok=True)
    before_path = settings.ALERTS_STATIC_DIR / f"{alert_id}_before.png"
    after_path = settings.ALERTS_STATIC_DIR / f"{alert_id}_after.png"

    _render_rgb_crop(
        t1_bands[0][r1:r2, c1:c2],
        t1_bands[1][r1:r2, c1:c2],
        t1_bands[2][r1:r2, c1:c2],
        before_path,
    )
    _render_rgb_crop(
        t2_bands[0][r1:r2, c1:c2],
        t2_bands[1][r1:r2, c1:c2],
        t2_bands[2][r1:r2, c1:c2],
        after_path,
    )

    before_url = f"/static/alerts/{alert_id}_before.png"
    after_url = f"/static/alerts/{alert_id}_after.png"
    return before_url, after_url


def run_detector_pipeline(reserve_id: str = "kudremukh") -> List[Alert]:
    """Execute the full 6-step Satellite Change Detection and Alert generation pipeline."""
    cfg = load_config()
    thresholds = cfg["thresholds"]
    scl_cfg = cfg.get("scl", {"cloud_classes": [3, 8, 9, 10, 11]})

    dndvi_thresh = thresholds["dndvi_threshold"]
    vh_drop_thresh = thresholds["vh_drop_db_threshold"]
    min_patch_ha = thresholds["min_patch_ha"]

    # -------------------------------------------------------------------------
    # STEP 1: FETCH (Load T1, T2 rasters and reserve polygon)
    # -------------------------------------------------------------------------
    s2_t1_path = settings.DATA_DIR / "sentinel2_t1.tif"
    s2_t2_path = settings.DATA_DIR / "sentinel2_t2.tif"
    s1_t1_path = settings.DATA_DIR / "sentinel1_vh_t1.tif"
    s1_t2_path = settings.DATA_DIR / "sentinel1_vh_t2.tif"

    if not (s2_t1_path.exists() and s2_t2_path.exists()):
        from data.generate_demo import generate_demo_dataset
        generate_demo_dataset()

    with rasterio.open(s2_t1_path) as src_t1:
        b4_t1 = src_t1.read(1)
        b8_t1 = src_t1.read(2)
        b12_t1 = src_t1.read(3)
        scl_t1 = src_t1.read(4)
        transform = src_t1.transform
        crs = src_t1.crs

    with rasterio.open(s2_t2_path) as src_t2:
        b4_t2 = src_t2.read(1)
        b8_t2 = src_t2.read(2)
        b12_t2 = src_t2.read(3)
        scl_t2 = src_t2.read(4)

    with rasterio.open(s1_t1_path) as src_s1_t1:
        vh_t1 = src_s1_t1.read(1)

    with rasterio.open(s1_t2_path) as src_s1_t2:
        vh_t2 = src_s1_t2.read(1)

    # Load Reserve Polygon
    reserve_path = settings.DATA_DIR / "kudremukh_reserve.geojson"
    if reserve_path.exists():
        with open(reserve_path, "r", encoding="utf-8") as f:
            reserve_data = json.load(f)
            reserve_geom = shape(reserve_data["geometry"])
    else:
        # Fallback bounding box polygon inside grid
        reserve_geom = Polygon([
            (75.206, 13.166),
            (75.234, 13.166),
            (75.234, 13.194),
            (75.206, 13.194),
            (75.206, 13.166),
        ])

    # -------------------------------------------------------------------------
    # STEP 2: CLEAN (Mask clouds/shadows via SCL & align grids)
    # -------------------------------------------------------------------------
    cloud_classes = set(scl_cfg.get("cloud_classes", [3, 8, 9, 10, 11]))
    cloud_mask_t1 = np.isin(scl_t1, list(cloud_classes))
    cloud_mask_t2 = np.isin(scl_t2, list(cloud_classes))
    valid_data_mask = ~(cloud_mask_t1 | cloud_mask_t2)

    # -------------------------------------------------------------------------
    # STEP 3: COMPARE (dNDVI, dNBR, SAR VH change in dB)
    # -------------------------------------------------------------------------
    # Prevent divide-by-zero
    eps = 1e-6
    ndvi_t1 = (b8_t1 - b4_t1) / (b8_t1 + b4_t1 + eps)
    ndvi_t2 = (b8_t2 - b4_t2) / (b8_t2 + b4_t2 + eps)
    dndvi = ndvi_t2 - ndvi_t1

    nbr_t1 = (b8_t1 - b12_t1) / (b8_t1 + b12_t1 + eps)
    nbr_t2 = (b8_t2 - b12_t2) / (b8_t2 + b12_t2 + eps)
    dnbr = nbr_t2 - nbr_t1

    # SAR VH loss in dB: drop in backscatter
    dvh_drop = vh_t1 - vh_t2

    # Candidate pixels: significant vegetation or structural change where data is valid
    candidate_pixels = (
        valid_data_mask
        & ((dndvi < dndvi_thresh) | (dvh_drop > vh_drop_thresh))
    )

    # -------------------------------------------------------------------------
    # STEP 4: FILTER (Inside reserve only & drop patches < 0.5 ha / 50 pixels)
    # -------------------------------------------------------------------------
    from rasterio.features import geometry_mask
    H, W = candidate_pixels.shape
    inside_reserve_mask = geometry_mask([reserve_geom], out_shape=(H, W), transform=transform, invert=True)

    filtered_candidates = candidate_pixels & inside_reserve_mask

    # Connected components labeling
    labeled_array, num_features = nd_label(filtered_candidates)
    logger.info("Found %d raw connected components before area filtering.", num_features)

    # Train or load ML classifier
    classifier, importances = train_or_load_classifier()

    alerts_created: List[Alert] = []
    now_iso = datetime.now(timezone.utc).isoformat()

    # -------------------------------------------------------------------------
    # STEP 5 & 6: CLASSIFY & ALERT
    # -------------------------------------------------------------------------
    for feature_id in range(1, num_features + 1):
        patch_mask = (labeled_array == feature_id)
        pixel_count = int(np.count_nonzero(patch_mask))
        # 1 pixel = 100 m² = 0.01 ha
        area_ha = round(pixel_count * 0.01, 2)

        # Drop patches < 0.5 ha (50 pixels at 10m grid)
        if area_ha < min_patch_ha:
            logger.info("Dropping small patch (feature %d): %.2f ha < %.2f ha", feature_id, area_ha, min_patch_ha)
            continue

        # Extract patch features for Random Forest
        patch_dndvi = float(np.mean(dndvi[patch_mask]))
        patch_dnbr = float(np.mean(dnbr[patch_mask]))
        patch_dvh = float(np.mean(dvh_drop[patch_mask]))
        patch_b8_t2 = float(np.mean(b8_t2[patch_mask]))
        patch_b12_t2 = float(np.mean(b12_t2[patch_mask]))

        features_vector = np.array([[
            patch_dndvi,
            patch_dnbr,
            patch_dvh,
            patch_b8_t2,
            patch_b12_t2,
        ]], dtype=np.float32)

        predicted_label = str(classifier.predict(features_vector)[0])
        probabilities = classifier.predict_proba(features_vector)[0]
        confidence = float(np.max(probabilities))

        logger.info(
            "Patch %d (%.2f ha) classified as '%s' with confidence %.3f (features: dNDVI=%.2f, dvh=%.2f dB)",
            feature_id, area_ha, predicted_label, confidence, patch_dndvi, patch_dvh
        )

        # Only real clearing or actionable disturbance alerts
        # Non-clearing decoys (seasonal, cloud, small) do not alert!
        if predicted_label != "clearing":
            logger.info("Patch %d rejected: classified as '%s', not an actionable clearing alert.", feature_id, predicted_label)
            continue

        # Compute centroid & boundary polygon in geographic coordinates
        patch_rows, patch_cols = np.where(patch_mask)
        min_r, max_r = int(np.min(patch_rows)), int(np.max(patch_rows))
        min_c, max_c = int(np.min(patch_cols)), int(np.max(patch_cols))

        center_r = float(np.mean(patch_rows))
        center_c = float(np.mean(patch_cols))
        center_x, center_y = xy(transform, center_r, center_c)
        centroid = LatLng(lat=round(center_y, 6), lng=round(center_x, 6))

        # Vectorize patch mask into GeoJSON polygon
        shapes_gen = shapes(patch_mask.astype(np.int16), mask=patch_mask, transform=transform)
        polygons = [Polygon(geom["coordinates"][0]) for geom, val in shapes_gen if val == 1]
        if polygons:
            patch_geom = polygons[0] if len(polygons) == 1 else polygons[0].buffer(0)
        else:
            # Fallback envelope
            x1, y1 = xy(transform, min_r, min_c)
            x2, y2 = xy(transform, max_r, max_c)
            patch_geom = Polygon([(x1, y1), (x2, y1), (x2, y2), (x1, y2), (x1, y1)])

        alert_id = f"alt_{uuid.uuid4().hex[:8]}"

        # Render before / after crops
        before_url, after_url = crop_thumbnails(
            alert_id=alert_id,
            bbox_rc=(min_r, max_r, min_c, max_c),
            t1_bands=(b4_t1, b8_t1, b12_t1),
            t2_bands=(b4_t2, b8_t2, b12_t2),
        )

        polygon_feature = {
            "type": "Feature",
            "properties": {
                "alert_id": alert_id,
                "label": predicted_label,
                "area_ha": area_ha,
                "confidence": round(confidence, 3),
            },
            "geometry": mapping(patch_geom),
        }

        alert = Alert(
            id=alert_id,
            reserve_id=reserve_id,
            status="open",
            label=predicted_label,  # type: ignore
            area_ha=area_ha,
            confidence=round(confidence, 3),
            centroid=centroid,
            polygon=polygon_feature,
            detected_at=now_iso,
            pass_t1="2026-10-15T05:30:00Z",
            pass_t2="2026-11-15T05:30:00Z",
            before_image_url=before_url,
            after_image_url=after_url,
            data_mode="demo" if settings.DATA_MODE == "demo" else "live",
        )

        save_alert(alert)
        alerts_created.append(alert)
        logger.info("Alert %s generated: %.2f ha %s at (%.4f, %.4f)", alert_id, area_ha, predicted_label, centroid.lat, centroid.lng)

    return alerts_created
