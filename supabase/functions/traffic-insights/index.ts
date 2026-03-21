import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMITS = {
  data: 30,
  prediction: 5,
} as const;

// Bengaluru key locations with coordinates and baseline commute times (minutes)
const bengaluruLocations = [
  { name: 'Silk Board Junction', lat: 12.9170, lng: 77.6227, baseCommute: 12 },
  { name: 'Marathahalli Bridge', lat: 12.9591, lng: 77.7009, baseCommute: 10 },
  { name: 'KR Puram', lat: 13.0012, lng: 77.6961, baseCommute: 8 },
  { name: 'Hebbal Flyover', lat: 13.0358, lng: 77.5970, baseCommute: 9 },
  { name: 'Whitefield Main Road', lat: 12.9698, lng: 77.7500, baseCommute: 10 },
  { name: 'Koramangala Inner Ring Road', lat: 12.9352, lng: 77.6245, baseCommute: 7 },
  { name: 'MG Road', lat: 12.9758, lng: 77.6066, baseCommute: 6 },
  { name: 'Jayanagar 4th Block', lat: 12.9254, lng: 77.5838, baseCommute: 7 },
];

// Bengaluru bounding box for incident API
const BENGALURU_BOUNDS = {
  minLat: 12.7500,
  maxLat: 13.1500,
  minLng: 77.4000,
  maxLng: 77.8500,
};

// TomTom Incident category mapping
const incidentCategories: { [key: number]: string } = {
  0: 'Unknown',
  1: 'Accident',
  2: 'Fog',
  3: 'Dangerous Conditions',
  4: 'Rain',
  5: 'Ice',
  6: 'Jam',
  7: 'Lane Closed',
  8: 'Road Closed',
  9: 'Road Works',
  10: 'Wind',
  11: 'Flooding',
  14: 'Broken Down Vehicle',
};

type SupabaseClient = ReturnType<typeof createClient>;

const REQUIRED_SECRETS = [
  'TOMTOM_API_KEY',
  'OPENWEATHER_API_KEY',
  'GEMINI_API_KEY',
] as const;

interface TomTomEvent {
  description: string;
}

interface TomTomIncidentProperties {
  id?: string;
  iconCategory?: number;
  magnitudeOfDelay?: number;
  events?: TomTomEvent[];
  startTime?: string;
  endTime?: string;
  from?: string;
  to?: string;
  delay?: number;
}

interface TomTomGeometry {
  type?: 'Point' | 'LineString';
  coordinates?: [number, number][] | [number, number];
}

interface TomTomIncidentFeature {
  properties?: TomTomIncidentProperties;
  geometry?: TomTomGeometry;
}

interface TomTomIncidentResponse {
  incidents?: TomTomIncidentFeature[];
}

interface OpenWeatherResponse {
  weather?: Array<{ id?: number; main?: string; description?: string; icon?: string }>;
  visibility?: number;
  wind?: { speed?: number };
  main?: { temp?: number; humidity?: number };
}

interface TrafficHistoryRow {
  recorded_at: string;
  congestion_level: number;
  location_name: string;
  latitude: number;
  longitude: number;
  current_speed: number | null;
  free_flow_speed: number | null;
}

interface FlowSegmentData {
  currentSpeed: number;
  freeFlowSpeed: number;
}

interface RealIncident {
  id: string;
  location: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  from: string;
  to: string;
  delay: number; // in seconds
  lat: number;
  lng: number;
}

interface RealRoadWork {
  id: string;
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  startTime: string;
  endTime: string;
  lat: number;
  lng: number;
}

interface Hotspot {
  name: string;
  congestionLevel: number;
  currentSpeed?: number | null;
  freeFlowSpeed?: number | null;
  trend: 'up' | 'down' | 'stable';
  eta: string;
  etaMinutes: number;
  isRealData: boolean;
}

let tomtomCache: {
  data: {
    hotspots: Hotspot[];
    realIncidents: RealIncident[];
    realRoadWorks: RealRoadWork[];
  };
  timestamp: number;
} | null = null;
const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes

interface WeatherData {
  condition: string;
  description: string;
  temperature: number;
  humidity: number;
  visibility: number; // in meters
  windSpeed: number; // in m/s
  icon: string;
  impactLevel: 'none' | 'low' | 'moderate' | 'severe';
}

