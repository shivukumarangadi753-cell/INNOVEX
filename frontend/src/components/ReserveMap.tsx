import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Alert, Reserve, RiskZoneFeature } from '../lib/types';
import { Layers, RotateCcw, Plus, Minus, Compass, AlertTriangle, ShieldAlert } from 'lucide-react';

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
    riskForecast?: boolean;
  };
  riskZones?: RiskZoneFeature[];
  selectedRiskZoneId?: string | null;
  onSelectRiskZone?: (zone: RiskZoneFeature) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  selectedPoint?: { lat: number; lng: number } | null;
  centerCoords?: [number, number];
  zoomLevel?: number;
  className?: string;
  interactive?: boolean;
}

export const ReserveMap: React.FC<ReserveMapProps> = ({
  reserve,
  alerts = [],
  selectedAlertId,
  onSelectAlert,
  showLayersControl = true,
  activeLayers = { ndvi: true, change: true, radar: false, riskForecast: false },
  riskZones = [],
  selectedRiskZoneId,
  onSelectRiskZone,
  onMapClick,
  selectedPoint,
  centerCoords,
  zoomLevel,
  className = '',
  interactive = true,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const selectedPointMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeBaseMap, setActiveBaseMap] = useState<'satellite' | 'street' | 'terrain'>('satellite');

  const baseTiles = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    street: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  };

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'base-tiles': {
              type: 'raster',
              tiles: [baseTiles.satellite],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap | ESRI Satellite | Copernicus Sentinel',
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
        },
        center: [75.255, 13.22], // Kudremukh Reserve, Karnataka
        zoom: 11,
        attributionControl: false,
        interactive: interactive,
      });

      map.on('load', () => {
        mapInstance.current = map;
        setMapLoaded(true);
      });

      // Handle map clicks if callback is provided
      map.on('click', (e) => {
        if (onMapClick) {
          onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        }
      });

      return () => {
        map.remove();
        mapInstance.current = null;
      };
    } catch (e) {
      console.warn('MapLibre WebGL initialization notice:', e);
    }
  }, [interactive]);

  // Switch Base Map Style (Satellite / Street / Terrain)
  const switchBaseMap = (type: 'satellite' | 'street' | 'terrain') => {
    setActiveBaseMap(type);
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    const source = map.getSource('base-tiles') as any;
    if (source && source.setTiles) {
      source.setTiles([baseTiles[type]]);
    } else {
      if (map.getLayer('base-tiles-layer')) {
        map.removeLayer('base-tiles-layer');
      }
      if (map.getSource('base-tiles')) {
        map.removeSource('base-tiles');
      }
      map.addSource('base-tiles', {
        type: 'raster',
        tiles: [baseTiles[type]],
        tileSize: 256,
      });
      map.addLayer(
        {
          id: 'base-tiles-layer',
          type: 'raster',
          source: 'base-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
        map.getLayer('reserve-fill') ? 'reserve-fill' : undefined
      );
    }
  };

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
            'fill-color': '#16a34a',
            'fill-opacity': 0.15,
          },
        });

        // Reserve Outline
        map.addLayer({
          id: 'reserve-line',
          type: 'line',
          source: 'reserve-boundary',
          paint: {
            'line-color': '#22c55e',
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
        ? '#16a34a'
        : isClearing
        ? '#dc2626'
        : isFire
        ? '#d97706'
        : '#0d9488';

      // Custom DOM Marker
      const el = document.createElement('div');
      el.className = `alert-marker cursor-pointer transition-transform duration-200 ${
        isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
      }`;
      el.innerHTML = `
        <div style="
          background-color: ${color};
          width: ${isSelected ? '26px' : '20px'};
          height: ${isSelected ? '26px' : '20px'};
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
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
              'fill-opacity': isSelected ? 0.5 : 0.3,
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

    // 3. Add Predictive AI Encroachment Hazard Zones (When riskForecast is enabled)
    if (activeLayers.riskForecast && riskZones.length > 0) {
      riskZones.forEach((zone) => {
        const isSelected = zone.properties.id === selectedRiskZoneId;
        const sourceId = `risk-zone-${zone.properties.id}`;
        const color = zone.properties.color || '#EF4444';

        // Add Polygon Source & Layers
        if (map.getSource(sourceId)) {
          (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(zone.geometry as any);
        } else {
          map.addSource(sourceId, {
            type: 'geojson',
            data: zone.geometry as any,
          });

          // Hazard Glowing Fill Layer
          map.addLayer({
            id: `${sourceId}-fill`,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': color,
              'fill-opacity': isSelected ? 0.45 : 0.28,
            },
          });

          // Hazard Pulsing Boundary Line
          map.addLayer({
            id: `${sourceId}-line`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': color,
              'line-width': isSelected ? 3.5 : 2.2,
              'line-dasharray': [4, 2],
            },
          });
        }

        // Add Glowing Centroid Label Badge Marker
        const centroid = zone.properties.centroid;
        if (centroid && centroid.lat && centroid.lng) {
          const el = document.createElement('div');
          el.className = `risk-badge cursor-pointer transition-all duration-300 ${
            isSelected ? 'scale-110 z-40' : 'hover:scale-105 z-30'
          }`;
          el.innerHTML = `
            <div style="
              background: rgba(15, 23, 42, 0.92);
              border: 1.5px solid ${color};
              box-shadow: 0 0 12px ${color}88, 0 4px 10px rgba(0,0,0,0.5);
              color: white;
              padding: 3px 8px;
              border-radius: 9999px;
              display: flex;
              align-items: center;
              gap: 5px;
              font-family: ui-monospace, SFMono-Regular, monospace;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.025em;
              white-space: nowrap;
            ">
              <span style="
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background-color: ${color};
                display: inline-block;
                box-shadow: 0 0 6px ${color};
              "></span>
              <span>${zone.properties.code}: ${zone.properties.probability_pct}%</span>
            </div>
          `;

          el.onclick = (e) => {
            e.stopPropagation();
            if (onSelectRiskZone) onSelectRiskZone(zone);
          };

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([centroid.lng, centroid.lat])
            .addTo(map);

          markersRef.current.push(marker);
        }
      });
    } else {
      // Cleanup risk zone layers if toggled off
      riskZones.forEach((zone) => {
        const sourceId = `risk-zone-${zone.properties.id}`;
        if (map.getLayer(`${sourceId}-line`)) map.removeLayer(`${sourceId}-line`);
        if (map.getLayer(`${sourceId}-fill`)) map.removeLayer(`${sourceId}-fill`);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      });
    }
  }, [reserve, alerts, selectedAlertId, riskZones, selectedRiskZoneId, mapLoaded, activeLayers, onSelectAlert, onSelectRiskZone]);

  // Update selected exploration point pin marker and camera center
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    if (selectedPointMarkerRef.current) {
      selectedPointMarkerRef.current.remove();
      selectedPointMarkerRef.current = null;
    }

    if (selectedPoint && selectedPoint.lat && selectedPoint.lng) {
      const el = document.createElement('div');
      el.className = 'selected-point-pin z-50';
      el.innerHTML = `
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 0 16px rgba(59, 130, 246, 0.9), 0 4px 10px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 14px;
        ">
          📍
        </div>
      `;

      selectedPointMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([selectedPoint.lng, selectedPoint.lat])
        .addTo(map);

      map.flyTo({
        center: [selectedPoint.lng, selectedPoint.lat],
        zoom: zoomLevel || 13,
        essential: true,
      });
    } else if (centerCoords) {
      map.flyTo({
        center: centerCoords,
        zoom: zoomLevel || 11,
        essential: true,
      });
    }
  }, [selectedPoint, centerCoords, zoomLevel, mapLoaded]);

  const resetView = () => {
    if (mapInstance.current) {
      mapInstance.current.flyTo({
        center: [75.255, 13.22],
        zoom: 11,
        essential: true,
      });
    }
  };

  const zoomIn = () => {
    if (mapInstance.current) mapInstance.current.zoomIn();
  };

  const zoomOut = () => {
    if (mapInstance.current) mapInstance.current.zoomOut();
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-emerald-950/60 shadow-subtle bg-slate-900 ${className}`}>
      {/* Map canvas container */}
      <div ref={mapContainer} className="w-full h-full min-h-[380px]" />

      {/* Overlaid Top-Left Controls: Kudremukh Center + Street / Satellite / Terrain (Exact Reference Match) */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={resetView}
          className="px-2.5 py-1.5 bg-white/90 dark:bg-navy-dark/90 hover:bg-white text-slate-800 dark:text-white rounded-xl shadow-sm border border-slate-200 dark:border-emerald-950/60 transition-colors text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
          title="Reset perspective"
        >
          <Compass className="w-3.5 h-3.5 text-[#16a34a]" />
          <span>Kudremukh Center</span>
        </button>

        <div className="flex items-center bg-white/90 dark:bg-navy-dark/90 backdrop-blur-md p-0.5 rounded-xl border border-slate-200 dark:border-emerald-950/60 shadow-sm text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchBaseMap('street')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeBaseMap === 'street'
                ? 'bg-[#16a34a] text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Street
          </button>
          <button
            type="button"
            onClick={() => switchBaseMap('satellite')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeBaseMap === 'satellite'
                ? 'bg-[#16a34a] text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => switchBaseMap('terrain')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeBaseMap === 'terrain'
                ? 'bg-[#16a34a] text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Terrain
          </button>
        </div>
      </div>

      {/* Overlaid Top-Right Zoom Controls (Exact Reference Match) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={zoomIn}
          className="w-8 h-8 bg-white/90 dark:bg-navy-dark/90 hover:bg-white text-slate-800 dark:text-white rounded-lg shadow-sm border border-slate-200 dark:border-emerald-950/60 flex items-center justify-center transition-colors backdrop-blur-md cursor-pointer"
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="w-8 h-8 bg-white/90 dark:bg-navy-dark/90 hover:bg-white text-slate-800 dark:text-white rounded-lg shadow-sm border border-slate-200 dark:border-emerald-950/60 flex items-center justify-center transition-colors backdrop-blur-md cursor-pointer"
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Overlaid Bottom-Left Map Legend (Exact Reference Match) */}
      <div className="absolute bottom-3 left-3 z-10 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl text-[11px] font-semibold text-white flex items-center gap-3 border border-white/10 shadow-lg pointer-events-none sm:pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block shadow-sm" />
          <span>Healthy Forest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] inline-block shadow-sm" />
          <span>Canopy Loss</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] inline-block shadow-sm" />
          <span>Moderate Change</span>
        </div>
      </div>

      {/* Scale indicator at bottom right */}
      <div className="absolute bottom-3 right-3 z-10 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-mono text-white/90 border border-white/10">
        5 km
      </div>
    </div>
  );
};
