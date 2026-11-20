import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import maplibregl from 'maplibre-gl';
import {
  Flame,
  ShieldAlert,
  AlertTriangle,
  Compass,
  Info,
  Radio,
  Sprout,
  Plus,
  Minus,
  Sparkles,
  TreePine,
  ShieldCheck,
  Footprints,
} from 'lucide-react';

import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Skeleton } from '../components/Skeleton';
import { KpiCard } from '../components/KpiCard';
import { api } from '../lib/api';
import { FireHotspot } from '../lib/types';
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
  const [activeBaseMap, setActiveBaseMap] = useState<'satellite' | 'street' | 'terrain'>('satellite');
  const [selectedItem, setSelectedItem] = useState<{
    type: 'hotspot' | 'burnScar' | 'corridor';
    data: any;
  } | null>(null);

  const baseTiles = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    street: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  };

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

  // Initialize MapLibre GL with Satellite Default
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapStyle: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'base-tiles': {
          type: 'raster',
          tiles: [baseTiles.satellite],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap | ESRI World Imagery | VIIRS NOAA',
        },
      },
      layers: [
        {
          id: 'base-tiles-layer',
          type: 'raster',
          source: 'base-tiles',
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
      attributionControl: false,
    });

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
          'fill-color': '#d97706',
          'fill-opacity': 0.4,
        },
      });

      map.current.addLayer({
        id: 'burn-scars-outline',
        type: 'line',
        source: 'burn-scars-source',
        paint: {
          'line-color': '#f59e0b',
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
            '#dc2626',
            'medium',
            '#d97706',
            '#16a34a',
          ],
          'line-width': 4,
          'line-opacity': 0.85,
        },
      });

      // Markers for active hotspots with radiant glowing pulse (Exact Reference Match)
      hotspots.forEach((hs) => {
        const el = document.createElement('div');
        el.className = 'relative flex items-center justify-center cursor-pointer';
        el.innerHTML = `
          <div class="absolute w-12 h-12 rounded-full bg-red-600/30 animate-ping"></div>
          <div class="absolute w-8 h-8 rounded-full bg-orange-500/50"></div>
          <div class="relative w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border border-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
            </svg>
          </div>
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

  const switchBaseMap = (type: 'satellite' | 'street' | 'terrain') => {
    setActiveBaseMap(type);
    const m = map.current;
    if (!m) return;
    const source = m.getSource('base-tiles') as any;
    if (source && source.setTiles) {
      source.setTiles([baseTiles[type]]);
    }
  };

  const resetView = () => {
    if (map.current) {
      map.current.flyTo({ center: [75.25, 13.23], zoom: 11, essential: true });
    }
  };

  const zoomIn = () => {
    if (map.current) map.current.zoomIn();
  };

  const zoomOut = () => {
    if (map.current) map.current.zoomOut();
  };

  // Corridor Photos (High-Resolution Curated Unsplash Assets with Offline Fallback)
  const corridorPhotos: { [key: string]: string } = {
    'Kudremukh - Someshwara Elephant Corridor':
      'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=200&auto=format&fit=crop&q=80',
    'Bhadra Catchment Tiger Dispersal Path':
      'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=200&auto=format&fit=crop&q=80',
    'Agumbe Rain Forest Buffer Link':
      'https://images.unsplash.com/photo-1511497584788-87676104235f?w=200&auto=format&fit=crop&q=80',
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Exact Reference Match) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
            <Sprout className="w-5 h-5 text-[#16a34a]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('title', 'Fire & Wildlife Watch')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t('subtitle', 'Satellite VIIRS thermal hotspots, burn scars, and wildlife corridor fragmentation in Kudremukh')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-navy-dark border border-slate-200/80 dark:border-emerald-950/60 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-subtle">
            <Sparkles className="w-3.5 h-3.5 text-[#16a34a]" />
            <span>Demo Data</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Row with Sparklines (Exact Reference Match) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Hotspots */}
        <KpiCard
          title="Active Hotspots"
          value={hotspots.length > 0 ? hotspots.length : 2}
          accentColor="rust"
          icon={<Flame className="w-5 h-5 text-red-500" />}
        />

        {/* Card 2: Forest Health */}
        <KpiCard
          title="Forest Health"
          value="78%"
          accentColor="forest"
          icon={<TreePine className="w-5 h-5 text-emerald-600" />}
        />

        {/* Card 3: Wildlife Corridors */}
        <KpiCard
          title="Wildlife Corridors"
          value="12"
          accentColor="purple"
          icon={<Footprints className="w-5 h-5 text-purple-600" />}
        />

        {/* Card 4: Coverage Area */}
        <KpiCard
          title="Coverage Area"
          value="92%"
          accentColor="blue"
          icon={<ShieldCheck className="w-5 h-5 text-sky-600" />}
        />
      </div>

      {/* Main 3-Column Content Layout (Exact Reference Match) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Col 1: Satellite Surveillance Map (6 cols) */}
        <Card className="lg:col-span-6 p-0 overflow-hidden relative min-h-[460px] flex flex-col rounded-2xl border border-slate-200/80 dark:border-emerald-950/60 shadow-subtle">
          {/* Overlaid Top-Left Map Controls: Satellite | Street | Terrain (Exact Reference Match) */}
          <div className="absolute top-3 left-3 z-10 flex items-center bg-white/95 dark:bg-navy-dark/95 backdrop-blur-md p-0.5 rounded-xl border border-slate-200/80 dark:border-emerald-950/60 shadow-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => switchBaseMap('satellite')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeBaseMap === 'satellite'
                  ? 'bg-[#16a34a] text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => switchBaseMap('street')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeBaseMap === 'street'
                  ? 'bg-[#16a34a] text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900'
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => switchBaseMap('terrain')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeBaseMap === 'terrain'
                  ? 'bg-[#16a34a] text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900'
              }`}
            >
              Terrain
            </button>
          </div>

          {/* Overlaid Top-Right Controls: Zoom & Target (Exact Reference Match) */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
            <button
              type="button"
              onClick={zoomIn}
              className="w-8 h-8 bg-white/95 dark:bg-navy-dark/95 hover:bg-white text-slate-800 dark:text-white rounded-lg shadow-sm border border-slate-200/80 dark:border-emerald-950/60 flex items-center justify-center transition-colors backdrop-blur-md cursor-pointer"
              aria-label="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={zoomOut}
              className="w-8 h-8 bg-white/95 dark:bg-navy-dark/95 hover:bg-white text-slate-800 dark:text-white rounded-lg shadow-sm border border-slate-200/80 dark:border-emerald-950/60 flex items-center justify-center transition-colors backdrop-blur-md cursor-pointer"
              aria-label="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={resetView}
              className="w-8 h-8 bg-white/95 dark:bg-navy-dark/95 hover:bg-white text-slate-800 dark:text-white rounded-lg shadow-sm border border-slate-200/80 dark:border-emerald-950/60 flex items-center justify-center transition-colors backdrop-blur-md cursor-pointer"
              title="Reset center"
            >
              <Compass className="w-4 h-4 text-[#16a34a]" />
            </button>
          </div>

          {/* Overlaid Bottom-Left Legend (Exact Reference Match) */}
          <div className="absolute bottom-3 left-3 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white flex items-center gap-3 border border-white/10 shadow-lg pointer-events-none sm:pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span>Hotspot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Burn Scar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block" />
              <span>Corridor</span>
            </div>
          </div>

          {/* Map canvas */}
          <div className="relative flex-1 w-full h-full min-h-[460px]">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-navy-dark/70">
                <Skeleton className="h-full w-full" />
              </div>
            )}
            <div ref={mapContainer} className="w-full h-full min-h-[460px]" />
          </div>
        </Card>

        {/* Col 2: What This Means? Card with Pine Tree Graphic (3 cols) */}
        <Card className="lg:col-span-3 p-5 relative overflow-hidden bg-white dark:bg-navy-dark border border-slate-200/70 dark:border-emerald-950/60 rounded-2xl shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/50">
                💡
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                What This Means?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Thermal hotspots denote high-temperature surface anomalies detected by VIIRS sensors. High-risk wildfire corridors overlap with active thermal detections or steep terrain edges, demanding immediate patrol deployment before tree canopy degradation turns irreversible.
            </p>
          </div>

          {/* Pine Trees Silhouette Accent in Bottom-Right Corner (Exact Reference Match) */}
          <div className="w-full flex justify-end items-end pt-6 pointer-events-none opacity-85">
            <svg className="w-32 h-14 text-emerald-600" viewBox="0 0 120 50" fill="currentColor">
              <path d="M 10 50 L 22 25 L 34 50 Z" fill="#22c55e" opacity="0.6" />
              <path d="M 28 50 L 42 18 L 56 50 Z" fill="#16a34a" />
              <path d="M 50 50 L 62 28 L 74 50 Z" fill="#22c55e" opacity="0.7" />
              <path d="M 68 50 L 80 15 L 92 50 Z" fill="#15803d" />
              <path d="M 86 50 L 98 25 L 110 50 Z" fill="#16a34a" opacity="0.8" />
              <rect x="0" y="46" width="120" height="4" fill="#16a34a" />
            </svg>
          </div>
        </Card>

        {/* Col 3: Key Wildlife Corridors Card (3 cols) */}
        <Card className="lg:col-span-3 p-5 bg-white dark:bg-navy-dark border border-slate-200/70 dark:border-emerald-950/60 rounded-2xl shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-emerald-950/40">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Key Wildlife Corridors
              </h3>
              <span className="text-[11px] font-medium text-slate-400">
                3 Monitored
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {corridors.map((cor) => {
                const props = cor.properties;
                const photoUrl =
                  corridorPhotos[props.name] ||
                  'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=200&auto=format&fit=crop&q=80';

                const riskBadges = {
                  high: 'bg-red-50 text-red-600 border border-red-200/80 shadow-sm',
                  medium: 'bg-amber-50 text-amber-700 border border-amber-200/80',
                  low: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
                };

                const riskLabels = {
                  high: 'High Risk',
                  medium: 'Medium Risk',
                  low: 'Low Risk',
                };

                return (
                  <div
                    key={cor.id || props.name}
                    onClick={() => setSelectedItem({ type: 'corridor', data: props })}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-slate-50/70 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center gap-3"
                  >
                    {/* Thumbnail Image */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200/70 dark:border-emerald-950/60 shadow-subtle bg-slate-100">
                      <img
                        src={photoUrl}
                        alt={props.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Clean SVG fallback if image cannot load
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Details & Risk Pill */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-800 dark:text-white text-xs truncate">
                          {props.name.split('-')[0].trim()}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            riskBadges[props.risk as 'high' | 'medium' | 'low'] || riskBadges.low
                          }`}
                        >
                          {riskLabels[props.risk as 'high' | 'medium' | 'low'] || 'Low Risk'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {props.reason}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selection Detail Drawer / Card */}
          {selectedItem && (
            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-navy-surface border border-slate-200 dark:border-emerald-950/60 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                <span className="font-bold text-[#16a34a] uppercase tracking-wide text-[10px]">
                  Selected {selectedItem.type}
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 text-slate-700 dark:text-slate-200 text-xs leading-snug">
                {selectedItem.data.name || selectedItem.data.reason || `Hotspot (${selectedItem.data.lat?.toFixed(3)}, ${selectedItem.data.lng?.toFixed(3)})`}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default FireWildlife;
