import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import maplibregl from 'maplibre-gl';
import { Flame, ShieldAlert, AlertTriangle, Info, Compass, Radio } from 'lucide-react';

import { Card, Chip, Skeleton } from '../features/stubs/components';
import {
  fetchHotspots,
  fetchBurnScars,
  fetchWildlifeCorridors,
  Hotspot,
  BurnScarFeature,
  WildlifeCorridorFeature,
} from '../features/api/client';

export const FireWildlife: React.FC = () => {
  const { t } = useTranslation('fire');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [burnScars, setBurnScars] = useState<BurnScarFeature[]>([]);
  const [corridors, setCorridors] = useState<WildlifeCorridorFeature[]>([]);
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
          fetchHotspots(),
          fetchBurnScars(),
          fetchWildlifeCorridors(),
        ]);
        setHotspots(hsData);
        setBurnScars(bsData.features as any);
        setCorridors(corData.features as any);
      } catch (err) {
        console.error('Failed to load fire & wildlife data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // OpenStreetMap raster style as reliable free / open-source base
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
          features: burnScars as any,
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
          features: corridors as any,
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

      // Add HTML markers for active hotspots
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

  const getRiskIcon = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high':
        return <ShieldAlert className="w-4 h-4 text-alertRust" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-amber" />;
      case 'low':
        return <Compass className="w-4 h-4 text-forest" />;
    }
  };

  const getRiskChipVariant = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-navy">{t('title')}</h1>
            <Chip variant="demo">{t('demoBadge')}</Chip>
          </div>
          <p className="text-sm text-slate-600 mt-1">{t('subtitle')}</p>
        </div>

        {/* Live / Status indicators */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Radio className="w-3.5 h-3.5 text-forest animate-pulse" />
            <span>Kudremukh Forest Reserve</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">VIIRS + Sentinel-2 NBR</span>
        </div>
      </div>

      {/* Main Grid: Map & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View Container */}
        <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col min-h-[480px]">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Flame className="w-4 h-4 text-alertRust" />
              <span>Interactive Surveillance Map</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
                Hotspots ({hotspots.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded bg-alertRust/40 border border-alertRust inline-block" />
                Burn Scars ({burnScars.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-forest inline-block" />
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
          <Card className="border-l-4 border-l-forest bg-[#F7F3EA]/60">
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

          {/* Wildlife Corridors List with Icons */}
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-navy flex items-center justify-between">
              <span>{t('corridorsTitle')}</span>
              <span className="text-xs font-normal text-slate-500">
                {corridors.length} Monitored
              </span>
            </h3>

            <div className="space-y-3">
              {corridors.map((cor) => {
                const props = cor.properties;
                return (
                  <div
                    key={cor.id}
                    onClick={() => setSelectedItem({ type: 'corridor', data: props })}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{props.name}</span>
                      <Chip
                        variant={getRiskChipVariant(props.risk)}
                        size="sm"
                        icon={getRiskIcon(props.risk)}
                      >
                        {t(`risk.${props.risk}`)}
                      </Chip>
                    </div>
                    <p className="text-slate-600 leading-snug">{props.reason}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Selection Detail Card */}
          {selectedItem && (
            <Card className="border-2 border-water/40 bg-white">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-water">
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
