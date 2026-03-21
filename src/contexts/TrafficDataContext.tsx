import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { knownGarbageHotspots } from '@/data/garbageData';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { TrafficData, HourlyDataPoint, TrafficMetrics, Incident, RoadWork, StationTrafficData } from '@/lib/trafficApi';
import type { LandslideRiskZone, Earthquake, NASAEvent } from '@/lib/landslideApi';
import { buildHourlyTrend, buildTrafficMetrics } from '@/lib/trafficHistory';

type TrafficHistoryRow = Tables<'traffic_history'>;
type GarbageReportRow = Tables<'garbage_reports'>;
type HeartbeatRow = Tables<'data_refresh_heartbeat'>;
type AIPredictionRow = Tables<'ai_predictions'>;
type DisasterAlertRow = Tables<'disaster_alerts'>;

export interface GarbagePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'collection_center' | 'dump_yard' | 'hotspot' | 'user_report';
  description: string;
  severity?: string;
  reportType?: string;
  reportedAt?: string;
  reporterName?: string | null;
  moderationStatus?: string;
  upvotes?: number;
  imageUrls?: string[];
}

export interface AIPredictionView {
  predictedAt: string;
  bestTimeWindowStart: string | null;
  bestTimeWindowEnd: string | null;
  bestTimeIsFuture: boolean | null;
  next1hCongestion: number | null;
  next2hCongestion: number | null;
  next3hCongestion: number | null;
  citySummary: string | null;
  avoidAreas: string[];
  alternateRoutes: Array<{
    from?: string;
    to?: string;
    via?: string;
    time_saved_mins?: number;
  }>;
  avgCongestionAtPrediction: number | null;
  weatherAtPrediction: string | null;
  hourOfPrediction: number | null;
}

type FreshnessStatus = 'fresh' | 'delayed' | 'stale';
const IS_DEV = import.meta.env.DEV;

interface TrafficDataContextType {
  trafficData: TrafficData | null;
  hourlyTrend: HourlyDataPoint[];
  garbagePoints: GarbagePoint[];
  isLoading: boolean;
  dataError: string | null;
  lastUpdated: Date | null;
  countdown: number;
  freshnessStatus: FreshnessStatus;
  freshnessLabel: string;
  aiPrediction: AIPredictionView | null;
  landslideZones: LandslideRiskZone[];
  earthquakes: Earthquake[];
  nasaEvents: NASAEvent[];
  metrics: TrafficMetrics | null;
  userReportsCount: number;
  airportStations: Record<string, StationTrafficData | null>;
  handleReportSubmitted: () => void;
}

const TrafficDataContext = createContext<TrafficDataContextType | null>(null);

const FRESH_THRESHOLD_MS = 25 * 60 * 1000;   // 25 min
const STALE_THRESHOLD_MS = 40 * 60 * 1000;   // 40 min

const ETA_CONGESTION_FACTOR = 0.6;
const ETA_BASE_MINUTES = 5;
const INSIGHTS_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
const AIRPORT_STATION_NAMES = [
  'Kempegowda International Airport',
  'KSR Bengaluru City Railway Station',
  'Yeshwanthpur Railway Station',
  'Bengaluru Cantonment Railway Station',
];
interface TrafficInsightsPayload {
  success?: boolean;
  metrics?: {
    incidents?: Incident[];
    incidentCount?: number;
    roadWorks?: RoadWork[];
    roadWorksCount?: number;
  };
  data?: {
    metrics?: {
      incidents?: Incident[];
      incidentCount?: number;
      roadWorks?: RoadWork[];
      roadWorksCount?: number;
    };
  };
}

const mapAIPrediction = (row: AIPredictionRow | null): AIPredictionView | null => {
  if (!row) {
    return null;
  }

  return {
    predictedAt: row.predicted_at,
    bestTimeWindowStart: row.best_time_window_start,
    bestTimeWindowEnd: row.best_time_window_end,
    bestTimeIsFuture: row.best_time_is_future,
    next1hCongestion: row.next_1h_congestion,
    next2hCongestion: row.next_2h_congestion,
    next3hCongestion: row.next_3h_congestion,
    citySummary: row.city_summary,
    avoidAreas: row.avoid_areas ?? [],
    alternateRoutes: Array.isArray(row.alternate_routes) ? (row.alternate_routes as Array<{ from?: string; to?: string; via?: string; time_saved_mins?: number }>) : [],
    avgCongestionAtPrediction: row.avg_congestion_at_prediction,
    weatherAtPrediction: row.weather_at_prediction,
    hourOfPrediction: row.hour_of_prediction,
  };
};

