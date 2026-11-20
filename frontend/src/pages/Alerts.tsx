import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  ExternalLink,
  Send,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowUpDown,
  Search,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { Alert } from '../lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Drawer } from '../components/Drawer';
import { ImageSlider } from '../components/ImageSlider';
import { Tooltip } from '../components/Tooltip';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';

export const Alerts: React.FC = () => {
  const { t } = useTranslation('alerts');
  const toast = useToast();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'area' | 'confidence'>('date');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAlerts();
      setAlerts(data);
      if (data.length > 0 && !selectedAlert) {
        setSelectedAlert(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to fetch alerts:', err);
      setError(err.message || 'Unable to retrieve alert records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleReview = async (id: string, decision: 'confirm' | 'false_alarm') => {
    setIsSubmitting(true);
    try {
      const updated = await api.reviewAlert(id, decision);
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setSelectedAlert(updated);

      if (decision === 'confirm') {
        toast.success(
          t('toasts.confirmSuccess', 'Alert Confirmed'),
          t('toasts.confirmMsg', 'Alert has been marked as confirmed clearing and filed for patrol audit.')
        );
      } else {
        toast.info(
          t('toasts.falseAlarmSuccess', 'Marked as False Alarm'),
          t('toasts.falseAlarmMsg', 'Alert updated. Model feedback loop will incorporate this sample.')
        );
      }
    } catch (err: any) {
      toast.error(
        t('toasts.errorTitle', 'Operation Failed'),
        err.message || t('toasts.errorMsg', 'Unable to complete request. Please check network connection.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTelegram = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await api.sendTelegram(id);
      if (res.sent) {
        toast.success(
          t('toasts.telegramSuccess', 'Telegram Alert Dispatched'),
          res.detail || t('toasts.telegramMsg', 'Notification sent successfully to field patrol channel.')
        );
      } else {
        toast.error('Telegram Dispatch Failed', res.detail);
      }
    } catch (err: any) {
      toast.error(
        t('toasts.errorTitle', 'Telegram Dispatch Failed'),
        err.message || 'Could not connect to Telegram gateway.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter and Sort
  const filteredAlerts = alerts
    .filter((a) => (filterStatus === 'all' ? true : a.status === filterStatus))
    .sort((a, b) => {
      if (sortBy === 'area') return b.area_ha - a.area_ha;
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
    });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy">
            {t('title', 'Alerts Management & Ground Dispatch')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('subtitle', 'Review, ground-truth, and dispatch official notifications to range officers')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAlerts}
            leftIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
          >
            Refresh Alerts
          </Button>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Filter:
            </span>
            {[
              { id: 'all', label: t('filters.all', 'All Alerts'), count: alerts.length },
              { id: 'open', label: t('filters.open', 'Open'), count: alerts.filter((a) => a.status === 'open').length },
              { id: 'confirmed', label: t('filters.confirmed', 'Confirmed'), count: alerts.filter((a) => a.status === 'confirmed').length },
              { id: 'false_alarm', label: t('filters.falseAlarm', 'False Alarms'), count: alerts.filter((a) => a.status === 'false_alarm').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  filterStatus === tab.id
                    ? 'bg-navy text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-navy"
            >
              <option value="date">{t('filters.sortDate', 'Detection Date (Newest)')}</option>
              <option value="area">{t('filters.sortArea', 'Area (Largest First)')}</option>
              <option value="confidence">{t('filters.sortConfidence', 'Confidence Score')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main List */}
      {error ? (
        <ErrorState title="Could Not Load Alerts" message={error} onRetry={fetchAlerts} />
      ) : isLoading ? (
        <ListSkeleton count={3} />
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          title="No Alerts Found"
          description="No satellite alerts match the currently selected status filter."
          actionLabel="Show All Alerts"
          onAction={() => setFilterStatus('all')}
        />
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isClearing = alert.label === 'clearing';
            const isFire = alert.label === 'fire_scar';
            const isConfirmed = alert.status === 'confirmed';

            return (
              <Card
                key={alert.id}
                className={`p-4 transition-all hover:shadow-card cursor-pointer border-l-4 ${
                  isConfirmed
                    ? 'border-l-forest'
                    : isClearing
                    ? 'border-l-rust'
                    : isFire
                    ? 'border-l-amber'
                    : 'border-l-teal'
                } ${selectedAlert?.id === alert.id ? 'ring-2 ring-navy/20 bg-cream-50/50' : 'bg-white'}`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Metadata */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-navy">
                        {alert.id.toUpperCase()}
                      </span>
                      <Chip variant={alert.status} size="sm" />
                      <Chip variant={alert.label} size="sm" />
                      {alert.data_mode === 'demo' && <Chip variant="demo" size="sm" />}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {alert.polygon.properties.name || `Kudremukh Sentinel Anomaly ${alert.id}`}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {alert.centroid.lat.toFixed(4)}°N, {alert.centroid.lng.toFixed(4)}°E
                      </span>
                      <span>
                        Area: <strong className="text-slate-800">{alert.area_ha} ha</strong>
                      </span>
                      <span>
                        Confidence: <strong className="text-rust">{(alert.confidence * 100).toFixed(0)}%</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(alert.detected_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Right: Quick Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlert(alert);
                      }}
                    >
                      Inspect & Review
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Send className="w-3 h-3" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendTelegram(alert.id);
                      }}
                      title="Dispatch alert card to Telegram field patrol"
                    >
                      Telegram
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Alert Detail Slide-out Drawer */}
      <Drawer
        isOpen={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert ? `Alert Details: ${selectedAlert.id.toUpperCase()}` : 'Alert Details'}
        subtitle="Review bi-temporal imagery, ground-truth status, and dispatch notifications"
        width="lg"
      >
        {selectedAlert && (
          <div className="space-y-6">
            {/* Status & Label Chips Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Chip variant={selectedAlert.status} />
                <Chip variant={selectedAlert.label} />
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Detected: {new Date(selectedAlert.detected_at).toLocaleString()}
              </div>
            </div>

            {/* GPS & Area Highlights */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-cream-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Affected Canopy Area</span>
                <span className="text-2xl font-bold text-slate-900">{selectedAlert.area_ha}</span>
                <span className="text-xs text-slate-500 ml-1">Hectares</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium block">Model Confidence</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-rust">
                    {(selectedAlert.confidence * 100).toFixed(0)}%
                  </span>
                  <Tooltip
                    term="Confidence Score"
                    text={t('drawer.confidenceExplainer', 'Estimated using spectral gradient, cloud mask purity, and spatial cluster compactness.')}
                  />
                </div>
                <span className="text-[10px] text-amber-dark font-medium block">Illustrative demo value</span>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono">
                  <MapPin className="w-4 h-4 text-forest" />
                  <span>
                    {selectedAlert.centroid.lat.toFixed(5)}°N, {selectedAlert.centroid.lng.toFixed(5)}°E
                  </span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${selectedAlert.centroid.lat},${selectedAlert.centroid.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal hover:text-teal-dark hover:underline"
                >
                  <span>{t('drawer.openMaps', 'Open in Google Maps')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Before / After Satellite Comparison Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy uppercase tracking-wider">
                  Bi-Temporal Satellite Observation
                </span>
                <span className="text-[11px] text-slate-500">Sentinel-2 L2A</span>
              </div>
              <ImageSlider
                beforeImage={`${selectedAlert.before_image_url}?v=20261121_highres`}
                afterImage={`${selectedAlert.after_image_url}?v=20261121_highres`}
                beforeLabel={t('drawer.pass1', 'Pass T1 (Before)')}
                afterLabel={t('drawer.pass2', 'Pass T2 (After)')}
              />
              <div className="flex justify-between text-[11px] text-slate-500 px-1 font-mono">
                <span>T1: {new Date(selectedAlert.pass_t1).toLocaleDateString()}</span>
                <span>T2: {new Date(selectedAlert.pass_t2).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action Buttons: Confirm, False Alarm, Send Telegram */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-navy uppercase tracking-wider">
                {t('drawer.reviewHeading', 'Field Ground-Truthing Decision')}
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="forest"
                  size="md"
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => handleReview(selectedAlert.id, 'confirm')}
                  disabled={selectedAlert.status === 'confirmed'}
                >
                  {t('drawer.btnConfirm', 'Confirm Clearing')}
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  isLoading={isSubmitting}
                  leftIcon={<XCircle className="w-4 h-4 text-slate-500" />}
                  onClick={() => handleReview(selectedAlert.id, 'false_alarm')}
                  disabled={selectedAlert.status === 'false_alarm'}
                >
                  {t('drawer.btnFalseAlarm', 'Mark False Alarm')}
                </Button>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isSubmitting}
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={() => handleSendTelegram(selectedAlert.id)}
                >
                  {t('drawer.btnTelegram', 'Send to Telegram')}
                </Button>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                  {t('drawer.telegramDesc', 'Dispatches instant geocoded card with satellite coordinates to Western Ghats Field Rangers Telegram channel.')}
                </p>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Alerts;
