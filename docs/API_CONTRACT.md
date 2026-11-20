# API CONTRACT (source of truth, do not change field names)
data_mode is always "demo" or "live". All dates are ISO 8601 strings.

GET  /api/health -> {status:"ok", data_mode}
GET  /api/reserves -> [{id, name, boundary: GeoJSON Feature, is_official: false}]

Alert object:
{ id, reserve_id, status:"open|confirmed|false_alarm",
  label:"clearing|fire_scar|seasonal|cloud_error",
  area_ha, confidence (0-1), centroid:{lat,lng},
  polygon: GeoJSON Feature, detected_at, pass_t1, pass_t2,
  before_image_url, after_image_url, data_mode }
GET  /api/alerts?status=  -> Alert[]
GET  /api/alerts/{id}     -> Alert
POST /api/alerts/{id}/review  body {decision:"confirm|false_alarm"} -> Alert
POST /api/alerts/{id}/telegram -> {sent:boolean, detail:string}
POST /api/detect/run -> {alerts_created:number, run_id, data_mode}
POST /api/model/retrain -> {samples_used:number, accuracy:number|null}

GET /api/fire/hotspots -> [{id, lat, lng, brightness, confidence,
                             acq_datetime, data_mode}]
GET /api/fire/burn-scars -> GeoJSON FeatureCollection
GET /api/wildlife/corridors -> GeoJSON FeatureCollection
     (feature props: {name, risk:"low|medium|high", reason})
GET /api/water/lakes -> [{id, name, centroid:{lat,lng}, data_mode}]
GET /api/water/lakes/{id}/trend -> {lake_id, name,
     points:[{date, area_ha}], change_pct, warning:boolean, data_mode}
GET /api/water/groundwater -> {station, unit:"m_below_ground",
     points:[{date, depth_m}], data_mode}
POST /api/advisor/irrigation body {ndvi, rain_forecast_mm,
     soil_moisture_pct, crop?} -> {advice:"irrigate_now|wait",
     reason, confidence_note}
POST /api/jal-score body {sector:"town|industry|farm",
     monthly_usage_kl, recycled_pct, leakage_pct, rainwater_harvesting:boolean}
     -> {score (0-100), band:"good|watch|critical", tips:string[]}

Images are served from /static/alerts/<id>_before.png and _after.png.
Env vars: DATA_MODE=demo|live, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
FIRMS_MAP_KEY, COPERNICUS_CLIENT_ID, COPERNICUS_CLIENT_SECRET,
VITE_API_URL=http://localhost:8000, VITE_USE_MOCK=true|false.
