import { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { typography } from '@/lib/typography';

interface DataPoint {
  time: string;
  congestion?: number;
  predicted?: number;
}

interface ChartPoint {
  time: number;
  congestion?: number;
  predicted?: number;
}

interface TrafficTrendChartProps {
  data: DataPoint[];
  title: string;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const BUCKET_MS = 30 * 60 * 1000;

const toIstBucketStartMs = (ms: number) => Math.floor((ms + IST_OFFSET_MS) / BUCKET_MS) * BUCKET_MS - IST_OFFSET_MS;

const getFallbackValue = (data: DataPoint[]) => {
  for (let index = data.length - 1; index >= 0; index -= 1) {
    const value = data[index]?.congestion ?? data[index]?.predicted;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
};

export const TrafficTrendChart = ({ data, title }: TrafficTrendChartProps) => {
  const [currentBuckets, setCurrentBuckets] = useState<Map<number, number> | null>(null);

  const HOUR_MS = 60 * 60 * 1000;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderNowMs = useMemo(() => Date.now(), [Math.floor(Date.now() / 30000)]);
  const windowStartMs = renderNowMs - 6 * HOUR_MS;
  const windowEndMs = renderNowMs + 4 * HOUR_MS;
  const renderNowBucketMs = toIstBucketStartMs(renderNowMs);
  const renderStartBucketMs = toIstBucketStartMs(windowStartMs);
  const renderEndBucketMs = toIstBucketStartMs(windowEndMs);

  useEffect(() => {
    let active = true;

    const fetchCurrentBuckets = async () => {
      const fallbackValue = getFallbackValue(data);
      const fetchNowMs = Date.now();
      const fetchNowBucketMs = toIstBucketStartMs(fetchNowMs);
      const fetchStartMs = toIstBucketStartMs(fetchNowMs - 6 * 60 * 60 * 1000);
      const sinceIso = new Date(fetchStartMs).toISOString();
      const untilIso = new Date().toISOString();

      try {
        const { data: historyRows, error } = await supabase
          .from('traffic_history')
          .select('recorded_at, congestion_level')
          .gte('recorded_at', sinceIso)
          .lte('recorded_at', untilIso)
	.eq('data_source', 'tomtom')
          .order('recorded_at', { ascending: false })
          .limit(300);

        if (error) {
          if (active) {
            const flat = new Map<number, number>();
            for (let cursor = fetchStartMs; cursor <= fetchNowBucketMs; cursor += BUCKET_MS) {
              flat.set(cursor, fallbackValue);
            }
            setCurrentBuckets(flat);
          }
          return;
        }

        const rows = [...(historyRows ?? [])].reverse();
        if (!rows.length) {
          if (active) {
            const flat = new Map<number, number>();
            for (let cursor = fetchStartMs; cursor <= fetchNowBucketMs; cursor += BUCKET_MS) {
              flat.set(cursor, fallbackValue);
            }
            setCurrentBuckets(flat);
          }
          return;
        }

        const aggregates = new Map<number, { total: number; count: number }>();
        for (const row of rows) {
          const ms = new Date(row.recorded_at).getTime();
          if (!Number.isFinite(ms) || ms < fetchStartMs || ms > fetchNowMs) continue;
          const bucket = toIstBucketStartMs(ms);
          const existing = aggregates.get(bucket) ?? { total: 0, count: 0 };
          aggregates.set(bucket, { total: existing.total + Number(row.congestion_level), count: existing.count + 1 });
        }

        const filled = new Map<number, number>();
        let lastValue: number | null = null;

        for (let cursor = fetchStartMs; cursor <= fetchNowBucketMs; cursor += BUCKET_MS) {
          const bucket = aggregates.get(cursor);
          if (bucket && bucket.count > 0) {
            const avg = Math.round(bucket.total / bucket.count);
            filled.set(cursor, avg);
            lastValue = avg;
          } else {
            const nextValue = lastValue ?? fallbackValue;
            filled.set(cursor, nextValue);
          }
        }

        if (active) {
          setCurrentBuckets(filled);
        }
      } catch {
        if (active) {
          const fallbackValue = getFallbackValue(data);
          const flat = new Map<number, number>();
          const fetchNowMs = Date.now();
          const fetchNowBucketMs = toIstBucketStartMs(fetchNowMs);
          const fetchStartMs = toIstBucketStartMs(fetchNowMs - 6 * 60 * 60 * 1000);
          for (let cursor = fetchStartMs; cursor <= fetchNowBucketMs; cursor += BUCKET_MS) {
            flat.set(cursor, fallbackValue);
          }
          setCurrentBuckets(flat);
        }
      }
    };

    void fetchCurrentBuckets();
    return () => {
      active = false;
    };
  }, [data]);

  const chartData: ChartPoint[] = useMemo(() => {
    const fallbackValue = getFallbackValue(data);
    const currentValueMap = currentBuckets ?? new Map<number, number>();
    const currentCongestion = currentValueMap.get(renderNowBucketMs) ?? fallbackValue;

    const points: ChartPoint[] = [];
    let carry = fallbackValue;
    for (let cursor = renderStartBucketMs; cursor <= renderEndBucketMs; cursor += BUCKET_MS) {
      if (cursor <= renderNowMs) {
        const fromMap = currentValueMap.get(cursor);
        const congestion = typeof fromMap === 'number' ? fromMap : carry;
        carry = congestion;
        points.push({ time: cursor, congestion });
      } else {
        const hoursFromNow = (cursor - renderNowMs) / HOUR_MS;
        const predicted = currentCongestion * Math.exp(-0.15 * hoursFromNow);
        points.push({ time: cursor, predicted });
      }
    }

    return points;
  }, [HOUR_MS, currentBuckets, data, renderEndBucketMs, renderNowBucketMs, renderNowMs, renderStartBucketMs]);

  const ticks = useMemo(() => {
    const tickValues: number[] = [];
    const firstHour = Math.ceil((windowStartMs + IST_OFFSET_MS) / HOUR_MS) * HOUR_MS - IST_OFFSET_MS;
    // Use 2-hour intervals on mobile to prevent overflow
    const interval = window.innerWidth < 768 ? 2 * HOUR_MS : HOUR_MS;
    for (let cursor = firstHour; cursor <= windowEndMs; cursor += interval) {
      tickValues.push(cursor);
    }
    return tickValues.length > 0 ? tickValues : [windowStartMs, windowEndMs];
  }, [HOUR_MS, windowEndMs, windowStartMs]);

  const hasAnySeries = chartData.some((point) => point.congestion !== undefined || point.predicted !== undefined);

  const formatTick = (value: number) =>
    new Date(value).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  if (!hasAnySeries) {
    return (
      <div className="rounded-xl border border-white/5 bg-card p-4">
        <h3 className={`${typography.sectionTitle} mb-4`}>{title}</h3>
        <div className="flex h-[280px] items-center justify-center rounded-xl border border-white/5 bg-card px-6 text-center">
          <div className="flex max-w-sm items-center gap-2 text-muted-foreground">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted-foreground" />
            <p className={typography.body}>Chart building — more data arrives every 20 minutes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-card p-4">
      <h3 className={`${typography.sectionTitle} mb-4`}>{title}</h3>
      <div className="h-[280px] w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <ReferenceLine
              x={renderNowMs}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{ value: 'Now', position: 'insideTopRight', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <XAxis
              dataKey="time"
              type="number"
              domain={[windowStartMs, windowEndMs]}
              ticks={ticks}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={48}
              tickMargin={8}
              tickFormatter={(value) => formatTick(Number(value))}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 50]}
              ticks={[0, 25, 50]}
            />
            <Tooltip
              labelFormatter={(value) => formatTick(Number(value))}
              formatter={(value) => [`${Math.round(Number(value))}%`, 'Congestion']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '2px',
                color: 'hsl(var(--foreground))',
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Line
              type="monotone"
              dataKey="congestion"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              name="Current"
              connectNulls={false}
              dot={false}
              animationDuration={800}
            />
            {chartData.some((point) => point.predicted !== undefined) && (
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicted"
                connectNulls={false}
                dot={false}
                animationDuration={800}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-[1px] w-3 bg-foreground" />
          <span className={typography.body}>Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 border-t border-dashed border-primary" />
          <span className={typography.body}>Predicted</span>
        </div>
      </div>
    </div>
  );
};
