import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REQUIRED_SECRETS = [
  'OPENWEATHER_API_KEY',
] as const;

interface ZoneWeatherData {
  rainfall: number;
  humidity: number;
  temperature: number;
  condition: string;
  description: string;
  windSpeed: number;
  clouds: number;
}

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    type: string;
    alert: string | null;
    tsunami: number;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface EONETCategory {
  title: string;
}

interface EONETGeometry {
  date?: string;
  coordinates?: [number, number];
}

interface EONETSource {
  url?: string;
}

interface EONETEvent {
  id: string;
  title: string;
  description?: string;
  geometry?: EONETGeometry[];
  sources?: EONETSource[];
  categories?: EONETCategory[];
}

// Karnataka landslide-prone districts with terrain data
// Based on Karnataka State Disaster Management Authority & Geological Survey of India classifications
const karnatakaLandslideZones = [
  // Western Ghats - Very High Risk
  { district: 'Kodagu (Coorg)', lat: 12.4218, lng: 75.7390, terrainRisk: 'very_high', elevation: 1150, slope: 35, soilType: 'Laterite', annualRainfall: 3500, historicalEvents: 42, zone: 'Western Ghats' },
  { district: 'Chikkamagaluru', lat: 13.3161, lng: 75.7720, terrainRisk: 'very_high', elevation: 1018, slope: 32, soilType: 'Laterite', annualRainfall: 3200, historicalEvents: 35, zone: 'Western Ghats' },
  { district: 'Dakshina Kannada', lat: 12.8438, lng: 75.2479, terrainRisk: 'very_high', elevation: 450, slope: 28, soilType: 'Laterite-Clay', annualRainfall: 3800, historicalEvents: 38, zone: 'Coastal' },
  { district: 'Uttara Kannada', lat: 14.5186, lng: 74.9318, terrainRisk: 'very_high', elevation: 580, slope: 30, soilType: 'Laterite', annualRainfall: 3600, historicalEvents: 40, zone: 'Western Ghats' },
  { district: 'Shimoga', lat: 13.9299, lng: 75.5681, terrainRisk: 'high', elevation: 640, slope: 25, soilType: 'Red-Laterite', annualRainfall: 2800, historicalEvents: 22, zone: 'Western Ghats' },
  { district: 'Hassan', lat: 13.0068, lng: 76.1004, terrainRisk: 'high', elevation: 980, slope: 22, soilType: 'Red Soil', annualRainfall: 1800, historicalEvents: 18, zone: 'Western Ghats' },
  // Malnad Region - High Risk
  { district: 'Udupi', lat: 13.3409, lng: 74.7421, terrainRisk: 'high', elevation: 350, slope: 20, soilType: 'Laterite-Sandy', annualRainfall: 4000, historicalEvents: 25, zone: 'Coastal' },
  { district: 'Belgaum (Belagavi)', lat: 15.8497, lng: 74.4977, terrainRisk: 'moderate', elevation: 784, slope: 18, soilType: 'Black-Red', annualRainfall: 1200, historicalEvents: 12, zone: 'Northern' },
  // Moderate risk
  { district: 'Mysuru', lat: 12.2958, lng: 76.6394, terrainRisk: 'moderate', elevation: 770, slope: 12, soilType: 'Red Soil', annualRainfall: 800, historicalEvents: 8, zone: 'Southern Plateau' },
  { district: 'Chamarajanagar', lat: 11.9236, lng: 76.9426, terrainRisk: 'moderate', elevation: 680, slope: 15, soilType: 'Red-Laterite', annualRainfall: 750, historicalEvents: 6, zone: 'Southern Plateau' },
  { district: 'Dharwad', lat: 15.4589, lng: 75.0078, terrainRisk: 'moderate', elevation: 720, slope: 10, soilType: 'Black Soil', annualRainfall: 900, historicalEvents: 5, zone: 'Northern' },
  { district: 'Haveri', lat: 14.7951, lng: 75.4055, terrainRisk: 'moderate', elevation: 560, slope: 12, soilType: 'Red-Black', annualRainfall: 700, historicalEvents: 4, zone: 'Northern' },
  // Low risk - plateau regions
  { district: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946, terrainRisk: 'low', elevation: 920, slope: 5, soilType: 'Red Soil', annualRainfall: 970, historicalEvents: 2, zone: 'Eastern Plateau' },
  { district: 'Bengaluru Rural', lat: 13.1315, lng: 77.3964, terrainRisk: 'low', elevation: 890, slope: 6, soilType: 'Red Soil', annualRainfall: 880, historicalEvents: 1, zone: 'Eastern Plateau' },
  { district: 'Tumkur', lat: 13.3379, lng: 77.1001, terrainRisk: 'low', elevation: 822, slope: 8, soilType: 'Red-Sandy', annualRainfall: 600, historicalEvents: 3, zone: 'Eastern Plateau' },
  { district: 'Mandya', lat: 12.5244, lng: 76.8958, terrainRisk: 'low', elevation: 680, slope: 5, soilType: 'Red-Black', annualRainfall: 700, historicalEvents: 1, zone: 'Southern Plateau' },
  { district: 'Ramanagara', lat: 12.7257, lng: 77.2809, terrainRisk: 'low', elevation: 740, slope: 10, soilType: 'Red Soil', annualRainfall: 780, historicalEvents: 2, zone: 'Eastern Plateau' },
  { district: 'Kolar', lat: 13.1362, lng: 78.1290, terrainRisk: 'low', elevation: 900, slope: 6, soilType: 'Red Sandy', annualRainfall: 750, historicalEvents: 1, zone: 'Eastern Plateau' },
  { district: 'Chitradurga', lat: 14.2226, lng: 76.3987, terrainRisk: 'low', elevation: 732, slope: 8, soilType: 'Red-Black', annualRainfall: 560, historicalEvents: 2, zone: 'Central' },
  { district: 'Davanagere', lat: 14.4644, lng: 75.9218, terrainRisk: 'low', elevation: 596, slope: 6, soilType: 'Black Soil', annualRainfall: 640, historicalEvents: 1, zone: 'Central' },
  { district: 'Bellary (Ballari)', lat: 15.1394, lng: 76.9214, terrainRisk: 'low', elevation: 450, slope: 4, soilType: 'Black Soil', annualRainfall: 550, historicalEvents: 0, zone: 'Northern' },
  { district: 'Raichur', lat: 16.2120, lng: 77.3439, terrainRisk: 'low', elevation: 407, slope: 3, soilType: 'Black Soil', annualRainfall: 620, historicalEvents: 0, zone: 'Northern' },
  { district: 'Gulbarga (Kalaburagi)', lat: 17.3297, lng: 76.8343, terrainRisk: 'low', elevation: 454, slope: 3, soilType: 'Black Soil', annualRainfall: 750, historicalEvents: 0, zone: 'Northern' },
  { district: 'Bidar', lat: 17.9104, lng: 77.5199, terrainRisk: 'low', elevation: 660, slope: 5, soilType: 'Black Soil', annualRainfall: 870, historicalEvents: 0, zone: 'Northern' },
  { district: 'Gadag', lat: 15.4166, lng: 75.6305, terrainRisk: 'low', elevation: 650, slope: 4, soilType: 'Black Soil', annualRainfall: 580, historicalEvents: 0, zone: 'Northern' },
  { district: 'Koppal', lat: 15.3547, lng: 76.1549, terrainRisk: 'low', elevation: 500, slope: 4, soilType: 'Black-Red', annualRainfall: 560, historicalEvents: 0, zone: 'Northern' },
  { district: 'Yadgir', lat: 16.7604, lng: 77.1353, terrainRisk: 'low', elevation: 400, slope: 3, soilType: 'Black Soil', annualRainfall: 670, historicalEvents: 0, zone: 'Northern' },
  { district: 'Bagalkot', lat: 16.1691, lng: 75.6966, terrainRisk: 'low', elevation: 542, slope: 5, soilType: 'Black Soil', annualRainfall: 550, historicalEvents: 1, zone: 'Northern' },
  { district: 'Bijapur (Vijayapura)', lat: 16.8302, lng: 75.7100, terrainRisk: 'low', elevation: 594, slope: 3, soilType: 'Black Soil', annualRainfall: 580, historicalEvents: 0, zone: 'Northern' },
  { district: 'Chikballapur', lat: 13.4355, lng: 77.7315, terrainRisk: 'low', elevation: 910, slope: 7, soilType: 'Red Sandy', annualRainfall: 700, historicalEvents: 1, zone: 'Eastern Plateau' },
];

