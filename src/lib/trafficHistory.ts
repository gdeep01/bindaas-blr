import type { TrafficData, TrafficMetrics, HourlyDataPoint, RouteImpact } from '@/lib/trafficApi';
import type { Tables } from '@/integrations/supabase/types';

type TrafficHistoryRow = Tables<'traffic_history'>;

const TRANSIT_LOCATION_NAMES = new Set([
  'kempegowda international airport',
  'ksr bengaluru city railway station',
  'yeshwanthpur railway station',
  'bengaluru cantonment railway station',
]);

const isTransitLocation = (name: string) => {
  const normalized = name.trim().toLowerCase();
  return TRANSIT_LOCATION_NAMES.has(normalized) || normalized.includes('railway station') || normalized.includes('international airport');
};

const isRoadTrafficRow = (row: TrafficHistoryRow) =>
  row.data_source !== 'tomtom-incidents' &&
  row.data_source !== 'tomtom-roadworks' &&
  !isTransitLocation(row.location_name);

const toHourLabel = (hour: number) => {
  const normalized = ((hour % 24) + 24) % 24;
  const period = normalized >= 12 ? 'PM' : 'AM';
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${hour12} ${period}`;
};

const estimateEtaMinutes = (congestionLevel: number) => Math.round(congestionLevel * 0.6 + 5);

const getRouteStatus = (impactScore: number): RouteImpact['status'] => {
  if (impactScore >= 60) return 'congested';
  if (impactScore >= 35) return 'moderate';
  return 'clear';
};

export function buildTrafficSnapshot(rows: TrafficHistoryRow[], previous?: TrafficData | null): TrafficData | null {
  if (!rows.length) {
    return previous ?? null;
  }

  const trafficOnlyRows = rows.filter(isRoadTrafficRow);

  const latestByLocation = new Map<string, TrafficHistoryRow>();
  for (const row of trafficOnlyRows) {
    if (!latestByLocation.has(row.location_name)) {
      latestByLocation.set(row.location_name, row);
    }
  }

  const latestRows = Array.from(latestByLocation.values()).sort((a, b) => b.congestion_level - a.congestion_level);
  const latestTimestamp = latestRows.reduce<Date | null>((currentLatest, row) => {
    const rowDate = new Date(row.recorded_at);
    if (!currentLatest || rowDate > currentLatest) {
      return rowDate;
    }

    return currentLatest;
  }, null);

  const hotspots = latestRows.map((row) => ({
    name: row.location_name,
    congestionLevel: row.congestion_level,
    trend: 'stable' as const,
    eta: `+${estimateEtaMinutes(row.congestion_level)} min`,
    etaMinutes: estimateEtaMinutes(row.congestion_level),
    isRealData: row.data_source === 'tomtom',
    currentSpeed: row.current_speed,
    freeFlowSpeed: row.free_flow_speed,
    lat: row.latitude,
    lng: row.longitude,
  }));

  const avgCongestion = hotspots.length
    ? Math.round(hotspots.reduce((sum, hotspot) => sum + hotspot.congestionLevel, 0) / hotspots.length)
    : previous?.sentimentScore ?? 0;

  return {
    hotspots,
    sentimentScore: avgCongestion,
    timestamp: latestTimestamp?.toISOString() ?? previous?.timestamp ?? new Date().toISOString(),
    isPeakHour: previous?.isPeakHour ?? false,
    isWeekend: previous?.isWeekend ?? false,
    currentHour: latestTimestamp?.getHours() ?? previous?.currentHour ?? new Date().getHours(),
    dataSource: hotspots.some((hotspot) => hotspot.isRealData) ? 'Supabase Realtime' : 'Cached DB Snapshot',
    metrics: previous?.metrics,
  };
}

export function buildHourlyTrend(rows: TrafficHistoryRow[]): HourlyDataPoint[] {
  if (!rows.length) {
    return [];
  }

  const getIstHour = (dateStr: string): number => {
    const hourStr = new Date(dateStr).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false });
    return Number(hourStr);
  };

  const filteredRows = rows.filter(isRoadTrafficRow);
  const sortedRows = [...filteredRows].sort(
    (left, right) => new Date(left.recorded_at).getTime() - new Date(right.recorded_at).getTime(),
  );
  const buckets = new Map<number, { total: number; count: number }>();
  sortedRows.forEach((row) => {
    const hour = getIstHour(row.recorded_at);
    const existing = buckets.get(hour) ?? { total: 0, count: 0 };
    buckets.set(hour, {
      total: existing.total + row.congestion_level,
      count: existing.count + 1,
    });
  });

  const currentHour = getIstHour(sortedRows.at(-1)?.recorded_at ?? sortedRows[0].recorded_at);
  const hourlyTrend = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, bucket]) => {
      const value = Math.round(bucket.total / bucket.count);
      const label = toHourLabel(hour);

      if (hour <= currentHour) {
        return { time: label, congestion: value };
      }

      return { time: label, predicted: value };
    });

  if (hourlyTrend.length >= 2) {
    return hourlyTrend;
  }

  return sortedRows.slice(-12).map((row) => ({
    time: new Date(row.recorded_at).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    congestion: row.congestion_level,
  }));
}

export function buildTrafficMetrics(
  trafficData: TrafficData | null,
  rows: TrafficHistoryRow[],
  previous?: TrafficMetrics | null,
): TrafficMetrics | null {
  if (!trafficData?.hotspots.length) {
    return previous ?? null;
  }

  const filteredRows = rows.filter(isRoadTrafficRow);
  const hourlyTrend = buildHourlyTrend(filteredRows);
  const trendValues = hourlyTrend
    .map((point) => ({ label: point.time, value: point.congestion ?? point.predicted ?? 0 }))
    .filter((point) => point.value > 0);

  const peakPoint = trendValues.reduce<{ label: string; value: number } | null>((best, point) => {
    if (!best || point.value > best.value) {
      return point;
    }

    return best;
  }, null);

  const routeImpacts: RouteImpact[] = trafficData.hotspots.slice(0, 6).map((hotspot) => {
    // Base time: derived from free flow speed (distance proxy)
    // Assume average corridor length ~5km, base time = 5km / freeFlowSpeed * 60
    const freeFlow = hotspot.freeFlowSpeed && hotspot.freeFlowSpeed > 0
      ? hotspot.freeFlowSpeed
      : 30;
    const currentSpd = hotspot.currentSpeed && hotspot.currentSpeed > 0
      ? hotspot.currentSpeed
      : freeFlow * (1 - hotspot.congestionLevel / 100);
    const CORRIDOR_KM = 5;
    const baseTime = Math.round((CORRIDOR_KM / freeFlow) * 60);        // minutes at free flow
    const actualTime = Math.round((CORRIDOR_KM / currentSpd) * 60);    // minutes at current speed
    const delay = Math.max(0, actualTime - baseTime);
    const impactScore = Math.min(95, hotspot.congestionLevel);

    return {
      corridor: hotspot.name,
      baseTime,
      actualTime,
      delay,
      impactScore,
      status: getRouteStatus(impactScore),
      hasIncident: false,
      hasRoadWork: false,
    };
  });

  const avgCommuteMinutes = routeImpacts.length
    ? Math.round(routeImpacts.reduce((sum, route) => sum + route.actualTime, 0) / routeImpacts.length)
    : previous?.avgCommuteMinutes ?? 0;

  const baselineCommute = routeImpacts.length
    ? Math.round(routeImpacts.reduce((sum, route) => sum + route.baseTime, 0) / routeImpacts.length)
    : avgCommuteMinutes;

  const commuteChangePercent = baselineCommute
    ? Math.round(((avgCommuteMinutes - baselineCommute) / baselineCommute) * 100)
    : previous?.commuteChangePercent ?? 0;

  return {
    avgCommuteMinutes,
    commuteChangePercent,
    peakHour: peakPoint?.label ?? previous?.peakHour ?? 'N/A',
    peakCongestion: peakPoint?.value ?? previous?.peakCongestion ?? 0,
    incidents: previous?.incidents ?? [],
    incidentCount: previous?.incidentCount ?? 0,
    roadWorks: previous?.roadWorks ?? [],
    roadWorksCount: previous?.roadWorksCount ?? 0,
    routeImpacts,
    weather: previous?.weather,
  };
}

export function formatElapsedTime(seconds: number) {
  const clampedSeconds = Math.max(0, Math.floor(seconds));
  if (clampedSeconds < 5) {
    return 'Just now';
  }

  if (clampedSeconds < 60) {
    return `${clampedSeconds}s ago`;
  }

  const minutes = Math.floor(clampedSeconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
