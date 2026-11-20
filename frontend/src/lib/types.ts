// TypeScript API Contract Interfaces for PRAKRITI-NETRA
// Source of truth for Frontend and Shared features

export type DataMode = 'demo' | 'live';

export type AlertStatus = 'open' | 'confirmed' | 'false_alarm';

export type AlertLabel = 'clearing' | 'fire_scar' | 'seasonal' | 'cloud_error';

export interface GeoJSONGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon';
  coordinates: any;
}

export interface GeoJSONFeature<G = GeoJSONGeometry, P = Record<string, any>> {
  type: 'Feature';
  geometry: G;
  properties: P;
}

export interface GeoJSONFeatureCollection<G = GeoJSONGeometry, P = Record<string, any>> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<G, P>[];
}

export interface Reserve {
  id: string;
  name: string;
  boundary: GeoJSONFeature;
  is_official: boolean;
}

export interface Alert {
  id: string;
  reserve_id: string;
  status: AlertStatus;
  label: AlertLabel;
  area_ha: number;
  confidence: number; // 0 - 1
  centroid: {
    lat: number;
    lng: number;
  };
  polygon: GeoJSONFeature;
  detected_at: string; // ISO 8601
  pass_t1: string;     // ISO 8601
  pass_t2: string;     // ISO 8601
  before_image_url: string;
  after_image_url: string;
  data_mode: DataMode;
}

export interface HealthResponse {
  status: string;
  data_mode: DataMode;
}

export interface ReviewAlertRequest {
  decision: 'confirm' | 'false_alarm';
}

export interface TelegramResponse {
  sent: boolean;
  detail: string;
}

export interface DetectRunResponse {
  alerts_created: number;
  run_id: string;
  data_mode: DataMode;
}

export interface ModelRetrainResponse {
  samples_used: number;
  accuracy: number | null;
}

export interface FireHotspot {
  id: string;
  lat: number;
  lng: number;
  brightness: number;
  confidence: number;
  acq_datetime: string;
  data_mode: DataMode;
}

export type BurnScarsResponse = GeoJSONFeatureCollection;

export interface CorridorProperties {
  name: string;
  risk: 'low' | 'medium' | 'high';
  reason: string;
}

export type WildlifeCorridorsResponse = GeoJSONFeatureCollection<GeoJSONGeometry, CorridorProperties>;

export interface Lake {
  id: string;
  name: string;
  centroid: {
    lat: number;
    lng: number;
  };
  data_mode: DataMode;
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
  data_mode: DataMode;
}

export interface GroundwaterPoint {
  date: string;
  depth_m: number;
}

export interface GroundwaterResponse {
  station: string;
  unit: 'm_below_ground';
  points: GroundwaterPoint[];
  data_mode: DataMode;
}

export interface IrrigationAdviceRequest {
  ndvi: number;
  rain_forecast_mm: number;
  soil_moisture_pct: number;
  crop?: string;
}

export interface IrrigationAdviceResponse {
  advice: 'irrigate_now' | 'wait';
  reason: string;
  confidence_note: string;
}

export interface JalScoreRequest {
  sector: 'town' | 'industry' | 'farm';
  monthly_usage_kl: number;
  recycled_pct: number;
  leakage_pct: number;
  rainwater_harvesting: boolean;
}

export interface JalScoreResponse {
  score: number; // 0 - 100
  band: 'good' | 'watch' | 'critical';
  tips: string[];
}

export interface RiskFactorBreakdown {
  road_proximity_score: number;
  cluster_diffusion_score: number;
  slope_accessibility_score: number;
  watercourse_proximity_score: number;
  dist_road_meters: number;
  slope_degrees: number;
}

export interface RiskZoneProperties {
  id: string;
  code: string;
  name: string;
  reserve_id: string;
  probability: number;
  probability_pct: number;
  risk_tier: 'CRITICAL' | 'HIGH' | 'MODERATE';
  color: string;
  projected_horizon_days: number;
  primary_driver: string;
  recommended_action: string;
  centroid: {
    lat: number;
    lng: number;
  };
  factors: RiskFactorBreakdown;
}

export type RiskZoneFeature = GeoJSONFeature<GeoJSONGeometry, RiskZoneProperties>;

export interface RiskZoneCollection {
  type: 'FeatureCollection';
  features: RiskZoneFeature[];
  metadata?: {
    model: string;
    forecast_horizon_days: number;
    total_zones: number;
    critical_count: number;
    data_mode: DataMode;
  };
}

export interface ForecastSummary {
  total_zones: number;
  critical_zones: number;
  high_zones: number;
  average_probability_pct: number;
  forecast_horizon_days: number;
  primary_threat_reserve: string;
  data_mode: DataMode;
}