function getClientKey(req: Request): string {
  return req.headers.get('cf-connecting-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'anonymous';
}

function isRateLimited(req: Request, type: 'data' | 'prediction'): boolean {
  const clientKey = `${type}:${getClientKey(req)}`;
  const now = Date.now();
  const existing = rateLimitStore.get(clientKey);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (existing.count >= RATE_LIMITS[type]) {
    return true;
  }

  existing.count += 1;
  rateLimitStore.set(clientKey, existing);
  return false;
}

// Fetch real incidents from TomTom Incident API
async function fetchTomTomIncidents(apiKey: string): Promise<{ incidents: RealIncident[], roadWorks: RealRoadWork[] }> {
  try {
    const { minLat, maxLat, minLng, maxLng } = BENGALURU_BOUNDS;
    const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
    
    // TomTom Traffic Incidents API v5
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${bbox}&fields={incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length,delay,roadNumbers,aci{probabilityOfOccurrence,numberOfReports,lastReportTime}}}}&language=en-GB&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11,14&timeValidityFilter=present`;
    
    console.log('Fetching TomTom incidents...');
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`TomTom Incident API error: ${response.status}`);
      return { incidents: [], roadWorks: [] };
    }
    
    const data = await response.json() as TomTomIncidentResponse;
    const incidents: RealIncident[] = [];
    const roadWorks: RealRoadWork[] = [];
    
    if (data.incidents && Array.isArray(data.incidents)) {
      console.log(`Found ${data.incidents.length} incidents from TomTom`);
      
      for (const inc of data.incidents) {
        const props = inc.properties;
        if (!props) continue;
        
        const iconCategory = props.iconCategory || 0;
        const categoryName = incidentCategories[iconCategory] || 'Unknown';
        
        // Get coordinates from geometry
        let lat = 0, lng = 0;
        if (inc.geometry?.coordinates) {
          if (inc.geometry.type === 'Point') {
            [lng, lat] = inc.geometry.coordinates as [number, number];
          } else if (inc.geometry.type === 'LineString' && Array.isArray(inc.geometry.coordinates) && inc.geometry.coordinates.length > 0) {
            // Take midpoint of the line
            const midIndex = Math.floor(inc.geometry.coordinates.length / 2);
            [lng, lat] = inc.geometry.coordinates[midIndex] as [number, number];
          }
        }
        
        // Determine severity based on magnitude of delay
        let severity: 'low' | 'medium' | 'high' = 'low';
        const magnitude = props.magnitudeOfDelay || 0;
        if (magnitude >= 4) severity = 'high';
        else if (magnitude >= 2) severity = 'medium';
        
        // Get event descriptions
        const eventDescriptions = props.events?.map((e) => e.description).join('; ') || categoryName;
        
        // Find nearest known location
        const nearestLocation = findNearestLocation(lat, lng);
        
        if (iconCategory === 9) {
          // Road works
          roadWorks.push({
            id: props.id || `rw-${Date.now()}-${Math.random()}`,
            location: props.from || nearestLocation,
            description: eventDescriptions,
            severity,
            startTime: props.startTime || '',
            endTime: props.endTime || '',
            lat,
            lng,
          });
        } else if ([1, 6, 7, 8, 14].includes(iconCategory)) {
          // Accidents, jams, lane closures, road closures, broken down vehicles
          incidents.push({
            id: props.id || `inc-${Date.now()}-${Math.random()}`,
            location: props.from || nearestLocation,
            type: categoryName,
            severity,
            description: eventDescriptions,
            from: props.from || '',
            to: props.to || '',
            delay: props.delay || 0,
            lat,
            lng,
          });
        }
      }
    }
    
    console.log(`Processed: ${incidents.length} incidents, ${roadWorks.length} road works`);
    return { incidents, roadWorks };
    
  } catch (error) {
    console.error('Error fetching TomTom incidents:', error);
    return { incidents: [], roadWorks: [] };
  }
}

// Find nearest known location to coordinates
function findNearestLocation(lat: number, lng: number): string {
  let nearest = bengaluruLocations[0].name;
  let minDist = Infinity;
  
  for (const loc of bengaluruLocations) {
    const dist = Math.sqrt(Math.pow(lat - loc.lat, 2) + Math.pow(lng - loc.lng, 2));
    if (dist < minDist) {
      minDist = dist;
      nearest = loc.name;
    }
  }
  
  return nearest;
}

// Fetch weather data from OpenWeatherMap
async function fetchWeatherData(apiKey: string): Promise<WeatherData | null> {
  try {
    // Bengaluru city center coordinates
    const lat = 12.9716;
    const lng = 77.5946;
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    
    console.log('Fetching weather data...');
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`OpenWeatherMap API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json() as OpenWeatherResponse;
    
    // Determine weather impact on traffic
    let impactLevel: 'none' | 'low' | 'moderate' | 'severe' = 'none';
    const weatherId = data.weather?.[0]?.id || 800;
    const visibility = data.visibility || 10000;
    const windSpeed = data.wind?.speed || 0;
    
    // Weather impact based on conditions
    if (weatherId >= 200 && weatherId < 300) {
      // Thunderstorm
      impactLevel = 'severe';
    } else if (weatherId >= 500 && weatherId < 600) {
      // Rain
      if (weatherId >= 502) impactLevel = 'severe';
      else if (weatherId >= 501) impactLevel = 'moderate';
      else impactLevel = 'low';
    } else if (weatherId >= 600 && weatherId < 700) {
      // Snow (rare in Bengaluru but handling)
      impactLevel = 'severe';
    } else if (weatherId >= 700 && weatherId < 800) {
      // Atmosphere (fog, mist, haze)
      if (visibility < 500) impactLevel = 'severe';
      else if (visibility < 1000) impactLevel = 'moderate';
      else if (visibility < 3000) impactLevel = 'low';
    }
    
    // Adjust for wind
    if (windSpeed > 15) impactLevel = 'severe';
    else if (windSpeed > 10 && impactLevel === 'none') impactLevel = 'low';
    
    return {
      condition: data.weather?.[0]?.main || 'Clear',
      description: data.weather?.[0]?.description || 'clear sky',
      temperature: Math.round(data.main?.temp || 25),
      humidity: data.main?.humidity || 50,
      visibility: visibility,
      windSpeed: windSpeed,
      icon: data.weather?.[0]?.icon || '01d',
      impactLevel,
    };
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

// Calculate real metrics from historical data and real incidents
async function calculateRealMetrics(
  supabase: SupabaseClient,
  currentHotspots: Hotspot[],
  realIncidents: RealIncident[], 
  realRoadWorks: RealRoadWork[],
  weatherData: WeatherData | null
) {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Fetch recent history for analysis
  const { data: recentHistory, error } = await supabase
    .from('traffic_history')
    .select('*')
    .gte('recorded_at', twentyFourHoursAgo.toISOString())
    .order('recorded_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching history:', error);
  }
  
  // 1. Calculate Average Commute Time based on current congestion
  const avgCongestion = currentHotspots.reduce((sum, h) => sum + h.congestionLevel, 0) / currentHotspots.length;
  
  // Apply weather impact multiplier
  let weatherMultiplier = 1;
  if (weatherData) {
    if (weatherData.impactLevel === 'severe') weatherMultiplier = 1.4;
    else if (weatherData.impactLevel === 'moderate') weatherMultiplier = 1.2;
    else if (weatherData.impactLevel === 'low') weatherMultiplier = 1.1;
  }
  
  const congestionMultiplier = (1 + (avgCongestion / 100) * 1.5) * weatherMultiplier;
  const avgBaseCommute = bengaluruLocations.reduce((sum, l) => sum + l.baseCommute, 0) / bengaluruLocations.length;
  const avgCommuteMinutes = Math.round(avgBaseCommute * congestionMultiplier);
  
  // Compare with historical average
  let historicalAvgCommute = avgCommuteMinutes;
  if (recentHistory && recentHistory.length > 0) {
    const historicalAvgCongestion = (recentHistory as TrafficHistoryRow[]).reduce((sum, h) => sum + h.congestion_level, 0) / recentHistory.length;
    const historicalMultiplier = 1 + (historicalAvgCongestion / 100) * 1.5;
    historicalAvgCommute = Math.round(avgBaseCommute * historicalMultiplier);
  }
  const commuteChange = avgCommuteMinutes - historicalAvgCommute;
  const commuteChangePercent = historicalAvgCommute > 0 ? Math.round((commuteChange / historicalAvgCommute) * 100) : 0;
  
  // 2. Detect Peak Hour from historical patterns
  const hourlyAverages: { [hour: number]: { total: number; count: number } } = {};
  if (recentHistory) {
    (recentHistory as TrafficHistoryRow[]).forEach((record) => {
      const recordHour = new Date(record.recorded_at).getHours();
      if (!hourlyAverages[recordHour]) {
        hourlyAverages[recordHour] = { total: 0, count: 0 };
      }
      hourlyAverages[recordHour].total += record.congestion_level;
      hourlyAverages[recordHour].count += 1;
    });
  }
  
  let peakHour = 9;
  let peakCongestion = 0;
  Object.entries(hourlyAverages).forEach(([hour, data]) => {
    const avg = data.total / data.count;
    if (avg > peakCongestion) {
      peakCongestion = avg;
      peakHour = parseInt(hour);
    }
  });
  
  const peakHourFormatted = peakHour > 12 
    ? `${peakHour - 12}:00 PM` 
    : peakHour === 12 
      ? '12:00 PM' 
      : `${peakHour}:00 AM`;
  
  // 3. Format real incidents for frontend
  const formattedIncidents = realIncidents.map(inc => ({
    location: inc.location,
    severity: inc.severity,
    description: `${inc.type}: ${inc.description}`,
    delay: inc.delay > 0 ? `+${Math.round(inc.delay / 60)} min delay` : undefined,
    lat: inc.lat,
    lng: inc.lng,
  }));
  
  // 4. Format real road works for frontend
  const formattedRoadWorks = realRoadWorks.map(rw => ({
    location: rw.location,
    description: rw.description,
    severity: rw.severity,
    lat: rw.lat,
    lng: rw.lng,
  }));
  
  // 5. Calculate Route Impact Scores
  const routeImpacts = currentHotspots.slice(0, 6).map(hotspot => {
    const location = bengaluruLocations.find(l => l.name === hotspot.name);
    const baseTime = location?.baseCommute || 10;
    
    // Check if this route has active incidents
    const hasIncident = realIncidents.some(inc => 
      inc.location.includes(hotspot.name) || findNearestLocation(inc.lat, inc.lng) === hotspot.name
    );
    const hasRoadWork = realRoadWorks.some(rw => 
      rw.location.includes(hotspot.name) || findNearestLocation(rw.lat, rw.lng) === hotspot.name
    );
    
    let incidentDelay = 0;
    if (hasIncident) {
      const incident = realIncidents.find(inc => 
        inc.location.includes(hotspot.name) || findNearestLocation(inc.lat, inc.lng) === hotspot.name
      );
      incidentDelay = incident ? Math.round((incident.delay || 0) / 60) : 5;
    }
    if (hasRoadWork) incidentDelay += 3;
    
    const congestionDelay = Math.round(baseTime * (hotspot.congestionLevel / 100) * 1.5);
    const actualTime = baseTime + congestionDelay + incidentDelay;
    const delay = actualTime - baseTime;
    
    return {
      corridor: hotspot.name,
      baseTime,
      actualTime,
      delay,
      impactScore: Math.min(100, Math.round((hotspot.congestionLevel * 1.2) + (hasIncident ? 15 : 0) + (hasRoadWork ? 10 : 0))),
      status: hotspot.congestionLevel < 50 && !hasIncident ? 'clear' : hotspot.congestionLevel < 70 ? 'moderate' : 'congested',
      hasIncident,
      hasRoadWork,
    };
  });
  
  return {
    avgCommuteMinutes,
    commuteChangePercent,
    peakHour: peakHourFormatted,
    peakCongestion: Math.round(peakCongestion),
    incidents: formattedIncidents,
    incidentCount: realIncidents.length,
    roadWorks: formattedRoadWorks,
    roadWorksCount: realRoadWorks.length,
    routeImpacts,
    weather: weatherData,
  };
}

