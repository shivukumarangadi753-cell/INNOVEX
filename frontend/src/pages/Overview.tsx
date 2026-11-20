import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  TreePine,
  Flame,
  Droplets,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';
import { Alert, Reserve } from '../lib/types';
import { KpiCard } from '../components/KpiCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { ReserveMap } from '../components/ReserveMap';
import { CardSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';

export const Overview: React.FC = () => {
  const { t } = useTranslation('overview');
  const navigate = useNavigate();

  const [reserve, setReserve] = useState<Reserve | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reservesData, alertsData] = await Promise.all([
        api.getReserves(),
        api.getAlerts(),
      ]);
      setReserve(reservesData[0] || null);
      setAlerts(alertsData);
      if (alertsData.length > 0) {
        setSelectedAlert(alertsData[0]);
      }
    } catch (err: any) {
      console.error('Failed to load overview telemetry:', err);
      setError(err.message || 'Unable to load satellite observations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAlertsCount = alerts.filter((a) => a.status === 'open').length;
  const totalAreaHa = alerts.reduce((acc, a) => acc + (a.status !== 'false_alarm' ? a.area_ha : 0), 0).toFixed(1);

  if (error) {
    return (
      <div className="py-8">
        <ErrorState
          title="Satellite Telemetry Unavailable"
          message={error}
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy">
            {t('title', 'Satellite Surveillance Overview')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('subtitle', 'Near real-time optical and radar telemetry for Kudremukh Reserve Forest & Bhadra River Catchment')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={loadData}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="forest"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => navigate('/alerts')}
          >
            View All Alerts
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={t('kpis.openAlerts', 'Open Alerts')}
            value={openAlertsCount}
            subtitle={t('kpis.openAlertsSub', 'Requires on-ground inspection')}
            tooltipText={t('kpis.openAlertsTip', 'Unresolved canopy disruptions detected by Sentinel-2 difference algorithms.')}
            accentColor="rust"
            icon={<AlertCircle className="w-6 h-6" />}
            trend={{
              value: '+1',
              label: 'past 48h',
              isPositive: false,
            }}
          />

          <KpiCard
            title={t('kpis.flaggedArea', 'Flagged This Month')}
            value={totalAreaHa}
            unit="ha"
            subtitle={t('kpis.flaggedAreaSub', 'Across Kudremukh reserve zone')}
            tooltipText={t('kpis.flaggedAreaTip', 'Total estimated surface hectares with significant biomass or canopy change.')}
            accentColor="amber"
            icon={<TreePine className="w-6 h-6" />}
          />

          <KpiCard
            title={t('kpis.fireHotspots', 'Active Fire Hotspots')}
            value={2}
            subtitle={t('kpis.fireHotspotsSub', 'NASA FIRMS 24-hour pass')}
            tooltipText={t('kpis.fireHotspotsTip', 'Thermal anomalies detected at 375m resolution by VIIRS/MODIS sensors.')}
            accentColor="amber"
            icon={<Flame className="w-6 h-6" />}
          />

          <KpiCard
            title={t('kpis.waterStress', 'Water-Stress Index')}
            value="Moderate"
            subtitle={t('kpis.waterStressSub', 'Lakhya & Bhadra catchment')}
            tooltipText={t('kpis.waterStressTip', 'Computed from multi-temporal surface water spread and CGWB well depth proxies.')}
            accentColor="teal"
            icon={<Droplets className="w-6 h-6" />}
            trend={{
              value: '-17.1%',
              label: 'spread shrink',
              isPositive: false,
            }}
          />
        </div>
      )}

      {/* Main Content Grid: Map + "What should I do today?" */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>{t('map.title', 'Western Ghats Spatial Overview')}</CardTitle>
                <CardDescription>
                  {t('map.subtitle', 'Kudremukh National Park boundary with prioritized alert polygons')}
                </CardDescription>
              </div>
              <span className="text-xs text-slate-500 hidden sm:inline">
                {t('map.clickAlert', 'Click an alert marker to inspect details')}
              </span>
            </CardHeader>
            <div className="p-4">
              <ReserveMap
                reserve={reserve || undefined}
                alerts={alerts}
                selectedAlertId={selectedAlert?.id}
                onSelectAlert={(a) => setSelectedAlert(a)}
                className="h-[440px]"
              />
            </div>
          </Card>
        </div>

        {/* "What should I do today?" Action Board */}
        <div className="space-y-4">
          <Card className="h-full flex flex-col border-t-4 border-t-navy">
            <CardHeader>
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-forest" />
                  <CardTitle className="text-lg">
                    {t('actionsCard.title', 'What should I do today?')}
                  </CardTitle>
                </div>
                <CardDescription className="mt-1">
                  {t('actionsCard.subtitle', 'Prioritized field interventions ranked by satellite confidence and spatial proximity')}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              {/* Action Item 1: Open clearing */}
              <div className="p-4 rounded-xl border border-rust/40 bg-rust-bg space-y-2.5 transition-all hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <Chip variant="clearing" size="sm" />
                  <span className="text-[11px] font-bold text-rust">Priority 1 (Urgent)</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                  {t('actionsCard.action1Title', 'Dispatch ground patrol to Kudremukh South Range')}
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {t('actionsCard.action1Desc', '2.4 ha canopy opening flagged with 92% satellite confidence. Suspected clearing near boundary marker 14.')}
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">ID: alt-001 (92% conf.)</span>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => navigate('/alerts')}
                  >
                    {t('actionsCard.action1Btn', 'Inspect Alert')}
                  </Button>
                </div>
              </div>

              {/* Action Item 2: Fire hotspot */}
              <div className="p-4 rounded-xl border border-amber/40 bg-amber-bg space-y-2.5 transition-all hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <Chip variant="fire_scar" size="sm" />
                  <span className="text-[11px] font-bold text-amber-dark">Priority 2 (High)</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                  {t('actionsCard.action2Title', 'Verify eastern buffer thermal anomaly')}
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {t('actionsCard.action2Desc', '5.1 ha grass burn scar detected. Confirm fire containment with local range officer.')}
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">ID: alt-002 (87% conf.)</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/alerts')}
                  >
                    {t('actionsCard.action2Btn', 'View Fire Details')}
                  </Button>
                </div>
              </div>

              {/* Action Item 3: Lake shrinkage */}
              <div className="p-4 rounded-xl border border-teal/40 bg-teal-bg space-y-2.5 transition-all hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <Chip variant="seasonal" label="Water Body" size="sm" />
                  <span className="text-[11px] font-bold text-teal-dark">Priority 3 (Watch)</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                  {t('actionsCard.action3Title', 'Audit Lakhya Reservoir surface shrinkage')}
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {t('actionsCard.action3Desc', 'Water spread contracted 17.1% over monsoon peak baseline. Trigger catchment review.')}
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">Lake: Lakhya Wetland</span>
                  <Button
                    size="sm"
                    variant="teal"
                    onClick={() => navigate('/water')}
                  >
                    {t('actionsCard.action3Btn', 'Open Water Watch')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Overview;
