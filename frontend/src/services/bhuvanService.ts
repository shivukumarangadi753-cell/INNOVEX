// ISRO Bhuvan Geoportal WMS Service
// Provides Land Use / Land Cover (LULC) and Forest Boundary WMS layers for Kudremukh
// Probes WMS availability with timeout; if unreachable or CORS blocked, gracefully hides toggle without crashing.

export interface BhuvanLayerInfo {
  id: string;
  name: string;
  description: string;
  wmsUrl: string;
  wmsLayer: string;
  format: string;
}

export interface BhuvanServiceResult {
  source: string;
  provider: string;
  area: string;
  isAvailable: boolean;
  layers: BhuvanLayerInfo[];
  lastUpdated: string;
  isFallback: boolean;
  error: string | null;
}

export async function checkBhuvanWmsAvailability(): Promise<BhuvanServiceResult> {
  const wmsEndpoint =
    import.meta.env.VITE_BHUVAN_WMS_URL || 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms';

  let isOnline = false;
  let probeError: string | null = null;

  // Lightweight probe to test WMS connectivity
  // Browsers enforce CORS on external government WMS services without access-control headers
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s probe timeout

    const probeUrl = `${wmsEndpoint}?service=WMS&version=1.1.1&request=GetCapabilities`;
    const response = await fetch(probeUrl, {
      method: 'HEAD',
      mode: 'no-cors', // probe connectivity without throwing CORS exceptions
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    isOnline = true;
  } catch (err: any) {
    // If blocked or offline, hide the layer toggle gracefully
    isOnline = false;
    probeError =
      err?.name === 'AbortError'
        ? 'Bhuvan WMS server did not respond within timeout'
        : 'Bhuvan WMS endpoint unreachable or restricted by browser CORS';
  }

  // Load layer catalog from /data/bhuvan_sample.json
  try {
    const fallbackRes = await fetch('/data/bhuvan_sample.json');
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return {
        source: 'ISRO Bhuvan Geoportal (WMS)',
        provider: 'National Remote Sensing Centre (NRSC) / ISRO',
        area: data.area || 'Kudremukh, Karnataka',
        isAvailable: isOnline,
        layers: data.layers || [],
        lastUpdated: data.last_updated || '2026-11-01T00:00:00Z',
        isFallback: !isOnline,
        error: isOnline ? null : probeError,
      };
    }
  } catch (err) {
    console.warn('Failed to load /data/bhuvan_sample.json:', err);
  }

  // Default layer catalog fallback
  return {
    source: 'ISRO Bhuvan Geoportal (WMS)',
    provider: 'National Remote Sensing Centre (NRSC) / ISRO',
    area: 'Kudremukh, Karnataka',
    isAvailable: isOnline,
    layers: [
      {
        id: 'bhuvan_lulc_50k',
        name: 'Land Use / Land Cover (LULC) 1:50,000',
        description: 'Multi-temporal vegetation and land cover classification',
        wmsUrl: wmsEndpoint,
        wmsLayer: 'lulc:KA_LULC50K_1516',
        format: 'image/png',
      },
    ],
    lastUpdated: '2026-11-01T00:00:00Z',
    isFallback: true,
    error: probeError,
  };
}
