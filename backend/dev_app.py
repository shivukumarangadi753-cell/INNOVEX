"""
Standalone Development Runner for Sidharthan's Lane
Serves all routers in backend/app/routers/ with CORS enabled for http://localhost:5173.
Allows local testing and inspection at http://localhost:8000/docs without modifying Shivukumar's app/main.py.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.app.routers.fire import router as fire_router
from backend.app.routers.wildlife import router as wildlife_router
from backend.app.routers.water import router as water_router
from backend.app.routers.advisor import router as advisor_router
from backend.app.routers.telegram import router as telegram_router

app = FastAPI(
    title="Prakriti-Netra API (Fire, Wildlife, Water & Telegram Lane)",
    description="Satellite Eye for India's Forests & Water - Kudremukh MVP",
    version="1.0.0"
)

# CORS configuration allowing requests from Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-mount routers owned by this lane
app.include_router(fire_router)
app.include_router(wildlife_router)
app.include_router(water_router)
app.include_router(advisor_router)
app.include_router(telegram_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "data_mode": "demo"
    }


if __name__ == "__main__":
    uvicorn.run("backend.dev_app:app", host="0.0.0.0", port=8000, reload=True)