const buildGarbagePoints = (reports: GarbageReportRow[]): GarbagePoint[] => {
  const staticPoints: GarbagePoint[] = knownGarbageHotspots.map((hotspot) => ({
    id: hotspot.id,
    name: hotspot.name,
    lat: hotspot.lat,
    lng: hotspot.lng,
    type: hotspot.type,
    description: hotspot.description,
  }));

  const userReports: GarbagePoint[] = reports.map((report) => ({
    id: report.id,
    name: report.location_name,
    lat: Number(report.latitude),
    lng: Number(report.longitude),
    type: 'user_report',
    description: report.description || 'Reported garbage issue',
    severity: report.severity,
    reportType: report.report_type,
    reportedAt: report.reported_at,
    reporterName: report.reporter_name,
    moderationStatus: report.moderation_status,
    upvotes: report.upvotes,
    imageUrls: report.image_urls ?? [],
  }));

  return [...staticPoints, ...userReports];
};

const mapDisasterAlerts = (alerts: DisasterAlertRow[]) => {
  const landslideZones = alerts
    .filter((alert) => alert.alert_type === 'landslide')
    .map((alert) => alert.raw_data)
    .filter((value) => Boolean(value && typeof value === 'object' && 'district' in value)) as unknown as LandslideRiskZone[];

  const earthquakes = alerts
    .filter((alert) => alert.alert_type === 'earthquake')
    .map((alert) => alert.raw_data)
    .filter((value) => Boolean(value && typeof value === 'object' && 'magnitude' in value)) as unknown as Earthquake[];

  const nasaEvents = alerts
    .filter((alert) => alert.alert_type === 'landslide' && alert.raw_data && typeof alert.raw_data === 'object' && 'title' in alert.raw_data)
    .map((alert) => alert.raw_data)
    .filter((value) => Boolean(value && typeof value === 'object' && 'title' in value && 'id' in value)) as unknown as NASAEvent[];

  return { landslideZones, earthquakes, nasaEvents };
};

const getFreshnessStatus = (ageMs: number): FreshnessStatus => {
  if (ageMs < FRESH_THRESHOLD_MS) {
    return 'fresh';
  }

  if (ageMs <= STALE_THRESHOLD_MS) {
    return 'delayed';
  }

  return 'stale';
};

const formatAge = (ageMs: number): string => {
  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toFiniteNumber = (value: number | string | undefined): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
};

const getCoordinatePair = (item: unknown): { lat: number | null; lng: number | null } => {
  if (!item || typeof item !== 'object') {
    return { lat: null, lng: null };
  }

  const candidate = item as Record<string, unknown> & {
    point?: Record<string, unknown>;
    geometry?: { coordinates?: unknown };
  };

  const lat =
    toFiniteNumber(candidate.lat as number | string | undefined) ??
    toFiniteNumber(candidate.latitude as number | string | undefined) ??
    toFiniteNumber(candidate.point?.lat as number | string | undefined) ??
    toFiniteNumber(candidate.point?.latitude as number | string | undefined);
  const lng =
    toFiniteNumber(candidate.lng as number | string | undefined) ??
    toFiniteNumber(candidate.longitude as number | string | undefined) ??
    toFiniteNumber(candidate.point?.lng as number | string | undefined) ??
    toFiniteNumber(candidate.point?.longitude as number | string | undefined);

  if (lat !== null && lng !== null) {
    return { lat, lng };
  }

  if (Array.isArray(candidate.geometry?.coordinates) && candidate.geometry.coordinates.length >= 2) {
    const [geometryLng, geometryLat] = candidate.geometry.coordinates as [unknown, unknown];
    return {
      lat: toFiniteNumber(geometryLat as number | string | undefined),
      lng: toFiniteNumber(geometryLng as number | string | undefined),
    };
  }

  return { lat: null, lng: null };
};

