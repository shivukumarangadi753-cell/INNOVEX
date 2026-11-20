# PRAKRITI-NETRA: Core Engine Handoff Document

**Lane:** Core Engine (Backend Scaffold + Change Detector + Alert Pipeline)  
**Assigned Branch:** `feature/shivu-core-engine`  
**Author:** Shivu (Core Engine Lane)  
**Date:** 2026-11-20  
**Project:** PRAKRITI-NETRA ("The Satellite Eye for India's Forests, Water & Wildlife")  
**Theme:** Code for Innovex '26 (Track: Protecting Natural Wealth)  

---

> [!IMPORTANT]
> **Git Reminder:** In accordance with Hard Rule 1, zero git commands were run by the AI agent. You must manually stage, commit, and push your work on `feature/shivu-core-engine`:
> ```bash
> git checkout -b feature/shivu-core-engine
> git status
> git add backend/ docs/ .env.example .gitignore
> git commit -m "feat(core-engine): implement backend scaffold, change detector, demo generator, and alert endpoints"
> ```

---

## 1. Summary of Deliverables & Files Created

### Core Architecture & Backend
- [`backend/app/main.py`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/app/main.py): FastAPI application root with CORS support for `http://localhost:5173`, static image mount at `/static`, and dynamic auto-registration of any router inside `backend/app/routers/` via `pkgutil`.
- [`backend/app/config.py`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/app/config.py): Environment settings reader supporting `.env` with fallback defaults.
- [`backend/app/schemas.py`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/app/schemas.py): Pydantic models matching the verbatim shared API contract for Alerts, Reserves, Reviews, Telegram, and teammate endpoints.
- [`backend/app/db.py`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/app/db.py): SQLite / SQLAlchemy database layer exposing reusable helper functions (`get_alert`, `list_alerts`, `save_alert`, `review_alert`, `list_reserves`, `save_reserve`).
- [`backend/app/routers/health.py`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/app/routers/health.py): `GET /api/health` (`status: "ok"`, `data_mode: "demo"`).
- [`backend/app/routers/reserves.py`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/app/routers/reserves.py): `GET /api/reserves` returning Kudremukh Reserve (`is_official: false`).
- [`backend/app/routers/alerts.py`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/app/routers/alerts.py): `GET /api/alerts`, `GET /api/alerts/{id}`, `POST /api/alerts/{id}/review`, and `POST /api/alerts/{id}/telegram`.
- [`backend/app/routers/detect.py`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/app/routers/detect.py): `POST /api/detect/run` and `POST /api/model/retrain`.
- [`backend/requirements.txt`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/requirements.txt): Complete dependency list.

### ML & Detection Engine
- [`backend/ml/config.yaml`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/ml/config.yaml): Single editable source of truth for detection thresholds (`dndvi < -0.25`, `vh_drop > 3.0 dB`, `min_patch_ha = 0.5`, SCL cloud classes).
- [`backend/ml/detector.py`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/ml/detector.py): Real 6-step change detector pipeline (Fetch $\rightarrow$ Clean SCL $\rightarrow$ Compare per-pixel $\Delta\text{NDVI}$, $\Delta\text{NBR}$, SAR $\Delta\text{VH}$ $\rightarrow$ Filter reserve & $\ge 0.5\text{ ha}$ $\rightarrow$ Classify Random Forest $\rightarrow$ Alert generation & before/after PNG thumbnail crops).
- [`backend/ml/model.joblib`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/ml/model.joblib): Persisted Random Forest classifier model and feature importances.

### Data & Static Assets
- [`backend/data/generate_demo.py`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/data/generate_demo.py): Synthetic Sentinel-2 & Sentinel-1 raster generator planting exactly 5 patches (1 real clearing, 1 fire scar, 1 seasonal leaf fall decoy, 1 cloud decoy, 1 outside-reserve clearing).
- [`backend/data/kudremukh_reserve.geojson`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/data/kudremukh_reserve.geojson): Simplified Kudremukh reserve boundary marked `is_official: false`.
- [`backend/static/alerts/`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/static/alerts/): Generated false-color before and after preview crops for each alert.

### Tests & Documentation
- [`backend/tests/test_detector.py`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/tests/test_detector.py): Verification tests ensuring clearing alerts, decoys do not alert, and small patches are dropped.
- [`backend/tests/test_api.py`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/backend/tests/test_api.py): Integration tests covering all endpoints and review flows.
- [`docs/API_CONTRACT.md`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/docs/API_CONTRACT.md): Verbatim API contract.
- [`.env.example`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/.env.example): Root environment variable template.
- [`.gitignore`](file:///c:/Users/ShivuKumar/OneDrive/Documents/project/.gitignore): Updated with raster and SQLite ignore patterns.

---

## 2. How to Run & Verify

### Starting the Backend Server
From the project root:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
Open your browser to:
- Interactive API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Monitored Reserves: [http://localhost:8000/api/reserves](http://localhost:8000/api/reserves)
- Forest Alerts: [http://localhost:8000/api/alerts](http://localhost:8000/api/alerts)

### Running Automated Tests
From the project root:
```bash
python -m pytest backend/tests -v
```
All 12 unit and integration tests run and pass in ~4 seconds.

---

## 3. How Teammates Integrate With This Backend

Teammates working on **Fire/Burn Scars**, **Water Bodies/Lakes**, or **Advisory/Jal-Score** only need to:
1. Create a new router file in `backend/app/routers/` (e.g. `backend/app/routers/water.py` or `fire.py`).
2. Define `router = APIRouter(prefix="/api/...", tags=[...])`.
3. Import shared schemas from `app.schemas` and DB helpers from `app.db`.
4. **Never edit `backend/app/main.py`** — it will automatically detect and mount the new endpoints on startup!

---

## 4. Honest Disclosure: Demo vs. Live Integration

| Component | Status | Details |
| :--- | :--- | :--- |
| **Sentinel-2 & Sentinel-1 Rasters** | **DEMO DATA** | Synthetically generated around Kudremukh (~13.1°N, 75.2°E) using genuine mathematical distributions for B4, B8, B12, SCL, and SAR VH backscatter. Clearly labeled `data_mode: "demo"`. |
| **Kudremukh Reserve Boundary** | **DEMO DATA** | Approximate geometric boundary flagged `is_official: false`. |
| **Telegram Dispatch** | **HYBRID** | If `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID` are set in `.env`, dispatches real messages via the Telegram Bot API. If unset, falls back to a simulated demo delivery response. |
| **Change Detector & ML Classifier** | **LIVE CODE** | Real NDVI, NBR, and SAR VH difference algorithms, SCL masking, spatial filtering, and a trained scikit-learn Random Forest model. |
| **Copernicus Data Space API** | **UNTESTED LIVE** | Client ID / Secret placeholders are configured in `.env`, but live API streaming was not executed (as required for offline demo reproducibility). |
| **PostgreSQL / PostGIS** | **READY** | Designed with standard GeoJSON geometries for seamless swap from SQLite to PostgreSQL/PostGIS. |

---

## 5. Untested Items

1. **High-concurrency database writes:** SQLite is configured with WAL-compatible transactions suitable for the MVP. Multi-worker write locks under heavy parallel load are untested.
2. **Real Copernicus Data Space Sentinel API token authentication:** Token refresh logic against the live Copernicus OAuth endpoint requires live external internet keys.
