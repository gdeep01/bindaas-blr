import { useEffect, useMemo, useRef, useState } from 'react';
import { Route } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TrafficTrendChart } from '@/components/TrafficTrendChart';
import { TrafficSentimentGauge } from '@/components/dashboard/TrafficSentimentGauge';
import { DataCard } from '@/components/ui/DataCard';
import { StatusDot } from '@/components/ui/StatusDot';
import { useTrafficData } from '@/contexts/TrafficDataContext';
import heroImage from '@/assets/bengaluru-hero.jpeg';
import { AirportStationsCard } from '@/components/AirportStationsCard';
import { bengaluruAreaMoods, getMoodColor } from '@/data/moodData';
import { typography } from '@/lib/typography';

const getCorridorBadge = (nowMin: number, baseMin: number) => {
  const delay = Number(nowMin) - Number(baseMin);

  if (delay <= 5) {
    return { delay, label: 'CLEAR', dot: 'good' as const, chip: 'border-success/30 bg-success/10 text-success', bar: 'bg-success' };
  }

  if (delay <= 10) {
    return { delay, label: 'MODERATE', dot: 'moderate' as const, chip: 'border-warning/30 bg-warning/10 text-warning', bar: 'bg-warning' };
  }

  if (delay <= 20) {
    return { delay, label: 'HEAVY', dot: 'moderate' as const, chip: 'border-primary/30 bg-primary/10 text-primary', bar: 'bg-primary' };
  }

  return { delay, label: 'SEVERE', dot: 'critical' as const, chip: 'border-danger/30 bg-danger/10 text-danger', bar: 'bg-danger' };
};

const getCongestionContext = (value: number) => {
  if (value < 30) return { label: 'Smooth', classes: 'border-success/30 bg-success/10 text-success' };
  if (value < 55) return { label: 'Moderate', classes: 'border-warning/30 bg-warning/10 text-warning' };
  if (value < 75) return { label: 'Heavy', classes: 'border-primary/30 bg-primary/10 text-primary' };
  return { label: 'Severe', classes: 'border-danger/30 bg-danger/10 text-danger' };
};

const getCongestionColor = (level: number): string => {
  if (level < 30) return 'hsl(var(--success))';
  if (level < 55) return 'hsl(var(--warning))';
  if (level < 75) return 'hsl(var(--primary))';
  return 'hsl(var(--danger))';
};

