import os
from pathlib import Path
from typing import Literal
from dotenv import load_dotenv

# Search for .env files
ENV_PATHS = [
    Path(__file__).resolve().parent.parent.parent / ".env",
    Path(__file__).resolve().parent.parent / ".env",
]
for p in ENV_PATHS:
    if p.exists():
        load_dotenv(p)


class Settings:
    def __init__(self):
        self.DATA_MODE: Literal["demo", "live"] = (
            "live" if os.getenv("DATA_MODE", "demo").lower() == "live" else "demo"
        )
        self.PORT: int = int(os.getenv("PORT", "8000"))
        self.HOST: str = os.getenv("HOST", "0.0.0.0")

        self.TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
        self.FIRMS_MAP_KEY: str = os.getenv("FIRMS_MAP_KEY", "")
        self.COPERNICUS_CLIENT_ID: str = os.getenv("COPERNICUS_CLIENT_ID", "")
        self.COPERNICUS_CLIENT_SECRET: str = os.getenv("COPERNICUS_CLIENT_SECRET", "")
        self.VITE_API_URL: str = os.getenv("VITE_API_URL", "http://localhost:8000")
        self.VITE_USE_MOCK: bool = os.getenv("VITE_USE_MOCK", "false").lower() in ("true", "1", "yes")

        # Directories
        self.BASE_DIR: Path = Path(__file__).resolve().parent.parent
        self.PROJECT_ROOT: Path = self.BASE_DIR.parent
        self.STATIC_DIR: Path = self.BASE_DIR / "static"
        self.ALERTS_STATIC_DIR: Path = self.BASE_DIR / "static" / "alerts"
        self.DATA_DIR: Path = self.BASE_DIR / "data"
        self.ML_DIR: Path = self.BASE_DIR / "ml"
        self.DB_PATH: Path = self.BASE_DIR / "prakriti_netra.db"

        # Ensure directories exist
        self.STATIC_DIR.mkdir(parents=True, exist_ok=True)
        self.ALERTS_STATIC_DIR.mkdir(parents=True, exist_ok=True)
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.ML_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
