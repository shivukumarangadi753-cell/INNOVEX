# Prakriti-Netra Lane Handoff: Fire, Wildlife, Water & Telegram

**Developer:** Sidharthan  
**Lane:** Fire, Wildlife, Water, Smart Water Use, Live Adapters, and Telegram  
**Branch:** `feature/sidharthan-water-fire-alerts`  
*(Reminder: Git operations are completely yours to perform. No git commands were executed.)*

---

## 1. Files Created in This Lane

### Backend Routers & API Contracts (`backend/app/routers/`)
- `backend/app/routers/fire.py`: `GET /api/fire/hotspots`, `GET /api/fire/burn-scars`
- `backend/app/routers/wildlife.py`: `GET /api/wildlife/corridors` (corridor risk ratings + plain-language reasoning)
- `backend/app/routers/water.py`: `GET /api/water/lakes`, `GET /api/water/lakes/{id}/trend`, `GET /api/water/groundwater`
- `backend/app/routers/advisor.py`: `POST /api/advisor/irrigation`, `POST /api/jal-score`
- `backend/app/routers/telegram.py`: `POST /api/alerts/{id}/telegram` (stubs `from app.db import get_alert` until Shivukumar's db is merged)

### Live Adapters & Services (`backend/adapters/`, `backend/services/`)
- `backend/adapters/firms.py`: NASA FIRMS VIIRS active fire adapter with automatic demo fallback.
- `backend/adapters/copernicus.py`: Sentinel-2 NDWI lake area adapter with automatic demo fallback.
- `backend/adapters/indiawris.py`: India-WRIS / CGWB groundwater telemetry adapter with automatic demo fallback.
- `backend/services/telegram.py`: Telegram Bot notification service formatting coordinates, Google Maps GPS link, and before/after imagery.

### Deterministic Demo Data (`backend/data/water_fire_demo/`)
- `hotspots.json`: Kudremukh active thermal detections (`data_mode: "demo"`).
- `burn_scars.geojson`: GeoJSON FeatureCollection with Kudremukh grassland/forest burn polygons.
- `corridors.geojson`: GeoJSON FeatureCollection with Elephant, Tiger, and Riparian corridors.
- `lakes.json`: Lakya Dam and Bhadra backwaters NDWI multi-temporal series exhibiting drying pattern (-24.78% change, triggering early warning).
- `groundwater.json`: Mudigere observation well water table telemetry.

### Automated Tests (`backend/tests/`)
- `backend/tests/test_advisor_rules.py`: Comprehensive test suite for irrigation rules and Jal-Score calculations.
- `backend/tests/test_water_fire_routers.py`: Integration and contract validation tests for all endpoints.

### Frontend Pages, Features & Translations (`frontend/src/`)
- `frontend/src/pages/FireWildlife.tsx`: MapLibre GL map with VIIRS hotspots, burn scars, risk-rated wildlife corridors with icons, and field advisory panel.
- `frontend/src/pages/WaterWatch.tsx`: Recharts time-series for lake area and groundwater, "Drying-lake early warning" banner, and beginner-friendly NDWI/groundwater tooltips.
- `frontend/src/pages/SmartWaterUse.tsx`: Farmer irrigation advisor (with "Irrigate now" vs "Wait" card) and Town/Industry Jal-Score auditor with 0–100 gauge and 3 saving tips.
- `frontend/src/features/stubs/components.tsx`: Card, Chip, Toast, Skeleton component stubs (isolated until Payal's shared library is merged).
- `frontend/src/features/api/client.ts`: Unified API client supporting both Live API (`VITE_API_URL`) and Mock mode (`VITE_USE_MOCK`).
- `frontend/src/locales/{en,hi,kn}/fire.json`: Translations in English, Hindi, and Kannada.
- `frontend/src/locales/{en,hi,kn}/water.json`: Translations in English, Hindi, and Kannada.
- `frontend/src/locales/{en,hi,kn}/advisor.json`: Translations in English, Hindi, and Kannada.
- `frontend/src/i18n.ts`: i18next configuration with language detector.
- `frontend/src/App.tsx`: Navigation bar and test harness with language switcher.

### Configuration
- `.env.example`: Documented environment variable template.
- `backend/dev_app.py`: Standalone development runner with CORS support for `http://localhost:5173`.

---

## 2. How to Run & Verify

### Backend Test Suite (Pytest)
```bash
.\.venv_prakriti\Scripts\python.exe -m pytest backend/tests -v
```
*(All 18 unit and contract tests execute and pass in ~1 second).*

### Backend Standalone Dev Server
```bash
.\.venv_prakriti\Scripts\python.exe -m uvicorn backend.dev_app:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive API documentation available at: **http://localhost:8000/docs**
- Health endpoint: **http://localhost:8000/api/health**

### Frontend Dev Server (Vite)
```bash
cd frontend
npm run dev
```
- Open **http://localhost:5173** in your browser.
- Switch between **Fire & Wildlife**, **Water Watch**, and **Smart Water Use**.
- Change language using the top-right language picker (`EN`, `HI`, `KN`).

---

## 3. What is Demo vs. Live Data

| Data Stream | Demo Mode (Default) | Live Satellite / Sensor Mode |
|---|---|---|
| **Fire Hotspots** | Deterministic VIIRS thermal points in Kudremukh (`data_mode: "demo"`) | NASA FIRMS API via `FIRMS_MAP_KEY` (`data_mode: "live"`) |
| **Burn Scars** | GeoJSON polygons in Kudremukh western slopes | Sentinel-2 NBR post-fire processing pipeline |
| **Wildlife Corridors** | Kudremukh-Someshwara, Bhadra-Kudremukh, Agumbe pathways | Expert-reviewed GeoJSON boundary definitions |
| **Lake NDWI Extent** | Lakya Dam multi-temporal series showing 24.8% drop (`warning: true`) | Sentinel-2 L2A water extraction via Copernicus CDSE |
| **Groundwater Depth** | CGWB Mudigere station telemetry (4.8m to 8.1m depth) | India-WRIS telemetry API |
| **Jal-Score & Advisor** | Rule-based agro-hydrological algorithm | Real-time sensor input with satellite NDVI |

All demo data responses explicitly include `"data_mode": "demo"`, and every UI page renders a distinct `DEMO DATA` badge.

---

## 4. Untested Live Adapters (Pending API Keys)

The following live adapters were verified to fall back cleanly to demo data with clear log lines, but their external live networks could not be tested against production servers due to unconfigured credentials:
1. **NASA FIRMS (`FIRMS_MAP_KEY`):** Live VIIRS query falls back cleanly when key is absent.
2. **Copernicus CDSE (`COPERNICUS_CLIENT_ID`, `COPERNICUS_CLIENT_SECRET`):** OAuth2 token generation and live tile processing falls back cleanly.
3. **India-WRIS Telemetry (`INDIAWRIS_API_KEY`):** Observation well live endpoint falls back cleanly.
4. **Telegram Bot Dispatch (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`):** Returns HTTP 200 with `{sent: false, detail: "Telegram not configured"}` gracefully without crashing.

---

## 5. Notes for Teammates

- **Shivukumar:** Our routers in `backend/app/routers/` (`fire.py`, `wildlife.py`, `water.py`, `advisor.py`, `telegram.py`) are self-contained with their own Pydantic models. Your `app/main.py` will auto-mount them when merged. In `telegram.py`, we import `get_alert` from `app.db` with a fallback stub.
- **Payal:** We imported temporary component stubs from `src/features/stubs/components.tsx` (`Card`, `Chip`, `Toast`, `Skeleton`). Once your shared UI library is merged, our three pages can directly switch to importing from your components folder.