async function fetchIncidentsFromDB(): Promise<{ incidents: Incident[]; roadWorks: RoadWork[] }> {
  const { data, error } = await supabase
    .from('traffic_history')
    .select('location_name, latitude, longitude, congestion_level, data_source, recorded_at')
    .in('data_source', ['tomtom-incidents', 'tomtom-roadworks'])
    .order('recorded_at', { ascending: false })
    .limit(500);

  if (error || !data || data.length === 0) return { incidents: [], roadWorks: [] };

  const latestTimestamp = new Date(data[0].recorded_at).getTime();
  const twoMinutesMs = 2 * 60 * 1000;

  const batchData = data.filter(row => {
    const rowTime = new Date(row.recorded_at).getTime();
    return latestTimestamp - rowTime <= twoMinutesMs;
  });

  const incidents: Incident[] = batchData
    .filter(row => row.data_source === 'tomtom-incidents')
    .map(row => ({
      location: row.location_name,
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      severity: row.congestion_level > 60 ? 'MAJOR' : row.congestion_level > 30 ? 'MODERATE' : 'MINOR',
      description: row.location_name,
      delay: `${row.congestion_level}%`,
    }));

  const roadWorks: RoadWork[] = batchData
    .filter(row => row.data_source === 'tomtom-roadworks')
    .map(row => ({
      location: row.location_name,
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      description: row.location_name,
      severity: 'MODERATE',
      delay: `${row.congestion_level}%`,
    }));

  return { incidents, roadWorks };
}



export const useTrafficData = () => {
  const context = useContext(TrafficDataContext);
  if (!context) {
    throw new Error('useTrafficData must be used within TrafficDataProvider');
  }

  return context;
};

