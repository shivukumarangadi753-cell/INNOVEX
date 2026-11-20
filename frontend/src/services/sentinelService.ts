// Copernicus Sentinel-2 MSI Satellite Imagery Service
// Provides before / after satellite observations for Kudremukh Reserve Forest
// Reads saved satellite imagery from /data/kudremukh_sentinel2_before.png and _after.png

export interface SentinelPassInfo {
  date: string;
  cloudCoveragePct: number;
  imageUrl: string;
  bands: string[];
}

export interface SentinelComparisonData {
  source: string;
  provider: string;
  area: string;
  tile: string;
  orbit: string;
  beforePass: SentinelPassInfo;
  afterPass: SentinelPassInfo;
  resolutionMeters: number;
  lastUpdated: string;
  isFallback: boolean;
  error: string | null;
}

export async function fetchSentinelComparison(): Promise<SentinelComparisonData> {
  const clientId = import.meta.env.VITE_COPERNICUS_CLIENT_ID;

  // Try fetching metadata from /data/sentinel_sample.json
  try {
    const res = await fetch('/data/sentinel_sample.json');
    if (res.ok) {
      const data = await res.json();
      return {
        source: 'Copernicus Sentinel-2 (MSI)',
        provider: 'European Space Agency (ESA) / Copernicus Data Space',
        area: data.area || 'Kudremukh National Park, Karnataka',
        tile: data.tile || '43PGK',
        orbit: data.orbit || 'R034',
        beforePass: {
          date: data.baseline_pass?.date || '2026-10-15',
          cloudCoveragePct: data.baseline_pass?.cloud_coverage_pct ?? 1.2,
          imageUrl: data.baseline_pass?.image_url || '/data/kudremukh_sentinel2_before.png',
          bands: data.baseline_pass?.bands || ['B02', 'B03', 'B04', 'B08', 'SCL'],
        },
        afterPass: {
          date: data.monitoring_pass?.date || '2026-11-15',
          cloudCoveragePct: data.monitoring_pass?.cloud_coverage_pct ?? 2.4,
          imageUrl: data.monitoring_pass?.image_url || '/data/kudremukh_sentinel2_after.png',
          bands: data.monitoring_pass?.bands || ['B02', 'B03', 'B04', 'B08', 'SCL'],
        },
        resolutionMeters: data.resolution_meters || 10,
        lastUpdated: data.last_updated || '2026-11-15T05:30:00Z',
        isFallback: !clientId,
        error: null,
      };
    }
  } catch (err) {
    console.warn('Failed to load /data/sentinel_sample.json, using static defaults:', err);
  }

  // Guaranteed fallback default if file is missing
  return {
    source: 'Copernicus Sentinel-2 (MSI)',
    provider: 'European Space Agency (ESA) / Copernicus Data Space',
    area: 'Kudremukh National Park, Karnataka',
    tile: '43PGK',
    orbit: 'R034',
    beforePass: {
      date: '2026-10-15',
      cloudCoveragePct: 1.2,
      imageUrl: '/data/kudremukh_sentinel2_before.png',
      bands: ['B02_Blue', 'B03_Green', 'B04_Red', 'B08_NIR'],
    },
    afterPass: {
      date: '2026-11-15',
      cloudCoveragePct: 2.4,
      imageUrl: '/data/kudremukh_sentinel2_after.png',
      bands: ['B02_Blue', 'B03_Green', 'B04_Red', 'B08_NIR'],
    },
    resolutionMeters: 10,
    lastUpdated: '2026-11-15T05:30:00Z',
    isFallback: true,
    error: null,
  };
}
