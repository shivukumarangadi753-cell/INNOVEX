import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { AlertOctagon, HelpCircle, Droplets, Waves, TrendingDown, ArrowDownRight } from 'lucide-react';

import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Skeleton } from '../components/Skeleton';
import { api } from '../lib/api';
import { Lake, LakeTrendResponse, GroundwaterResponse } from '../lib/types';
import i18n from '../lib/i18n';

// i18n Bundles for Water Watch
import enWater from '../locales/en/water.json';
import hiWater from '../locales/hi/water.json';
import knWater from '../locales/kn/water.json';

i18n.addResourceBundle('en', 'water', enWater, true, true);
i18n.addResourceBundle('hi', 'water', hiWater, true, true);
i18n.addResourceBundle('kn', 'water', knWater, true, true);

export const WaterWatch: React.FC = () => {
  const { t } = useTranslation('water');

  const [lakes, setLakes] = useState<Lake[]>([]);
  const [selectedLakeId, setSelectedLakeId] = useState<string>('lake-lakhya');
  const [lakeTrend, setLakeTrend] = useState<LakeTrendResponse | null>(null);
  const [groundwater, setGroundwater] = useState<GroundwaterResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Tooltip popup states
  const [showNdwiHelp, setShowNdwiHelp] = useState(false);
  const [showGwHelp, setShowGwHelp] = useState(false);

  useEffect(() => {
    async function loadLakes() {
      try {
        const lakesData = await api.getWaterLakes();
        setLakes(lakesData || []);
        if (lakesData && lakesData.length > 0) {
          setSelectedLakeId(lakesData[0].id);
        }
      } catch (err) {
        console.error('Failed to load lakes:', err);
      }
    }
    loadLakes();
  }, []);

  useEffect(() => {
    async function loadDetails() {
      if (!selectedLakeId) return;
      try {
        setLoading(true);
        const [trendData, gwData] = await Promise.all([
          api.getWaterLakeTrend(selectedLakeId),
          api.getWaterGroundwater(),
        ]);
        setLakeTrend(trendData);
        setGroundwater(gwData);
      } catch (err) {
        console.error('Failed to load water details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [selectedLakeId]);

  const latestLakePoint = lakeTrend?.points?.[lakeTrend.points.length - 1];
  const latestGwPoint = groundwater?.points?.[groundwater.points.length - 1];

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-navy">{t('title')}</h1>
            <Chip variant="demo" label={t('demoBadge')} />
          </div>
          <p className="text-sm text-slate-600 mt-1">{t('subtitle')}</p>
        </div>

        {/* Lake Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">
            {t('selectLake')}:
          </label>
          <select
            value={selectedLakeId}
            onChange={(e) => setSelectedLakeId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
          >
            {lakes.map((lake) => (
              <option key={lake.id} value={lake.id}>
                {lake.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Drying-Lake Early Warning Banner (Appears when warning === true) */}
      {lakeTrend?.warning && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-rust bg-gradient-to-r from-red-50 via-red-50/90 to-amber-50/50 dark:from-rust/20 dark:to-navy-dark p-5 shadow-card animate-in fade-in-50 duration-200">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-gradient-to-br from-rust to-rust-dark p-2.5 text-white shadow-md flex-shrink-0">
              <AlertOctagon className="w-6 h-6 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-rust dark:text-red-400">
                  {t('earlyWarningTitle')}
                </h3>
                <Chip variant="open" size="sm" label="CRITICAL SHRINKAGE" />
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 leading-relaxed font-medium">
                {t('earlyWarningMessage', { pct: Math.abs(lakeTrend.change_pct).toFixed(1) })}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 bg-white/90 dark:bg-navy-dark px-3 py-1 rounded-full border border-red-200 dark:border-red-900/50 shadow-2xs">
                  <TrendingDown className="w-3.5 h-3.5 text-rust" />
                  Net Change: <strong className="text-rust">{lakeTrend.change_pct}%</strong>
                </span>
                <span className="bg-white/90 dark:bg-navy-dark px-3 py-1 rounded-full border border-red-200 dark:border-red-900/50 shadow-2xs">
                  Target Water Body: <strong className="text-navy dark:text-cream">{lakeTrend.name}</strong>
                </span>
                <span className="text-red-700 dark:text-red-300 font-semibold underline decoration-rust cursor-pointer">
                  Recommend immediate ground verification by local irrigation authorities.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Metric 1: Current Lake Surface Area */}
        <Card className="p-5 flex items-center justify-between border-l-4 border-l-teal">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Waves className="w-4 h-4 text-teal" />
              <span>{t('currentExtent')}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy">
                {latestLakePoint ? latestLakePoint.area_ha.toFixed(1) : '--'}
              </span>
              <span className="text-xs font-medium text-slate-500">hectares</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {latestLakePoint?.date ? new Date(latestLakePoint.date).toLocaleDateString() : ''}
            </div>
          </div>
          <div className="p-3 bg-teal-bg rounded-full text-teal">
            <Droplets className="w-6 h-6" />
          </div>
        </Card>

        {/* Metric 2: Surface Area Change */}
        <Card className="p-5 flex items-center justify-between border-l-4 border-l-rust">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <ArrowDownRight className="w-4 h-4 text-rust" />
              <span>{t('sixMonthChange')}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rust">
                {lakeTrend ? `${lakeTrend.change_pct}%` : '--'}
              </span>
              <span className="text-xs font-medium text-rust/80">drop</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Sentinel-2 NDWI time-series
            </div>
          </div>
          <div className="p-3 bg-rust-bg rounded-full text-rust">
            <TrendingDown className="w-6 h-6" />
          </div>
        </Card>

        {/* Metric 3: Groundwater Depth */}
        <Card className="p-5 flex items-center justify-between border-l-4 border-l-amber sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Droplets className="w-4 h-4 text-amber-dark" />
              <span>{t('currentDepth')}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy">
                {latestGwPoint ? latestGwPoint.depth_m.toFixed(1) : '--'}
              </span>
              <span className="text-xs font-medium text-slate-500">mbgl</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {groundwater?.station || 'Regional Telemetry'}
            </div>
          </div>
          <div className="p-3 bg-amber-bg rounded-full text-amber-dark">
            <Waves className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lake Surface Area Trend Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-navy">{t('lakeTrendTitle')}</h3>
              <button
                type="button"
                onClick={() => setShowNdwiHelp(!showNdwiHelp)}
                className="text-slate-400 hover:text-teal transition-colors"
                title="Explain NDWI"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-slate-500 font-mono">Lakya Dam (ha)</span>
          </div>

          {showNdwiHelp && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-teal">{t('ndwiTooltipTitle')}</div>
              <p className="text-slate-700 leading-relaxed">{t('ndwiTooltipText')}</p>
            </div>
          )}

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={lakeTrend?.points || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="lakeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1F6F8B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1F6F8B" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short' })}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={['dataMin - 20', 'dataMax + 20']} />
                  <RechartsTooltip
                    formatter={(val: any) => [`${val} ha`, 'Water Extent']}
                    labelFormatter={(label) => new Date(label).toDateString()}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="area_ha"
                    stroke="#1F6F8B"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#lakeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Groundwater Depth Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-navy">{t('groundwaterTitle')}</h3>
              <button
                type="button"
                onClick={() => setShowGwHelp(!showGwHelp)}
                className="text-slate-400 hover:text-amber-dark transition-colors"
                title="Explain Groundwater Depth"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-slate-500 font-mono">Depth (meters)</span>
          </div>

          {showGwHelp && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-amber-dark">{t('gwTooltipTitle')}</div>
              <p className="text-slate-700 leading-relaxed">{t('gwTooltipText')}</p>
            </div>
          )}

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={groundwater?.points || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short' })}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[2, 10]} />
                  <RechartsTooltip
                    formatter={(val: any) => [`${val} meters below surface`, 'Water Table Depth']}
                    labelFormatter={(label) => new Date(label).toDateString()}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="depth_m"
                    stroke="#B8860B"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#B8860B' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default WaterWatch;
