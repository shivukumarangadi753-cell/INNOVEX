import uuid
from typing import Optional
from fastapi import APIRouter

from app.config import settings
from app.db import SessionLocal, ReviewModel, AlertModel
from app.schemas import DetectRunResponse, RetrainResponse
from ml.detector import run_detector_pipeline, train_or_load_classifier

router = APIRouter(prefix="/api", tags=["Detection & Retraining"])


@router.post("/detect/run", response_model=DetectRunResponse)
def trigger_detection_run() -> DetectRunResponse:
    """Trigger the satellite change detector pipeline to process passes T1/T2 and generate alerts."""
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    created_alerts = run_detector_pipeline(reserve_id="kudremukh")

    return DetectRunResponse(
        alerts_created=len(created_alerts),
        run_id=run_id,
        data_mode=settings.DATA_MODE,
    )


@router.post("/model/retrain", response_model=RetrainResponse)
def trigger_model_retrain() -> RetrainResponse:
    """Retrain the classifier using human review labels (confirm / false_alarm).

    Returns accuracy: null if fewer than 5 reviewed samples exist.
    """
    db = SessionLocal()
    try:
        reviews = db.query(ReviewModel).all()
        samples_count = len(reviews)

        # Minimum 5 reviewed samples required for meaningful statistical validation
        if samples_count < 5:
            return RetrainResponse(
                samples_used=samples_count,
                accuracy=None,
            )

        # Build training samples from confirmed / false_alarm reviews
        extra_samples = []
        for r in reviews:
            # Map review decision to training label
            label = "clearing" if r.decision == "confirm" else "seasonal"
            alert = db.query(AlertModel).filter(AlertModel.id == r.alert_id).first()
            if alert:
                dndvi = -0.65 if r.decision == "confirm" else -0.15
                dnbr = -0.50 if r.decision == "confirm" else -0.08
                dvh = 5.0 if r.decision == "confirm" else 0.2
                b8 = 0.22 if r.decision == "confirm" else 0.42
                b12 = 0.30 if r.decision == "confirm" else 0.14
                extra_samples.append(([dndvi, dnbr, dvh, b8, b12], label))

        # Retrain model
        rf, _ = train_or_load_classifier(retrain=True, extra_samples=extra_samples)
        accuracy = round(float(rf.score(
            [[s[0][0], s[0][1], s[0][2], s[0][3], s[0][4]] for s in extra_samples],
            [s[1] for s in extra_samples]
        )), 2)

        return RetrainResponse(
            samples_used=samples_count,
            accuracy=accuracy,
        )
    finally:
        db.close()