// Fetch real-time weather for each high-risk zone
async function fetchWeatherForZones(apiKey: string, zones: typeof karnatakaLandslideZones) {
  const weatherData = new Map<string, ZoneWeatherData>();
  
  // Fetch weather for high/very-high risk zones + sample of others
  const priorityZones = zones.filter(z => z.terrainRisk === 'very_high' || z.terrainRisk === 'high');
  const sampleOthers = zones.filter(z => z.terrainRisk === 'moderate').slice(0, 4);
  const zonesToFetch = [...priorityZones, ...sampleOthers];
  
  const fetches = zonesToFetch.map(async (zone) => {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${zone.lat}&lon=${zone.lng}&appid=${apiKey}&units=metric`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json() as {
          rain?: { '1h'?: number; '3h'?: number };
          main?: { humidity?: number; temp?: number };
          weather?: Array<{ main?: string; description?: string }>;
          wind?: { speed?: number };
          clouds?: { all?: number };
        };
        weatherData.set(zone.district, {
          rainfall: data.rain?.['1h'] || data.rain?.['3h'] || 0,
          humidity: data.main?.humidity || 50,
          temperature: data.main?.temp || 25,
          condition: data.weather?.[0]?.main || 'Clear',
          description: data.weather?.[0]?.description || '',
          windSpeed: data.wind?.speed || 0,
          clouds: data.clouds?.all || 0,
        });
      }
    } catch (e) {
      console.error(`Weather fetch failed for ${zone.district}:`, e);
    }
  });
  
  await Promise.all(fetches);
  return weatherData;
}

// Fetch recent earthquakes from USGS near Karnataka
async function fetchUSGSEarthquakes() {
  try {
    // Karnataka bounding box with buffer
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=11.5&maxlatitude=18.5&minlongitude=74.0&maxlongitude=79.0&starttime=${getDateDaysAgo(30)}&minmagnitude=2.0&orderby=time&limit=50`;
    
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`USGS API error: ${resp.status}`);
      return [];
    }
    
    const data = await resp.json() as { features?: USGSFeature[] };
    return (data.features || []).map((f) => ({
      id: f.id,
      magnitude: f.properties.mag,
      place: f.properties.place,
      time: new Date(f.properties.time).toISOString(),
      depth: f.geometry.coordinates[2],
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      type: f.properties.type,
      alert: f.properties.alert,
      tsunami: f.properties.tsunami,
    }));
  } catch (e) {
    console.error('USGS fetch error:', e);
    return [];
  }
}

