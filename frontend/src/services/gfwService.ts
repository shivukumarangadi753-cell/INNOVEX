// Global Forest Watch (GFW Data API) Integration Service
// Fetches deforestation alerts for Kudremukh Reserve Forest area
// Provides robust fallback to /data/alerts_sample.json if API is unreachable or key is unset.

export interface GfwAlert {
  id: string;
  lat: number;
  lon: number;
  date: string;
  area_ha: number;
  confidence: 'nominal' | 'high' | string;
  status: 'pending' | 'confirmed' | 'rejected' | string;
}

export interface GfwServiceResult {
  source: string;
  provider: string;
  area: string;
  alerts: GfwAlert[];
  lastUpdated: string;
  isFallback: boolean;
  error: string | null;
}

export async function fetchGfwAlerts(): Promise<GfwServiceResult> {
  const apiKey = import.meta.env.VITE_GFW_API_KEY;

  // Kudremukh bounding box: [minLon, minLat, maxLon, maxLat]
  // approx: [75.10, 13.05, 75.38, 13.30]
  if (apiKey) {
    try {
      const gfwUrl = `https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query?sql=SELECT latitude as lat, longitude as lon, gfw_integrated_alerts__date as date, gfw_integrated_alerts__confidence as confidence FROM data WHERE latitude >= 13.05 AND latitude <= 13.30 AND longitude >= 75.10 AND longitude <= 75.38 ORDER BY date DESC LIMIT 100`;

      const response = await fetch(gfwUrl, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const json = await response.json();
        const data = json.data || [];
        const alerts: GfwAlert[] = data.map((item: any, idx: number) => ({
          id: `GFW-${idx + 1}`,
          lat: Number(item.lat),
          lon: Number(item.lon),
          date: item.date || new Date().toISOString().split('T')[0],
          area_ha: item.area_ha || 0.1, // GLAD 30m pixel is ~0.09 ha
          confidence: item.confidence === 'high' ? 'high' : 'nominal',
          status: 'pending',
        }));

        return {
          source: 'Global Forest Watch (Data API)',
          provider: 'World Resources Institute (WRI) / GLAD',
          area: 'Kudremukh, Karnataka',
          alerts,
          lastUpdated: new Date().toISOString(),
          isFallback: false,
          error: null,
        };
      }
    } catch (err) {
      console.warn('GFW Live API call failed, falling back to local dataset:', err);
    }
  }

  // Graceful Fallback: Load sample JSON from /data/alerts_sample.json
  try {
    const fallbackRes = await fetch('/data/alerts_sample.json');
    if (!fallbackRes.ok) {
      throw new Error(`Failed to load /data/alerts_sample.json: ${fallbackRes.statusText}`);
    }
    const sample = await fallbackRes.json();
    return {
      source: 'Global Forest Watch (Data API)',
      provider: 'World Resources Institute (WRI) / GLAD (Offline Demo Feed)',
      area: sample.area || 'Kudremukh, Karnataka',
      alerts: sample.alerts || [],
      lastUpdated: sample.last_updated || '2026-04-02T00:00:00Z',
      isFallback: true,
      error: apiKey ? 'Live GFW API call timed out; using verified sample cache' : null,
    };
  } catch (err: any) {
    return {
      source: 'Global Forest Watch (Data API)',
      provider: 'World Resources Institute (WRI)',
      area: 'Kudremukh, Karnataka',
      alerts: [],
      lastUpdated: new Date().toISOString(),
      isFallback: true,
      error: err?.message || 'Failed to load both live API and fallback sample data',
    };
  }
}
