from fastapi import APIRouter
from app.config import settings
from app.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Check API server health and current operational data mode (demo or live)."""
    return HealthResponse(
        status="ok",
        data_mode=settings.DATA_MODE,
    )