const DashboardPage = () => {
  const { trafficData, hourlyTrend, metrics, userReportsCount } = useTrafficData();

  const topCongestionZones = useMemo(
    () =>
      (trafficData?.hotspots || [])
        .filter((hotspot) => hotspot.congestionLevel > 0)
        .sort((a, b) => b.congestionLevel - a.congestionLevel)
        .slice(0, 5),
    [trafficData?.hotspots],
  );

  const peakSubtitle = useMemo(() => {
    const peakLabel = metrics?.peakHour?.trim();
    if (!peakLabel) return undefined;
    const match = peakLabel.match(/^(\d{1,2})\s*(AM|PM)$/i);
    if (!match) return undefined;

    const hour12 = Number.parseInt(match[1], 10);
    if (!Number.isFinite(hour12) || hour12 < 1 || hour12 > 12) return undefined;
    const isPm = match[2].toUpperCase() === 'PM';
    const peakHour24 = hour12 % 12 + (isPm ? 12 : 0);

    return peakHour24 > new Date().getHours() ? 'Expected peak' : "Today's peak was";
  }, [metrics?.peakHour]);

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const handleScroll = () => {
      const children = Array.from(el.children) as HTMLElement[];
      if (children.length < 2) return;
      const viewportCenter = el.scrollLeft + el.clientWidth / 2;
      const distances = children.map((child) => {
        const childCenter = child.offsetLeft + child.clientWidth / 2;
        return Math.abs(childCenter - viewportCenter);
      });
      const next = distances[0] <= distances[1] ? 0 : 1;
      setCarouselIndex(next);
    };

    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const livabilityTop3 = useMemo(
    () => [...bengaluruAreaMoods].sort((a, b) => b.overallMood - a.overallMood).slice(0, 3),
    [],
  );

  const sentiment = trafficData?.sentimentScore ?? 0;

  return (
    <ErrorBoundary>
      {/* Hero OUTSIDE the constrained wrapper — truly full bleed */}
      <section className="w-full overflow-hidden">
        {/* MOBILE HERO — compact, not full screen */}
        <div className="relative overflow-hidden md:hidden" style={{ minHeight: '480px', maxHeight: '560px' }}>
          <img
            src={heroImage}
            alt="Bengaluru aerial"
            className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
          />
          {/* Gradient — only bottom 50% */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% via-black/50 to-black/90" />

          {/* Content pinned to bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-5">
            <h1 className="font-serif italic font-bold text-4xl text-white leading-tight tracking-tight mb-1">
              Bengaluru,<br />Live.
            </h1>
            <p className="font-sans text-sm text-white/60 font-light mb-3">
              Traffic, weather, and livability, all in one place.
            </p>
            {/* Compact congestion card */}
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-display text-[10px] font-black tracking-[0.2em] uppercase text-orange-400">
                  Live City Traffic
                </span>
                <span className={`badge border-success/30 bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full font-black tracking-widest ${getCongestionContext(sentiment).classes}`}>
                  {getCongestionContext(sentiment).label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-black text-3xl text-white [font-variant-numeric:normal]">
                  {sentiment}%
                </span>
                <div className="flex-1 min-w-0">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/10 mb-1">
                    <div className="h-full bg-orange-500" style={{ width: `${sentiment}%` }} />
                  </div>
                  <p className="font-sans text-[11px] text-white/40 font-light">
                    Updated every 30 min
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP HERO — md and above only */}
        <div className="relative hidden md:block overflow-hidden min-h-[580px]">
          <img
            src={heroImage}
            alt="Vidhana Soudha"
            width="1920"
            height="1080"
            className="absolute inset-0 h-full w-full object-cover object-[center_20%] scale-100"
          />
          <div className="absolute inset-0 bg-black/40" />
          {/* Positioned with nav padding directly on the container */}
          <div className="absolute inset-0 z-10 flex items-end pb-8 px-4 md:px-8 xl:px-12">
            <div className="w-full max-w-[1800px] mx-auto flex items-end justify-between gap-8">
              {/* Heading — left side */}
              <div className="max-w-lg flex-shrink-0">
                <h1 className="font-serif italic font-bold text-6xl md:text-7xl lg:text-8xl text-white leading-none tracking-tight">
                  Bengaluru, Live.
                </h1>
                <p className="font-sans text-base text-white/60 font-light tracking-wide mt-4">
                  Traffic, weather, and livability, all in one place.
                </p>
              </div>
              {/* Congestion card — right side, never overflows */}
              <div className="flex-shrink-0 w-[300px]">
                <TrafficSentimentGauge value={sentiment} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Everything else INSIDE constrained wrapper */}
      <div className="flex flex-col gap-6 py-6">
        <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <DataCard className="card-elevated flex flex-col justify-between p-4 min-h-[100px]">
            <div>
              <div className="eyebrow mb-1">AVG. COMMUTE TIME</div>
              <div className="font-sans text-xs text-white/40 font-light">vs. free flow</div>
            </div>
            <div className="font-display font-black text-3xl text-white tracking-tighter leading-none mt-auto tabular-nums">
              {metrics ? `${metrics.avgCommuteMinutes} min` : '--'}
            </div>
          </DataCard>

          <DataCard className="card-elevated flex flex-col justify-between p-4 min-h-[100px]">
            <div>
              <div className="eyebrow mb-1">PEAK TODAY</div>
              <div className="font-sans text-xs text-white/40 font-light">{peakSubtitle ?? '\u00A0'}</div>
            </div>
            <div className="font-display font-black text-3xl text-white tracking-tighter leading-none mt-auto tabular-nums">{metrics?.peakHour || '--'}</div>
          </DataCard>

          <DataCard className="card-elevated flex flex-col justify-between p-4 min-h-[100px]">
            <div>
              <div className="eyebrow mb-1">CITY INCIDENTS</div>
              <div className="font-sans text-xs text-white/40 font-light">{'\u00A0'}</div>
            </div>
            <div className="font-display font-black text-3xl text-white tracking-tighter leading-none mt-auto tabular-nums">
              {metrics ? String(metrics.incidents?.length ?? 0) : '0'}
            </div>
          </DataCard>

          <DataCard className="card-elevated flex flex-col justify-between p-4 min-h-[100px]">
            <div>
              <div className="eyebrow mb-1">ROAD WORKS</div>
              <div className="font-sans text-xs text-white/40 font-light">{'\u00A0'}</div>
            </div>
            <div className="font-display font-black text-3xl text-white tracking-tighter leading-none mt-auto tabular-nums">
              {metrics ? String(metrics.roadWorks?.length ?? 0) : '0'}
            </div>
          </DataCard>

          <DataCard className="card-elevated flex flex-col justify-between p-4 min-h-[100px] col-span-2 md:col-span-1">
            <div>
              <div className="eyebrow mb-1">GARBAGE REPORTS</div>
              <div className="font-sans text-xs text-white/40 font-light">{'\u00A0'}</div>
            </div>
            <div className="font-display font-black text-3xl text-white tracking-tighter leading-none mt-auto tabular-nums">{String(userReportsCount ?? 0)}</div>
          </DataCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TrafficTrendChart data={hourlyTrend.length > 0 ? hourlyTrend : []} title="Today's Traffic Pattern" />
          </div>

          <DataCard>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={typography.h3}>Top Congestion Zones</h3>
              <span className="font-sans text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase">LIVE</span>
            </div>

            <div className="w-full overflow-hidden space-y-4">
              {topCongestionZones.map((hotspot) => {
                const badge = getCongestionContext(hotspot.congestionLevel);
                return (
                  <div key={hotspot.name} className="list-row px-0">
                    {/* Row 1: name + badge */}
                    <div className="flex items-center gap-2 w-full min-w-0 mb-1">
                      <span className="font-display font-black text-white text-sm tracking-tight flex-1 min-w-0 truncate">
                        {hotspot.name}
                      </span>
                      <span className={`inline-flex items-center rounded-xl border px-2 py-1 font-display font-black text-[10px] tracking-widest uppercase flex-shrink-0 ml-auto ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Row 2: ETA badge + percentage */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="badge badge-neutral flex-shrink-0 text-[10px]">ETA {hotspot.eta || 'N/A'}</span>
                      <span className="font-display font-black text-white text-sm tracking-tight flex-shrink-0">
                        {hotspot.congestionLevel}%
                      </span>
                    </div>

                    {/* Progress bar — full width */}
                    <div className="progress-track w-full">
                      <div className="progress-fill" style={{ width: `${Math.max(6, hotspot.congestionLevel)}%`, backgroundColor: getCongestionColor(hotspot.congestionLevel) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </DataCard>
        </section>

        <section>
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-2"
          >
            <div className="min-w-[85%] snap-center md:min-w-0">
              <DataCard>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={typography.h3}>Corridor Status</h3>
                  <Route className="h-5 w-5 text-muted-foreground not-italic" />
                </div>

                <div className="space-y-3">
                  {(metrics?.routeImpacts || []).slice(0, 6).map((route) => {
                    const routeStatus = getCorridorBadge(route.actualTime, route.baseTime);
                    const barWidth = Math.min(100, (routeStatus.delay / 30) * 100);
                    return (
                      <div key={route.corridor} className="list-row">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className={`min-w-0 truncate ${typography.h4}`}>
                            {route.corridor}
                          </span>
                          <span
                            className={`badge ${routeStatus.chip}`}
                          >
                            <StatusDot status={routeStatus.dot} />
                            {routeStatus.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-sans text-xs text-white/40 font-light">
                            Normal: {route.baseTime ?? '--'} min {'\u2192'} Now: {route.actualTime ?? '--'} min
                          </span>
                          <span className="font-display font-black text-white text-sm tracking-tight tabular-nums">+{routeStatus.delay ?? 0} min</span>
                        </div>
                        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                          <div className={`h-full ${routeStatus.bar}`} style={{ width: `${Math.max(barWidth, 8)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {metrics?.routeImpacts?.length ? null : (
                    <div className="rounded-xl border border-white/5 bg-card p-4 text-sm text-muted-foreground">
                      No corridor data is available right now.
                    </div>
                  )}
                </div>
              </DataCard>
            </div>

            <div className="min-w-[85%] snap-center md:min-w-0">
              <AirportStationsCard />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 md:hidden">
            <div className={`h-1.5 w-1.5 rounded-full ${carouselIndex === 0 ? 'bg-primary' : 'bg-white/20'}`} />
            <div className={`h-1.5 w-1.5 rounded-full ${carouselIndex === 1 ? 'bg-primary' : 'bg-white/20'}`} />
          </div>
        </section>

        <section>
          <DataCard>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={typography.h3}>Area Livability</h3>
              <span className="font-sans text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase">TOP 3</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {livabilityTop3.map((area) => (
                <div key={area.id} className="card-elevated card-interactive flex items-center justify-between p-4 gap-4">
                  <span className="font-display font-black text-white text-base tracking-tight min-w-0 truncate flex-1">{area.area}</span>
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 font-display font-black text-2xl leading-none tabular-nums text-foreground"
                    style={{ borderColor: getMoodColor(area.overallMood) }}
                  >
                    {area.overallMood}
                  </div>
                </div>
              ))}
            </div>
          </DataCard>
        </section>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardPage;
