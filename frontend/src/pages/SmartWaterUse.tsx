import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sprout,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Gauge,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { api } from '../lib/api';
import {
  IrrigationAdviceRequest,
  IrrigationAdviceResponse,
  JalScoreRequest,
  JalScoreResponse,
} from '../lib/types';
import i18n from '../lib/i18n';

// i18n Bundles for Smart Water Use
import enAdvisor from '../locales/en/advisor.json';
import hiAdvisor from '../locales/hi/advisor.json';
import knAdvisor from '../locales/kn/advisor.json';

i18n.addResourceBundle('en', 'advisor', enAdvisor, true, true);
i18n.addResourceBundle('hi', 'advisor', hiAdvisor, true, true);
i18n.addResourceBundle('kn', 'advisor', knAdvisor, true, true);

export const SmartWaterUse: React.FC = () => {
  const { t } = useTranslation('advisor');

  const [activeTab, setActiveTab] = useState<'farmer' | 'jalScore'>('farmer');

  // --- Farmer Advisor Form State ---
  const [irrigationForm, setIrrigationForm] = useState<IrrigationAdviceRequest>({
    crop: 'Arecanut',
    ndvi: 0.38,
    rain_forecast_mm: 2.0,
    soil_moisture_pct: 26.0,
  });
  const [irrigationResult, setIrrigationResult] = useState<IrrigationAdviceResponse | null>(null);
  const [irrigationLoading, setIrrigationLoading] = useState(false);
  const [irrigationError, setIrrigationError] = useState<string | null>(null);

  // --- Jal-Score Form State ---
  const [jalForm, setJalForm] = useState<JalScoreRequest>({
    sector: 'farm',
    monthly_usage_kl: 1200,
    recycled_pct: 20,
    leakage_pct: 18,
    rainwater_harvesting: true,
  });
  const [jalResult, setJalResult] = useState<JalScoreResponse | null>(null);
  const [jalLoading, setJalLoading] = useState(false);
  const [jalError, setJalError] = useState<string | null>(null);

  // Handle Farmer Advisor Submit
  const handleIrrigationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIrrigationError(null);

    // Validation
    if (irrigationForm.ndvi < 0 || irrigationForm.ndvi > 1) {
      setIrrigationError('NDVI must be between 0.0 and 1.0');
      return;
    }
    if (irrigationForm.soil_moisture_pct < 0 || irrigationForm.soil_moisture_pct > 100) {
      setIrrigationError('Soil moisture must be between 0% and 100%');
      return;
    }
    if (irrigationForm.rain_forecast_mm < 0) {
      setIrrigationError('Rainfall forecast cannot be negative');
      return;
    }

    try {
      setIrrigationLoading(true);
      const res = await api.getIrrigationAdvice(irrigationForm);
      setIrrigationResult(res);
    } catch (err: any) {
      setIrrigationError(err.message || 'Failed to calculate irrigation advice.');
    } finally {
      setIrrigationLoading(false);
    }
  };

  // Handle Jal-Score Submit
  const handleJalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJalError(null);

    // Validation
    if (jalForm.monthly_usage_kl <= 0) {
      setJalError('Monthly usage must be greater than 0 kL');
      return;
    }
    if (jalForm.recycled_pct < 0 || jalForm.recycled_pct > 100) {
      setJalError('Recycled percentage must be between 0% and 100%');
      return;
    }
    if (jalForm.leakage_pct < 0 || jalForm.leakage_pct > 100) {
      setJalError('Leakage percentage must be between 0% and 100%');
      return;
    }

    try {
      setJalLoading(true);
      const res = await api.getJalScore(jalForm);
      setJalResult(res);
    } catch (err: any) {
      setJalError(err.message || 'Failed to compute Jal-Score.');
    } finally {
      setJalLoading(false);
    }
  };

  // Render 0-100 Gauge Circle
  const renderGauge = (score: number) => {
    const strokeDashoffset = 283 - (283 * score) / 100;
    const color =
      score >= 70 ? '#2E7D4F' : score >= 40 ? '#B8860B' : '#C8441B';

    return (
      <div className="relative flex items-center justify-center w-36 h-36">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#e2e8f0"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={color}
            strokeWidth="10"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-extrabold text-navy">{score}</span>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            / 100
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-navy">{t('title')}</h1>
            <Chip variant="demo" label={t('demoBadge')} />
          </div>
          <p className="text-sm text-slate-600 mt-1">{t('subtitle')}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-200/70 p-1 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('farmer')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'farmer'
                ? 'bg-white text-navy shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sprout className="w-4 h-4 text-forest" />
            <span>{t('irrigationTab')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('jalScore')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'jalScore'
                ? 'bg-white text-navy shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-teal" />
            <span>{t('jalScoreTab')}</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: FARMER ADVISOR ================= */}
      {activeTab === 'farmer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Card */}
          <Card className="p-5 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-navy flex items-center gap-2">
                <Sprout className="w-5 h-5 text-forest" />
                <span>Field Agro-Hydrology Parameters</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter current field sensor readings or use regional satellite baselines.
              </p>
            </div>

            {irrigationError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{irrigationError}</span>
              </div>
            )}

            <form onSubmit={handleIrrigationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('cropLabel')}
                </label>
                <select
                  value={irrigationForm.crop || 'Arecanut'}
                  onChange={(e) =>
                    setIrrigationForm({ ...irrigationForm, crop: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                >
                  <option value="Arecanut">Arecanut (Betel Nut)</option>
                  <option value="Coffee">Robusta / Arabica Coffee</option>
                  <option value="Pepper">Black Pepper (Vines)</option>
                  <option value="Cardamom">Cardamom</option>
                  <option value="Paddy">Paddy / Rice</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t('soilLabel')}
                  </label>
                  <span className="text-xs font-mono font-bold text-forest">
                    {irrigationForm.soil_moisture_pct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="1"
                  value={irrigationForm.soil_moisture_pct}
                  onChange={(e) =>
                    setIrrigationForm({
                      ...irrigationForm,
                      soil_moisture_pct: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-forest cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Dry (&lt;30%)</span>
                  <span>Moderate (30-55%)</span>
                  <span>Saturated (&gt;55%)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t('rainLabel')}
                  </label>
                  <span className="text-xs font-mono font-bold text-teal">
                    {irrigationForm.rain_forecast_mm} mm
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="150"
                  step="0.5"
                  value={irrigationForm.rain_forecast_mm}
                  onChange={(e) =>
                    setIrrigationForm({
                      ...irrigationForm,
                      rain_forecast_mm: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t('ndviLabel')}
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {irrigationForm.ndvi}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={irrigationForm.ndvi}
                  onChange={(e) =>
                    setIrrigationForm({
                      ...irrigationForm,
                      ndvi: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={irrigationLoading}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#256841] transition-colors"
              >
                <span>{irrigationLoading ? 'Computing...' : t('calculateAdvice')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </Card>

          {/* Big Result Card */}
          <div className="space-y-6">
            {irrigationResult ? (
              <Card
                className={`border-2 p-6 transition-all shadow-subtle ${
                  irrigationResult.advice === 'irrigate_now'
                    ? 'border-rust bg-gradient-to-br from-red-50/60 to-white'
                    : 'border-forest bg-gradient-to-br from-emerald-50/60 to-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Hydrological Recommendation
                  </span>
                  <Chip
                    variant={
                      irrigationResult.advice === 'irrigate_now' ? 'open' : 'confirmed'
                    }
                    label={
                      irrigationResult.advice === 'irrigate_now'
                        ? 'ACTION REQUIRED'
                        : 'CONSERVE WATER'
                    }
                  />
                </div>

                {/* Big Recommendation Header */}
                <div className="mt-4 flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl text-white ${
                      irrigationResult.advice === 'irrigate_now'
                        ? 'bg-rust'
                        : 'bg-forest'
                    }`}
                  >
                    {irrigationResult.advice === 'irrigate_now' ? (
                      <AlertCircle className="w-8 h-8" />
                    ) : (
                      <CheckCircle2 className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-navy">
                      {irrigationResult.advice === 'irrigate_now'
                        ? t('irrigateNow')
                        : t('wait')}
                    </h2>
                    <span className="text-xs text-slate-500">
                      Evaluated for Kudremukh Catchment Soils
                    </span>
                  </div>
                </div>

                {/* Plain-Language Reason */}
                <div className="mt-5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-subtle">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Plain-Language Assessment
                  </h4>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {irrigationResult.reason}
                  </p>
                </div>

                {/* Confidence Note */}
                <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
                  <Sparkles className="w-4 h-4 text-amber-dark flex-shrink-0 mt-0.5" />
                  <span>{irrigationResult.confidence_note}</span>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex flex-col items-center justify-center text-center p-10 bg-slate-50 border-dashed border-2 border-slate-200">
                <Sprout className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-600">
                  Ready to calculate irrigation needs
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Fill in your crop and soil values on the left and submit to view immediate action guidance.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: JAL-SCORE ================= */}
      {activeTab === 'jalScore' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Card */}
          <Card className="p-5 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-navy flex items-center gap-2">
                <Gauge className="w-5 h-5 text-teal" />
                <span>Water Efficiency Auditor Form</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Audit monthly water balance for town wards, industrial plants, or agricultural estates.
              </p>
            </div>

            {jalError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{jalError}</span>
              </div>
            )}

            <form onSubmit={handleJalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('sectorLabel')}
                </label>
                <select
                  value={jalForm.sector}
                  onChange={(e: any) =>
                    setJalForm({ ...jalForm, sector: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal bg-white"
                >
                  <option value="farm">{t('sectorFarm')}</option>
                  <option value="town">{t('sectorTown')}</option>
                  <option value="industry">{t('sectorIndustry')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('usageLabel')}
                </label>
                <input
                  type="number"
                  min="10"
                  step="50"
                  value={jalForm.monthly_usage_kl}
                  onChange={(e) =>
                    setJalForm({
                      ...jalForm,
                      monthly_usage_kl: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal bg-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t('recycleLabel')}
                  </label>
                  <span className="text-xs font-mono font-bold text-teal">
                    {jalForm.recycled_pct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={jalForm.recycled_pct}
                  onChange={(e) =>
                    setJalForm({
                      ...jalForm,
                      recycled_pct: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-teal cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t('leakageLabel')}
                  </label>
                  <span className="text-xs font-mono font-bold text-rust">
                    {jalForm.leakage_pct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={jalForm.leakage_pct}
                  onChange={(e) =>
                    setJalForm({
                      ...jalForm,
                      leakage_pct: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-rust cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="rwh"
                  checked={jalForm.rainwater_harvesting}
                  onChange={(e) =>
                    setJalForm({ ...jalForm, rainwater_harvesting: e.target.checked })
                  }
                  className="w-4 h-4 text-teal rounded border-slate-300 focus:ring-teal"
                />
                <label htmlFor="rwh" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  {t('rwhLabel')}
                </label>
              </div>

              <button
                type="submit"
                disabled={jalLoading}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#18586f] transition-colors"
              >
                <span>{jalLoading ? 'Auditing...' : t('calculateScore')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </Card>

          {/* Jal-Score Result Card */}
          <div className="space-y-6">
            {jalResult ? (
              <Card className="border-2 border-slate-200 p-6 space-y-6 shadow-subtle bg-white">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t('scoreTitle')}
                  </span>
                  <Chip
                    variant={
                      jalResult.band === 'good'
                        ? 'confirmed'
                        : jalResult.band === 'watch'
                        ? 'risk_medium'
                        : 'open'
                    }
                    label={
                      jalResult.band === 'good'
                        ? t('bandGood')
                        : jalResult.band === 'watch'
                        ? t('bandWatch')
                        : t('bandCritical')
                    }
                  />
                </div>

                {/* Gauge Display & Band */}
                <div className="flex flex-col sm:flex-row items-center gap-6 justify-around bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  {renderGauge(jalResult.score)}

                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-xs uppercase font-bold text-slate-400">
                      Performance Rating
                    </span>
                    <h3 className="text-2xl font-black text-navy capitalize">
                      {jalResult.band} Status
                    </h3>
                    <p className="text-xs text-slate-600 max-w-xs">
                      {jalResult.score >= 70
                        ? 'Exemplary efficiency! Recycling and low leakage are safeguarding regional aquifers.'
                        : jalResult.score >= 40
                        ? 'Moderate efficiency. Distribution losses require targeted pipeline acoustic audits.'
                        : 'High risk of water deficit. Substantial leakage and low reuse threaten summer resilience.'}
                    </p>
                  </div>
                </div>

                {/* 3 Saving Tips */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-dark" />
                    <span>{t('priorityTips')}</span>
                  </h4>

                  <div className="space-y-2">
                    {jalResult.tips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-800 leading-snug"
                      >
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-bg text-teal font-bold text-[11px] flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex flex-col items-center justify-center text-center p-10 bg-slate-50 border-dashed border-2 border-slate-200">
                <Gauge className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-600">
                  Ready to compute Jal-Score
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Provide your sector usage, recycling percentage, and distribution loss to receive your 0-100 score and custom savings tips.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartWaterUse;