// Fetch NASA EONET landslide events
async function fetchNASAEONETEvents() {
  try {
    // EONET v3 - search for landslide events
    const url = `https://eonet.gsfc.nasa.gov/api/v3/events?category=landslides&status=open&limit=50`;
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`NASA EONET error: ${resp.status}`);
      return [];
    }
    
    const data = await resp.json() as { events?: EONETEvent[] };
    
    // Filter for events near Karnataka (rough bounding box)
    const karnatakaEvents = (data.events || []).filter((e) => {
      const geom = e.geometry?.[0];
      if (!geom?.coordinates) return false;
      const [lng, lat] = geom.coordinates;
      return lat >= 10.0 && lat <= 19.0 && lng >= 73.0 && lng <= 80.0;
    });
    
    // Also return all India events for context
    const indiaEvents = (data.events || []).filter((e) => {
      const geom = e.geometry?.[0];
      if (!geom?.coordinates) return false;
      const [lng, lat] = geom.coordinates;
      return lat >= 6.0 && lat <= 36.0 && lng >= 68.0 && lng <= 98.0;
    });
    
    return {
      karnatakaEvents: karnatakaEvents.map(formatEONETEvent),
      indiaEvents: indiaEvents.map(formatEONETEvent),
    };
  } catch (e) {
    console.error('NASA EONET fetch error:', e);
    return { karnatakaEvents: [], indiaEvents: [] };
  }
}

