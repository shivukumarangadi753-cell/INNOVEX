import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import maplibregl from 'maplibre-gl';
import { Flame, ShieldAlert, AlertTriangle, Compass, Info, Radio, Layers } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Chip } from '../components/Chip';
import { Skeleton } from '../components/Skeleton';
import { api } from '../lib/api';
import { FireHotspot, BurnScarsResponse, WildlifeCorridorsResponse } from '../lib/types';
import i18n from '../lib/i18n';

// i18n Bundles for Fire & Wildlife
import enFire from '../locales/en/fire.json';
import hiFire from '../locales/hi/fire.json';
import knFire from '../locales/kn/fire.json';

i18n.addResourceBundle('en', 'fire', enFire, true, true);
i18n.addResourceBundle('hi', 'fire', hiFire, true, true);
i18n.addResourceBundle('kn', 'fire', knFire, true, true);

export const FireWildlife: React.FC = () => {
  const { t } = useTranslation('fire');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const [hotspots, setHotspots] = useState<FireHotspot[]>([]);
  const [burnScars, setBurnScars] = useState<any[]>([]);
  const [corridors, setCorridors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'hotspot' | 'burnScar' | 'corridor';
    data: any;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [hsData, bsData, corData] = await Promise.all([
          api.getFireHotspots(),
          api.getFireBurnScars(),
          api.getWildlifeCorridors(),
        ]);
        setHotspots(hsData || []);
        setBurnScars(bsData?.features || []);
        setCorridors(corData?.features || []);
      } catch (err) {
        console.error('Failed to load fire and wildlife data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapStyle: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap Contributors',
        },
      },
      layers: [
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    };

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [75.25, 13.23], // Kudremukh coordinates
      zoom: 11,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // Add Burn Scars Layer
      map.current.addSource('burn-scars-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: burnScars,
        },
      });

      map.current.addLayer({
        id: 'burn-scars-fill',
        type: 'fill',
        source: 'burn-scars-source',
        paint: {
          'fill-color': '#C8441B',
          'fill-opacity': 0.35,
        },
      });

      map.current.addLayer({
        id: 'burn-scars-outline',
        type: 'line',
        source: 'burn-scars-source',
        paint: {
          'line-color': '#C8441B',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });

      // Add Wildlife Corridors Layer
      map.current.addSource('corridors-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: corridors,
        },
      });

      map.current.addLayer({
        id: 'corridors-line',
        type: 'line',
        source: 'corridors-source',
        paint: {
          'line-color': [
            'match',
            ['get', 'risk'],
            'high',
            '#C8441B',
            'medium',
            '#B8860B',
            '#2E7D4F',
          ],
          'line-width': 4,
          'line-opacity': 0.85,
        },
      });

      // Markers for active hotspots
      hotspots.forEach((hs) => {
        const el = document.createElement('div');
        el.className =
          'relative flex items-center justify-center w-8 h-8 rounded-full bg-red-600/90 text-white shadow-lg cursor-pointer transform hover:scale-125 transition-transform duration-150 animate-pulse';
        el.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
          </svg>
        `;
        el.onclick = () => {
          setSelectedItem({ type: 'hotspot', data: hs });
        };

        if (map.current) {
          new maplibregl.Marker({ element: el })
            .setLngLat([hs.lng, hs.lat])
            .addTo(map.current);
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [loading, hotspots, burnScars, corridors]);

  const getRiskChipVariant = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high':
        return 'risk_high';
      case 'medium':
        return 'risk_medium';
      case 'low':
        return 'risk_low';
    }
  };

  const getRiskIcon = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high':
        return <ShieldAlert className="w-3.5 h-3.5 text-rust" />;
      case 'medium':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-dark" />;
      case 'low':
        return <Compass className="w-3.5 h-3.5 text-forest" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-navy">{t('title')}</h1>
            <Chip variant="demo" label={t('demoBadge')} />
          </div>
          <p className="text-sm text-slate-600 mt-1">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-subtle text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Radio className="w-3.5 h-3.5 text-forest animate-pulse" />
            <span>Kudremukh Reserve Forest</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">VIIRS + Sentinel-2 NBR</span>
        </div>
      </div>

      {/* Main Grid: Map & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View Container */}
        <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col min-h-[480px] rounded-2xl border border-slate-200/90 shadow-card">
          <div className="p-4 bg-gradient-to-r from-cream-50/70 to-white dark:from-navy-surface dark:to-navy-dark border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-navy dark:text-white">
              <span className="p-1 rounded-md bg-rust/15 text-rust border border-rust/30">
                <Flame className="w-4 h-4 text-rust" />
              </span>
              <span>Interactive Surveillance Map</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                Hotspots ({hotspots.length})
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                <span className="w-2.5 h-2 rounded bg-rust/40 border border-rust inline-block" />
                Burn Scars ({burnScars.length})
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                <span className="w-2.5 h-0.5 bg-forest inline-block" />
                Corridors ({corridors.length})
              </span>
            </div>
          </div>

          <div className="relative flex-1 w-full h-[450px]">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                <Skeleton className="h-full w-full" />
              </div>
            )}
            <div ref={mapContainer} className="w-full h-full" />
          </div>
        </Card>

        {/* Details & Field Advisory Panel */}
        <div className="space-y-6">
          {/* Plain Language "What This Means" Panel */}
          <Card className="border-l-4 border-l-forest bg-cream-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-forest mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-navy">{t('whatThisMeansTitle')}</h3>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                  {t('whatThisMeansText')}
                </p>
              </div>
            </div>
          </Card>

          {/* Wildlife Corridors List with Accessible Icons */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy">{t('corridorsTitle')}</h3>
              <span className="text-xs font-normal text-slate-500">
                {corridors.length} Monitored
              </span>
            </div>

            <div className="space-y-3">
              {corridors.map((cor) => {
                const props = cor.properties;
                return (
                  <div
                    key={cor.id || props.name}
                    onClick={() => setSelectedItem({ type: 'corridor', data: props })}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{props.name}</span>
                      <Chip
                        variant={getRiskChipVariant(props.risk)}
                        size="sm"
                        icon={getRiskIcon(props.risk)}
                        label={t(`risk.${props.risk}`)}
                      />
                    </div>
                    <p className="text-slate-600 leading-snug">{props.reason}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Selection Detail Card */}
          {selectedItem && (
            <Card className="border-2 border-teal-light/50 bg-white p-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-teal">
                  Selected {selectedItem.type}
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {selectedItem.type === 'hotspot' && (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('brightness')}:</span>
                    <span className="font-semibold">{selectedItem.data.brightness} K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('confidence')}:</span>
                    <span className="font-semibold text-forest">
                      {selectedItem.data.confidence}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('detectedAt')}:</span>
                    <span className="font-mono text-slate-700">
                      {selectedItem.data.acq_datetime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS:</span>
                    <span className="font-mono">
                      {selectedItem.data.lat.toFixed(4)}, {selectedItem.data.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              {selectedItem.type === 'corridor' && (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="font-semibold text-slate-800">{selectedItem.data.name}</div>
                  <p className="text-slate-600">{selectedItem.data.reason}</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FireWildlife;
