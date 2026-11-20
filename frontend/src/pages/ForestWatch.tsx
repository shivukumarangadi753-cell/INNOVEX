import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  TreePine,
  CheckCircle2,
  Clock,
  Radio,
  Zap,
  ArrowRight,
  AlertTriangle,
  Info,
  Sparkles,
  ShieldAlert,
  Crosshair,
  Send,
  X,
  Compass,
} from 'lucide-react';
import { api } from '../lib/api';
import { Alert, Reserve, RiskZoneFeature } from '../lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Tooltip } from '../components/Tooltip';
import { ImageSlider } from '../components/ImageSlider';
import { ReserveMap } from '../components/ReserveMap';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { useToast } from '../components/Toast';

export const ForestWatch: React.FC = () => {
  const { t } = useTranslation('forest');
  const { showToast } = useToast();

  const [reserve, setReserve] = useState<Reserve | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [riskZones, setRiskZones] = useState<RiskZoneFeature[]>([]);
  const [selectedRiskZone, setSelectedRiskZone] = useState<RiskZoneFeature | null>(null);
  const [currentPass, setCurrentPass] = useState<'T1' | 'T2'>('T2');
  const [layers, setLayers] = useState({
    ndvi: true,
    change: true,
    radar: false,
    riskForecast: true,
  });

  useEffect(() => {
    Promise.all([api.getReserves(), api.getAlerts(), api.getRiskZones()]).then(([res, al, rz]) => {
      setReserve(res[0] || null);
      setAlerts(al);
      if (al.length > 0) setSelectedAlert(al[0]);
      if (rz && rz.features) {
        setRiskZones(rz.features);
        // Default select highest risk zone
        const highest = [...rz.features].sort((a, b) => b.properties.probability - a.properties.probability)[0];
        if (highest) setSelectedRiskZone(highest);
      }
    });
  }, []);

  const toggleLayer = (layerKey: 'ndvi' | 'change' | 'radar' | 'riskForecast') => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const steps = [
    {
      num: '1',
      title: t('pipeline.step1Title', '1. FETCH'),
      desc: t('pipeline.step1Desc', 'Poll Copernicus Open Data Space API for new Sentinel-2 MSI and Sentinel-1 SAR passes covering Kudremukh tile 43PGK.'),
      active: true,
    },
    {
      num: '2',
      title: t('pipeline.step2Title', '2. CLEAN'),
      desc: t('pipeline.step2Desc', 'Apply Cloud & Snow mask using SCL band (Scene Classification) to eliminate false shadows from monsoon clouds.'),
      active: true,
    },
    {
      num: '3',
      title: t('pipeline.step3Title', '3. COMPARE'),
      desc: t('pipeline.step3Desc', 'Compute bi-temporal differential NDVI (ΔNDVI = NDVI_T2 - NDVI_T1) and SAR co-polarization backscatter shift.'),
      active: true,
    },
    {
      num: '4',
      title: t('pipeline.step4Title', '4. FILTER'),
      desc: t('pipeline.step4Desc', 'Eliminate sub-pixel noise and seasonal deciduous fluctuations using spatial morphology filters (> 0.5 hectare min area).'),
      active: true,
    },
    {
      num: '5',
      title: t('pipeline.step5Title', '5. CLASSIFY'),
      desc: t('pipeline.step5Desc', 'Machine learning model predicts anomaly class: illegal clearing, fire scar, seasonal shedding, or residual cloud error.'),
      active: true,
    },
    {
      num: '6',
      title: t('pipeline.step6Title', '6. ALERT'),
      desc: t('pipeline.step6Desc', 'Publish geocoded alert with centroid GPS, confidence rating, and dispatch push notification to forest guard Telegram bot.'),
      active: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header (Exact Reference Match) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
            <TreePine className="w-5 h-5 text-[#16a34a]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('title', 'Forest Watch & Canopy Loss Tracking')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t('subtitle', 'Bi-temporal Sentinel-2 MSI & Sentinel-1 SAR change detection for Kudremukh Reserve Forest')}
            </p>
          </div>
        </div>

        {/* Date Range & Flagged Pass Badge (Exact Reference Match) */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Date Picker Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-navy-dark border border-slate-200/80 dark:border-emerald-950/60 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-subtle">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>1 Nov – 30 Nov 2025</span>
          </div>

          {/* T2 (Nov 18 - Flagged) Pill Badge */}
          <button
            type="button"
            onClick={() => setCurrentPass(currentPass === 'T2' ? 'T1' : 'T2')}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            T2 (Nov 18 – Flagged)
          </button>
        </div>
      </div>

      {/* Main 3-Column Content Layout (Exact Reference Match) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Col 1: Kudremukh Reserve Canopy Analysis (5 cols) */}
        <Card className="lg:col-span-5 p-5 bg-white dark:bg-navy-dark border border-slate-200/70 dark:border-emerald-950/60 rounded-2xl shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-emerald-950/40">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Kudremukh Reserve Canopy Analysis
                </h3>
                <Tooltip text="Multispectral optical change detection using Sentinel-2 MSI bands." />
              </div>

              {/* Layer Selector Pills (Exact Reference Match) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleLayer('ndvi')}
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 transition-colors ${
                    layers.ndvi
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-700'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${layers.ndvi ? 'bg-[#16a34a]' : 'bg-slate-300'}`} />
                  NDVI Difference
                </button>

                <button
                  type="button"
                  onClick={() => toggleLayer('change')}
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 transition-colors ${
                    layers.change
                      ? 'bg-red-50 text-red-600 border-red-300 dark:bg-red-950/50 dark:border-red-700'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${layers.change ? 'bg-red-500' : 'bg-slate-300'}`} />
                  Change Mask
                </button>

                <button
                  type="button"
                  onClick={() => toggleLayer('radar')}
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 transition-colors ${
                    layers.radar
                      ? 'bg-sky-50 text-sky-600 border-sky-300 dark:bg-sky-950/50 dark:border-sky-700'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${layers.radar ? 'bg-sky-500' : 'bg-slate-300'}`} />
                  Radar SAR
                </button>

                {/* AI Risk Heatmap (45d) Forecaster Toggle */}
                <button
                  type="button"
                  onClick={() => toggleLayer('riskForecast')}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 transition-all shadow-sm ${
                    layers.riskForecast
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500 shadow-amber-500/20'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                  title="Toggle 45-day AI Encroachment Risk Probability Heatmap"
                >
                  <Sparkles className={`w-3 h-3 ${layers.riskForecast ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
                  <span>AI Risk Heatmap (45d)</span>
                </button>
              </div>
            </div>

            {/* Map Container */}
            <div className="mt-3">
              <ReserveMap
                reserve={reserve || undefined}
                alerts={alerts}
                selectedAlertId={selectedAlert?.id}
                onSelectAlert={(a) => setSelectedAlert(a)}
                riskZones={riskZones}
                selectedRiskZoneId={selectedRiskZone?.properties.id}
                onSelectRiskZone={(z) => setSelectedRiskZone(z)}
                activeLayers={layers}
                className="h-[360px]"
              />
            </div>

            {/* Predictive Spatial Intelligence Inspector Card */}
            {layers.riskForecast && selectedRiskZone && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-amber-500/40 shadow-lg text-white">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="font-mono font-bold text-xs text-amber-400">
                      FORECASTER: {selectedRiskZone.properties.code}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({selectedRiskZone.properties.name})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                      {selectedRiskZone.properties.risk_tier} RISK: {selectedRiskZone.properties.probability_pct}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium">Primary Encroachment Driver:</span>
                    <p className="font-semibold text-slate-200 mt-0.5">
                      {selectedRiskZone.properties.primary_driver}
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400">
                      <span>Forecast Window: </span>
                      <strong className="text-amber-300">Next 45 Days</strong>
                    </div>
                  </div>

                  {/* Factor Meters */}
                  <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Road Proximity ({selectedRiskZone.properties.factors.dist_road_meters}m):</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {Math.round(selectedRiskZone.properties.factors.road_proximity_score * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${selectedRiskZone.properties.factors.road_proximity_score * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Cluster Diffusion:</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {Math.round(selectedRiskZone.properties.factors.cluster_diffusion_score * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${selectedRiskZone.properties.factors.cluster_diffusion_score * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Slope Flatness ({selectedRiskZone.properties.factors.slope_degrees}°):</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {Math.round(selectedRiskZone.properties.factors.slope_accessibility_score * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${selectedRiskZone.properties.factors.slope_accessibility_score * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Preemptive Action Directives */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-300">
                    <span className="text-amber-400 font-bold">Preemptive Directive: </span>
                    {selectedRiskZone.properties.recommended_action}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        showToast(
                          `🚨 Preemptive UAV Drone Patrol dispatched to coordinates ${selectedRiskZone.properties.centroid.lat}°N, ${selectedRiskZone.properties.centroid.lng}°E (${selectedRiskZone.properties.code})`,
                          'info'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Dispatch Drone</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        showToast(
                          `📋 Preemptive Ranger checkpoint itinerary logged for ${selectedRiskZone.properties.code}`,
                          'success'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      <span>Log Patrol</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Col 2: Draggable Before / After Visual Comparison (4 cols) */}
        <Card className="lg:col-span-4 p-5 bg-white dark:bg-navy-dark border border-slate-200/70 dark:border-emerald-950/60 rounded-2xl shadow-subtle flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-emerald-950/40">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Draggable Before / After Visual Comparison
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedAlert
                  ? `Inspecting ${selectedAlert.polygon?.properties?.name || 'Kudremukh South Ridge Clearing'}`
                  : 'Inspecting Kudremukh South Ridge Clearing'}
              </p>
            </div>

            {/* Draggable Slider (Exact Reference Match) */}
            <div className="mt-3">
              <ImageSlider
                beforeImage={
                  (selectedAlert?.before_image_url ||
                  '/static/alerts/alert-001_before.png') + '?v=20261121_highres'
                }
                afterImage={
                  (selectedAlert?.after_image_url ||
                  '/static/alerts/alert-001_after.png') + '?v=20261121_highres'
                }
                beforeLabel={
                  selectedAlert?.pass_t1
                    ? `Pass T1 (${new Date(selectedAlert.pass_t1).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`
                    : 'Before (Pass T1)'
                }
                afterLabel={
                  selectedAlert?.pass_t2
                    ? `Pass T2 (${new Date(selectedAlert.pass_t2).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`
                    : 'After (Pass T2)'
                }
                className="w-full"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center italic mt-2">
            Drag central divider to compare optical canopy clearing.
          </p>
        </Card>

        {/* Col 3: Insights at a Glance with Leaf Illustration (3 cols) */}
        <Card className="lg:col-span-3 p-5 bg-white dark:bg-navy-dark border border-slate-200/70 dark:border-emerald-950/60 rounded-2xl shadow-subtle relative overflow-hidden flex flex-col justify-between">
          {/* Decorative Foliage in Top-Right Corner (Exact Reference Match) */}
          <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none opacity-40">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-emerald-500">
              <path
                d="M 50 0 C 80 10, 95 40, 100 80 C 70 70, 55 40, 50 0 Z"
                fill="currentColor"
                opacity="0.25"
              />
              <path
                d="M 60 10 C 90 30, 90 60, 100 100 C 60 85, 45 50, 60 10 Z"
                fill="currentColor"
                opacity="0.35"
              />
              <path
                d="M 40 5 Q 70 40 85 90"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.5"
              />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-emerald-950/40">
              <span className="text-[#16a34a] font-bold text-base">📊</span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Insights at a Glance
              </h3>
            </div>

            {/* Metrics List (Exact Reference Match) */}
            <div className="space-y-4 mt-5">
              {/* Metric 1: Canopy Loss */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#16a34a] flex items-center justify-center shrink-0 border border-emerald-100">
                  <TreePine className="w-4 h-4 text-[#16a34a]" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">Canopy Loss Detected</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedAlert ? `${selectedAlert.area_ha} Hectares` : '2.4 Hectares'}
                  </div>
                </div>
              </div>

              {/* Metric 2: Detection Confidence */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#16a34a] flex items-center justify-center shrink-0 border border-emerald-100">
                  <Clock className="w-4 h-4 text-[#16a34a]" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">Detection Confidence</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedAlert ? `${(selectedAlert.confidence * 100).toFixed(0)}%` : '92%'}
                  </div>
                </div>
              </div>

              {/* Metric 3: Status */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center shrink-0 border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">Status</div>
                  <div className="text-sm font-extrabold text-red-600">
                    Disruption Flagged
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA Button (Exact Reference Match) */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-emerald-950/40">
            <Button
              variant="forest"
              className="w-full text-xs font-bold py-3 rounded-xl shadow-md hover:shadow-glow-emerald"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                const el = document.getElementById('pipeline-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View Detailed Report
            </Button>
          </div>
        </Card>
      </div>

      {/* 6-Step Satellite Processing Pipeline Section */}
      <Card id="pipeline-section" className="border border-slate-200/80 dark:border-emerald-950/60 shadow-subtle p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100 dark:border-emerald-950/40">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#16a34a]" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('pipeline.title', '6-Step Satellite Processing Pipeline')}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('pipeline.subtitle', 'How Prakriti-Netra converts raw Copernicus open data into actionable field alerts')}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/40 rounded-full text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#16a34a]" />
            <span>{t('pipeline.status', 'Pipeline Status: Active (Last pass 4h ago)')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-3.5 bg-slate-50/70 dark:bg-navy-surface rounded-xl border border-slate-200/70 dark:border-emerald-950/40 shadow-subtle flex flex-col justify-between hover:border-emerald-400 transition-colors"
            >
              <div>
                <div className="w-7 h-7 rounded-lg bg-[#16a34a] text-white font-bold text-xs flex items-center justify-center mb-2 shadow-sm">
                  {step.num}
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200/50 dark:border-emerald-950/40 flex items-center gap-1 text-[10px] text-[#16a34a] font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Validated Step</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ForestWatch;
