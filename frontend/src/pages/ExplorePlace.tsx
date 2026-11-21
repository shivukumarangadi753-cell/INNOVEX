import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Compass,
  Search,
  Calendar,
  Layers,
  MapPin,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Info,
  Sparkles,
  Cloud,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Skeleton } from '../components/Skeleton';
import { ImageSlider } from '../components/ImageSlider';
import { ReserveMap } from '../components/ReserveMap';
import { api } from '../lib/api';
import { PlaceSearchResult, ExploreImageryResponse } from '../lib/types';
import { useToast } from '../components/Toast';

export const ExplorePlace: React.FC = () => {
  const { t } = useTranslation('explore');
  const { info, error } = useToast();

  // Coordinates & Place state
  const [query, setQuery] = useState('Kudremukh Peak');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState('Kudremukh Peak, Chikkamagaluru, Karnataka');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 13.2215,
    lng: 75.2548,
  });

  // Controls state
  const [radiusKm, setRadiusKm] = useState<number>(2.0);
  const [beforeDate, setBeforeDate] = useState('2024-01-15');
  const [afterDate, setAfterDate] = useState('2024-06-15');

  // Imagery result state
  const [loading, setLoading] = useState(false);
  const [imageryData, setImageryData] = useState<ExploreImageryResponse | null>(null);

  // Search places debounced
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await api.searchPlaces(q);
        setSearchResults(results);
      } catch (err) {
        console.warn('Place search notice:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch Sentinel-2 bi-temporal imagery for specific coordinates
  const fetchImageryForLocation = useCallback(async (
    targetLat: number,
    targetLng: number,
    radius: number,
    before: string,
    after: string
  ) => {
    setLoading(true);
    try {
      const data = await api.getExploreImagery(
        targetLat,
        targetLng,
        radius,
        before,
        after
      );
      setImageryData(data);
    } catch (err: any) {
      error('Satellite Retrieval Notice', err?.message || 'Unable to retrieve imagery.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  // Handle place selection from search results
  const handleSelectPlace = (place: PlaceSearchResult) => {
    setSelectedPlaceName(place.name);
    setCoords({ lat: place.lat, lng: place.lng });
    setSearchResults([]);
    setQuery(place.name);
    fetchImageryForLocation(place.lat, place.lng, radiusKm, beforeDate, afterDate);
  };

  // Handle map click
  const handleMapClick = useCallback((newCoords: { lat: number; lng: number }) => {
    setCoords(newCoords);
    setSelectedPlaceName(`Selected Location (${newCoords.lat.toFixed(4)}° N, ${newCoords.lng.toFixed(4)}° E)`);
    setSearchResults([]);
    fetchImageryForLocation(newCoords.lat, newCoords.lng, radiusKm, beforeDate, afterDate);
  }, [radiusKm, beforeDate, afterDate, fetchImageryForLocation]);

  // Fetch imagery manually
  const handleFetchImagery = () => {
    fetchImageryForLocation(coords.lat, coords.lng, radiusKm, beforeDate, afterDate);
  };

  // Fetch initial imagery on load
  useEffect(() => {
    fetchImageryForLocation(coords.lat, coords.lng, radiusKm, beforeDate, afterDate);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-emerald-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
            <Compass className="w-5 h-5 text-[#16a34a]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('title', 'Explore a Place')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t('subtitle', 'Search any location in India or click the satellite map to inspect bi-temporal vegetation changes')}
            </p>
          </div>
        </div>

        {/* Demo / Live Tag */}
        <div className="self-start sm:self-auto flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-white dark:bg-emerald-950 dark:text-emerald-300 border border-slate-700">
            {imageryData?.data_mode === 'demo' ? 'DEMO DATA' : 'LIVE SATELLITE'}
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Search, Map & Observation Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4 bg-white dark:bg-navy-dark border border-slate-200/80 dark:border-emerald-950/60 rounded-2xl shadow-subtle space-y-4">
            {/* Search Input Box */}
            <div className="relative">
              <label htmlFor="place-search" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {t('searchButton', 'Search Place')}
              </label>
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  id="place-search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder', 'Search place name (e.g. Kudremukh, Tannirbhavi)...')}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-surface border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Autocomplete Dropdown List */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-navy-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPlace(result)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-between"
                    >
                      <span className="truncate pr-2 font-medium">{result.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {result.lat.toFixed(2)}, {result.lng.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Coordinates & Instructions */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-surface border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                  {selectedPlaceName}
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 shrink-0 ml-2">
                {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
              </span>
            </div>

            {/* Interactive Map (Click to set point) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{t('clickMapPrompt', 'Click anywhere on map to drop a pin')}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">MapLibre Interactive</span>
              </div>
              <ReserveMap
                className="h-[280px] w-full"
                onMapClick={handleMapClick}
                selectedPoint={coords}
                centerCoords={[coords.lng, coords.lat]}
                zoomLevel={12}
                showLayersControl={false}
              />
            </div>

            {/* Controls: Radius & Date Pickers */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Radius Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {t('radiusLabel', 'Analysis Radius')}
                </label>
                <div className="flex items-center gap-2">
                  {[1.0, 2.0, 5.0].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRadiusKm(r);
                        fetchImageryForLocation(coords.lat, coords.lng, r, beforeDate, afterDate);
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        radiusKm === r
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-navy-surface text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label htmlFor="before-date" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {t('beforeDate', 'Before Pass')}
                  </label>
                  <input
                    id="before-date"
                    type="date"
                    value={beforeDate}
                    onChange={(e) => setBeforeDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-navy-surface border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="after-date" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {t('afterDate', 'After Pass')}
                  </label>
                  <input
                    id="after-date"
                    type="date"
                    value={afterDate}
                    onChange={(e) => setAfterDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-navy-surface border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleFetchImagery}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? t('loadingText', 'Retrieving...') : t('inspectButton', 'Retrieve Satellite Imagery')}</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Bi-Temporal Satellite Results & Analysis (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {loading ? (
            <Card className="p-6 bg-white dark:bg-navy-dark border border-slate-200/80 dark:border-emerald-950/60 rounded-2xl shadow-subtle space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-72 w-full rounded-2xl" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            </Card>
          ) : imageryData?.status === 'ok' ? (
            <Card className="p-5 bg-white dark:bg-navy-dark border border-slate-200/80 dark:border-emerald-950/60 rounded-2xl shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-emerald-950/40 gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Bi-Temporal Satellite Comparison
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span className="truncate">{selectedPlaceName}</span> • Radius {radiusKm} km
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                    {imageryData.satellite}
                  </span>
                </div>
              </div>

              {/* Image Comparison Slider */}
              <div className="relative">
                <ImageSlider
                  beforeImage={imageryData.before_image_url || '/static/alerts/alert-001_before.png'}
                  afterImage={imageryData.after_image_url || '/static/alerts/alert-001_after.png'}
                  beforeLabel={`Before: ${imageryData.observation_dates?.before}, Sentinel-2, cloud ${imageryData.cloud_cover_pct?.before}%`}
                  afterLabel={`After: ${imageryData.observation_dates?.after}, Sentinel-2, cloud ${imageryData.cloud_cover_pct?.after}%`}
                  className="w-full"
                />
              </div>

              {/* Satellite Disclaimer Banner */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{t('disclaimer', 'Satellite images are not real time. This is the latest available clear observation for these dates.')}</span>
              </div>

              {/* Analytical Vegetation Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Vegetation Change */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-surface border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {t('vegetationChange', 'Vegetation Change')}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span
                      className={`text-xl font-black font-mono ${
                        (imageryData.vegetation_change_pct_points || 0) < 0
                          ? 'text-red-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {(imageryData.vegetation_change_pct_points || 0) > 0 ? '+' : ''}
                      {imageryData.vegetation_change_pct_points} pp
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Threshold: NDVI &gt; 0.40
                  </span>
                </div>

                {/* Mean NDVI Before vs After */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-surface border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {t('meanNdvi', 'Mean Canopy NDVI')}
                  </span>
                  <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {imageryData.ndvi_mean_before} → {imageryData.ndvi_mean_after}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Δ: {((imageryData.ndvi_mean_after || 0) - (imageryData.ndvi_mean_before || 0)).toFixed(2)}
                  </span>
                </div>

                {/* Cloud & Valid Pixels */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-surface border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {t('validPixels', 'Valid Pixel Coverage')}
                  </span>
                  <div className="font-mono text-sm font-bold text-emerald-600 mt-1">
                    {imageryData.valid_pixel_pct?.after}% valid
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Cloud: {imageryData.cloud_cover_pct?.after}%
                  </span>
                </div>
              </div>
            </Card>
          ) : imageryData?.status === 'no_clear_scene' ? (
            <Card className="p-6 bg-white dark:bg-navy-dark border border-amber-300 dark:border-amber-900 rounded-2xl shadow-subtle text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                <Cloud className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('noClearSceneTitle', 'No Clear Image Found for This Window')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {imageryData.message || t('noClearSceneDesc', 'No clear Sentinel-2 observation with ≤20% cloud cover exists in the requested date bracket.')}
              </p>
              {imageryData.searched_window && (
                <div className="text-[11px] font-mono bg-slate-50 dark:bg-navy-surface p-2 rounded-lg max-w-sm mx-auto text-slate-600 dark:text-slate-400">
                  Searched: {imageryData.searched_window.before_window} &amp; {imageryData.searched_window.after_window}
                </div>
              )}
            </Card>
          ) : imageryData?.status === 'data_unavailable' ? (
            <Card className="p-6 bg-white dark:bg-navy-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-subtle text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('dataUnavailableTitle', 'Satellite Service Offline')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {imageryData.message || t('dataUnavailableDesc', 'Copernicus satellite credentials are not configured or live service is unreachable.')}
              </p>
            </Card>
          ) : (
            <Card className="p-8 bg-white dark:bg-navy-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-subtle text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <Compass className="w-6 h-6 text-[#16a34a]" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('emptyStateTitle', 'Select a Place to Begin')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t('emptyStateDesc', 'Search a landmark or click any location on the map to inspect historical canopy and vegetation shifts.')}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorePlace;
