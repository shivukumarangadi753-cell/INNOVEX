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

import { Card, Chip, Skeleton } from '../features/stubs/components';
import {
  fetchLakes,
  fetchLakeTrend,
  fetchGroundwater,
  LakeSummary,
  LakeTrendResponse,
  GroundwaterResponse,
} from '../features/api/client';

export const WaterWatch: React.FC = () => {
  const { t } = useTranslation('water');

  const [lakes, setLakes] = useState<LakeSummary[]>([]);
  const [selectedLakeId, setSelectedLakeId] = useState<string>('lake_lakya_dam');
  const [lakeTrend, setLakeTrend] = useState<LakeTrendResponse | null>(null);
  const [groundwater, setGroundwater] = useState<GroundwaterResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Tooltip popup states
  const [showNdwiHelp, setShowNdwiHelp] = useState(false);
  const [showGwHelp, setShowGwHelp] = useState(false);

  useEffect(() => {
    async function loadLakes() {
      try {
        const lakesData = await fetchLakes();
        setLakes(lakesData);
        if (lakesData.length > 0) {
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
          fetchLakeTrend(selectedLakeId),
          fetchGroundwater(),
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
            <Chip variant="demo">{t('demoBadge')}</Chip>
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
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-water focus:outline-none focus:ring-1 focus:ring-water"
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
        <div className="relative overflow-hidden rounded-xl border-2 border-alertRust bg-red-50/90 p-5 shadow-md">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-alertRust p-2.5 text-white shadow-sm flex-shrink-0">
              <AlertOctagon className="w-6 h-6 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-alertRust">
                  {t('earlyWarningTitle')}
                </h3>
                <Chip variant="danger" size="sm">CRITICAL SHRINKAGE</Chip>
              </div>
              <p className="text-xs text-slate-800 mt-1 leading-relaxed">
                {t('earlyWarningMessage', { pct: Math.abs(lakeTrend.change_pct).toFixed(1) })}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-md border border-red-200">
                  <TrendingDown className="w-3.5 h-3.5 text-alertRust" />
                  Net Change: <strong>{lakeTrend.change_pct}%</strong>
                </span>
                <span className="bg-white/80 px-2.5 py-1 rounded-md border border-red-200">
                  Target Water Body: <strong>{lakeTrend.name}</strong>
                </span>
                <span className="text-red-700 font-semibold underline decoration-alertRust cursor-pointer">
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
        <Card className="flex items-center justify-between border-l-4 border-l-water">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Waves className="w-4 h-4 text-water" />
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
          <div className="p-3 bg-water/10 rounded-full text-water">
            <Droplets className="w-6 h-6" />
          </div>
        </Card>

        {/* Metric 2: 6-Month Area Change */}
        <Card className="flex items-center justify-between border-l-4 border-l-alertRust">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <ArrowDownRight className="w-4 h-4 text-alertRust" />
              <span>{t('sixMonthChange')}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-alertRust">
                {lakeTrend ? `${lakeTrend.change_pct}%` : '--'}
              </span>
              <span className="text-xs font-medium text-alertRust/80">drop</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Sentinel-2 NDWI time-series
            </div>
          </div>
          <div className="p-3 bg-red-100 rounded-full text-alertRust">
            <TrendingDown className="w-6 h-6" />
          </div>
        </Card>

        {/* Metric 3: Groundwater Depth */}
        <Card className="flex items-center justify-between border-l-4 border-l-amber sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Droplets className="w-4 h-4 text-amber" />
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
          <div className="p-3 bg-amber-100 rounded-full text-amber">
            <Waves className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lake Surface Area Trend Chart */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-navy">{t('lakeTrendTitle')}</h3>
              {/* Beginner Explanatory Tooltip Icon */}
              <button
                type="button"
                onClick={() => setShowNdwiHelp(!showNdwiHelp)}
                className="text-slate-400 hover:text-water transition-colors"
                title="Explain NDWI"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-slate-500 font-mono">Lakya Dam (ha)</span>
          </div>

          {/* NDWI Tooltip Explainer Banner */}
          {showNdwiHelp && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-water">{t('ndwiTooltipTitle')}</div>
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
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-navy">{t('groundwaterTitle')}</h3>
              {/* Beginner Explanatory Tooltip Icon */}
              <button
                type="button"
                onClick={() => setShowGwHelp(!showGwHelp)}
                className="text-slate-400 hover:text-amber transition-colors"
                title="Explain Groundwater Depth"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-slate-500 font-mono">Depth (meters)</span>
          </div>

          {/* Groundwater Tooltip Explainer Banner */}
          {showGwHelp && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-amber">{t('gwTooltipTitle')}</div>
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
                  {/* Invert axis visual feeling or plot depth: higher number = deeper */}
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
