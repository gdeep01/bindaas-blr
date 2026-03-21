import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Route, Sparkles } from 'lucide-react';
import { DataCard } from '@/components/ui/DataCard';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusDot } from '@/components/ui/StatusDot';
import { HotspotCard } from '@/components/HotspotCard';
import { typography } from '@/lib/typography';
import { useTrafficData } from '@/contexts/TrafficDataContext';
import { supabase } from '@/integrations/supabase/client';
import type { AIInsights, TrafficData } from '@/lib/trafficApi';
import { jsonrepair } from 'jsonrepair';

const OFF_PEAK_START_HOUR = 20;
const OFF_PEAK_END_HOUR = 6;
const STALE_PREDICTION_MS = 2 * 60 * 60 * 1000;
const DB_FRESH_MS = 60 * 60 * 1000;

const isOffPeakHour = (date = new Date()) => {
  const hour = date.getHours();
  return hour >= OFF_PEAK_START_HOUR || hour < OFF_PEAK_END_HOUR;
};

const formatWindow = (start: string | null, end: string | null) => {
  if (!start || !end) {
    return 'Now is a good time to travel';
  }

  return `${start.slice(0, 5)} \u2013 ${end.slice(0, 5)}`;
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return 'just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  return `${Math.floor(diffMinutes / 60)}h ago`;
};

const parseAiInsights = (raw: string): AIInsights | null => {
  let trimmed = raw.trim();
  // Strip markdown code fences Gemini sometimes adds
  if (trimmed.startsWith('```')) {
    trimmed = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  if (!trimmed.startsWith('{')) return null;

  try {
    const repaired = jsonrepair(trimmed);
    const parsed: unknown = JSON.parse(repaired);
    if (!parsed || typeof parsed !== 'object') return null;

    const candidate = parsed as Partial<AIInsights>;
    if (typeof candidate.summary !== 'string') return null;
    if (!Array.isArray(candidate.predictions)) return null;
    if (typeof candidate.bestTimeToTravel !== 'string') return null;
    if (!Array.isArray(candidate.avoidAreas)) return null;
    if (!Array.isArray(candidate.alternateRoutes)) return null;

    return candidate as AIInsights;
  } catch {
    return null;
  }
};

const sanitizeBestTime = (text: string | undefined): string => {
  if (!text) return 'Check back shortly for travel recommendations.';

  // Remove "Tomorrow" word
  const cleaned = text.replace(/tomorrow,?\s*/gi, '').trim();

  // Try to extract a time from the string like "5:30 AM" or "17:30"
  const timeMatch = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const meridiem = timeMatch[3]?.toUpperCase();
    const hour24 = meridiem === 'PM' && hour !== 12 ? hour + 12
                 : meridiem === 'AM' && hour === 12 ? 0
                 : hour;
    const currentHour = new Date().getHours();

    // If the suggested time has already passed today, show fallback
    if (hour24 < currentHour) {
      return 'Traffic is expected to ease after 10:00 PM tonight.';
    }
  }

  return cleaned || 'Check back shortly for travel recommendations.';
};

const getCongestionBadgeMeta = (value: number) => {
  if (value < 30) return { label: 'Low', className: 'border-success/30 bg-success/15 text-success' };
  if (value < 55) return { label: 'Moderate', className: 'border-warning/30 bg-warning/15 text-warning' };
  if (value < 75) return { label: 'High', className: 'border-primary/30 bg-primary/15 text-primary' };
  return { label: 'Severe', className: 'border-danger/30 bg-danger/15 text-danger' };
};