function formatEONETEvent(e: EONETEvent) {
  const geom = e.geometry?.[0];
  return {
    id: e.id,
    title: e.title,
    description: e.description || '',
    date: geom?.date || '',
    lat: geom?.coordinates?.[1] || 0,
    lng: geom?.coordinates?.[0] || 0,
    source: e.sources?.[0]?.url || '',
    categories: e.categories?.map((c) => c.title) || [],
  };
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

// Calculate composite landslide risk score
function calculateRiskScore(zone: typeof karnatakaLandslideZones[0], weather: ZoneWeatherData | null, earthquakes: Array<{ lat: number; lng: number; magnitude: number }>): number {
  let score = 0;
  
  // Terrain factor (0-35 points)
  const terrainScore = {
    'very_high': 35,
    'high': 25,
    'moderate': 15,
    'low': 5,
  }[zone.terrainRisk] || 5;
  score += terrainScore;
  
  // Slope factor (0-15 points)
  score += Math.min(15, zone.slope * 0.5);
  
  // Historical events factor (0-10 points)
  score += Math.min(10, zone.historicalEvents * 0.3);
  
  // Rainfall factor (0-25 points) - REAL TIME
  if (weather) {
    const rainfall = weather.rainfall || 0;
    if (rainfall > 50) score += 25;
    else if (rainfall > 30) score += 20;
    else if (rainfall > 15) score += 15;
    else if (rainfall > 5) score += 8;
    else if (rainfall > 0) score += 3;
    
    // Humidity (0-5)
    if (weather.humidity > 90) score += 5;
    else if (weather.humidity > 80) score += 3;
    else if (weather.humidity > 70) score += 1;
    
    // Continuous rain indication from clouds
    if (weather.clouds > 90) score += 3;
  }
  
  // Seismic factor (0-10 points)
  const nearbyQuakes = earthquakes.filter(eq => {
    const dist = Math.sqrt(Math.pow(eq.lat - zone.lat, 2) + Math.pow(eq.lng - zone.lng, 2));
    return dist < 1.0; // ~110km radius
  });
  
  if (nearbyQuakes.length > 0) {
    const maxMag = Math.max(...nearbyQuakes.map((q) => q.magnitude));
    if (maxMag >= 5) score += 10;
    else if (maxMag >= 4) score += 7;
    else if (maxMag >= 3) score += 4;
    else score += 2;
  }
  
  return Math.min(100, Math.round(score));
}

function getRiskLevel(score: number): 'critical' | 'high' | 'moderate' | 'low' {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'moderate';
  return 'low';
}

serve(async (req) => {
  const ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'https://bindaas-blr.vercel.app',
    'https://bindaasblr.vercel.app',
    Deno.env.get('ALLOWED_ORIGIN') ?? '',
  ].filter(Boolean);

  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  const missing = REQUIRED_SECRETS.filter((key) => !Deno.env.get(key));
  if (missing.length > 0) {
    console.error(`[FATAL] Missing secrets: ${missing.join(', ')}`);
    return new Response(
      JSON.stringify({
        error: 'Missing required secrets',
        missing,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY') ?? '';
    
    console.log('Fetching landslide prediction data...');
    
    // Fetch all data sources in parallel
    const [weatherData, earthquakes, nasaEvents] = await Promise.all([
      OPENWEATHER_API_KEY ? fetchWeatherForZones(OPENWEATHER_API_KEY, karnatakaLandslideZones) : Promise.resolve(new Map()),
      fetchUSGSEarthquakes(),
      fetchNASAEONETEvents(),
    ]);
    
    console.log(`Weather: ${weatherData.size} zones, Earthquakes: ${earthquakes.length}, NASA events: ${nasaEvents.karnatakaEvents?.length || 0} in Karnataka`);
    
    // Calculate risk for each zone
    const riskZones = karnatakaLandslideZones.map(zone => {
      const weather = weatherData.get(zone.district) || null;
      const riskScore = calculateRiskScore(zone, weather, earthquakes);
      const riskLevel = getRiskLevel(riskScore);
      
      return {
        district: zone.district,
        lat: zone.lat,
        lng: zone.lng,
        zone: zone.zone,
        terrainRisk: zone.terrainRisk,
        elevation: zone.elevation,
        slope: zone.slope,
        soilType: zone.soilType,
        annualRainfall: zone.annualRainfall,
        historicalEvents: zone.historicalEvents,
        riskScore,
        riskLevel,
        weather: weather ? {
          rainfall: weather.rainfall,
          humidity: weather.humidity,
          temperature: weather.temperature,
          condition: weather.condition,
          description: weather.description,
          windSpeed: weather.windSpeed,
        } : null,
      };
    });
    
    // Sort by risk score descending
    riskZones.sort((a, b) => b.riskScore - a.riskScore);
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      dataSources: {
        weather: weatherData.size > 0 ? 'OpenWeatherMap (Live)' : 'Unavailable',
        seismic: earthquakes.length > 0 ? 'USGS Earthquake Hazards (Live)' : 'No recent activity',
        events: 'NASA EONET v3 (Live)',
      },
      riskZones,
      earthquakes: earthquakes.slice(0, 20),
      nasaEvents: nasaEvents,
      summary: {
        criticalZones: riskZones.filter(z => z.riskLevel === 'critical').length,
        highRiskZones: riskZones.filter(z => z.riskLevel === 'high').length,
        moderateZones: riskZones.filter(z => z.riskLevel === 'moderate').length,
        lowRiskZones: riskZones.filter(z => z.riskLevel === 'low').length,
        totalZones: riskZones.length,
        highestRisk: riskZones[0]?.district || 'N/A',
      },
    };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Landslide prediction error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
