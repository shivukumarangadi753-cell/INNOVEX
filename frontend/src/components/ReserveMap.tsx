import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Alert, Reserve } from '../lib/types';
import { Layers, Maximize2, RotateCcw, Map, Satellite, Mountain } from 'lucide-react';

export type BaseMapMode = 'street' | 'satellite' | 'terrain';

interface ReserveMapProps {
  reserve?: Reserve;
  alerts?: Alert[];
  selectedAlertId?: string | null;
  onSelectAlert?: (alert: Alert) => void;
  showLayersControl?: boolean;
  activeLayers?: {
    ndvi?: boolean;
    change?: boolean;
    radar?: boolean;
  };
  className?: string;
  interactive?: boolean;
}

export const ReserveMap: React.FC<ReserveMapProps> = ({
  reserve,
  alerts = [],
  selectedAlertId,
  onSelectAlert,
  showLayersControl = true,
  activeLayers = { ndvi: true, change: true, radar: false },
  className = '',
  interactive = true,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [baseMap, setBaseMap] = useState<BaseMapMode>('street');

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap contributors | Copernicus Sentinel Data',
            },
            satellite: {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256,
              attribution: 'Tiles &copy; Esri World Imagery',
            },
            terrain: {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256,
              attribution: 'Tiles &copy; Esri World Topo Map',
            },
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19,
              layout: {
                visibility: 'visible',
              },
            },
            {
              id: 'satellite-tiles',
              type: 'raster',
              source: 'satellite',
              minzoom: 0,
              maxzoom: 19,
              layout: {
                visibility: 'none',
              },
            },
            {
              id: 'terrain-tiles',
              type: 'raster',
              source: 'terrain',
              minzoom: 0,
              maxzoom: 19,
              layout: {
                visibility: 'none',
              },
            },
          ],
        },
        center: [75.255, 13.22], // Kudremukh Reserve, Karnataka
        zoom: 11,
        attributionControl: false,
        interactive: interactive,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

      map.on('load', () => {
        mapInstance.current = map;
        setMapLoaded(true);
      });

      map.on('error', () => {
        // Fallback gracefully
        setMapError(false);
      });

      return () => {
        map.remove();
        mapInstance.current = null;
      };
    } catch (e) {
      console.warn('MapLibre WebGL initialization notice:', e);
      setMapError(true);
    }
  }, [interactive]);

  // Handle Base Map Switch
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer('osm-tiles')) {
      map.setLayoutProperty('osm-tiles', 'visibility', baseMap === 'street' ? 'visible' : 'none');
    }
    if (map.getLayer('satellite-tiles')) {
      map.setLayoutProperty('satellite-tiles', 'visibility', baseMap === 'satellite' ? 'visible' : 'none');
    }
    if (map.getLayer('terrain-tiles')) {
      map.setLayoutProperty('terrain-tiles', 'visibility', baseMap === 'terrain' ? 'visible' : 'none');
    }
  }, [baseMap, mapLoaded]);

  // Add reserve boundary and alert polygons when map is loaded
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Add Reserve Boundary
    if (reserve && reserve.boundary) {
      if (map.getSource('reserve-boundary')) {
        (map.getSource('reserve-boundary') as maplibregl.GeoJSONSource).setData(
          reserve.boundary as any
        );
      } else {
        map.addSource('reserve-boundary', {
          type: 'geojson',
          data: reserve.boundary as any,
        });

        // Reserve Fill
        map.addLayer({
          id: 'reserve-fill',
          type: 'fill',
          source: 'reserve-boundary',
          paint: {
            'fill-color': '#2E7D4F',
            'fill-opacity': 0.12,
          },
        });

        // Reserve Outline
        map.addLayer({
          id: 'reserve-line',
          type: 'line',
          source: 'reserve-boundary',
          paint: {
            'line-color': '#2E7D4F',
            'line-width': 2.5,
            'line-dasharray': [4, 2],
          },
        });
      }
    }

    // 2. Add Alert Polygons and Centroid Markers
    alerts.forEach((alert) => {
      const isSelected = alert.id === selectedAlertId;
      const isClearing = alert.label === 'clearing';
      const isFire = alert.label === 'fire_scar';
      const isConfirmed = alert.status === 'confirmed';

      const color = isConfirmed
        ? '#2E7D4F' // Forest green
        : isClearing
        ? '#C8441B' // Rust alert
        : isFire
        ? '#B8860B' // Amber
        : '#1F6F8B'; // Water teal

      // Custom DOM Marker
      const el = document.createElement('div');
      el.className = `alert-marker cursor-pointer transition-transform duration-200 ${
        isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
      }`;
      el.innerHTML = `
        <div style="
          background-color: ${color};
          width: ${isSelected ? '28px' : '22px'};
          height: ${isSelected ? '28px' : '22px'};
          border-radius: 50%;
          border: 2.5px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 10px;
        ">
          ${isClearing ? '!' : isFire ? '🔥' : '✓'}
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onSelectAlert) onSelectAlert(alert);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([alert.centroid.lng, alert.centroid.lat])
        .addTo(map);

      markersRef.current.push(marker);

      // Add Alert Polygon Layer
      const polySourceId = `alert-poly-${alert.id}`;
      if (alert.polygon && activeLayers.change) {
        if (!map.getSource(polySourceId)) {
          map.addSource(polySourceId, {
            type: 'geojson',
            data: alert.polygon as any,
          });

          map.addLayer({
            id: `${polySourceId}-fill`,
            type: 'fill',
            source: polySourceId,
            paint: {
              'fill-color': color,
              'fill-opacity': isSelected ? 0.45 : 0.25,
            },
          });

          map.addLayer({
            id: `${polySourceId}-line`,
            type: 'line',
            source: polySourceId,
            paint: {
              'line-color': color,
              'line-width': isSelected ? 3 : 1.8,
            },
          });
        }
      }
    });
  }, [reserve, alerts, selectedAlertId, mapLoaded, activeLayers, onSelectAlert]);

  const resetView = () => {
    if (mapInstance.current) {
      mapInstance.current.flyTo({
        center: [75.255, 13.22],
        zoom: 11,
        essential: true,
      });
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200/80 shadow-subtle bg-cream-50 ${className}`}>
      {/* Map canvas container */}
      <div ref={mapContainer} className="w-full h-full min-h-[380px]" />

      {/* Map Overlay Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={resetView}
          className="p-2 bg-white/95 dark:bg-navy-dark/95 hover:bg-white text-navy dark:text-cream rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-700 transition-colors text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm"
          title="Reset map perspective to Kudremukh Center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Kudremukh Center</span>
        </button>

        {/* Base Map Switcher: Street, Satellite, Terrain */}
        <div className="flex items-center bg-white/95 dark:bg-navy-dark/95 backdrop-blur-sm p-1 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setBaseMap('street')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
              baseMap === 'street'
                ? 'bg-navy text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Default Street View (OpenStreetMap)"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Street</span>
          </button>
          <button
            type="button"
            onClick={() => setBaseMap('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
              baseMap === 'satellite'
                ? 'bg-forest text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="High-resolution Satellite Imagery (ESRI World Imagery)"
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
          <button
            type="button"
            onClick={() => setBaseMap('terrain')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
              baseMap === 'terrain'
                ? 'bg-teal text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Topographical Elevation / Terrain View (ESRI World Topo)"
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Terrain</span>
          </button>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-md border border-slate-200 text-xs space-y-1.5 pointer-events-none sm:pointer-events-auto">
        <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-navy" />
          <span>Map Legend</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-3 h-0.5 bg-forest border border-dashed border-forest inline-block" />
          <span>Kudremukh Reserve Boundary</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-rust inline-block" />
          <span>Open Clearing Alert (2.4 ha)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-amber inline-block" />
          <span>Active Fire Anomaly (5.1 ha)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-forest inline-block" />
          <span>Confirmed Patrol Verified</span>
        </div>
      </div>
    </div>
  );
};
