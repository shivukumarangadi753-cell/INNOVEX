# Hand-off Documentation: Frontend Shell, Design System & Main Pages

**Project**: PRAKRITI-NETRA ("The Satellite Eye for India's Forests, Water & Wildlife")  
**Track**: Protecting Natural Wealth (Code for Innovex '26)  
**Lane Owner**: Payal (Frontend UI & Design System Lead)  
**Branch**: `feature/payal-frontend-ui` *(Managed manually by the user)*  

---

## 1. Summary of Completed Milestones

| Milestone | Scope | Status | Verification |
| :--- | :--- | :--- | :--- |
| **M1: Scaffold & Design System** | Vite + React + TS + Tailwind with custom tokens, 12 reusable components, unified API client (`src/lib/api.ts`), typed interfaces (`src/lib/types.ts`), mock fixtures (`src/mocks/*.json`). | **Complete** | `npm run build` passes with zero errors; components export cleanly for Sidharthan's lane. |
| **M2: App Shell & i18n** | Top bar with logo, tagline, language switcher (EN / हिन्दी / ಕನ್ನಡ), Demo/Live badge, dark/light theme toggle, left sidebar nav (desktop) and bottom nav bar (mobile). | **Complete** | Dynamic switching across 3 languages using separated per-page locale JSONs. |
| **M3: Overview Page** | 4 KPI cards (Open Alerts, Flagged Hectares, Active Fire Hotspots, Water-Stress Index), MapLibre GL Kudremukh reserve boundary & alert pins, "What should I do today?" prioritized field intervention task board. | **Complete** | Responsive layout, real-time alert data integration, direct inspection deep-links. |
| **M4: Forest Watch Page** | MapLibre reserve boundary & change polygon layers, T1/T2 pass toggle, draggable Before/After satellite comparison slider, layer switches (NDVI, Change Mask, Sentinel-1 Radar SAR), 6-step pipeline explainer (FETCH $\to$ CLEAN $\to$ COMPARE $\to$ FILTER $\to$ CLASSIFY $\to$ ALERT). | **Complete** | Slider allows smooth horizontal drag; pipeline steps detail exact processing logic. |
| **M5: Alerts Page** | Status filters (all, open, confirmed, false alarms), sorting (date, area, confidence), card list + slide-out detail drawer with GPS coordinates, "Open in Google Maps" external link, Before/After image slider, "Confirm clearing", "Mark false alarm", and "Send to Telegram" actions with toast feedback. | **Complete** | Fully connected to API contract; friendly toasts trigger on success and failure. |
| **M6: About Page & Tour** | National environmental problem statistics (ISFR 2023, 80% agri freshwater, 25% global groundwater, 2-year survey gap), UN SDG 6/13/15 badges, Now/Next/Later roadmap, official sources footer, and 4-step interactive guided tour walkthrough. | **Complete** | Modal tour guides first-time visitors through key platform capabilities. |
| **M7: Polish & Accessibility** | WCAG AA contrast compliance, keyboard focus rings (`#2E7D4F`), touch targets $\ge$ 44px, screen-reader aria labels, `prefers-reduced-motion` styles, and 360px mobile viewport audit. | **Complete** | Verified across desktop, tablet, and mobile breakpoints. |

---

## 2. Manifest of Created Files

### Configuration & Tooling
- `frontend/package.json` — Frontend dependencies (`maplibre-gl`, `recharts`, `react-i18next`, `lucide-react`, `tailwindcss`)
- `frontend/vite.config.ts` — Vite server configuration on port 5173 with `@/` alias
- `frontend/tsconfig.json` & `frontend/tsconfig.node.json` — Strict TypeScript compiler setup
- `frontend/tailwind.config.js` — Custom color tokens: `cream` (`#F7F3EA`), `navy` (`#12296B`), `forest` (`#2E7D4F`), `teal` (`#1F6F8B`), `amber` (`#B8860B`), `rust` (`#C8441B`), 12px border radius
- `frontend/postcss.config.js` — PostCSS configuration
- `frontend/index.html` — HTML shell with Inter typography and MapLibre stylesheets
- `frontend/.env` & `frontend/.env.example` — `VITE_API_URL=http://localhost:8000`, `VITE_USE_MOCK=true`
- `.env.example` (root) — Full stack environment reference

### Reusable UI Primitives (`frontend/src/components/`)
- `Card.tsx` — Standard card container with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`
- `KpiCard.tsx` — Stat card with large metric, trend indicators, tooltips, and colored accent borders
- `Button.tsx` — Accessible buttons (`primary`, `forest`, `danger`, `teal`, `outline`, `ghost`) with spinner and min 44px touch targets
- `Chip.tsx` — Color + icon chips (never color-only) for statuses (`open`, `confirmed`, `false_alarm`), anomaly types, and risk levels
- `Tooltip.tsx` — Interactive explainer popover for technical terms (NDVI, SAR, Sentinel-2, Hectare)
- `Skeleton.tsx` — Accessible shimmer placeholders (`CardSkeleton`, `ListSkeleton`)
- `EmptyState.tsx` — Friendly empty state illustration with title and call-to-action
- `ErrorState.tsx` — Non-blocking error presentation with retry button
- `Toast.tsx` — Global notification context provider and `useToast` hook for success/error alerts
- `Drawer.tsx` — Slide-out side drawer with backdrop, keyboard Escape support, and focus trapping
- `Tabs.tsx` — Tab navigation bar with badge counts and accessible keyboard roles
- `DemoRibbon.tsx` — Prominent amber banner indicating synthetic telemetry when `data_mode=demo`
- `ImageSlider.tsx` — Draggable Before/After split image comparison slider with keyboard accessibility
- `ReserveMap.tsx` — MapLibre GL map component with Kudremukh boundary, alert markers, and layer toggles
- `TopBar.tsx` — Top bar with logo, tagline, EN/HI/KN language selector, Demo/Live badge, and light/dark toggle
- `Navigation.tsx` — Dual-mode navigation: desktop left sidebar and mobile bottom tab bar

### Core Architecture & API Client (`frontend/src/lib/`)
- `types.ts` — Canonical TypeScript data contracts matching the project's source of truth
- `api.ts` — Unified API client. Dynamically serves mock fixtures when `VITE_USE_MOCK=true`, or calls `VITE_API_URL` when `false`
- `i18n.ts` — `react-i18next` initialization with independent namespaces per page and language

### Data Mock Fixtures (`frontend/src/mocks/`)
- `alerts.json` — 3 realistic Kudremukh alerts (2.4 ha open clearing, 5.1 ha fire scar, 1.8 ha confirmed encroachment)
- `reserves.json` — Kudremukh Reserve Forest & National Park boundary polygon in GeoJSON format
- `fire.json` — Active thermal hotspots and burn scars
- `wildlife.json` — Wildlife elephant/tiger corridors with risk tiers (`low`, `medium`, `high`)
- `water.json` — Lakhya wetland reservoir surface area points, shrinkage trend (-17.1%), and CGWB groundwater depths

### Internationalization Locales (`frontend/src/locales/`)
- `en/` — `common.json`, `overview.json`, `forest.json`, `alerts.json`, `about.json`
- `hi/` — `common.json`, `overview.json`, `forest.json`, `alerts.json`, `about.json`
- `kn/` — `common.json`, `overview.json`, `forest.json`, `alerts.json`, `about.json`

### Pages (`frontend/src/pages/`)
- `Overview.tsx` — Surveillance dashboard, KPIs, spatial map, and daily action recommendations
- `ForestWatch.tsx` — Canopy loss analysis, layer toggles, Before/After image comparison, 6-step pipeline
- `Alerts.tsx` — Filterable alerts list, detail slide-out drawer, review status controls, Telegram dispatch
- `About.tsx` — National problem statistics, UN SDG alignments, roadmap, 4-step guided tour
- `FireWildlife.tsx` — Placeholder for Sidharthan's lane
- `WaterWatch.tsx` — Placeholder for Sidharthan's lane
- `SmartWaterUse.tsx` — Placeholder for Sidharthan's lane

---

## 3. How to Run the Application

### 1. Running with Standalone Mock Data (No Backend Needed)
Ensure `frontend/.env` contains:
```ini
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=true
```
Run from your terminal:
```powershell
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser. The entire application runs client-side with 100% of features active.

### 2. Switching to Live FastAPI Backend
When the backend team runs the FastAPI server on port 8000, simply change `frontend/.env`:
```ini
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=false
```
Then refresh `http://localhost:5173`. With **zero code modifications**, `src/lib/api.ts` routes all requests directly to the live backend endpoints (`/api/alerts`, `/api/alerts/{id}/review`, `/api/alerts/{id}/telegram`, etc.).

---

## 4. What is Demo Data vs Live Data

In strict compliance with our project's honesty guidelines:
- **Demo Mode (`VITE_USE_MOCK=true` or `data_mode: "demo"`)**:
  - All satellite imagery, 92% confidence metrics, and polygon coordinates are **synthetic test telemetry**.
  - A prominent amber top ribbon (`DEMO MODE ACTIVE`) and `DEMO DATA` chips are shown across the UI.
  - Review actions update local in-memory state for seamless demo evaluation.
  - Telegram dispatch simulates delivery and returns a mock confirmation payload.
- **Live Mode (`VITE_USE_MOCK=false`)**:
  - Live mode displays the green `LIVE SATELLITE` indicator.
  - Calls actual Copernicus Sentinel-2 / NASA FIRMS observations delivered by the backend.

---

## 5. What Remains Untested / For Partner Lanes

1. **Sidharthan's Feature Modules**:
   - `pages/FireWildlife.tsx` & `features/fire-wildlife/*`
   - `pages/WaterWatch.tsx` & `features/water-watch/*`
   - `pages/SmartWaterUse.tsx` & `features/smart-water/*`
   These routes currently render clean placeholder cards ready for Sidharthan to fill in. Sidharthan can import any component directly:
   ```typescript
   import { Card, KpiCard, Button, Chip, Skeleton } from '@/components';
   import { api } from '@/lib/api';
   import type { FireHotspot, LakeTrendResponse } from '@/lib/types';
   ```
2. **Actual Telegram Bot Token**: In mock mode, Telegram delivery is simulated. In live mode, the backend requires valid `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` values in `.env`.
3. **Custom MapLibre Vector Tile Style Server**: In offline environments without external internet access, MapLibre falls back to cached raster layers or vector overlays.

---

## 6. Git Reminder

> [!IMPORTANT]
> Per Hard Rule #1, **no git commands were executed by the agent**. Branch creation (`feature/payal-frontend-ui`), staging, commits, and pushes are entirely in your manual control.
