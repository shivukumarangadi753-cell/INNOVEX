import {
  Alert,
  Reserve,
  HealthResponse,
  ReviewAlertRequest,
  TelegramResponse,
  DetectRunResponse,
  ModelRetrainResponse,
  FireHotspot,
  BurnScarsResponse,
  WildlifeCorridorsResponse,
  Lake,
  LakeTrendResponse,
  GroundwaterResponse,
  IrrigationAdviceRequest,
  IrrigationAdviceResponse,
  JalScoreRequest,
  JalScoreResponse,
  RiskZoneCollection,
  ForecastSummary,
} from './types';

import rawAlerts from '../mocks/alerts.json';
import rawReserves from '../mocks/reserves.json';
import rawFire from '../mocks/fire.json';
import rawWildlife from '../mocks/wildlife.json';
import rawWater from '../mocks/water.json';
import rawRiskZones from '../mocks/risk_zones.json';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === true;

// In-memory state for mock mode changes (e.g. alert reviews)
let mockAlerts: Alert[] = JSON.parse(JSON.stringify(rawAlerts));

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  isMock(): boolean {
    return USE_MOCK;
  },

  async getHealth(): Promise<HealthResponse> {
    if (USE_MOCK) {
      return { status: 'ok', data_mode: 'demo' };
    }
    return fetchJson<HealthResponse>('/api/health');
  },

  async getReserves(): Promise<Reserve[]> {
    if (USE_MOCK) {
      return JSON.parse(JSON.stringify(rawReserves));
    }
    return fetchJson<Reserve[]>('/api/reserves');
  },

  async getAlerts(status?: string): Promise<Alert[]> {
    if (USE_MOCK) {
      if (status) {
        return mockAlerts.filter((a) => a.status === status);
      }
      return [...mockAlerts];
    }
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetchJson<Alert[]>(`/api/alerts${query}`);
  },

  async getAlert(id: string): Promise<Alert> {
    if (USE_MOCK) {
      const match = mockAlerts.find((a) => a.id === id);
      if (!match) throw new Error(`Alert with id ${id} not found`);
      return { ...match };
    }
    return fetchJson<Alert>(`/api/alerts/${id}`);
  },

  async reviewAlert(id: string, decision: 'confirm' | 'false_alarm'): Promise<Alert> {
    if (USE_MOCK) {
      const index = mockAlerts.findIndex((a) => a.id === id);
      if (index === -1) throw new Error(`Alert with id ${id} not found`);
      const updated: Alert = {
        ...mockAlerts[index],
        status: decision === 'confirm' ? 'confirmed' : 'false_alarm',
      };
      mockAlerts[index] = updated;
      return updated;
    }
    const body: ReviewAlertRequest = { decision };
    return fetchJson<Alert>(`/api/alerts/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async sendTelegram(id: string): Promise<TelegramResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return {
        sent: true,
        detail: `[DEMO DATA] Satellite alert ${id} dispatched to Telegram channel (Western Ghats Field Rangers).`,
      };
    }
    return fetchJson<TelegramResponse>(`/api/alerts/${id}/telegram`, {
      method: 'POST',
    });
  },

  async runDetect(): Promise<DetectRunResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      return {
        alerts_created: 0,
        run_id: `run-${Date.now()}`,
        data_mode: 'demo',
      };
    }
    return fetchJson<DetectRunResponse>('/api/detect/run', { method: 'POST' });
  },

  async retrainModel(): Promise<ModelRetrainResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        samples_used: 124,
        accuracy: 0.918,
      };
    }
    return fetchJson<ModelRetrainResponse>('/api/model/retrain', { method: 'POST' });
  },

  async getFireHotspots(): Promise<FireHotspot[]> {
    if (USE_MOCK) {
      return (rawFire as any).hotspots;
    }
    return fetchJson<FireHotspot[]>('/api/fire/hotspots');
  },

  async getFireBurnScars(): Promise<BurnScarsResponse> {
    if (USE_MOCK) {
      return (rawFire as any).burn_scars;
    }
    return fetchJson<BurnScarsResponse>('/api/fire/burn-scars');
  },

  async getWildlifeCorridors(): Promise<WildlifeCorridorsResponse> {
    if (USE_MOCK) {
      return rawWildlife as unknown as WildlifeCorridorsResponse;
    }
    return fetchJson<WildlifeCorridorsResponse>('/api/wildlife/corridors');
  },

  async getWaterLakes(): Promise<Lake[]> {
    if (USE_MOCK) {
      return (rawWater as any).lakes;
    }
    return fetchJson<Lake[]>('/api/water/lakes');
  },

  async getWaterLakeTrend(id: string): Promise<LakeTrendResponse> {
    if (USE_MOCK) {
      const match = (rawWater as any).trends[id] || (rawWater as any).trends['lake-lakhya'];
      return match;
    }
    return fetchJson<LakeTrendResponse>(`/api/water/lakes/${id}/trend`);
  },

  async getWaterGroundwater(): Promise<GroundwaterResponse> {
    if (USE_MOCK) {
      return (rawWater as any).groundwater;
    }
    return fetchJson<GroundwaterResponse>('/api/water/groundwater');
  },

  async getIrrigationAdvice(body: IrrigationAdviceRequest): Promise<IrrigationAdviceResponse> {
    if (USE_MOCK) {
      return {
        advice: body.soil_moisture_pct < 28 && body.rain_forecast_mm < 5 ? 'irrigate_now' : 'wait',
        reason:
          body.soil_moisture_pct < 28 && body.rain_forecast_mm < 5
            ? 'Root zone moisture critically low with zero rain forecast for 48h'
            : 'Sufficient residual soil moisture or precipitation expected',
        confidence_note: 'DEMO DATA: Estimated using simulated optical NDVI and ERA5 soil proxy',
      };
    }
    return fetchJson<IrrigationAdviceResponse>('/api/advisor/irrigation', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getJalScore(body: JalScoreRequest): Promise<JalScoreResponse> {
    if (USE_MOCK) {
      let score = 70;
      if (body.rainwater_harvesting) score += 15;
      if (body.recycled_pct > 30) score += 10;
      if (body.leakage_pct > 20) score -= 20;
      score = Math.max(0, Math.min(100, score));

      const band: 'good' | 'watch' | 'critical' = score >= 75 ? 'good' : score >= 50 ? 'watch' : 'critical';
      return {
        score,
        band,
        tips: [
          'Install flow sensors on distribution main lines to cut conveyance loss below 10%',
          'Mandate rooftop rainwater recharge pits across institutional complexes',
          'Recycle greywater for green belt irrigation to save potable reservoir water',
        ],
      };
    }
    return fetchJson<JalScoreResponse>('/api/jal-score', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async sendCopilotMessage(message: string, language: string = 'en', context?: any): Promise<any> {
    if (USE_MOCK) {
      const msg = message.toLowerCase();
      if (msg.includes('lake') || msg.includes('water') || msg.includes('kavoor')) {
        return {
          reply: `💧 **Waterbody Telemetry Analysis**:\n\nThe lake with the steepest depletion is **Lakya Dam Reservoir (Kudremukh)**.\n\n* **Surface Area Depletion**: \`- 24.78%\` over the monitored seasonal window.\n* **Current Water Spread**: \`184.6 ha\` (Critical warning threshold: >15% drop exceeded).\n* **Second Affected**: **Kavoor Lake (Mangalore)** with \`1.5 ha\` shoreline infill and weed choking.\n* **Recommendation**: Issue immediate dredging moratorium and monitor inflow sluices.`,
          intent: 'lake_trend',
          actions: [{ type: 'navigate', label: 'Open Water Watch', target: '/water' }],
          voice_script: 'Satellite observation indicates Lakya Dam has suffered a 24.8 percent water spread loss, and Kavoor Lake in Mangalore is facing shoreline encroachment.',
          suggested_questions: ['Draft legal notice for Kavoor lake', 'Calculate carbon loss for Mangalore mangrove clearing', 'Show alert summary']
        };
      }
      if (msg.includes('fir') || msg.includes('legal') || msg.includes('notice')) {
        return {
          reply: `⚖️ **Automated Legal Notice & Preliminary Offence Report (FIR)**:\n\nOfficial legal document generated under **Section 26 of the Indian Forest Act, 1927**:\n\n\`\`\`text\n================================================================================\n                    GOVERNMENT OF KARNATAKA - FOREST DEPARTMENT\n                       OFFICE OF THE RANGE FOREST OFFICER\n                 MANGALURU TERRITORIAL DIVISION, DAKSHINA KANNADA\n================================================================================\nCASE CRIME NO: FCR-2026-ALT-MNG-001\nOFFENCE: Illegal clearing of 2.8 ha Coastal Wetland Mangroves\nSECTIONS: Indian Forest Act Sec 26(1)(a), (h); CRZ Notification 2019 Sec 3(1)\nEVIDENCE: Bi-temporal Copernicus Sentinel-2 MSI (Oct 15 - Nov 18, 2025)\nACTION: Seizure of earth-moving excavators and filing before JMFC Magistrate\n================================================================================\n\`\`\``,
          intent: 'fir_draft',
          actions: [{ type: 'copy_fir', label: 'Copy FIR Text' }, { type: 'dispatch_telegram', label: 'Dispatch to Telegram' }],
          voice_script: 'First Information Report successfully generated for case FCR 2026 under Section 26 of the Indian Forest Act.',
          suggested_questions: ['Calculate carbon penalty for this case', 'Dispatch alert to patrol Telegram', 'Show lake status']
        };
      }
      if (msg.includes('carbon') || msg.includes('co2') || msg.includes('penalty') || msg.includes('fine')) {
        return {
          reply: `🌿 **Carbon Stock & Ecological Damage Assessment**:\n\n* **Target Alert**: \`Gurupura Estuary Tannirbhavi Mangroves\` (2.8 ha)\n* **Trees Felled**: ~\`1,260 mature mangrove trees\`\n* **Biomass Lost**: \`392.0 metric tons\`\n* **Carbon Emitted**: **\`1,438.2 tCO₂ equivalent\`**\n* **Supreme Court NPV Legal Penalty**: **\`₹29.40 Lakhs\`** (calculated at ₹10.5L/ha under Supreme Court of India guidelines).`,
          intent: 'carbon_loss',
          actions: [{ type: 'inspect_alert', label: 'Inspect Alert Imagery', target: '/alerts' }],
          voice_script: 'Analysis shows an estimated 1,438 metric tons of CO2 emitted, with an environmental compensation penalty of 29.4 Lakh rupees.',
          suggested_questions: ['Draft legal FIR for this alert', 'Dispatch to Telegram', 'Which lake lost the most water?']
        };
      }
      return {
        reply: `🛰️ **Prakriti Autonomous Ecological Briefing**:\n\nActive surveillance covers **Kudremukh National Park** and the **Mangaluru Coastal Eco-Zone**:\n\n* **Total Satellite Alerts**: \`6 detected\` (\`5 open for patrol audit\`).\n* **Mangaluru Incidents**: \`3 critical alerts\` (Tannirbhavi Mangroves, Kavoor Lake, Pilikula Eco-Park).\n* **Total Canopy Lost**: **\`16.8 hectares\`**.\n* **Revisit Cadence**: 5-day Sentinel-2 optical & 6-day Sentinel-1 SAR radar active.\n\nHow would you like to proceed, Officer?`,
        intent: 'alert_inquiry',
        actions: [{ type: 'navigate', label: 'Inspect Alerts', target: '/alerts' }, { type: 'navigate', label: 'Open Forest Watch', target: '/forest' }],
        voice_script: 'Autonomous briefing: Surveillance active over Kudremukh and Mangalore. 5 alerts open for patrol inspection.',
        suggested_questions: ['Which lake in Mangalore lost the most water?', 'Calculate carbon loss for Tannirbhavi mangrove', 'Draft legal FIR for Pilikula clearing']
      };
    }
    return fetchJson<any>('/api/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message, language, context }),
    });
  },

  async getRiskZones(reserveId?: string, minProbability: number = 0.30): Promise<RiskZoneCollection> {
    if (USE_MOCK) {
      const collection = rawRiskZones as RiskZoneCollection;
      let filtered = collection.features;
      if (reserveId) {
        filtered = filtered.filter((f) => f.properties.reserve_id === reserveId);
      }
      filtered = filtered.filter((f) => f.properties.probability >= minProbability);
      return {
        ...collection,
        features: filtered,
      };
    }
    const params = new URLSearchParams();
    if (reserveId) params.append('reserve_id', reserveId);
    params.append('min_probability', minProbability.toString());
    return fetchJson<RiskZoneCollection>(`/api/forecast/risk-zones?${params.toString()}`);
  },

  async getForecastSummary(): Promise<ForecastSummary> {
    if (USE_MOCK) {
      const collection = rawRiskZones as RiskZoneCollection;
      const features = collection.features;
      const total = features.length;
      const critical = features.filter((f) => f.properties.risk_tier === 'CRITICAL').length;
      const high = features.filter((f) => f.properties.risk_tier === 'HIGH').length;
      const avg = Math.round(features.reduce((acc, f) => acc + f.properties.probability_pct, 0) / Math.max(1, total));
      return {
        total_zones: total,
        critical_zones: critical,
        high_zones: high,
        average_probability_pct: avg,
        forecast_horizon_days: 45,
        primary_threat_reserve: 'Mangaluru Coastal Eco-Zone & Kudremukh National Park',
        data_mode: 'demo',
      };
    }
    return fetchJson<ForecastSummary>('/api/forecast/summary');
  },
};
