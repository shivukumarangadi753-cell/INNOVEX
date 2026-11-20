import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

from app.config import settings
from app.schemas import Alert, LatLng, Reserve

# Database Setup: SQLite with PostGIS-ready column types
DATABASE_URL = f"sqlite:///{settings.DB_PATH.as_posix()}"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ReserveModel(Base):
    __tablename__ = "reserves"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    boundary = Column(Text, nullable=False)  # GeoJSON Feature serialized as JSON string
    is_official = Column(Boolean, default=False, nullable=False)

    alerts = relationship("AlertModel", back_populates="reserve", cascade="all, delete-orphan")


class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, index=True)
    reserve_id = Column(String(64), ForeignKey("reserves.id"), nullable=False, index=True)
    status = Column(String(32), default="open", nullable=False, index=True)  # open, confirmed, false_alarm
    label = Column(String(32), nullable=False)  # clearing, fire_scar, seasonal, cloud_error
    area_ha = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    centroid_lat = Column(Float, nullable=False)
    centroid_lng = Column(Float, nullable=False)
    polygon = Column(Text, nullable=False)  # GeoJSON Feature serialized as JSON string
    detected_at = Column(String(64), nullable=False)
    pass_t1 = Column(String(64), nullable=False)
    pass_t2 = Column(String(64), nullable=False)
    before_image_url = Column(String(255), nullable=False)
    after_image_url = Column(String(255), nullable=False)
    data_mode = Column(String(16), default="demo", nullable=False)

    reserve = relationship("ReserveModel", back_populates="alerts")
    reviews = relationship("ReviewModel", back_populates="alert", cascade="all, delete-orphan")


