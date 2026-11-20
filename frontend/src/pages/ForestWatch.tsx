import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  Calendar,
  Eye,
  Sliders,
  CheckCircle2,
  Clock,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import { Alert, Reserve } from '../lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Tooltip } from '../components/Tooltip';
import { ImageSlider } from '../components/ImageSlider';
import { ReserveMap } from '../components/ReserveMap';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';

export const ForestWatch: React.FC = () => {
  const { t } = useTranslation('forest');

  const [reserve, setReserve] = useState<Reserve | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [currentPass, setCurrentPass] = useState<'T1' | 'T2'>('T2');
  const [layers, setLayers] = useState({
    ndvi: true,
    change: true,
    radar: false,
  });

  useEffect(() => {
    Promise.all([api.getReserves(), api.getAlerts()]).then(([res, al]) => {
      setReserve(res[0] || null);
      setAlerts(al);
      if (al.length > 0) setSelectedAlert(al[0]);
    });
  }, []);

  const toggleLayer = (layerKey: 'ndvi' | 'change' | 'radar') => {
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy">
            {t('title', 'Forest Watch & Canopy Loss Tracking')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('subtitle', 'Bi-temporal Sentinel-2 MSI & Sentinel-1 SAR change detection for Kudremukh Reserve Forest')}
          </p>
        </div>

        {/* T1 / T2 Pass Toggle */}
        <div className="flex items-center gap-1.5 bg-cream-50 dark:bg-navy-dark p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 self-start sm:self-auto shadow-xs">
          <Calendar className="w-4 h-4 text-navy dark:text-cream ml-1.5" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">Satellite Pass:</span>
          <button
            type="button"
            onClick={() => setCurrentPass('T1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              currentPass === 'T1'
                ? 'bg-gradient-to-r from-forest to-forest-dark text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            T1 (Nov 06)
          </button>
          <button
            type="button"
            onClick={() => setCurrentPass('T2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              currentPass === 'T2'
                ? 'bg-gradient-to-r from-rust to-rust-dark text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            T2 (Nov 18 - Flagged)
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map with Layer Controls + Draggable Before/After Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map & Layers (8 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="flex-wrap gap-2">
              <div>
                <CardTitle>Kudremukh Reserve Canopy Analysis</CardTitle>
                <CardDescription>
                  Displaying {currentPass === 'T2' ? 'Pass T2 (Nov 18)' : 'Pass T1 (Nov 06)'} multispectral observations
                </CardDescription>
              </div>

              {/* Layer Toggles */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => toggleLayer('ndvi')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold border flex items-center gap-1.5 transition-all shadow-2xs ${
                    layers.ndvi
                      ? 'bg-forest-bg text-forest-dark border-forest/40'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${layers.ndvi ? 'bg-forest ring-2 ring-forest/30' : 'bg-slate-300'}`} />
                  NDVI Difference
                  <Tooltip term="NDVI" text={t('layers.ndviTip', 'Normalized Difference Vegetation Index compares Red and Near-Infrared reflectance.')} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleLayer('change')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold border flex items-center gap-1.5 transition-all shadow-2xs ${
                    layers.change
                      ? 'bg-rust-bg text-rust-dark border-rust/40'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${layers.change ? 'bg-rust ring-2 ring-rust/30' : 'bg-slate-300'}`} />
                  Change Mask
                  <Tooltip term="Canopy Mask" text={t('layers.changeTip', 'Thresholded difference isolating sudden drop in canopy.')} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleLayer('radar')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold border flex items-center gap-1.5 transition-all shadow-2xs ${
                    layers.radar
                      ? 'bg-teal-bg text-teal-dark border-teal/40'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${layers.radar ? 'bg-teal ring-2 ring-teal/30' : 'bg-slate-300'}`} />
                  Radar SAR
                  <Tooltip term="Sentinel-1 SAR" text={t('layers.radarTip', 'Synthetic Aperture Radar backscatter penetrates cloud cover during monsoons.')} />
                </button>
              </div>
            </CardHeader>

            <div className="p-4">
              <ReserveMap
                reserve={reserve || undefined}
                alerts={alerts}
                selectedAlertId={selectedAlert?.id}
                onSelectAlert={(a) => setSelectedAlert(a)}
                activeLayers={layers}
                className="h-[420px]"
              />
            </div>
          </Card>
        </div>

        {/* Draggable Before / After Image Slider (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div>
                <CardTitle>{t('slider.title', 'Draggable Before / After Visual Comparison')}</CardTitle>
                <CardDescription>
                  {selectedAlert
                    ? `Inspecting ${selectedAlert.polygon.properties.name || selectedAlert.id}`
                    : 'Select an alert to inspect satellite comparison'}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
              {selectedAlert && (
                <>
                  <div className="space-y-2">
                    <ImageSlider
                      beforeImage={selectedAlert.before_image_url}
                      afterImage={selectedAlert.after_image_url}
                      beforeLabel={t('slider.passT1', 'Pass T1: Nov 06, 2026')}
                      afterLabel={t('slider.passT2', 'Pass T2: Nov 18, 2026')}
                      className="w-full"
                    />
                    <p className="text-[11px] text-slate-500 text-center italic">
                      {t('slider.instructions', 'Drag slider horizontally or use keyboard to compare the canopy boundary.')}
                    </p>
                  </div>

                  {/* Anomaly Inspection Metadata Card */}
                  <div className="p-4 bg-cream-50 rounded-xl border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy uppercase tracking-wider">
                        Flagged Anomaly Telemetry
                      </span>
                      <Chip variant={selectedAlert.label} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Estimated Area:</span>
                        <div className="font-bold text-slate-800">{selectedAlert.area_ha} Hectares</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Satellite Confidence:</span>
                        <div className="font-bold text-rust">{(selectedAlert.confidence * 100).toFixed(0)}% (Illustrative)</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Centroid GPS:</span>
                        <div className="font-mono text-slate-700">
                          {selectedAlert.centroid.lat.toFixed(4)}°N, {selectedAlert.centroid.lng.toFixed(4)}°E
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Status:</span>
                        <div>
                          <Chip variant={selectedAlert.status} size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 6-Step Satellite Processing Pipeline Section */}
      <Card className="border-t-4 border-t-forest shadow-card">
        <CardHeader className="flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gradient-to-r from-cream-50/70 to-white dark:from-navy-surface dark:to-navy-dark">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-forest/15 text-forest border border-forest/30">
                <Zap className="w-5 h-5 text-forest" />
              </span>
              <CardTitle className="text-lg">{t('pipeline.title', '6-Step Satellite Processing Pipeline')}</CardTitle>
            </div>
            <CardDescription className="mt-0.5">
              {t('pipeline.subtitle', 'How Prakriti-Netra converts raw Copernicus open data into actionable field alerts')}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-forest-bg text-forest-dark border border-forest/30 rounded-full text-xs font-bold shadow-xs">
            <Radio className="w-3.5 h-3.5 animate-pulse text-forest" />
            <span>{t('pipeline.status', 'Pipeline Status: Active (Last pass 4h ago)')}</span>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="p-4 bg-white dark:bg-navy-dark rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-subtle flex flex-col justify-between hover:border-forest hover:-translate-y-0.5 hover:shadow-card transition-all duration-200"
              >
                <div>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-forest to-forest-dark text-white font-extrabold text-xs flex items-center justify-center mb-2.5 shadow-xs border border-forest-light/30">
                    {step.num}
                  </div>
                  <h4 className="font-bold text-xs text-navy dark:text-white uppercase tracking-wide">{step.title}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{step.desc}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 text-[10px] text-forest font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validated Step</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForestWatch;
