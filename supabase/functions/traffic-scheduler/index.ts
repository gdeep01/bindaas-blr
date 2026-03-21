import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  AIRPORT_LOCATIONS,
  ALL_COMMUTE_LOCATIONS,
  getRouteBaseTime,
  getRouteHash,
  getTrackedRouteSummary,
  getWeightedRouteCongestion,
  TRACKED_LOCATIONS,
} from "../_shared/routeUtils.ts";

const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };

// Bengaluru bounding box — covers the entire city
const BENGALURU_BBOX = {
  minLat: 12.7343,
  maxLat: 13.1736,
  minLng: 77.3791,
  maxLng: 77.8876,
};

type SupabaseClient = ReturnType<typeof createClient>;

const REQUIRED_SECRETS = [
  "TOMTOM_API_KEY",
  "OPENWEATHER_API_KEY",
  "GEMINI_API_KEY",
] as const;

interface FlowSegmentData {
  currentSpeed?: number;
  freeFlowSpeed?: number;
}

interface TomTomFlowResult {
  location: (typeof TRACKED_LOCATIONS)[number];
  flowData: FlowSegmentData | null;
}

interface WeatherSnapshot {
  condition: string;
  temperature: number | null;
}

interface TrafficRecord {
  location_name: string;
  latitude: number;
  longitude: number;
  congestion_level: number;
  current_speed: number | null;
  free_flow_speed: number | null;
  recorded_at: string;
  data_source: string;
  weather_condition: string | null;
  weather_temp: number | null;
  day_of_week: number;
  departure_hour: number;
  is_peak_hour: boolean;
  is_weekend: boolean;
}

interface LandslidePredictionResponse {
  success?: boolean;
  riskZones?: Array<{
    district: string;
    riskLevel: string;
    riskScore: number;
    weather?: {
      condition?: string;
      rainfall?: number;
      temperature?: number;
    } | null;
  }>;
  earthquakes?: Array<{
    id: string;
    place: string;
    magnitude: number;
    time: string;
  }>;
  nasaEvents?: {
    karnatakaEvents?: Array<{
      id: string;
      title: string;
      date: string;
    }>;
    indiaEvents?: Array<{
      id: string;
      title: string;
      date: string;
    }>;
  };
}

interface TomTomIncident {
  id: string;
  type: string;
  geometry?: {
    coordinates?: number[] | number[][];
  };
  properties?: {
    iconCategory?: number;
    magnitudeOfDelay?: number;
    startTime?: string;
    endTime?: string;
    from?: string;
    to?: string;
    length?: number;
    delay?: number;
    roadNumbers?: string[];
    timeValidity?: string;
    probabilityOfOccurrence?: string;
    numberOfReports?: number;
    lastReportTime?: string;
    events?: Array<{ description?: string; code?: number; iconCategory?: number }>;
  };
}

interface TomTomIncidentsResponse {
  incidents?: TomTomIncident[];
}

interface IncidentRecord {
  location_name: string;
  latitude: number;
  longitude: number;
  congestion_level: number;
  current_speed: number | null;
  free_flow_speed: number | null;
  data_source: string;
  recorded_at: string;
}

const calculateCongestion = (
  flowData: FlowSegmentData | null,
  locationName: string,
) => {
  const currentSpeed = typeof flowData?.currentSpeed === "number" ? flowData.currentSpeed : 0;
  const freeFlowSpeed = typeof flowData?.freeFlowSpeed === "number" ? flowData.freeFlowSpeed : 0;
  const effectiveFreeFlow = freeFlowSpeed > 0 ? freeFlowSpeed : 60;
  const rawCongestion = (1 - currentSpeed / effectiveFreeFlow) * 100;
  const clamped = Math.max(0, Math.min(100, Math.round(rawCongestion)));

  console.log(
    `[Congestion] ${locationName}: currentSpeed=${currentSpeed} freeFlowSpeed=${freeFlowSpeed} effectiveFreeFlow=${effectiveFreeFlow} raw=${rawCongestion} clamped=${clamped}`,
  );

  return {
    congestionLevel: clamped,
    currentSpeed,
    freeFlowSpeed,
    effectiveFreeFlow,
  };
};