class ReviewModel(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(String(64), ForeignKey("alerts.id"), nullable=False, index=True)
    decision = Column(String(32), nullable=False)  # confirm, false_alarm
    reviewed_at = Column(String(64), nullable=False)

    alert = relationship("AlertModel", back_populates="reviews")


# Initialize tables
Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Public Helpers for Teammate Import & Core Engine
# ---------------------------------------------------------------------------

def _model_to_alert_schema(m: AlertModel) -> Alert:
    return Alert(
        id=m.id,
        reserve_id=m.reserve_id,
        status=m.status,  # type: ignore
        label=m.label,  # type: ignore
        area_ha=round(m.area_ha, 2),
        confidence=round(m.confidence, 3),
        centroid=LatLng(lat=m.centroid_lat, lng=m.centroid_lng),
        polygon=json.loads(m.polygon),
        detected_at=m.detected_at,
        pass_t1=m.pass_t1,
        pass_t2=m.pass_t2,
        before_image_url=m.before_image_url,
        after_image_url=m.after_image_url,
        data_mode=m.data_mode,  # type: ignore
    )


def _model_to_reserve_schema(m: ReserveModel) -> Reserve:
    return Reserve(
        id=m.id,
        name=m.name,
        boundary=json.loads(m.boundary),
        is_official=m.is_official,
    )


def get_alert(alert_id: str) -> Optional[Alert]:
    """Retrieve an alert by ID."""
    db = SessionLocal()
    try:
        m = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
        return _model_to_alert_schema(m) if m else None
    finally:
        db.close()


def ensure_mangalore_seed_data():
    """Ensure Mangalore reserve and 3 before/after comparison alerts exist in the DB."""
    try:
        from data.generate_mangalore_examples import get_mangalore_alerts_data, get_mangalore_reserve_data
        db = SessionLocal()
        try:
            mng_res = db.query(ReserveModel).filter(ReserveModel.id == "res-mangaluru-coastal").first()
            if not mng_res:
                r_data = get_mangalore_reserve_data()
                new_res = ReserveModel(
                    id=r_data["id"],
                    name=r_data["name"],
                    boundary=json.dumps(r_data["boundary"]),
                    is_official=r_data.get("is_official", False),
                )
                db.add(new_res)
                db.commit()

            mng_alert = db.query(AlertModel).filter(AlertModel.id == "alt-mng-001").first()
            if not mng_alert:
                for a_data in get_mangalore_alerts_data():
                    new_a = AlertModel(
                        id=a_data["id"],
                        reserve_id=a_data["reserve_id"],
                        status=a_data["status"],
                        label=a_data["label"],
                        area_ha=a_data["area_ha"],
                        confidence=a_data["confidence"],
                        centroid_lat=a_data["centroid"]["lat"],
                        centroid_lng=a_data["centroid"]["lng"],
                        polygon=json.dumps(a_data["polygon"]),
                        detected_at=a_data["detected_at"],
                        pass_t1=a_data["pass_t1"],
                        pass_t2=a_data["pass_t2"],
                        before_image_url=a_data["before_image_url"],
                        after_image_url=a_data["after_image_url"],
                        data_mode=a_data.get("data_mode", "demo"),
                    )
                    db.add(new_a)
                db.commit()
        finally:
            db.close()
    except Exception:
        pass


def list_alerts(status: Optional[str] = None) -> List[Alert]:
    """List all alerts, optionally filtered by status ('open', 'confirmed', 'false_alarm')."""
    ensure_mangalore_seed_data()
    db = SessionLocal()
    try:
        query = db.query(AlertModel)
        if status:
            query = query.filter(AlertModel.status == status)
        models = query.order_by(AlertModel.detected_at.desc()).all()
        return [_model_to_alert_schema(m) for m in models]
    finally:
        db.close()


def save_alert(alert: Union[Alert, Dict[str, Any]]) -> Alert:
    """Save or update an alert in SQLite."""
    data = alert.model_dump() if isinstance(alert, Alert) else dict(alert)
    centroid = data["centroid"]
    lat = centroid.get("lat") if isinstance(centroid, dict) else centroid.lat
    lng = centroid.get("lng") if isinstance(centroid, dict) else centroid.lng
    poly_str = json.dumps(data["polygon"]) if not isinstance(data["polygon"], str) else data["polygon"]

    db = SessionLocal()
    try:
        existing = db.query(AlertModel).filter(AlertModel.id == data["id"]).first()
        if existing:
            existing.reserve_id = data["reserve_id"]
            existing.status = data["status"]
            existing.label = data["label"]
            existing.area_ha = data["area_ha"]
            existing.confidence = data["confidence"]
            existing.centroid_lat = lat
            existing.centroid_lng = lng
            existing.polygon = poly_str
            existing.detected_at = data["detected_at"]
            existing.pass_t1 = data["pass_t1"]
            existing.pass_t2 = data["pass_t2"]
            existing.before_image_url = data["before_image_url"]
            existing.after_image_url = data["after_image_url"]
            existing.data_mode = data.get("data_mode", settings.DATA_MODE)
            db.commit()
            db.refresh(existing)
            return _model_to_alert_schema(existing)
        else:
            new_model = AlertModel(
                id=data["id"],
                reserve_id=data["reserve_id"],
                status=data["status"],
                label=data["label"],
                area_ha=data["area_ha"],
                confidence=data["confidence"],
                centroid_lat=lat,
                centroid_lng=lng,
                polygon=poly_str,
                detected_at=data["detected_at"],
                pass_t1=data["pass_t1"],
                pass_t2=data["pass_t2"],
                before_image_url=data["before_image_url"],
                after_image_url=data["after_image_url"],
                data_mode=data.get("data_mode", settings.DATA_MODE),
            )
            db.add(new_model)
            db.commit()
            db.refresh(new_model)
            return _model_to_alert_schema(new_model)
    finally:
        db.close()


def review_alert(alert_id: str, decision: str) -> Optional[Alert]:
    """Review an alert, updating status to confirmed or false_alarm and recording history."""
    db = SessionLocal()
    try:
        alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
        if not alert:
            return None
        
        status_map = {"confirm": "confirmed", "false_alarm": "false_alarm"}
        alert.status = status_map.get(decision, decision)
        
        review = ReviewModel(
            alert_id=alert_id,
            decision=decision,
            reviewed_at=datetime.now(timezone.utc).isoformat(),
        )
        db.add(review)
        db.commit()
        db.refresh(alert)
        return _model_to_alert_schema(alert)
    finally:
        db.close()


def get_reviews_count() -> int:
    """Return count of reviewed alerts for model retraining."""
    db = SessionLocal()
    try:
        return db.query(ReviewModel).count()
    finally:
        db.close()


def list_reserves() -> List[Reserve]:
    """List all registered forest reserves."""
    ensure_mangalore_seed_data()
    db = SessionLocal()
    try:
        models = db.query(ReserveModel).all()
        return [_model_to_reserve_schema(m) for m in models]
    finally:
        db.close()


def save_reserve(reserve: Union[Reserve, Dict[str, Any]]) -> Reserve:
    """Save or update a forest reserve."""
    data = reserve.model_dump() if isinstance(reserve, Reserve) else dict(reserve)
    boundary_str = json.dumps(data["boundary"]) if not isinstance(data["boundary"], str) else data["boundary"]

    db = SessionLocal()
    try:
        existing = db.query(ReserveModel).filter(ReserveModel.id == data["id"]).first()
        if existing:
            existing.name = data["name"]
            existing.boundary = boundary_str
            existing.is_official = data.get("is_official", False)
            db.commit()
            db.refresh(existing)
            return _model_to_reserve_schema(existing)
        else:
            new_model = ReserveModel(
                id=data["id"],
                name=data["name"],
                boundary=boundary_str,
                is_official=data.get("is_official", False),
            )
            db.add(new_model)
            db.commit()
            db.refresh(new_model)
            return _model_to_reserve_schema(new_model)
    finally:
        db.close()
