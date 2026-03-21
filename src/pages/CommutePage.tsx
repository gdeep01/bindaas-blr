import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, MessageCircle, TrendingUp, Wallet } from 'lucide-react';
import { LineChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTrafficData } from '@/contexts/TrafficDataContext';
import { useToast } from '@/hooks/use-toast';
import { ALL_COMMUTE_LOCATIONS, BIKE_COST_PER_KM, formatHourRange, getAutoFare, getBmtcFare, getCabFare, getMetroFare, getRouteDistance } from '@/lib/commute';
import { getTrackedRouteSummary, getWeightedRouteCongestion } from '@/lib/routeTiming';
import { typography } from '@/lib/typography';
import { DataCard } from '@/components/ui/DataCard';
import { useRouteBestTime } from '@/hooks/useRouteBestTime';
import { useRouteReliability } from '@/hooks/useRouteReliability';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const IS_DEV = import.meta.env.DEV;
const LOCATION_MAX_CHARS = 20;

type RouteHistoryRow = Pick<Tables<'traffic_history'>, 'location_name' | 'congestion_level' | 'recorded_at' | 'current_speed'>;

const truncateLocationName = (name: string) => {
  const trimmed = name.trim();
  if (trimmed.length <= LOCATION_MAX_CHARS) return trimmed;
  return `${trimmed.slice(0, LOCATION_MAX_CHARS)}\u2026`;
};

const getDistanceEstimate = (
  fromPoint?: { lat: number; lng: number },
  toPoint?: { lat: number; lng: number },
  fallbackBaseTime = 15,
) => {
  if (fromPoint && toPoint) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthRadius = 6371;
    const dLat = toRad(toPoint.lat - fromPoint.lat);
    const dLng = toRad(toPoint.lng - fromPoint.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(fromPoint.lat)) * Math.cos(toRad(toPoint.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.max(4, Math.round(earthRadius * c * 1.25));
  }

  return Math.max(5, Math.round(fallbackBaseTime / 1.8));
};

const formatChartHour = (value: string) =>
  new Date(value).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    hour12: true,
  });

const CommutePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { trafficData } = useTrafficData();

  const [routeHistory, setRouteHistory] = useState<RouteHistoryRow[]>([]);
  const [isRouteHistoryLoading, setIsRouteHistoryLoading] = useState(false);

  const paramFrom = searchParams.get('from') || '';
  const paramTo = searchParams.get('to') || '';
  const hasParams = Boolean(paramFrom && paramTo);

  const [fromLocation, setFromLocation] = useState(paramFrom || 'Koramangala Inner Ring Road');
  const [toLocation, setToLocation] = useState(paramTo || 'Whitefield Main Road');

  const [homeRoute, setHomeRoute] = useState<{ from: string; to: string } | null>(() => {
    const saved = window.localStorage.getItem('leaveNow_homeRoute');
    try {
      return saved ? (JSON.parse(saved) as { from: string; to: string }) : null;
    } catch {
      return null;
    }
  });
  const [officeRoute, setOfficeRoute] = useState<{ from: string; to: string } | null>(() => {
    const saved = window.localStorage.getItem('leaveNow_officeRoute');
    try {
      return saved ? (JSON.parse(saved) as { from: string; to: string }) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (paramFrom) setFromLocation(paramFrom);
    if (paramTo) setToLocation(paramTo);
  }, [paramFrom, paramTo]);

  const hotspots = useMemo(() => trafficData?.hotspots || [], [trafficData]);
  const currentFrom = paramFrom || fromLocation;
  const currentTo = paramTo || toLocation;
  const { trackedFrom, trackedTo, baseTime } = getTrackedRouteSummary(currentFrom, currentTo);
  const fromData = hotspots.find((hotspot) => hotspot.name.includes(trackedFrom) || trackedFrom.includes(hotspot.name));
  const toData = hotspots.find((hotspot) => hotspot.name.includes(trackedTo) || trackedTo.includes(hotspot.name));
  const fromCongestion = fromData?.congestionLevel ?? 0;
  const toCongestion = toData?.congestionLevel ?? 0;
  const routeCongestion = getWeightedRouteCongestion(fromCongestion, toCongestion);
  const estimatedMinutes = Math.round(baseTime + routeCongestion * 0.4);

  const weatherCondition = trafficData?.metrics?.weather?.condition;
  const { data: routeReliability } = useRouteBestTime({
    fromLocation: currentFrom,
    toLocation: currentTo,
    weatherCondition,
  });

  const { data: routeReliabilityData } = useRouteReliability({
    fromLocation: currentFrom,
    toLocation: currentTo,
  });

  useEffect(() => {
    if (!trackedFrom) return;
    let active = true;

    const fetchRouteHistory = async () => {
      setIsRouteHistoryLoading(true);
      const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      try {
        const { data, error } = await supabase
          .from('traffic_history')
          .select('location_name, congestion_level, recorded_at, current_speed')
          .eq('location_name', trackedFrom)
          .gte('recorded_at', sinceIso)
          .order('recorded_at', { ascending: true })
          .limit(288);

        if (error) {
          if (IS_DEV) console.error('Route history fetch failed:', error.message);
          if (active) setRouteHistory([]);
          return;
        }

        if (active) setRouteHistory((data || []) as RouteHistoryRow[]);
      } catch (error) {
        if (IS_DEV) console.error('Route history fetch failed:', error);
        if (active) setRouteHistory([]);
      } finally {
        if (active) setIsRouteHistoryLoading(false);
      }
    };

    void fetchRouteHistory();
    return () => {
      active = false;
    };
  }, [trackedFrom]);

  const chartData = useMemo(() => {
    const buckets = new Map<string, { recordedAt: string; totalCongestion: number; totalSpeed: number; count: number }>();

    routeHistory.forEach((row) => {
      const bucketDate = new Date(row.recorded_at);
      bucketDate.setMinutes(0, 0, 0);
      const bucketKey = bucketDate.toISOString();
      const currentBucket = buckets.get(bucketKey) ?? { recordedAt: bucketKey, totalCongestion: 0, totalSpeed: 0, count: 0 };

      buckets.set(bucketKey, {
        recordedAt: bucketKey,
        totalCongestion: currentBucket.totalCongestion + clamp(row.congestion_level),
        totalSpeed: currentBucket.totalSpeed + Number(row.current_speed ?? 0),
        count: currentBucket.count + 1,
      });
    });

    return Array.from(buckets.values()).map((bucket) => ({
      time: bucket.recordedAt,
      congestion: Math.round(bucket.totalCongestion / bucket.count),
      speed: Math.round(bucket.totalSpeed / bucket.count),
    }));
  }, [routeHistory]);

  const allZeroChart = chartData.length > 0 && chartData.every((point) => point.congestion === 0);
  const chartMaxCongestion = chartData.length > 0 ? Math.max(...chartData.map((point) => point.congestion)) : 0;

  const routeTimingData = routeReliability?.bestTime ?? routeReliability?.learning;
  const routeSampleCount = routeTimingData?.sampleCount ?? 0;
  const showEstimatedBadge = !routeTimingData || routeTimingData.isEstimated === true || routeSampleCount < 50;

  const bestWindow = useMemo(() => {
    if (routeTimingData && typeof routeTimingData.bestDepartureHour === 'number') {
      return {
        startHour: routeTimingData.bestDepartureHour,
        average: Math.round(routeTimingData.avgDurationMins),
      };
    }

    if (routeHistory.length < 2) return null;
    let best = { startHour: new Date(routeHistory[0].recorded_at).getHours(), average: 100 };
    for (let index = 0; index < routeHistory.length - 1; index += 1) {
      const first = routeHistory[index];
      const second = routeHistory[index + 1];
      const avg = Math.round((first.congestion_level + second.congestion_level) / 2);
      if (avg < best.average) best = { startHour: new Date(first.recorded_at).getHours(), average: avg };
    }
    return best;
  }, [routeHistory, routeTimingData]);

  const distanceKm = useMemo(() => {
    // Priority 1: Real computed distance if points available
    if (fromData && toData) {
      return getDistanceEstimate(
        { lat: fromData.lat, lng: fromData.lng },
        { lat: toData.lat, lng: toData.lng },
        baseTime
      );
    }
    // Priority 2: Precise lookup for known road pairs
    return getRouteDistance(currentFrom, currentTo);
  }, [fromData, toData, baseTime, currentFrom, currentTo]);
  const costOptions = useMemo(() => {
    const autoCost = Math.round(getAutoFare(distanceKm));
    const cabCost = Math.round(getCabFare(distanceKm));
    const metroCost = Math.round(getMetroFare(distanceKm));
    const busCost = Math.round(getBmtcFare(distanceKm));
    const bikeCost = Math.round(distanceKm * BIKE_COST_PER_KM);
    return [
      { mode: 'Auto Rickshaw', price: autoCost },
      { mode: 'Ola/Uber Mini', price: cabCost },
      { mode: 'Namma Metro', price: metroCost },
      { mode: 'BMTC Bus', price: busCost },
      { mode: 'Bike', price: bikeCost },
    ];
  }, [distanceKm]);

  const activeRouteIncidents = useMemo(() => {
    const incidents = trafficData?.metrics?.incidents ?? [];
    return incidents.filter((incident) => {
      const location = incident.location?.toLowerCase?.() ?? '';
      const needles = [trackedFrom, trackedTo, currentFrom, currentTo].map((value) => value.toLowerCase());
      return needles.some((needle) => needle && location.includes(needle));
    }).length;
  }, [currentFrom, currentTo, trackedFrom, trackedTo, trafficData?.metrics?.incidents]);

  const handleAnalyze = () => {
    navigate(`/commute?from=${encodeURIComponent(fromLocation)}&to=${encodeURIComponent(toLocation)}`);
  };

  const handleSaveHome = () => {
    const route = { from: fromLocation, to: toLocation };
    setHomeRoute(route);
    window.localStorage.setItem('leaveNow_homeRoute', JSON.stringify(route));
    toast({ title: 'Saved Home', description: `${fromLocation} \u2192 ${toLocation}` });
  };

  const handleSaveOffice = () => {
    const route = { from: fromLocation, to: toLocation };
    setOfficeRoute(route);
    window.localStorage.setItem('leaveNow_officeRoute', JSON.stringify(route));
    toast({ title: 'Saved Office', description: `${fromLocation} \u2192 ${toLocation}` });
  };

  const shareMessage = `${'\u{1F6A6}'} Bindaas BLR ${'\u2014'} Commute Update

From: ${currentFrom}
To: ${currentTo}

Traffic now: ${routeCongestion}% congestion
Est. travel time: ${estimatedMinutes} min

Check live Bengaluru traffic ${'\u2192'} https://bindaas-blr.vercel.app`;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      toast({ title: 'Copied!' });
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy manually.', variant: 'destructive' });
    }
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/?text=' + encodeURIComponent(shareMessage), '_blank');
  };

  const bottomNote = useMemo(() => {
    if (fromCongestion < 20) return `Traffic is light ${'\u2014'} good time to travel ${'\u{1F7E2}'}`;
    if (fromCongestion < 40) return `Moderate traffic ${'\u2014'} expect some delays ${'\u{1F7E1}'}`;
    if (fromCongestion < 60) return `Heavy traffic ${'\u2014'} consider leaving earlier ${'\u{1F534}'}`;
    return `Severe congestion ${'\u2014'} avoid if possible ${'\u203C\uFE0F'}`;
  }, [fromCongestion]);

  return (
    <div className="flex flex-col gap-6">
      {hasParams ? (
        <>
          <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight truncate">
            {`${currentFrom} \u2192 ${currentTo}`}
          </h1>
          <div className="md:hidden">
            <h1 className={typography.h1}>Commute Analysis</h1>
            <p className={`${typography.body} mt-1`}>
              {truncateLocationName(currentFrom)} {'\u2192'} {truncateLocationName(currentTo)}
            </p>
          </div>
        </>
      ) : (
        <h1 className={typography.h1}>Commute Analysis</h1>
      )}

      <div className="bg-muted/30 rounded-xl p-4">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div className="flex-1">
            <label className={typography.label}>From</label>
            <select
              value={fromLocation}
              onChange={(event) => setFromLocation(event.target.value)}
              className="mt-2 min-h-[44px] w-full rounded-xl border border-white/10 bg-background px-3 py-3 text-sm font-bold text-foreground"
            >
              {ALL_COMMUTE_LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className={typography.label}>To</label>
            <select
              value={toLocation}
              onChange={(event) => setToLocation(event.target.value)}
              className="mt-2 min-h-[44px] w-full rounded-xl border border-white/10 bg-background px-3 py-3 text-sm font-bold text-foreground"
            >
              {ALL_COMMUTE_LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveHome}
            className="min-h-[44px] rounded-xl border border-white/10 px-3 py-2 text-[0.75rem] font-bold text-muted-foreground hover:text-foreground"
          >
            {homeRoute ? 'Update Home' : 'Save Home'}
          </button>
          <button
            type="button"
            onClick={handleSaveOffice}
            className="min-h-[44px] rounded-xl border border-white/10 px-3 py-2 text-[0.75rem] font-bold text-muted-foreground hover:text-foreground"
          >
            {officeRoute ? 'Update Office' : 'Save Office'}
          </button>
          <button
            type="button"
            onClick={handleAnalyze}
            className="min-h-[44px] rounded-xl border border-primary bg-primary px-4 py-2 text-[0.75rem] font-bold text-primary-foreground"
          >
            Analyze
          </button>
        </div>
      </div>

      {hasParams ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <DataCard>
              <p className="eyebrow mb-1">CURRENT STATUS</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-sans text-xs text-white/40 font-light">Origin Congestion</span>
                  <span className={`${typography.dataValue} tabular-nums`}>{fromCongestion}%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-sans text-xs text-white/40 font-light">Route Estimate</span>
                  <span className={`${typography.dataValue} tabular-nums`}>{estimatedMinutes} min</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="font-sans text-xs text-white/40 font-light">Tracked Junction</span>
                  <span className={`${typography.dataValue} text-right`}>{fromData?.name || trackedFrom || 'N/A'}</span>
                </div>
                <div className="pt-2 text-[11px] text-muted-foreground">
                  Corridor note: {routeCongestion < 35 ? 'Low traffic corridor' : routeCongestion > 70 ? 'High congestion corridor' : 'Moderate corridor'} · {activeRouteIncidents} active incidents
                </div>
              </div>
            </DataCard>

            <DataCard>
              <p className="eyebrow mb-1">BEST TIME TO LEAVE</p>
              <div className="mt-4">
                <div className="eyebrow text-orange-400 mb-2">Optimal departure</div>
                <div className={`${typography.statLarge} text-orange-400`}>
                  {bestWindow ? formatHourRange(bestWindow.startHour) : '—'}
                </div>
                {showEstimatedBadge ? (
                  <span className="mt-3 badge badge-neutral">ESTIMATED</span>
                ) : null}
              </div>
            </DataCard>
          </div>

          <div className="border-t border-border pt-6">
            <DataCard>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="eyebrow">COST ESTIMATE</p>
                </div>
                <Wallet className="h-5 w-5 text-muted-foreground not-italic" />
              </div>
              <div>
                {costOptions.map((option) => (
                  <div key={option.mode} className="list-row flex items-center justify-between">
                    <span className={typography.dataValue}>{option.mode}</span>
                    <span className="font-display font-black text-white text-sm tracking-tight tabular-nums">{`\u20B9${option.price.toLocaleString('en-IN')}`}</span>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">Estimates based on current Bengaluru rates. Actual fares may vary.</p>
              </div>
            </DataCard>
          </div>

          <div className="border-t border-border pt-6">
            <DataCard>
              <p className="eyebrow mb-3">HOURLY CHART</p>
              <div className="mt-4 h-[300px] sm:h-[360px]">
                {!isRouteHistoryLoading && routeHistory.length < 2 ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-white/5 bg-card px-6 text-center text-muted-foreground">
                    <div>
                      <p className="text-sm text-foreground">Chart data is still building for this route.</p>
                      <p className="mt-1 text-xs text-muted-foreground">More samples arrive every 20 minutes.</p>
                    </div>
                  </div>
                ) : allZeroChart ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-white/5 bg-card px-6 text-center text-muted-foreground">
                    <div>
                      <p className="text-sm text-foreground">Traffic flowing freely</p>
                      <p className="mt-1 text-xs text-muted-foreground">No congestion recorded at this location today</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        minTickGap={28}
                        interval="preserveStartEnd"
                        tickFormatter={formatChartHour}
                      />
                      <YAxis domain={[0, Math.max(100, chartMaxCongestion + 10)]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip
                        labelFormatter={(value) => formatChartHour(String(value))}
                        formatter={(value) => [`${value}%`, 'Congestion:']}
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '4px',
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                      <Line type="monotone" dataKey="congestion" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} name="Congestion" animationDuration={800} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </DataCard>
          </div>

          <DataCard>
            <p className="eyebrow mb-3">CHANCE OF DELAY</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-card p-4">
                <p className={typography.label}>Trips Recorded</p>
                <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                  {routeReliabilityData?.sample_count ?? '\u2014'}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-card p-4">
                <p className={typography.label}>Average Time</p>
                <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                  {routeReliabilityData?.avg_duration_mins
                    ? `${Math.round(routeReliabilityData.avg_duration_mins)} min`
                    : '\u2014'}
                </p>
              </div>
            </div>
            <p className="font-sans text-xs text-white/35 font-light mt-3 pt-3 border-t border-white/[0.05]">
              Route reliability data is estimated based on historical patterns.
            </p>
          </DataCard>

          <DataCard>
            <p className="eyebrow mb-3">SHARE</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="min-h-[44px] rounded-xl border border-white/10 px-4 py-3 text-[0.75rem] font-bold text-foreground transition-colors hover:border-primary/40"
              >
                <span className="inline-flex items-center gap-2">
                  <Copy className="h-4 w-4 not-italic" />
                  Copy Message
                </span>
              </button>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="min-h-[44px] rounded-xl border border-primary px-4 py-3 text-[0.75rem] font-bold text-primary transition-colors hover:border-foreground hover:text-foreground"
              >
                <span className="inline-flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 not-italic" />
                  WhatsApp
                </span>
              </button>
            </div>
          </DataCard>

          <div className="py-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-card px-4 py-2 text-sm text-muted-foreground">{bottomNote}</span>
          </div>
        </>
      ) : (
        <DataCard>
          <p className={typography.body}>
            Set your Bengaluru commute above to generate a live route snapshot, best departure window, and cost estimate.
          </p>
        </DataCard>
      )}
    </div>
  );
};

export default CommutePage;