export const TrafficDataProvider = ({ children }: { children: ReactNode }) => {
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [hourlyTrend, setHourlyTrend] = useState<HourlyDataPoint[]>([]);
  const [garbagePoints, setGarbagePoints] = useState<GarbagePoint[]>([]);
  const [aiPrediction, setAiPrediction] = useState<AIPredictionView | null>(null);
  const [landslideZones, setLandslideZones] = useState<LandslideRiskZone[]>([]);
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [nasaEvents, setNasaEvents] = useState<NASAEvent[]>([]);
  const [metrics, setMetrics] = useState<TrafficMetrics | null>(null);
  const [airportStations, setAirportStations] = useState<Record<string, StationTrafficData | null>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mostRecentRecordedAt, setMostRecentRecordedAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const trafficDataRef = useRef<TrafficData | null>(null);
  const lastInsightsFetchRef = useRef<number>(Number(sessionStorage.getItem('lastInsightsFetch')) || 0);

  useEffect(() => {
    trafficDataRef.current = trafficData;
  }, [trafficData]);

  const refreshFromDB = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true);
    }

    try {
    const nowIso = new Date().toISOString();
    const last24HoursIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Core queries that must succeed
    const [latestTrafficResponse, trafficHistoryResponse, heartbeatResponse] = await Promise.all([
      supabase
        .from('traffic_history')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100),
      supabase
        .from('traffic_history')
        .select('*')
        .gte('recorded_at', last24HoursIso)
        .order('recorded_at', { ascending: true })
        .limit(1000),
      supabase
        .from('data_refresh_heartbeat')
        .select('*')
        .eq('id', 1)
        .maybeSingle(),
    ]);

    // Non-critical queries — use allSettled so failures don't crash the refresh
    const [aiResult, garbageResult, disasterResult] = await Promise.allSettled([
      supabase
        .from('ai_predictions')
        .select('*')
        .order('predicted_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('garbage_reports')
        .select('id, location_name, latitude, longitude, description, severity, report_type, reported_at, reporter_name, moderation_status, upvotes, image_urls')
        .order('reported_at', { ascending: false })
        .limit(50),
      supabase
        .from('disaster_alerts')
        .select('*')
        .gte('expires_at', nowIso)
        .order('fetched_at', { ascending: false })
        .limit(200),
    ]);

    const aiResponse = aiResult.status === 'fulfilled' ? aiResult.value : { data: null, error: null };
    const garbageResponse = garbageResult.status === 'fulfilled' ? garbageResult.value : { data: null, error: null };
    const disasterResponse = disasterResult.status === 'fulfilled' ? disasterResult.value : { data: null, error: null };

    // Traffic-insights: separate call with 15-min cooldown
    let trafficInsightsResponse: { data: TrafficInsightsPayload | null; error: { message: string } | null } = { data: null, error: null };
    const now = Date.now();
    if (now - lastInsightsFetchRef.current >= INSIGHTS_COOLDOWN_MS) {
      try {
        if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
          console.warn('VITE_SUPABASE_ANON_KEY is undefined!');
        }
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/traffic-insights`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ type: 'data' }),
            cache: 'no-store',
            mode: 'cors',
            signal: AbortSignal.timeout(10000),
          }
        );
        const data = await res.json();
        trafficInsightsResponse = { data, error: data.error ? { message: data.error } : null };
        lastInsightsFetchRef.current = now;
        sessionStorage.setItem('lastInsightsFetch', now.toString());
      } catch (insightsErr) {
        // Make failures visible on mobile devtools as well.
        console.error('incidents fetch failed:', insightsErr);
        if (IS_DEV) {
          console.warn('traffic-insights call failed:', insightsErr instanceof Error ? insightsErr.message : insightsErr);
        }
      }
    }

    setDataError(null);

    const latestTrafficRows = (latestTrafficResponse.data || []) as TrafficHistoryRow[];
    const historyRows = (trafficHistoryResponse.data || []) as TrafficHistoryRow[];
    const heartbeat = heartbeatResponse.data as HeartbeatRow | null;
    const latestAi = aiResponse.data as AIPredictionRow | null;
    const garbageRows = (garbageResponse.data || []) as GarbageReportRow[];
    const disasterAlerts = (disasterResponse.data || []) as DisasterAlertRow[];
    const seen = new Set<string>();
    const latestRowsByLocation = latestTrafficRows.filter((row) => {
  if (
    row.data_source === 'tomtom-incidents' ||
    row.data_source === 'tomtom-roadworks'
  ) {
    return false;
  }
  if (seen.has(row.location_name)) {
    return false;
  }
  seen.add(row.location_name);
  return true;
});
    const latestRecordedRow = latestTrafficRows.reduce<TrafficHistoryRow | null>((latest, row) => {
      if (!latest) {
        return row;
      }
      return new Date(row.recorded_at) > new Date(latest.recorded_at) ? row : latest;
    }, null);

    const stationData: Record<string, StationTrafficData | null> = {};
    AIRPORT_STATION_NAMES.forEach(name => {
      const row = latestTrafficRows.find(r => r.location_name === name);
      if (row) {
        stationData[name] = {
          location_name: row.location_name,
          congestion_level: Number(row.congestion_level),
          current_speed: Number(row.current_speed ?? 0),
          free_flow_speed: Number(row.free_flow_speed ?? 0),
          recorded_at: row.recorded_at,
        };
      } else {
        stationData[name] = null;
      }
    });
    setAirportStations(stationData);

    // Always read only the latest batch from DB — single source of truth
    // Historical data is preserved in DB for analysis, frontend shows latest batch only
    const { incidents, roadWorks } = await fetchIncidentsFromDB();



    if (trafficInsightsResponse.error && IS_DEV) {
      console.warn('traffic-insights unavailable:', trafficInsightsResponse.error.message);
    }

    const hotspots = latestRowsByLocation.map((row) => ({
      name: row.location_name,
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      congestionLevel: Number(row.congestion_level),
      currentSpeed: Number(row.current_speed ?? 0),
      freeFlowSpeed: Number(row.free_flow_speed ?? 0),
      trend: 'stable' as const,
      eta: `${Math.max(ETA_BASE_MINUTES, Math.round(Number(row.congestion_level) * ETA_CONGESTION_FACTOR + ETA_BASE_MINUTES))} min`,
      etaMinutes: Math.max(ETA_BASE_MINUTES, Math.round(Number(row.congestion_level) * ETA_CONGESTION_FACTOR + ETA_BASE_MINUTES)),
      isRealData: row.data_source === 'tomtom',
    }));
    const nonZeroHotspots = hotspots.filter((hotspot) => hotspot.congestionLevel > 0);
    const avgCongestion =
      nonZeroHotspots.length > 0
        ? Math.round(
            nonZeroHotspots.reduce((sum, hotspot) => sum + hotspot.congestionLevel, 0) / nonZeroHotspots.length,
          )
        : 0;

    const snapshot =
      hotspots.length > 0
        ? {
            hotspots,
            sentimentScore: avgCongestion,
            timestamp: latestRecordedRow?.recorded_at ?? new Date().toISOString(),
            isPeakHour: latestRecordedRow?.is_peak_hour ?? false,
            isWeekend: latestRecordedRow?.is_weekend ?? false,
            currentHour:
              typeof latestRecordedRow?.departure_hour === 'number'
                ? latestRecordedRow.departure_hour
                : new Date().getHours(),
            dataSource: 'Supabase Realtime',
            metrics: trafficDataRef.current?.metrics,
          }
        : trafficDataRef.current;
    const trafficWeather = latestRecordedRow?.weather_condition
      ? {
          condition: latestRecordedRow.weather_condition,
          description: latestRecordedRow.weather_condition,
          temperature: latestRecordedRow.weather_temp ?? 0,
          humidity: 0,
          visibility: 0,
          windSpeed: 0,
          icon: '01d',
          impactLevel: 'none' as const,
        }
      : undefined;
    const nextMetrics = buildTrafficMetrics(snapshot, historyRows, trafficDataRef.current?.metrics ?? null);
    const mergedMetrics = nextMetrics
      ? {
          ...nextMetrics,
          incidents,
          incidentCount: incidents.length,
          roadWorks,
          roadWorksCount: roadWorks.length,
          weather: trafficWeather,
        }
      : null;

    if (snapshot) {
      setTrafficData({
        ...snapshot,
        metrics: mergedMetrics ?? undefined,
      });
    }

    setMetrics(mergedMetrics);
    setHourlyTrend(buildHourlyTrend(historyRows));
    setAiPrediction(mapAIPrediction(latestAi));
    setGarbagePoints(buildGarbagePoints(garbageRows));

    const disasterState = mapDisasterAlerts(disasterAlerts);
    setLandslideZones(disasterState.landslideZones);
    setEarthquakes(disasterState.earthquakes);
    setNasaEvents(disasterState.nasaEvents);

    const heartbeatDate = heartbeat?.last_refreshed_at
      ? new Date(heartbeat.last_refreshed_at)
      : latestRecordedRow?.recorded_at
        ? new Date(latestRecordedRow.recorded_at)
        : null;

    setLastUpdated(heartbeatDate);
    setMostRecentRecordedAt(latestRecordedRow?.recorded_at ?? null);

    if (isInitialLoad) {
      setIsLoading(false);
    }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load traffic data';
      if (IS_DEV) {
        console.error('refreshFromDB error:', err);
      }
      setDataError(message);
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshFromDB(true);

    const heartbeatChannel = supabase
      .channel('data-refresh')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'data_refresh_heartbeat',
        },
        () => {
          void refreshFromDB(false);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(heartbeatChannel);
    };
  }, [refreshFromDB]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshFromDB(false);
    }, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [refreshFromDB]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick((previous) => previous + 1);
    }, 15_000);

    return () => window.clearInterval(interval);
  }, []);

  const countdown = useMemo(() => {
    if (!mostRecentRecordedAt) {
      return 0;
    }

    void tick;
    const latestTimestamp = new Date(mostRecentRecordedAt).getTime(); // UTC ms
    const nowMs = Date.now(); // UTC ms
    const ageMs = nowMs - latestTimestamp;
    return ageMs;
  }, [mostRecentRecordedAt, tick]);

  const handleReportSubmitted = useCallback(() => {
    void refreshFromDB(false);
  }, [refreshFromDB]);

  const freshnessStatus = getFreshnessStatus(countdown);
  const freshnessLabel = useMemo(() => {
    if (freshnessStatus === 'fresh') {
      return `Updated ${formatAge(countdown)}`;
    }

    if (freshnessStatus === 'delayed') {
      return `Updated ${formatAge(countdown)}`;
    }

    return `Data may be delayed • ${formatAge(countdown)}`;
  }, [countdown, freshnessStatus]);

  const userReportsCount = garbagePoints.filter((point) => point.type === 'user_report').length;

  const contextValue = useMemo(() => ({
    trafficData,
    hourlyTrend,
    garbagePoints,
    isLoading,
    dataError,
    lastUpdated,
    countdown,
    freshnessStatus,
    freshnessLabel,
    aiPrediction,
    landslideZones,
    earthquakes,
    nasaEvents,
    metrics,
    userReportsCount,
    airportStations,
    handleReportSubmitted,
  }), [
    trafficData, hourlyTrend, garbagePoints, isLoading, dataError,
    lastUpdated, countdown, freshnessStatus, freshnessLabel,
    aiPrediction, landslideZones, earthquakes, nasaEvents,
    metrics, userReportsCount, airportStations, handleReportSubmitted,
  ]);

  return (
    <TrafficDataContext.Provider value={contextValue}>
      {children}
    </TrafficDataContext.Provider>
  );
};