const isPeakHour = (hour: number) => (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21);

const getIstParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const hour = Number.parseInt(lookup("hour"), 10);
  const minute = Number.parseInt(lookup("minute"), 10);

  return {
    label: `${lookup("weekday")}, ${lookup("day")} ${lookup("month")} ${lookup("year")}`,
    timeLabel: `${lookup("hour")}:${lookup("minute")} IST`,
    hour,
    minute,
  };
};

async function fetchTomTomTrafficFlow(
  apiKey: string,
  locations: typeof TRACKED_LOCATIONS | typeof AIRPORT_LOCATIONS = TRACKED_LOCATIONS,
): Promise<TomTomFlowResult[]> {
  return Promise.all(
    locations.map(async (location) => {
      try {
        const url =
          `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${location.lat},${location.lng}&unit=KMPH&key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json() as { flowSegmentData?: FlowSegmentData };
        return {
          location,
          flowData: data.flowSegmentData ?? null,
        };
      } catch (error) {
        console.error(`[TomTom] FAILED ${location.name}:`, error instanceof Error ? error.message : error);
        return {
          location,
          flowData: null,
        };
      }
    }),
  );
}

async function fetchWeather(apiKey: string): Promise<WeatherSnapshot | null> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${BENGALURU_CENTER.lat}&lon=${BENGALURU_CENTER.lng}&appid=${apiKey}&units=metric`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather failed with status ${response.status}`);
  }

  const data = await response.json() as {
    weather?: Array<{ main?: string }>;
    main?: { temp?: number };
  };

  return {
    condition: data.weather?.[0]?.main?.toLowerCase() || "unknown",
    temperature: typeof data.main?.temp === "number" ? Number(data.main.temp.toFixed(2)) : null,
  };
}

async function fetchTomTomIncidents(apiKey: string): Promise<IncidentRecord[]> {
  try {
    const { minLat, maxLat, minLng, maxLng } = BENGALURU_BBOX;
    const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;

    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${bbox}&fields={incidents{type,geometry{coordinates},properties{iconCategory,magnitudeOfDelay,events{description,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity,probabilityOfOccurrence,numberOfReports,lastReportTime}}}&language=en-GB&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11,14&timeValidityFilter=present`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[TomTom Incidents] HTTP ${response.status}`);
      return [];
    }

    const data = await response.json() as TomTomIncidentsResponse;
    const incidents = data.incidents ?? [];

    console.log(`[TomTom Incidents] Received ${incidents.length} incidents`);

    const records: IncidentRecord[] = [];
    const now = new Date().toISOString();

    for (const incident of incidents) {
      // Extract coordinates — first coordinate pair from geometry
      let lat = BENGALURU_CENTER.lat;
      let lng = BENGALURU_CENTER.lng;

      const coords = incident.geometry?.coordinates;
      if (Array.isArray(coords)) {
        if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
          // Point geometry [lng, lat]
          lng = coords[0] as number;
          lat = coords[1] as number;
        } else if (Array.isArray(coords[0])) {
          // LineString geometry [[lng, lat], ...]
          const first = coords[0] as number[];
          lng = first[0];
          lat = first[1];
        }
      }

      // Only include if within Bengaluru bounding box
      if (
        lat < BENGALURU_BBOX.minLat || lat > BENGALURU_BBOX.maxLat ||
        lng < BENGALURU_BBOX.minLng || lng > BENGALURU_BBOX.maxLng
      ) {
        continue;
      }

      const props = incident.properties ?? {};
      const description = props.events?.[0]?.description ?? 'Traffic incident';
      const from = props.from ?? '';
      const to = props.to ?? '';
      const locationName = from && to
        ? `Incident: ${from} → ${to}`
        : `Incident: ${description}`;

      // magnitudeOfDelay: 0=unknown,1=minor,2=moderate,3=major,4=undefined
      const magnitudeMap: Record<number, number> = { 0: 20, 1: 30, 2: 55, 3: 80, 4: 20 };
      const congestionLevel = magnitudeMap[props.magnitudeOfDelay ?? 0] ?? 20;

      records.push({
        location_name: locationName.slice(0, 255),
        latitude: lat,
        longitude: lng,
        congestion_level: congestionLevel,
        current_speed: null,
        free_flow_speed: null,
        data_source: 'tomtom-incidents',
        recorded_at: now,
      });
    }

    console.log(`[TomTom Incidents] Mapped ${records.length} valid incident records`);
    return records;
  } catch (error) {
    console.error('[TomTom Incidents] Fetch failed:', error instanceof Error ? error.message : error);
    return [];
  }
}

async function fetchTomTomRoadWorks(apiKey: string): Promise<IncidentRecord[]> {
  try {
    const { minLat, maxLat, minLng, maxLng } = BENGALURU_BBOX;
    const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;

    // categoryFilter 8 = road works in TomTom incident categories
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${bbox}&fields={incidents{type,geometry{coordinates},properties{iconCategory,magnitudeOfDelay,events{description,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}&language=en-GB&categoryFilter=8&timeValidityFilter=present`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[TomTom RoadWorks] HTTP ${response.status}`);
      return [];
    }

    const data = await response.json() as TomTomIncidentsResponse;
    const incidents = data.incidents ?? [];

    console.log(`[TomTom RoadWorks] Received ${incidents.length} road works`);

    const records: IncidentRecord[] = [];
    const now = new Date().toISOString();

    for (const incident of incidents) {
      let lat = BENGALURU_CENTER.lat;
      let lng = BENGALURU_CENTER.lng;

      const coords = incident.geometry?.coordinates;
      if (Array.isArray(coords)) {
        if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
          lng = coords[0] as number;
          lat = coords[1] as number;
        } else if (Array.isArray(coords[0])) {
          const first = coords[0] as number[];
          lng = first[0];
          lat = first[1];
        }
      }

      if (
        lat < BENGALURU_BBOX.minLat || lat > BENGALURU_BBOX.maxLat ||
        lng < BENGALURU_BBOX.minLng || lng > BENGALURU_BBOX.maxLng
      ) {
        continue;
      }

      const props = incident.properties ?? {};
      const description = props.events?.[0]?.description ?? 'Road works';
      const from = props.from ?? '';
      const to = props.to ?? '';
      const locationName = from && to
        ? `Road works: ${from} → ${to}`
        : `Road works: ${description}`;

      records.push({
        location_name: locationName.slice(0, 255),
        latitude: lat,
        longitude: lng,
        congestion_level: 40, // road works always cause moderate disruption
        current_speed: null,
        free_flow_speed: null,
        data_source: 'tomtom-roadworks',
        recorded_at: now,
      });
    }

    console.log(`[TomTom RoadWorks] Mapped ${records.length} valid road work records`);
    return records;
  } catch (error) {
    console.error('[TomTom RoadWorks] Fetch failed:', error instanceof Error ? error.message : error);
    return [];
  }
}

async function storeIncidentsAndRoadWorks(
  supabase: SupabaseClient,
  incidents: IncidentRecord[],
  roadWorks: IncidentRecord[],
) {
  const allRecords = [...incidents, ...roadWorks];

  if (allRecords.length === 0) {
    console.log('[Incidents] No incidents or road works to store');
    return;
  }

  // Delete stale incidents and road works older than 1 hour
  await supabase
    .from('traffic_history')
    .delete()
    .in('data_source', ['tomtom-incidents', 'tomtom-roadworks'])
    .lt('recorded_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

  const { error } = await supabase
    .from('traffic_history')
    .insert(allRecords);

  if (error) {
    console.error('[Incidents] DB insert failed:', error.message);
    throw error;
  }

  console.log(`[Incidents] Stored ${incidents.length} incidents + ${roadWorks.length} road works`);
}

async function fetchLastKnownWeather(supabase: SupabaseClient): Promise<WeatherSnapshot | null> {
  const { data, error } = await supabase
    .from("traffic_history")
    .select("weather_condition, weather_temp")
    .not("weather_condition", "is", null)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    condition: data.weather_condition || "unknown",
    temperature: data.weather_temp,
  };
}

async function storeTrafficRows(
  supabase: SupabaseClient,
  rows: TrafficRecord[],
) {
  const rowsToInsert = rows.map((row) => ({
    location_name: row.location_name,
    latitude: row.latitude,
    longitude: row.longitude,
    congestion_level: row.congestion_level,
    current_speed: row.current_speed,
    free_flow_speed: row.free_flow_speed,
    data_source: "tomtom",
    recorded_at: new Date().toISOString(),
  }));

  console.log("[Supabase] Attempting insert of", rowsToInsert.length, "rows");
  console.log("[Supabase] First row sample:", JSON.stringify(rowsToInsert[0]));

  const { error } = await supabase
    .from("traffic_history")
    .insert(rowsToInsert);

  if (error) {
    console.error("[Supabase] Real insert FAILED:", error.message);
    throw error;
  }

  console.log("[Supabase] Real insert SUCCESS -", rowsToInsert.length, "traffic rows written");
}

async function upsertRouteReliability(
  supabase: SupabaseClient,
  rows: TrafficRecord[],
  weatherCondition: string,
  timestamp: string,
) {
  const congestionByName = new Map(rows.map((row) => [row.location_name, row.congestion_level]));
  const locationNames = [...new Set(rows.map((row) => row.location_name))];
  const dayOfWeek = rows[0]?.day_of_week ?? new Date(timestamp).getDay();
  const departureHour = rows[0]?.departure_hour ?? new Date(timestamp).getHours();
  const routePairs: Array<{ from: string; to: string }> = [];
  const seen = new Set<string>();
  for (let i = 0; i < locationNames.length; i += 1) {
    for (let j = i + 1; j < locationNames.length; j += 1) {
      const from = locationNames[i];
      const to = locationNames[j];
      const routeHash = getRouteHash(from, to);
      const key = `${routeHash}-${dayOfWeek}-${departureHour}-${weatherCondition}`;

      if (seen.has(key)) {
        console.warn("[Routes] Skipping duplicate pair:", from, "->", to);
        continue;
      }

      seen.add(key);
      routePairs.push({ from, to });
    }
  }
  console.log("[Routes] Computing reliability for", routePairs.length, "unique route pairs");

  const routeHashes = routePairs.map((route) => getRouteHash(route.from, route.to));

  const { data: existingRows } = await supabase
    .from("route_reliability")
    .select("*")
    .in("route_hash", routeHashes)
    .eq("day_of_week", dayOfWeek)
    .eq("departure_hour", departureHour)
    .eq("weather_condition", weatherCondition);

  const existingMap = new Map(
    (existingRows || []).map((row) => [
      `${row.route_hash}|${row.day_of_week}|${row.departure_hour}|${row.weather_condition}`,
      row,
    ]),
  );

  const upserts = routePairs.map((route) => {
    const { trackedFrom, trackedTo } = getTrackedRouteSummary(route.from, route.to);
    const fromCongestion = congestionByName.get(trackedFrom) ?? 0;
    const toCongestion = congestionByName.get(trackedTo) ?? 0;
    const congestionLevel = getWeightedRouteCongestion(fromCongestion, toCongestion);
    const distanceFactor = getRouteBaseTime(route.from, route.to);
    const newDuration = Number((distanceFactor * (1 + congestionLevel / 100)).toFixed(2));
    const routeHash = getRouteHash(route.from, route.to);
    const key = `${routeHash}|${dayOfWeek}|${departureHour}|${weatherCondition}`;
    const existing = existingMap.get(key);
    const sampleCount = existing?.sample_count ?? 0;
    const nextSampleCount = sampleCount + 1;
    const previousAverage = existing?.avg_duration_mins ?? newDuration;
    const averageDuration = ((previousAverage * sampleCount) + newDuration) / nextSampleCount;

    return {
      route_hash: routeHash,
      from_location: route.from,
      to_location: route.to,
      day_of_week: dayOfWeek,
      departure_hour: departureHour,
      weather_condition: weatherCondition,
      avg_duration_mins: Number(averageDuration.toFixed(2)),
      p90_duration_mins: Math.max(existing?.p90_duration_mins ?? 0, newDuration),
      min_duration_mins: existing?.min_duration_mins
        ? Math.min(existing.min_duration_mins, newDuration)
        : newDuration,
      sample_count: nextSampleCount,
      last_updated: timestamp,
    };
  });

  for (const pair of upserts) {
    const { error } = await supabase
      .from("route_reliability")
      .upsert(pair, {
        onConflict: "route_hash,day_of_week,departure_hour,weather_condition",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(
        "[Routes] Upsert failed for",
        pair.from_location,
        "->",
        pair.to_location,
        ":",
        error.message,
      );
    }
  }

  console.log("[Routes] Route reliability update complete");

  return upserts.length;
}

const parseBestTimeWindow = (value: string | undefined | null) => {
  if (!value) {
    return { start: null, end: null };
  }

  const [start, end] = value.split("-").map((part) => part.trim());
  const normalize = (timeValue?: string) => {
    if (!timeValue) {
      return null;
    }

    const match = timeValue.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
      return null;
    }

    const hours = match[1].padStart(2, "0");
    const minutes = match[2].padStart(2, "0");
    return `${hours}:${minutes}:00`;
  };

  return {
    start: normalize(start),
    end: normalize(end),
  };
};

const timeStringToMinutes = (value: string | null) => {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(":").map((part) => Number.parseInt(part, 10));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

async function storeAiPrediction(
  supabase: SupabaseClient,
  hotspots: TrafficRecord[],
  weather: WeatherSnapshot,
  timestamp: string,
) {
  // Query the last prediction to see if we should skip
  const { data: lastPrediction } = await supabase
    .from("ai_predictions")
    .select("predicted_at")
    .order("predicted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const minutesSinceLast = lastPrediction 
    ? (Date.now() - new Date(lastPrediction.predicted_at).getTime()) / 60000 
    : 999;

  if (lastPrediction && minutesSinceLast < 25) {
    console.info('[Gemini] Skipping this run — predictions fresh enough');
    return false;
  }

  console.info('[Gemini] Generating fresh predictions');

  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    console.error("[Gemini] Missing GEMINI_API_KEY");
    return false;
  }

  const predictionDate = new Date(timestamp);
  const ist = getIstParts(predictionDate);
  const hour = ist.hour;
  const avgCongestion = hotspots.length
    ? Number((hotspots.reduce((sum, hotspot) => sum + hotspot.congestion_level, 0) / hotspots.length).toFixed(2))
    : 0;
  const dayOfPrediction = predictionDate.getDay();
  const phase = hour >= 22
    ? "late night"
    : isPeakHour(hour)
      ? "peak hour"
      : "off-peak";

  const nowIST = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    weekday: 'long',
  });

  const systemPrompt = `You are a Bengaluru traffic analyst.
Current time in Bengaluru: ${nowIST} IST.
The bestTimeToTravel field must be a future time window within the next 6 hours from NOW.
Never suggest a time that has already passed today.
Never use the word "Tomorrow".
If no good window exists in the next 6 hours, say "Late tonight after 11:00 PM".

It is ${phase}.
Current weather: ${weather.condition}, ${weather.temperature ?? "--"}°C.

Respond ONLY in this exact JSON format, no other text:
{
  "best_time_window": "09:00-10:30",
  "next_1h_congestion": 35,
  "next_2h_congestion": 40,
  "next_3h_congestion": 30,
  "city_summary": "...",
  "avoid_areas": ["Location A", "Location B"],
  "alternate_routes": [
    {
      "from": "Koramangala",
      "to": "Hebbal",
      "time_saved_mins": 15,
      "via": "Outer Ring Road"
    }
  ]
}`;

  const userPrompt = `Current traffic data:
${hotspots.map((hotspot) => `- ${hotspot.location_name}: ${hotspot.congestion_level}% congestion, ${hotspot.current_speed ?? "--"} kmph`).join("\n")}
City average congestion: ${avgCongestion}%
Time: ${ist.timeLabel}
Weather: ${weather.condition}, ${weather.temperature ?? "--"}°C
Day: ${ist.label}
Is peak hour: ${isPeakHour(hour) ? "yes" : "no"}`;

  try {
    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    console.log("[Gemini] Starting AI prediction call...");

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${geminiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    console.log("[Gemini] Response status:", geminiRes.status);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[Gemini] Failed:", errText);
      return false;
    }

    const geminiData = await geminiRes.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    console.log("[Gemini] Raw response:", JSON.stringify(geminiData).slice(0, 200));

    const rawContent = geminiData.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(rawContent) as {
      best_time_window?: string;
      next_1h_congestion?: number;
      next_2h_congestion?: number;
      next_3h_congestion?: number;
      city_summary?: string;
      avoid_areas?: string[];
      alternate_routes?: unknown[];
    };

    const { start, end } = parseBestTimeWindow(parsed.best_time_window);
    const bestTimeIsFuture = (() => {
      const startMinutes = timeStringToMinutes(start);
      if (startMinutes === null) {
        return null;
      }
      return startMinutes >= (hour * 60 + ist.minute);
    })();

    const predictionRow = {
      predicted_at: timestamp,
      best_time_window_start: start,
      best_time_window_end: end,
      best_time_is_future: bestTimeIsFuture,
      next_1h_congestion: parsed.next_1h_congestion ?? null,
      next_2h_congestion: parsed.next_2h_congestion ?? null,
      next_3h_congestion: parsed.next_3h_congestion ?? null,
      city_summary: parsed.city_summary ?? null,
      avoid_areas: parsed.avoid_areas ?? [],
      alternate_routes: parsed.alternate_routes ?? [],
      raw_gemini_response: rawContent,
      avg_congestion_at_prediction: avgCongestion,
      weather_at_prediction: weather.condition,
      hour_of_prediction: hour,
      day_of_prediction: dayOfPrediction,
    };

    const { error: aiError } = await supabase.from("ai_predictions").upsert(predictionRow, { onConflict: "hour_of_prediction,day_of_prediction" });

    if (aiError) {
      console.error("[Gemini] DB insert failed:", aiError.message);
      return false;
    }

    console.log("[Gemini] AI prediction saved to DB");

    await supabase
      .from("ai_predictions")
      .delete()
      .lt("predicted_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return true;
  } catch (error) {
    console.error("[Gemini] Exception:", error instanceof Error ? error.message : error);
    return false;
  }
}

async function storeDisasterAlerts(
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceRoleKey: string,
) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/landslide-predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scheduled: true }),
    });

    if (!response.ok) {
      throw new Error(`landslide-predictions failed with status ${response.status}`);
    }

    const payload = await response.json() as LandslidePredictionResponse;
    if (!payload.success) {
      console.error("[Disaster] landslide-predictions returned unsuccessful payload");
      return false;
    }

    const fetchedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

    const alerts = [
      ...(payload.riskZones || []).map((zone) => ({
        alert_type: "landslide",
        severity: zone.riskLevel,
        location_name: zone.district,
        description: `${zone.district} risk at ${zone.riskScore}%`,
        raw_data: zone,
        fetched_at: fetchedAt,
        expires_at: expiresAt,
      })),
      ...(payload.earthquakes || []).map((quake) => ({
        alert_type: "earthquake",
        severity: quake.magnitude >= 4 ? "high" : quake.magnitude >= 3 ? "moderate" : "low",
        location_name: quake.place,
        description: `M${quake.magnitude} earthquake near ${quake.place}`,
        raw_data: quake,
        fetched_at: fetchedAt,
        expires_at: expiresAt,
      })),
      ...((payload.nasaEvents?.karnatakaEvents || []).map((event) => ({
        alert_type: "landslide",
        severity: "moderate",
        location_name: event.title,
        description: event.title,
        raw_data: event,
        fetched_at: fetchedAt,
        expires_at: expiresAt,
      }))),
    ];

    await supabase
      .from("disaster_alerts")
      .delete()
      .or("alert_type.eq.landslide,alert_type.eq.earthquake,alert_type.eq.flood");

    if (alerts.length > 0) {
      const { error } = await supabase.from("disaster_alerts").insert(alerts);
      if (error) {
        throw error;
      }
    }

    await supabase
      .from("disaster_alerts")
      .delete()
      .lt("expires_at", new Date().toISOString());

    return true;
  } catch (error) {
    console.error("[Disaster] Alert refresh failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

async function upsertHeartbeat(
  supabase: SupabaseClient,
  timestamp: string,
  rows: TrafficRecord[],
  weather: WeatherSnapshot,
) {
  const avgCityCongestion = rows.length
    ? Number((rows.reduce((sum, row) => sum + row.congestion_level, 0) / rows.length).toFixed(2))
    : null;

  const { error } = await supabase
    .from("data_refresh_heartbeat")
    .upsert({
      id: 1,
      last_refreshed_at: timestamp,
      traffic_locations_updated: rows.length,
      avg_city_congestion: avgCityCongestion,
      weather_condition: weather.condition,
      weather_temp: weather.temperature,
    });

  if (error) {
    throw error;
  }
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

  const cronSecret = Deno.env.get('SCHEDULER_SECRET');
  const incomingSecret = req.headers.get('x-cron-secret');

  if (req.method !== 'OPTIONS' && incomingSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const missing = REQUIRED_SECRETS.filter((key) => !Deno.env.get(key));
  if (missing.length > 0) {
    console.error(`[FATAL] Missing secrets: ${missing.join(", ")}`);
    return new Response(
      JSON.stringify({
        error: "Missing required secrets",
        missing,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const tomtomApiKey = Deno.env.get("TOMTOM_API_KEY") ?? "";
    const openWeatherApiKey = Deno.env.get("OPENWEATHER_API_KEY") ?? "";
    const requestBody = await req.json().catch(() => null);
    const mode = typeof requestBody === "object" && requestBody && "mode" in requestBody
      ? (requestBody as { mode?: string }).mode
      : undefined;
    const targetLocations = mode === "airports" ? AIRPORT_LOCATIONS : TRACKED_LOCATIONS;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const now = new Date();
    const recordedAt = now.toISOString();
    const dayOfWeek = now.getDay();
    const departureHour = now.getHours();
    const weekend = dayOfWeek === 0 || dayOfWeek === 6;
    const peak = isPeakHour(departureHour);

    const flowResults = (await fetchTomTomTrafficFlow(tomtomApiKey, targetLocations)).map(({ location, flowData }) => {
      try {
        if (!flowData) {
          return null;
        }
        const congestion = calculateCongestion(flowData, location.name);
        console.log(`[TomTom] OK ${location.name}: ${flowData?.currentSpeed ?? "--"}kmph`);
        return {
          location,
          congestion: congestion.congestionLevel,
          currentSpeed: congestion.currentSpeed,
          freeFlowSpeed: congestion.freeFlowSpeed > 0 ? congestion.freeFlowSpeed : congestion.effectiveFreeFlow,
        };
      } catch (error) {
        console.error(`[TomTom] Fetch failed for ${location.name}:`, error instanceof Error ? error.message : error);
        return null;
      }
    });

    const validFlows = flowResults.filter((flow): flow is NonNullable<typeof flow> => Boolean(flow));
    if (validFlows.length === 0) {
      console.error(`[${recordedAt}] TomTom returned no usable traffic rows`);
      return new Response(JSON.stringify({
        success: true,
        skipped: "tomtom-unavailable",
        refreshedAt: recordedAt,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let weather: WeatherSnapshot | null = null;
    if (openWeatherApiKey) {
      try {
        weather = await fetchWeather(openWeatherApiKey);
        console.log(`[Weather] OK Bengaluru: ${weather?.condition ?? "unknown"} ${weather?.temperature ?? "--"}C`);
      } catch (error) {
        console.error("[Weather] Fetch failed:", error instanceof Error ? error.message : error);
      }
    }

    if (!weather) {
      try {
        weather = await fetchLastKnownWeather(supabase);
        if (weather) {
          console.log("[Weather] Using last known weather snapshot");
        }
      } catch (error) {
        console.error("[Weather] Last known weather lookup failed:", error instanceof Error ? error.message : error);
      }
    }

    if (!weather) {
      weather = { condition: "unknown", temperature: null };
    }

    const trafficRows: TrafficRecord[] = validFlows.map((flow) => ({
      location_name: flow.location.name,
      latitude: flow.location.lat,
      longitude: flow.location.lng,
      congestion_level: flow.congestion,
      current_speed: flow.currentSpeed,
      free_flow_speed: flow.freeFlowSpeed,
      recorded_at: recordedAt,
      data_source: "tomtom",
      weather_condition: weather.condition,
      weather_temp: weather.temperature,
      day_of_week: dayOfWeek,
      departure_hour: departureHour,
      is_peak_hour: peak,
      is_weekend: weekend,
    }));

    try {
      await storeTrafficRows(supabase, trafficRows);
      console.log(`[Supabase] Inserted ${trafficRows.length} traffic rows`);
      console.log("[Scheduler] Traffic insert done");
    } catch (error) {
      if (error && typeof error === "object" && "message" in error && "code" in error) {
        const dbError = error as { message?: string; code?: string };
        console.error("[Supabase] Insert failed:", dbError.message, dbError.code);
      } else {
        console.error("[Supabase] Insert threw:", error instanceof Error ? error.message : error);
      }
    }

    try {
      const count = await upsertRouteReliability(supabase, trafficRows, weather.condition, recordedAt);
      console.log(`[Supabase] Upserted ${count} route reliability rows`);
      console.log("[Scheduler] Routes done");
    } catch (error) {
      console.error("[Supabase] Route reliability upsert failed:", error instanceof Error ? error.message : error);
    }

    try {
      await storeAiPrediction(supabase, trafficRows, weather, recordedAt);
      console.log("[Scheduler] Gemini done");
    } catch (error) {
      console.error("[Scheduler] Gemini stage failed:", error instanceof Error ? error.message : error);
    }

    try {
      const [incidents, roadWorks] = await Promise.all([
        fetchTomTomIncidents(tomtomApiKey),
        fetchTomTomRoadWorks(tomtomApiKey),
      ]);
      await storeIncidentsAndRoadWorks(supabase, incidents, roadWorks);
      console.log('[Scheduler] Incidents + road works done');
    } catch (error) {
      console.error('[Scheduler] Incidents stage failed:', error instanceof Error ? error.message : error);
    }

    try {
      await storeDisasterAlerts(supabase, Deno.env.get("SUPABASE_URL") ?? "", serviceRoleKey);
    } catch (error) {
      console.error("[Scheduler] Disaster alerts stage failed:", error instanceof Error ? error.message : error);
    }

    try {
      await upsertHeartbeat(supabase, recordedAt, trafficRows, weather);
      console.log("[Supabase] Heartbeat updated successfully");
    } catch (error) {
      console.error("[Supabase] Heartbeat upsert failed:", error instanceof Error ? error.message : error);
    }

    return new Response(JSON.stringify({
      success: true,
      refreshedAt: recordedAt,
      trafficLocationsUpdated: trafficRows.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scheduler error";
    console.error("traffic-scheduler error:", error);

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