export const AIPredictionsPanel = () => {
  const { aiPrediction, trafficData: dbTrafficData } = useTrafficData();
  const [liveAiInsights, setLiveAiInsights] = useState<AIInsights | string | null>(null);
  const [liveTrafficData, setLiveTrafficData] = useState<TrafficData | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveFetchedAt, setLiveFetchedAt] = useState<string | null>(null);
  const [hasAttemptedLive, setHasAttemptedLive] = useState(false);

  const fetchLiveInsights = useCallback(async () => {
    setIsLiveLoading(true);
    setLiveError(null);
    setHasAttemptedLive(true);

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
          body: JSON.stringify({ type: 'prediction' }),
          cache: 'no-store',
          mode: 'cors',
          signal: AbortSignal.timeout(10000),
        }
      );
      const data = (await res.json()) as {
        success?: boolean;
        data?: TrafficData;
        aiInsights?: AIInsights | string;
        error?: string;
      };
      const response = { data, error: data.error ? { message: data.error } : null };

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.aiInsights) {
        throw new Error(response.data?.error || 'traffic-insights returned no aiInsights');
      }

      setLiveAiInsights(response.data.aiInsights);
      setLiveTrafficData(response.data.data ?? null);
      setLiveFetchedAt(new Date().toISOString());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown traffic-insights error';
      setLiveError(message);
      setLiveAiInsights(null);
      setLiveTrafficData(null);
    } finally {
      setIsLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    const dbAgeMs = aiPrediction?.predictedAt
      ? Date.now() - new Date(aiPrediction.predictedAt).getTime()
      : null;
    const dbIsFresh = dbAgeMs !== null && dbAgeMs < DB_FRESH_MS;
    if (!dbIsFresh) {
      void fetchLiveInsights();
    } else {
      setHasAttemptedLive(true); // mark as attempted so fallback renders
    }
  }, [fetchLiveInsights, aiPrediction?.predictedAt]);

  const dbAgeMs = useMemo(() => {
    if (!aiPrediction?.predictedAt) {
      return null;
    }

    return Date.now() - new Date(aiPrediction.predictedAt).getTime();
  }, [aiPrediction?.predictedAt]);

  const dbIsFresh = dbAgeMs !== null && dbAgeMs < DB_FRESH_MS;
  const dbIsFreshEnough = dbAgeMs !== null && dbAgeMs <= STALE_PREDICTION_MS;
  const canUseDbFallback = Boolean(aiPrediction && dbIsFreshEnough);
  const shouldShowDbFallback = !liveAiInsights && hasAttemptedLive && !isLiveLoading && Boolean(liveError) && canUseDbFallback;

  const normalizedLiveAiInsights = useMemo(() => {
    if (!liveAiInsights) return null;
    // Case 1: entire liveAiInsights is a string
    if (typeof liveAiInsights === 'string') {
      return parseAiInsights(liveAiInsights) ?? null;
    }
    // Case 2: summary field contains the full JSON blob
    if (typeof (liveAiInsights as AIInsights).summary === 'string') {
      const parsed = parseAiInsights((liveAiInsights as AIInsights).summary);
      if (parsed) return parsed;
    }
    // Case 3: already a valid AIInsights object
    return liveAiInsights as AIInsights;
  }, [liveAiInsights]);

  const normalizedDbInsights = useMemo(() => {
    if (!aiPrediction?.citySummary) return null;
    return parseAiInsights(aiPrediction.citySummary);
  }, [aiPrediction?.citySummary]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const offPeak = useMemo(() => isOffPeakHour(new Date()), [Math.floor(Date.now() / 60000)]);
  const averageCongestion = liveTrafficData?.sentimentScore ?? aiPrediction?.avgCongestionAtPrediction ?? dbTrafficData?.sentimentScore ?? 0;
  const rawBestTime = (normalizedLiveAiInsights ?? normalizedDbInsights)?.bestTimeToTravel
    ?? (aiPrediction?.bestTimeIsFuture
      ? formatWindow(aiPrediction.bestTimeWindowStart, aiPrediction.bestTimeWindowEnd)
      : averageCongestion < 50
        ? 'Now is a good time to travel'
        : new Date().getHours() > 20
          ? 'Traffic easing — good to go'
          : 'Traffic easing soon');

  const sanitizedBestTime = sanitizeBestTime(rawBestTime);

  const upcomingPredictions = (normalizedLiveAiInsights?.predictions ?? [])
    .map((prediction, index) => ({
      label: prediction.time || `Forecast ${index + 1}`,
      value: prediction.congestionLevel,
      insight: prediction.insight,
    }));

  const lastUpdatedLine = useMemo(() => {
    if (normalizedLiveAiInsights && liveFetchedAt) {
      const relative = formatRelativeTime(liveFetchedAt);
      return relative ? `Live — ${relative}` : null;
    }

    if (aiPrediction?.predictedAt) {
      const relative = formatRelativeTime(aiPrediction.predictedAt);
      return relative ? `Scheduled — ${relative}` : null;
    }

    return null;
  }, [aiPrediction?.predictedAt, liveFetchedAt, normalizedLiveAiInsights]);

  return (
    <DataCard>


      {isLiveLoading && !liveAiInsights && !shouldShowDbFallback ? (
        <div className="py-4">
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
            </div>
            <div className="h-4 w-1/2 bg-muted rounded" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Analyzing live Bengaluru traffic...</p>
        </div>
      ) : null}

      {!isLiveLoading && !liveAiInsights && !shouldShowDbFallback && !aiPrediction ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Sparkles size={32} className="mb-3 text-muted-foreground not-italic" />
          <p className="text-sm text-muted-foreground">Smart predictions will appear after the next prediction cycle.</p>
          <p className="mt-1 text-xs text-muted-foreground">The panel updates automatically when new intelligence arrives.</p>
        </div>
      ) : null}

      {!liveAiInsights && hasAttemptedLive && !isLiveLoading && liveError && !canUseDbFallback ? (
        <div className="rounded-sm border border-warning/50 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-warning not-italic" />
            <div className="flex-1">
              <p className={`${typography.body} text-foreground`}>Could not load live AI insights.</p>
              <p className={`${typography.label} mt-1`}>Error: {liveError}</p>
              {aiPrediction && !dbIsFreshEnough ? (
                <p className={`${typography.label} mt-1`}>The last saved prediction is older than 2 hours, so it won't be shown as current.</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {normalizedLiveAiInsights ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/5 bg-card p-4">
            <p className={`${typography.body} text-foreground`}>{normalizedLiveAiInsights.summary || 'Citywide AI summary is currently unavailable.'}</p>
            {formatRelativeTime(liveFetchedAt) ? (
              <p className={`${typography.label} mt-2`}>Last Updated: {formatRelativeTime(liveFetchedAt)}</p>
            ) : null}
          </div>

          <div className="card p-4">
            <p className="eyebrow mb-2">BEST TIME TO TRAVEL</p>
            <p className="font-sans text-sm text-white/70 font-light leading-relaxed">
              {sanitizedBestTime}
            </p>
          </div>

          {upcomingPredictions.length > 0 ? (
            <div className="space-y-2">
              <h4 className="eyebrow mb-2">Upcoming Predictions</h4>
              {upcomingPredictions.map((prediction) => (
                <div key={prediction.label} className="rounded-xl border border-white/5 bg-card p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className={typography.dataValue}>{prediction.label}</span>
                    {typeof prediction.value === 'number' ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-display font-black text-white text-sm tracking-tight">{prediction.value}%</span>
                        <span className={`badge badge-${getCongestionBadgeMeta(prediction.value).label.toLowerCase()}`}>{getCongestionBadgeMeta(prediction.value).label}</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-2 py-1">
                        <StatusDot status="moderate" />
                        <span className={typography.label}>--</span>
                      </span>
                    )}
                  </div>
                  {prediction.insight ? (
                    <p className={`${typography.label} mt-2 text-muted-foreground`}>{prediction.insight}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {normalizedLiveAiInsights.alternateRoutes.length > 0 ? (
            <div className="space-y-2">
              <h4 className="eyebrow mb-2 flex items-center gap-2">
                <Route className="h-4 w-4 not-italic" />
                Suggested Alternate Routes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {normalizedLiveAiInsights.alternateRoutes.map((route, index) => (
                  <div key={`${route.from}-${route.to}-${route.via}-${index}`} className="card-elevated card-interactive p-4 overflow-hidden w-full">
                    <div className="flex items-start justify-between gap-2 mb-1 min-w-0">
                      <span className="font-display font-black text-white text-sm tracking-tight flex-1 min-w-0">
                        <span className="block truncate">{route.from || 'N/A'}</span>
                        <span className="text-white/40 mx-1">→</span>
                        <span className="block truncate font-black">{route.to || 'N/A'}</span>
                      </span>
                      <span className="font-sans text-xs text-orange-400 font-medium flex-shrink-0 text-right">
                        {route.savings || 'Alternate'}
                      </span>
                    </div>
                    <p className="eyebrow-accent text-[9px] mt-1">Via {route.via || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {offPeak ? (
            <div className="rounded-xl border border-white/5 bg-card p-4">
              <p className="eyebrow">Traffic Outlook</p>
              <p className={`${typography.body} mt-1 text-green-400`}>No significant congestion is expected at this hour.</p>
            </div>
          ) : normalizedLiveAiInsights.avoidAreas.length > 0 ? (
            <div className="space-y-2">
              <span className="eyebrow">Avoid</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {normalizedLiveAiInsights.avoidAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-sm border border-danger/40 bg-danger/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-danger"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {liveTrafficData?.hotspots?.length ? (
            <div className="space-y-2">
              <h4 className="eyebrow mb-2">Traffic Hotspots</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {liveTrafficData.hotspots.slice(0, 6).map((hotspot) => (
                  <HotspotCard
                    key={`${hotspot.name}-${hotspot.lat}-${hotspot.lng}`}
                    name={hotspot.name}
                    congestionLevel={hotspot.congestionLevel}
                    trend={hotspot.trend}
                    eta={hotspot.eta}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (shouldShowDbFallback || dbIsFresh) && aiPrediction ? (
        <div className="space-y-4">
          <div className="rounded-sm border border-border p-4">
            {normalizedDbInsights ? (
              <>
                <p className="font-sans text-sm text-white/70 font-light leading-relaxed text-foreground">{normalizedDbInsights.summary || 'Citywide AI summary is currently unavailable.'}</p>
                {formatRelativeTime(aiPrediction.predictedAt) ? (
                  <p className={`${typography.label} mt-2`}>Last Updated: {formatRelativeTime(aiPrediction.predictedAt)}</p>
                ) : null}
              </>
            ) : (
              <>
                <p className={`${typography.body} text-foreground`}>{aiPrediction.citySummary || 'Citywide AI summary will appear after the next scheduled run.'}</p>
                {formatRelativeTime(aiPrediction.predictedAt) ? (
                  <p className={`${typography.label} mt-2`}>Last Updated: {formatRelativeTime(aiPrediction.predictedAt)}</p>
                ) : null}
              </>
            )}
          </div>

          <div className="card p-4">
            <p className="eyebrow mb-2">BEST TIME TO TRAVEL</p>
            <p className="font-sans text-sm text-white/70 font-light leading-relaxed">
              {sanitizedBestTime}
            </p>
          </div>

          {normalizedDbInsights ? (
            normalizedDbInsights.predictions.length > 0 ? (
              <div className="space-y-2">
                <h4 className="eyebrow mb-2">Upcoming Predictions</h4>
                {normalizedDbInsights.predictions.map((prediction, index) => (
                  <div key={`${prediction.time}-${index}`} className="rounded-sm border border-border p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className={typography.dataValue}>{prediction.time || `Forecast ${index + 1}`}</span>
                      {typeof prediction.congestionLevel === 'number' ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-display font-black text-white text-sm tracking-tight">{prediction.congestionLevel}%</span>
                          <span className={`badge badge-${getCongestionBadgeMeta(prediction.congestionLevel).label.toLowerCase()}`}>{getCongestionBadgeMeta(prediction.congestionLevel).label}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-sm border border-border px-2 py-1">
                          <StatusDot status="moderate" />
                          <span className={typography.label}>--</span>
                        </span>
                      )}
                    </div>
                    {prediction.insight ? (
                      <p className={`${typography.label} mt-2 text-muted-foreground`}>{prediction.insight}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null
          ) : ([
            { label: 'Next 1 Hour', value: aiPrediction.next1hCongestion },
            { label: 'Next 2 Hours', value: aiPrediction.next2hCongestion },
            { label: 'Next 3 Hours', value: aiPrediction.next3hCongestion },
          ].filter((item) => typeof item.value === 'number').length ? (
            <div className="space-y-2">
              <h4 className="eyebrow mb-2">Upcoming Predictions</h4>
              {[
                { label: 'Next 1 Hour', value: aiPrediction.next1hCongestion },
                { label: 'Next 2 Hours', value: aiPrediction.next2hCongestion },
                { label: 'Next 3 Hours', value: aiPrediction.next3hCongestion },
              ].filter((item) => typeof item.value === 'number').map((prediction) => (
                <div key={prediction.label} className="rounded-sm border border-border p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className={typography.dataValue}>{prediction.label}</span>
                    <span className="inline-flex items-center gap-2 rounded-sm border border-border px-2 py-1">
                      <StatusDot
                        status={
                          (prediction.value ?? 0) <= 40 ? 'good' :
                          (prediction.value ?? 0) <= 65 ? 'moderate' :
                          'heavy'
                        }
                      />
                      <span className={typography.label}>{prediction.value ?? '--'}%</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : null)}

          {normalizedDbInsights ? (
            normalizedDbInsights.alternateRoutes.length > 0 ? (
              <div className="space-y-2">
                <h4 className="eyebrow mb-2 flex items-center gap-2">
                  <Route className="h-4 w-4 not-italic" />
                  Suggested Alternate Routes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {normalizedDbInsights.alternateRoutes.map((route, index) => (
                    <div key={`${route.from}-${route.to}-${route.via}-${index}`} className="card-elevated card-interactive p-4 overflow-hidden w-full">
                      <div className="flex items-start justify-between gap-2 mb-1 min-w-0">
                        <span className="font-display font-black text-white text-sm tracking-tight flex-1 min-w-0">
                          <span className="block truncate">{route.from || 'N/A'}</span>
                          <span className="text-white/40 mx-1">→</span>
                          <span className="block truncate font-black">{route.to || 'N/A'}</span>
                        </span>
                        <span className="font-sans text-xs text-orange-400 font-medium flex-shrink-0 text-right">
                          {route.savings || 'Alternate'}
                        </span>
                      </div>
                      <p className="eyebrow-accent text-[9px] mt-1">Via {route.via || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          ) : aiPrediction.alternateRoutes.length > 0 ? (
            <div className="space-y-2">
              <h4 className="eyebrow mb-2 flex items-center gap-2">
                <Route className="h-4 w-4 not-italic" />
                Suggested Alternate Routes
              </h4>
              {aiPrediction.alternateRoutes.slice(0, 2).map((route, index) => (
                <div key={`${route.from || 'route'}-${index}`} className="card-elevated card-interactive p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className={typography.dataValue}>{route.from || 'N/A'}</span>
                      <span className="mx-2 text-muted-foreground">to</span>
                      <span className={typography.dataValue}>{route.to || 'N/A'}</span>
                    </div>
                    <span className={`${typography.label} text-success`}>
                      {typeof route.time_saved_mins === 'number' ? `${route.time_saved_mins} min saved` : 'Alternate'}
                    </span>
                  </div>
                  <p className={`${typography.label} mt-1 text-primary`}>Via {route.via || 'N/A'}</p>
                </div>
              ))}
            </div>
          ) : null}

          {offPeak ? (
            <div className="rounded-sm border border-border p-4">
              <p className="eyebrow">Traffic Outlook</p>
              <p className={`${typography.body} mt-1 text-green-400`}>No significant congestion is expected at this hour.</p>
            </div>
          ) : normalizedDbInsights ? (
            normalizedDbInsights.avoidAreas.length > 0 ? (
              <div className="space-y-2">
                <span className="eyebrow">Avoid</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {normalizedDbInsights.avoidAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-sm border border-danger/40 bg-danger/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-danger"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            ) : null
          ) : aiPrediction.avoidAreas.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <span className="eyebrow">Avoid</span>
              {aiPrediction.avoidAreas.map((area) => (
                <span key={area} className="rounded-sm border border-danger px-2 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-danger">
                  {area}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </DataCard>
  );
};
