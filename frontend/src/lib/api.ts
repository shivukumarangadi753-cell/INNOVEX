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
} from './types';

import rawAlerts from '../mocks/alerts.json';
import rawReserves from '../mocks/reserves.json';
import rawFire from '../mocks/fire.json';
import rawWildlife from '../mocks/wildlife.json';
import rawWater from '../mocks/water.json';

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
};
