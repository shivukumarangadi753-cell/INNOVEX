/**
 * Prakriti-Netra API Client for Fire, Wildlife, Water & Advisor Lanes.
 * Handles both Live API communication (VITE_API_URL) and Mock Mode (VITE_USE_MOCK).
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  brightness: number;
  confidence: number;
  acq_datetime: string;
  data_mode: 'demo' | 'live';
}

export interface BurnScarFeature {
  type: 'Feature';
  id: string;
  properties: {
    id: string;
    name: string;
    detected_date: string;
    area_ha: number;
    severity: string;
    data_mode: 'demo' | 'live';
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface WildlifeCorridorFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    risk: 'low' | 'medium' | 'high';
    reason: string;
  };
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
}

export interface LakeSummary {
  id: string;
  name: string;
  centroid: {
    lat: number;
    lng: number;
  };
  data_mode: 'demo' | 'live';
}

export interface LakeTrendPoint {
  date: string;
  area_ha: number;
}

export interface LakeTrendResponse {
  lake_id: string;
  name: string;
  points: LakeTrendPoint[];
  change_pct: number;
  warning: boolean;
  data_mode: 'demo' | 'live';
}

export interface GroundwaterPoint {
  date: string;
  depth_m: number;
}

export interface GroundwaterResponse {
  station: string;
  unit: string;
  points: GroundwaterPoint[];
  data_mode: 'demo' | 'live';
}

export interface IrrigationPayload {
  ndvi: number;
  rain_forecast_mm: number;
  soil_moisture_pct: number;
  crop?: string;
}

export interface IrrigationResponse {
  advice: 'irrigate_now' | 'wait';
  reason: string;
  confidence_note: string;
}

export interface JalScorePayload {
  sector: 'town' | 'industry' | 'farm';
  monthly_usage_kl: number;
  recycled_pct: number;
  leakage_pct: number;
  rainwater_harvesting: boolean;
}

export interface JalScoreResponse {
  score: number;
  band: 'good' | 'watch' | 'critical';
  tips: string[];
}

export interface TelegramResponse {
  sent: boolean;
  detail: string;
}

// ================= Mock Fallback Data =================

const MOCK_HOTSPOTS: Hotspot[] = [
  {
    id: "viirs_kudremukh_01",
    lat: 13.214,
    lng: 75.212,
    brightness: 338.4,
    confidence: 88,
    acq_datetime: "2026-11-19T13:45:00Z",
    data_mode: "demo"
  },
  {
    id: "viirs_kudremukh_02",
    lat: 13.228,
    lng: 75.231,
    brightness: 326.1,
    confidence: 74,
    acq_datetime: "2026-11-19T13:45:00Z",
    data_mode: "demo"
  },
  {
    id: "viirs_kudremukh_03",
    lat: 13.167,
    lng: 75.289,
    brightness: 345.9,
    confidence: 92,
    acq_datetime: "2026-11-20T01:30:00Z",
    data_mode: "demo"
  },
  {
    id: "viirs_kudremukh_04",
    lat: 13.295,
    lng: 75.184,
    brightness: 312.0,
    confidence: 63,
    acq_datetime: "2026-11-20T01:30:00Z",
    data_mode: "demo"
  }
];

const MOCK_BURN_SCARS = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      id: "burn_scar_01",
      properties: {
        id: "burn_scar_01",
        name: "Kudremukh Western Slopes Fire Scar",
        detected_date: "2026-11-15T08:00:00Z",
        area_ha: 42.5,
        severity: "high",
        data_mode: "demo" as const
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [75.205, 13.208],
            [75.218, 13.210],
            [75.222, 13.220],
            [75.211, 13.225],
            [75.202, 13.217],
            [75.205, 13.208]
          ]
        ]
      }
    },
    {
      type: "Feature" as const,
      id: "burn_scar_02",
      properties: {
        id: "burn_scar_02",
        name: "Shola Grassland Edge Burn",
        detected_date: "2026-11-18T10:30:00Z",
        area_ha: 18.2,
        severity: "medium",
        data_mode: "demo" as const
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [75.275, 13.160],
            [75.286, 13.162],
            [75.290, 13.172],
            [75.278, 13.174],
            [75.271, 13.168],
            [75.275, 13.160]
          ]
        ]
      }
    }
  ]
};

const MOCK_CORRIDORS = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      id: "corridor_kudremukh_someshwara",
      properties: {
        name: "Kudremukh-Someshwara Elephant Corridor",
        risk: "high" as const,
        reason: "Active thermal hotspots and human encroachment detected along eastern fringe."
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [75.145, 13.120],
          [75.178, 13.155],
          [75.204, 13.195],
          [75.228, 13.235],
          [75.250, 13.270]
        ]
      }
    },
    {
      type: "Feature" as const,
      id: "corridor_bhadra_kudremukh",
      properties: {
        name: "Bhadra-Kudremukh Tiger Dispersal Route",
        risk: "medium" as const,
        reason: "Seasonal canopy thinning and road crossing friction observed near Kalasa ridge."
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [75.240, 13.290],
          [75.285, 13.310],
          [75.335, 13.340],
          [75.390, 13.375]
        ]
      }
    },
    {
      type: "Feature" as const,
      id: "corridor_agumbe_kudremukh",
      properties: {
        name: "Agumbe-Kudremukh Riparian Pathway",
        risk: "low" as const,
        reason: "Continuous dense evergreen canopy with zero recent fire anomalies."
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [75.090, 13.480],
          [75.120, 13.410],
          [75.160, 13.330],
          [75.190, 13.260]
        ]
      }
    }
  ]
};

const MOCK_LAKES: LakeSummary[] = [
  {
    id: "lake_lakya_dam",
    name: "Lakya Dam Reservoir (Kudremukh)",
    centroid: { lat: 13.255, lng: 75.253 },
    data_mode: "demo"
  },
  {
    id: "lake_bhadra_backwaters",
    name: "Bhadra River Backwaters",
    centroid: { lat: 13.310, lng: 75.385 },
    data_mode: "demo"
  }
];

const MOCK_LAKE_TREND: LakeTrendResponse = {
  lake_id: "lake_lakya_dam",
  name: "Lakya Dam Reservoir (Kudremukh)",
  points: [
    { date: "2026-05-15T00:00:00Z", area_ha: 252.4 },
    { date: "2026-06-30T00:00:00Z", area_ha: 268.1 },
    { date: "2026-08-15T00:00:00Z", area_ha: 274.0 },
    { date: "2026-09-30T00:00:00Z", area_ha: 245.8 },
    { date: "2026-10-31T00:00:00Z", area_ha: 218.2 },
    { date: "2026-11-20T00:00:00Z", area_ha: 184.6 }
  ],
  change_pct: -24.78,
  warning: true,
  data_mode: "demo"
};

const MOCK_GROUNDWATER: GroundwaterResponse = {
  station: "CGWB Mudigere Station (Kudremukh Catchment)",
  unit: "m_below_ground",
  points: [
    { date: "2026-01-15T00:00:00Z", depth_m: 4.8 },
    { date: "2026-03-15T00:00:00Z", depth_m: 6.2 },
    { date: "2026-05-15T00:00:00Z", depth_m: 8.1 },
    { date: "2026-07-15T00:00:00Z", depth_m: 3.9 },
    { date: "2026-09-15T00:00:00Z", depth_m: 3.5 },
    { date: "2026-10-15T00:00:00Z", depth_m: 5.4 },
    { date: "2026-11-20T00:00:00Z", depth_m: 7.3 }
  ],
  data_mode: "demo"
};

// ================= API Functions =================

export async function fetchHotspots(): Promise<Hotspot[]> {
  if (USE_MOCK) return MOCK_HOTSPOTS;
  try {
    const res = await fetch(`${API_BASE}/api/fire/hotspots`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API: fire] Failed to fetch live hotspots, falling back to mock:', err);
    return MOCK_HOTSPOTS;
  }
}

export async function fetchBurnScars(): Promise<typeof MOCK_BURN_SCARS> {
  if (USE_MOCK) return MOCK_BURN_SCARS;
  try {
    const res = await fetch(`${API_BASE}/api/fire/burn-scars`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API: fire] Failed to fetch burn scars, falling back to mock:', err);
    return MOCK_BURN_SCARS;
  }
}

export async function fetchWildlifeCorridors(): Promise<typeof MOCK_CORRIDORS> {
  if (USE_MOCK) return MOCK_CORRIDORS;
  try {
    const res = await fetch(`${API_BASE}/api/wildlife/corridors`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API: wildlife] Failed to fetch corridors, falling back to mock:', err);
    return MOCK_CORRIDORS;
  }
}

export async function fetchLakes(): Promise<LakeSummary[]> {
  if (USE_MOCK) return MOCK_LAKES;
  try {
    const res = await fetch(`${API_BASE}/api/water/lakes`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API: water] Failed to fetch lakes, falling back to mock:', err);
    return MOCK_LAKES;
  }
}

export async function fetchLakeTrend(lakeId: string): Promise<LakeTrendResponse> {
  if (USE_MOCK) return MOCK_LAKE_TREND;
  try {
    const res = await fetch(`${API_BASE}/api/water/lakes/${lakeId}/trend`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API: water] Failed to fetch trend for ${lakeId}, falling back to mock:`, err);
    return MOCK_LAKE_TREND;
  }
}

export async function fetchGroundwater(): Promise<GroundwaterResponse> {
  if (USE_MOCK) return MOCK_GROUNDWATER;
  try {
    const res = await fetch(`${API_BASE}/api/water/groundwater`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API: water] Failed to fetch groundwater, falling back to mock:', err);
    return MOCK_GROUNDWATER;
  }
}

export async function submitIrrigationAdvice(payload: IrrigationPayload): Promise<IrrigationResponse> {
  if (USE_MOCK) {
    if (payload.rain_forecast_mm >= 15.0) {
      return {
        advice: 'wait',
        reason: `Significant rain (${payload.rain_forecast_mm}mm) expected. Postpone irrigation.`,
        confidence_note: 'Demo mode mock calculation.'
      };
    }
    if (payload.soil_moisture_pct < 35.0) {
      return {
        advice: 'irrigate_now',
        reason: `Low soil moisture (${payload.soil_moisture_pct}%). Immediate irrigation required.`,
        confidence_note: 'Demo mode mock calculation.'
      };
    }
    return {
      advice: 'wait',
      reason: `Soil moisture (${payload.soil_moisture_pct}%) is currently adequate.`,
      confidence_note: 'Demo mode mock calculation.'
    };
  }

  try {
    const res = await fetch(`${API_BASE}/api/advisor/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API: advisor] Failed live request, using mock logic:', err);
    return {
      advice: payload.soil_moisture_pct < 35 ? 'irrigate_now' : 'wait',
      reason: `Mock response: Soil moisture is ${payload.soil_moisture_pct}%.`,
      confidence_note: 'Fallback evaluation due to network unavailability.'
    };
  }
}

export async function submitJalScore(payload: JalScorePayload): Promise<JalScoreResponse> {
  if (USE_MOCK) {
    let score = 50 + (payload.recycled_pct * 0.3) - (payload.leakage_pct * 0.5);
    if (payload.rainwater_harvesting) score += 15;
    score = Math.max(0, Math.min(100, Math.round(score)));
    const band = score >= 70 ? 'good' : score >= 40 ? 'watch' : 'critical';
    return {
      score,
      band,
      tips: [
        `Fix distribution leaks to recover estimated ${(payload.leakage_pct * 0.01 * payload.monthly_usage_kl).toFixed(1)} kL/month.`,
        payload.rainwater_harvesting ? "Maintain rooftop filter beds before upcoming monsoon." : "Install rainwater harvesting pits for aquifer recharge.",
        "Implement greywater treatment for non-potable requirements."
      ]
    };
  }

  try {
    const res = await fetch(`${API_BASE}/api/jal-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API: advisor] Failed live jal-score request, using mock calculation:', err);
    return {
      score: 65,
      band: 'watch',
      tips: [
        "Audit branch distribution pipelines for underground joint leakage.",
        "Set up rooftop rainwater harvesting structures.",
        "Upgrade to drip/precision irrigation networks."
      ]
    };
  }
}

export async function dispatchTelegramAlert(alertId: string): Promise<TelegramResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/alerts/${alertId}/telegram`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      sent: false,
      detail: 'Telegram dispatch failed or server offline'
    };
  }
}