// Store traffic data to database
async function storeTrafficHistory(supabase: SupabaseClient, hotspots: Hotspot[], dataSource: string) {
  try {
    const historyRecords = hotspots.map(hotspot => {
      const location = bengaluruLocations.find(loc => loc.name === hotspot.name);
      return {
        location_name: hotspot.name,
        latitude: location?.lat || 0,
        longitude: location?.lng || 0,
        congestion_level: hotspot.congestionLevel,
        current_speed: hotspot.currentSpeed || null,
        free_flow_speed: hotspot.freeFlowSpeed || null,
        data_source: dataSource,
      };
    });
    
    const { error } = await supabase
      .from('traffic_history')
      .insert(historyRecords);
    
    if (error) {
      console.error('Error storing traffic history:', error);
    } else {
      console.log(`Stored ${historyRecords.length} traffic records`);
    }
  } catch (error) {
    console.error('Error in storeTrafficHistory:', error);
  }
}

// Fetch real traffic flow data from TomTom API
async function fetchTomTomTrafficFlow(lat: number, lng: number, apiKey: string) {
  try {
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`TomTom API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data.flowSegmentData;
  } catch (error) {
    console.error('Error fetching TomTom traffic:', error);
    return null;
  }
}

// Calculate congestion level from TomTom data
function calculateCongestionFromFlow(flowData: FlowSegmentData | null): number {
  if (!flowData) return -1;
  
  const currentSpeed = flowData.currentSpeed;
  const freeFlowSpeed = flowData.freeFlowSpeed;
  
  if (!currentSpeed || !freeFlowSpeed) return -1;
  
  const speedRatio = currentSpeed / freeFlowSpeed;
  const congestionLevel = Math.round((1 - speedRatio) * 100);
  
  return Math.max(0, Math.min(95, congestionLevel));
}

// Determine trend based on time of day and historical patterns
function determineTrend(hour: number, isWeekend: boolean): 'up' | 'down' | 'stable' {
  if (isWeekend) return 'stable';
  
  if (hour < 9) return 'up';
  if (hour >= 10 && hour < 16) return 'down';
  if (hour >= 16 && hour < 19) return 'up';
  if (hour >= 19) return 'down';
  return 'stable';
}

// Calculate ETA delay based on congestion
function calculateETA(congestionLevel: number): string {
  if (congestionLevel < 0) return 'N/A';
  const minutes = Math.round(congestionLevel * 0.6 + 5);
  return `+${minutes} min`;
}

// Generate hourly trend data
function generateHourlyTrend(currentHour: number, avgCongestion: number) {
  const data = [];
  
  for (let i = 6; i <= 21; i++) {
    let baseCongestion = 30;
    
    if (i >= 8 && i <= 10) baseCongestion = 70 + (i === 9 ? 15 : 0);
    else if (i > 10 && i < 17) baseCongestion = 45 + Math.sin((i - 10) * 0.5) * 10;
    else if (i >= 17 && i <= 20) baseCongestion = 75 + (i === 18 ? 12 : 0);
    else baseCongestion = 25 + (i - 6) * 3;
    
    const adjustmentFactor = avgCongestion > 0 ? avgCongestion / 55 : 1;
    const adjustedCongestion = Math.round(Math.min(95, baseCongestion * adjustmentFactor));
    
    const hour12 = i > 12 ? i - 12 : i;
    const period = i >= 12 ? 'PM' : 'AM';
    const timeLabel = `${hour12} ${period}`;
    
    if (i <= currentHour) {
      data.push({ time: timeLabel, congestion: adjustedCongestion, predicted: undefined });
    } else {
      data.push({ time: timeLabel, congestion: undefined, predicted: adjustedCongestion });
    }
  }
  
  return data;
}

function formatCurrentTime(date: Date) {
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function isOffPeakHour(hour: number) {
  return hour >= 20 || hour < 6;
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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  try {
    const { type, context } = await req.json();
    const MAX_CONTEXT_LENGTH = 500;

    if (!type || !['data', 'prediction'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid request type' }), { status: 400, headers: corsHeaders });
    }

    if (context && typeof context !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid context' }), { status: 400, headers: corsHeaders });
    }

    const safeContext = typeof context === 'string' 
      ? context.slice(0, MAX_CONTEXT_LENGTH).replace(/[<>]/g, '') 
      : '';
    const requestType = type === 'prediction' ? 'prediction' : 'data';

    if (isRateLimited(req, requestType)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again shortly.',
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const TOMTOM_API_KEY = Deno.env.get("TOMTOM_API_KEY") ?? '';
    const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY") ?? '';
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? '';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    const isOffPeak = isOffPeakHour(hour);
    const currentTimeLabel = formatCurrentTime(now);

    let hotspots: Hotspot[] = [];
    let usedRealData = false;
    
    // Fetch real incidents and road works from TomTom
    let realIncidents: RealIncident[] = [];
    let realRoadWorks: RealRoadWork[] = [];
    
    const cacheTimestamp = Date.now();

    if (tomtomCache && (cacheTimestamp - tomtomCache.timestamp < CACHE_DURATION_MS)) {
      console.log('Serving TomTom data from isolate memory cache...');
      hotspots = tomtomCache.data.hotspots;
      realIncidents = tomtomCache.data.realIncidents;
      realRoadWorks = tomtomCache.data.realRoadWorks;
      usedRealData = hotspots.length > 0;
    } else {
      console.log('Fetching real traffic data from TomTom...');
        
        // Fetch traffic flow for all locations
        const trafficPromises = bengaluruLocations.map(async (location) => {
          const flowData = await fetchTomTomTrafficFlow(location.lat, location.lng, TOMTOM_API_KEY);
          const congestionLevel = calculateCongestionFromFlow(flowData);
          
          return {
            name: location.name,
            congestionLevel,
            currentSpeed: flowData?.currentSpeed || null,
            freeFlowSpeed: flowData?.freeFlowSpeed || null,
            trend: determineTrend(hour, isWeekend),
            eta: calculateETA(congestionLevel),
            etaMinutes: congestionLevel >= 0 ? Math.round(congestionLevel * 0.6 + 5) : 0,
            isRealData: congestionLevel >= 0,
          };
        });
        
        // Fetch incidents in parallel
        const incidentPromise = fetchTomTomIncidents(TOMTOM_API_KEY);
        
        let trafficResults: Awaited<ReturnType<typeof Promise.all<typeof trafficPromises>>> = [];
        let incidentResults: { incidents: RealIncident[]; roadWorks: RealRoadWork[] } = { incidents: [], roadWorks: [] };

        try {
          [trafficResults, incidentResults] = await Promise.all([
            Promise.all(trafficPromises),
            incidentPromise,
          ]);
        } catch (error) {
          console.error('[TomTom] Parallel fetch failed:', error instanceof Error ? error.message : error);
        }
        
        hotspots = trafficResults
          .filter(h => h.congestionLevel >= 0)
          .sort((a, b) => b.congestionLevel - a.congestionLevel);
        
        realIncidents = incidentResults.incidents;
        realRoadWorks = incidentResults.roadWorks;
        
        usedRealData = hotspots.length > 0;
        
        if (usedRealData) {
          tomtomCache = {
            data: { hotspots, realIncidents, realRoadWorks },
            timestamp: cacheTimestamp,
          };
        }
      console.log(`Retrieved real data for ${hotspots.length} locations, ${realIncidents.length} incidents, ${realRoadWorks.length} road works. Updated cache.`);
    }
    
    // Fetch weather data
    let weatherData: WeatherData | null = null;
    try {
      weatherData = await fetchWeatherData(OPENWEATHER_API_KEY);
      if (weatherData) {
        console.log(`Weather: ${weatherData.condition} (${weatherData.temperature}°C), Impact: ${weatherData.impactLevel}`);
      }
    } catch (error) {
      console.error('[Weather] Failed:', error instanceof Error ? error.message : error);
    }

    if (hotspots.length === 0) {
      console.log('Using simulated traffic data');
      
      hotspots = bengaluruLocations.map(location => {
        let baseCongestion = 40 + Math.random() * 20;
        if (isPeakHour && !isWeekend) baseCongestion += 25;
        if (isWeekend) baseCongestion *= 0.6;
        
        const congestionLevel = Math.round(Math.min(92, Math.max(15, baseCongestion)));
        
        return {
          name: location.name,
          congestionLevel,
          trend: determineTrend(hour, isWeekend),
          eta: calculateETA(congestionLevel),
          etaMinutes: Math.round(congestionLevel * 0.6 + 5),
          isRealData: false,
        };
      }).sort((a, b) => b.congestionLevel - a.congestionLevel);
    }

    const avgCongestion = Math.round(
      hotspots.reduce((sum, h) => sum + h.congestionLevel, 0) / hotspots.length
    );

    // Store traffic data
    if (usedRealData) {
      try {
        await storeTrafficHistory(supabase, hotspots, usedRealData ? 'tomtom' : 'simulated');
      } catch (error) {
        console.error('[Supabase] Traffic history store failed:', error instanceof Error ? error.message : error);
      }
    }

    // Calculate real metrics from historical data + real incidents
    let realMetrics = null;
    try {
      realMetrics = await calculateRealMetrics(supabase, hotspots, realIncidents, realRoadWorks, weatherData);
    } catch (error) {
      console.error('[Supabase] Metrics calculation failed:', error instanceof Error ? error.message : error);
    }
    
    // Fallback metrics if no database
    if (!realMetrics) {
      const avgBaseCommute = bengaluruLocations.reduce((sum, l) => sum + l.baseCommute, 0) / bengaluruLocations.length;
      const congestionMultiplier = 1 + (avgCongestion / 100) * 1.5;
      
      realMetrics = {
        avgCommuteMinutes: Math.round(avgBaseCommute * congestionMultiplier),
        commuteChangePercent: isPeakHour ? 15 : -5,
        peakHour: '9:00 AM',
        peakCongestion: 75,
        incidents: realIncidents.map(inc => ({
          location: inc.location,
          severity: inc.severity,
          description: `${inc.type}: ${inc.description}`,
        })),
        incidentCount: realIncidents.length,
        roadWorks: realRoadWorks.map(rw => ({
          location: rw.location,
          description: rw.description,
          severity: rw.severity,
        })),
        roadWorksCount: realRoadWorks.length,
        routeImpacts: [],
        weather: weatherData,
      };
    }

    const hotspotsWithCoords = hotspots.map(h => {
      const location = bengaluruLocations.find(loc => loc.name === h.name);
      return {
        ...h,
        lat: location?.lat || 0,
        lng: location?.lng || 0,
      };
    });

    const trafficData = {
      hotspots: hotspotsWithCoords,
      sentimentScore: avgCongestion,
      timestamp: new Date().toISOString(),
      isPeakHour,
      isWeekend,
      currentHour: hour,
      dataSource: usedRealData ? 'TomTom Traffic API' : 'Simulated',
      metrics: realMetrics,
    };

    const hourlyTrend = generateHourlyTrend(hour, avgCongestion);

    if (type === 'data') {
      return new Response(JSON.stringify({
        success: true,
        data: trafficData,
        hourlyTrend,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'prediction') {
      if (!GEMINI_API_KEY) {
        return new Response(JSON.stringify({
          success: true,
          data: trafficData,
          hourlyTrend,
          aiInsights: {
            summary: `Current city congestion is at ${avgCongestion}%. ${usedRealData ? 'Data from TomTom Traffic API.' : 'Using simulated patterns.'}`,
            predictions: [],
            bestTimeToTravel: isOffPeak ? 'Traffic has eased — now is a good time to travel' : isPeakHour ? 'After 8:30 PM' : 'Now',
            avoidAreas: isOffPeak ? [] : hotspots.slice(0, 3).map(h => h.name),
            alternateRoutes: [],
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const weatherContext = weatherData 
        ? `\nWeather: ${weatherData.condition} (${weatherData.temperature}°C), Visibility: ${weatherData.visibility}m, Wind: ${weatherData.windSpeed} m/s, Traffic Impact: ${weatherData.impactLevel}`
        : '';

      const systemPrompt = `You are an expert Bengaluru traffic analyst AI. Analyze real traffic data and provide actionable insights.
      
Be concise and data-driven. The data comes from ${usedRealData ? 'live TomTom Traffic API with real incident data' : 'pattern-based simulation'}.
IMPORTANT: The "bestTimeToTravel" field must ALWAYS be a future time window within the next 6 hours from the current time. The current time is ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST. Never suggest a time that has already passed today. Never use the word "Tomorrow". If the only good travel window is late at night, say "After 10:00 PM tonight" or "Late tonight after 11:00 PM". The time window must be realistic given the current hour.
If the current time is between 8:00 PM and 6:00 AM, do not tell users to avoid routes "now" unless the live congestion is still severe. In off-peak hours, prefer guidance like "No significant congestion at this hour. Good time to travel."

Focus on:
1. Current traffic status interpretation based on REAL data
2. Predictions for the next 2-3 hours based on patterns
3. Best times to travel
4. Alternative route suggestions for congested areas
5. Weather impact on traffic if applicable

Return a JSON object with these fields:
- summary: A 1-2 sentence overview (string)
- predictions: Array of 3 predictions with { time: string, congestionLevel: number, insight: string }
- bestTimeToTravel: string (specific time recommendation)
- avoidAreas: Array of area names to avoid (max 3)
- alternateRoutes: Array of { from: string, to: string, via: string, savings: string }`;

      const userPrompt = `Current Bengaluru Traffic Data (${usedRealData ? 'LIVE from TomTom' : 'Simulated'}):
- Current local time: ${currentTimeLabel}
- City Congestion Index: ${avgCongestion}%
- Average Commute Time: ${realMetrics.avgCommuteMinutes} min (${realMetrics.commuteChangePercent > 0 ? '+' : ''}${realMetrics.commuteChangePercent}% vs normal)
- Peak Hour Today: ${realMetrics.peakHour} (${realMetrics.peakCongestion}% congestion)
- Active Incidents: ${realMetrics.incidentCount}
- Road Works: ${realMetrics.roadWorksCount} ongoing
${weatherContext}

Top Congested Areas:
${hotspots.slice(0, 5).map(h => `- ${h.name}: ${h.congestionLevel}% congestion (${h.trend} trend, ${h.eta} delay)`).join('\n')}

${realIncidents.length > 0 ? `\nLive Incidents:\n${realIncidents.slice(0, 5).map(i => `- ${i.type} at ${i.location}: ${i.description}${i.delay > 0 ? ` (+${Math.round(i.delay/60)} min delay)` : ''}`).join('\n')}` : ''}

${realRoadWorks.length > 0 ? `\nActive Road Works:\n${realRoadWorks.slice(0, 5).map(r => `- ${r.location}: ${r.description}`).join('\n')}` : ''}

${safeContext ? `User Query: ${safeContext}` : 'Provide general traffic predictions and route recommendations for Bengaluru commuters.'}`;

      try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GEMINI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: "Rate limit exceeded. Please try again in a moment." 
            }), {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          if (response.status === 402) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: "AI credits exhausted. Please add credits to continue." 
            }), {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const aiResponse = await response.json();
        const aiContent = aiResponse.choices?.[0]?.message?.content;
        
        const aiContentText = typeof aiContent === 'string' ? aiContent : '';
        let storedGeminiContent = aiContentText;
        try {
          storedGeminiContent = JSON.stringify(JSON.parse(aiContentText));
        } catch {
          console.warn('[Gemini] Response was not valid JSON, storing raw');
        }

        let aiInsights;
        try {
          aiInsights = JSON.parse(storedGeminiContent);
        } catch {
          aiInsights = { 
            summary: aiContentText || `City congestion at ${avgCongestion}%.`,
            predictions: [], 
            bestTimeToTravel: isOffPeak ? 'Traffic has eased — now is a good time to travel' : 'Tomorrow 7:30 AM - 9:00 AM', 
            avoidAreas: isOffPeak ? [] : hotspots.slice(0, 3).map(h => h.name), 
            alternateRoutes: [] 
          };
        }

        console.log('[Gemini] AI prediction generated successfully');

        // Persist the latest prediction snapshot as a singleton row for DB fallback consumers.
        // This should never block the live response.
        try {
          const parsed = aiInsights as Record<string, unknown>;
          const predictionNow = new Date();
          const bestTimeRaw = (parsed as { best_time_window?: unknown }).best_time_window
            ?? (parsed as { bestTimeToTravel?: unknown }).bestTimeToTravel
            ?? null;
          const parseTimeWindow = (raw: string | undefined): { start: string | null; end: string | null } => {
            if (!raw) return { start: null, end: null };

            // Handle "HH:MM-HH:MM" format
            const rangeMatch = raw.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
            if (rangeMatch) {
              return { start: rangeMatch[1] + ':00', end: rangeMatch[2] + ':00' };
            }

            // Handle 12-hour format like "8:00 PM"
            const twelveHourMatch = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (twelveHourMatch) {
              let h = parseInt(twelveHourMatch[1]);
              const m = twelveHourMatch[2];
              const period = twelveHourMatch[3].toUpperCase();
              if (period === 'PM' && h !== 12) h += 12;
              if (period === 'AM' && h === 12) h = 0;
              const time = `${String(h).padStart(2, '0')}:${m}:00`;
              return { start: time, end: null };
            }

            return { start: null, end: null };
          };

          const timeWindow = parseTimeWindow(typeof bestTimeRaw === 'string' ? bestTimeRaw : undefined);
          const next1h = (parsed as { next_1h_congestion?: unknown }).next_1h_congestion
            ?? (parsed as { predictions?: Array<{ congestionLevel?: unknown }> }).predictions?.[0]?.congestionLevel
            ?? null;
          const next2h = (parsed as { next_2h_congestion?: unknown }).next_2h_congestion
            ?? (parsed as { predictions?: Array<{ congestionLevel?: unknown }> }).predictions?.[1]?.congestionLevel
            ?? null;
          const next3h = (parsed as { next_3h_congestion?: unknown }).next_3h_congestion
            ?? (parsed as { predictions?: Array<{ congestionLevel?: unknown }> }).predictions?.[2]?.congestionLevel
            ?? null;

          const { error: upsertError } = await supabase.from('ai_predictions').upsert({
            id: '60e3cd2f-2c93-4882-bd13-f8eadff2a348', // fixed singleton row ID
            predicted_at: predictionNow.toISOString(),
            best_time_window_start: timeWindow.start,
            best_time_window_end: timeWindow.end,
            best_time_is_future: true,
            next_1h_congestion: typeof next1h === 'number' ? next1h : null,
            next_2h_congestion: typeof next2h === 'number' ? next2h : null,
            next_3h_congestion: typeof next3h === 'number' ? next3h : null,
            city_summary: storedGeminiContent || null,
            avoid_areas: (parsed as { avoid_areas?: unknown }).avoid_areas
              ?? (parsed as { avoidAreas?: unknown }).avoidAreas
              ?? [],
            alternate_routes: (parsed as { alternate_routes?: unknown }).alternate_routes
              ?? (parsed as { alternateRoutes?: unknown }).alternateRoutes
              ?? [],
            raw_gemini_response: storedGeminiContent || null,
            avg_congestion_at_prediction: avgCongestion ?? null,
            weather_at_prediction: weatherData?.condition ?? null,
            hour_of_prediction: predictionNow.getUTCHours(),
            day_of_prediction: predictionNow.getUTCDay(),
          }, { onConflict: 'id' });

          if (upsertError) {
            console.error('[Supabase] ai_predictions upsert failed:', upsertError.message);
          }
        } catch (dbError) {
          console.error('[Supabase] ai_predictions upsert threw:', dbError instanceof Error ? dbError.message : dbError);
        }

        return new Response(JSON.stringify({
          success: true,
          data: trafficData,
          hourlyTrend,
          aiInsights,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      } catch (aiError) {
        console.error('AI prediction error:', aiError);
        return new Response(JSON.stringify({
          success: true,
          data: trafficData,
          hourlyTrend,
          aiInsights: {
            summary: `Current city congestion is at ${avgCongestion}%.`,
            predictions: [],
            bestTimeToTravel: isOffPeak ? 'Traffic has eased — now is a good time to travel' : isPeakHour ? 'After 8:30 PM' : 'Now is a good time',
            avoidAreas: isOffPeak ? [] : hotspots.slice(0, 3).map(h => h.name),
            alternateRoutes: [],
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid request type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in traffic-insights function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
