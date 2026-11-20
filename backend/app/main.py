import importlib
import logging
import pkgutil
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
import app.routers as routers_package

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prakriti-netra")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info(f"Starting PRAKRITI-NETRA Backend (DATA_MODE={settings.DATA_MODE})")
    
    # Optional demo seed on startup if demo mode is active
    if settings.DATA_MODE == "demo":
        try:
            from app.db import list_alerts
            from data.generate_demo import generate_demo_dataset
            from ml.detector import run_detector_pipeline

            # Check if any alerts exist, if not run generator & detector once to seed DB
            existing_alerts = list_alerts()
            if not existing_alerts:
                logger.info("Demo DB empty. Generating synthetic demo rasters and running initial detector pass...")
                generate_demo_dataset()
                run_detector_pipeline()
                logger.info("Startup demo seeding completed successfully.")
        except Exception as e:
            logger.warning(f"Startup seeding notice: {e}")

    yield
    # Shutdown actions
    logger.info("Shutting down PRAKRITI-NETRA Backend.")


app = FastAPI(
    title="PRAKRITI-NETRA API",
    description="The Satellite Eye for India's Forests, Water & Wildlife (Code for Innovex '26)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS: Allow frontend from port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        settings.VITE_API_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for alert before/after PNGs
app.mount("/static", StaticFiles(directory=str(settings.STATIC_DIR)), name="static")


# Dynamically register all router modules in app/routers
def register_routers():
    for _, module_name, _ in pkgutil.iter_modules(routers_package.__path__):
        full_module_path = f"app.routers.{module_name}"
        try:
            mod = importlib.import_module(full_module_path)
            if hasattr(mod, "router") and isinstance(mod.router, APIRouter):
                app.include_router(mod.router)
                logger.info(f"Auto-registered router module: {full_module_path}")
        except Exception as exc:
            logger.error(f"Failed to auto-register router {full_module_path}: {exc}")


register_routers()
