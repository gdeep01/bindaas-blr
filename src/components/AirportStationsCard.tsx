import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plane, Train } from 'lucide-react';
import { DataCard } from '@/components/ui/DataCard';
import { StatusDot } from '@/components/ui/StatusDot';
import { supabase } from '@/integrations/supabase/client';
import { typography } from '@/lib/typography';

const MONITORED_LOCATIONS = [
  { name: 'Kempegowda International Airport', short: 'BIAL', icon: 'plane' as const },
  { name: 'KSR Bengaluru City Railway Station', short: 'KSR', icon: 'train' as const },
  { name: 'Yeshwanthpur Railway Station', short: 'Yeshwanthpur', icon: 'train' as const },
  { name: 'Bengaluru Cantonment Railway Station', short: 'Cantonment', icon: 'train' as const },
] as const;

type StationData = { congestion_level: number; recorded_at: string } | null;

const getCongestionBadge = (level: number | undefined) => {
  if (typeof level !== 'number') return { label: 'NO DATA', status: 'cached' as const, classes: 'border-white/10 text-muted-foreground' };
  if (level === 0) return { label: 'CLEAR', status: 'good' as const, classes: 'border-success/30 bg-success/10 text-success' };
  if (level < 20) return { label: 'SMOOTH', status: 'good' as const, classes: 'border-success/30 bg-success/10 text-success' };
  if (level < 40) return { label: 'MODERATE', status: 'moderate' as const, classes: 'border-warning/30 bg-warning/10 text-warning' };
  if (level < 60) return { label: 'HEAVY', status: 'heavy' as const, classes: 'border-orange-500/30 bg-orange-500/10 text-orange-400' };
  return { label: 'SEVERE', status: 'severe' as const, classes: 'border-danger/30 bg-danger/10 text-danger' };
};

export const AirportStationsCard = () => {
  const [latestRows, setLatestRows] = useState<Record<string, StationData>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const STATION_NAMES = useMemo(() => MONITORED_LOCATIONS.map(loc => loc.name), []);

  const fetchStationData = useCallback(async () => {
    setIsLoading(true);
    const { data, error: fetchError } = await supabase
      .from('traffic_history')
      .select('location_name, congestion_level, recorded_at')
      .in('location_name', STATION_NAMES)
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false });

    if (fetchError) { setError(fetchError.message); setIsLoading(false); return; }
    if (!data) { setIsLoading(false); return; }

    const nextState: Record<string, StationData> = {};
    STATION_NAMES.forEach(name => {
      const record = data.find(r => r.location_name === name);
      nextState[name] = record ?? null;
    });

    setLatestRows(nextState);
    const timestamps = data.map(r => new Date(r.recorded_at).getTime());
    if (timestamps.length > 0) setLastUpdated(new Date(Math.max(...timestamps)));
    setError(null);
    setIsLoading(false);
  }, [STATION_NAMES]);

  useEffect(() => {
    void fetchStationData();
    const refreshInterval = setInterval(() => void fetchStationData(), 30 * 60 * 1000);
    const tickInterval = setInterval(() => setNow(new Date()), 60_000);
    return () => { clearInterval(refreshInterval); clearInterval(tickInterval); };
  }, [fetchStationData]);

  return (
    <DataCard>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className={typography.h3}>Airport & Stations</h3>
          <p className={typography.label}>REFRESHES EVERY 30 MIN</p>
        </div>
        {(() => {
          const minutesAgo = lastUpdated ? Math.floor((now.getTime() - lastUpdated.getTime()) / 60_000) : null;
          if (minutesAgo === null) return null;
          const updatedLabel = minutesAgo < 2 ? 'Just now' : minutesAgo < 60 ? `${minutesAgo} min ago` : `${Math.floor(minutesAgo / 60)}h ago`;
          const isStale = minutesAgo > 60;
          return <span className={`text-xs ${isStale ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>Updated {updatedLabel}</span>;
        })()}
      </div>

      <div className="space-y-3">
        {MONITORED_LOCATIONS.map((loc) => {
          const row = latestRows[loc.name];
          const badge = getCongestionBadge(row?.congestion_level);
          const congestionValue = typeof row?.congestion_level === 'number' ? `${row.congestion_level}%` : '--';
          return (
            <div key={loc.name} className="list-row px-0 w-full">
              <div className="flex items-center gap-3 w-full min-w-0">
                <div className="flex-shrink-0 w-5 flex justify-center">
                  {loc.icon === 'plane' ? <Plane className="h-4 w-4 text-white/40" /> : <Train className="h-4 w-4 text-white/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-display font-black text-white text-base tracking-tight truncate">{loc.short}</span>
                    <StatusDot status={badge.status} className="flex-shrink-0" />
                  </div>
                  <p className="font-sans text-xs text-white/40 font-light truncate mt-0.5">
                    {row ? loc.name : 'Awaiting latest feed'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge border-white/10 uppercase text-[10px] tracking-widest px-2 py-0.5 rounded-full font-black ${badge.classes}`}>
                    {badge.label}
                  </span>
                  <span className="font-display font-black text-white text-sm w-10 text-right">{congestionValue}</span>
                </div>
              </div>
            </div>
          );
        })}
        {error ? <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">Failed to load: {error}</div> : null}
        {isLoading && !Object.values(latestRows).some(Boolean) ? <div className="text-sm text-muted-foreground">Loading latest feeds…</div> : null}
      </div>
    </DataCard>
  );
};