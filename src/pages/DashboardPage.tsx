import { useEffect, useMemo, useRef, useState } from 'react';
import { Route } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TrafficTrendChart } from '@/components/TrafficTrendChart';
import { DataCard } from '@/components/ui/DataCard';
import { StatusDot } from '@/components/ui/StatusDot';
import { useTrafficData } from '@/contexts/TrafficDataContext';
import { AirportStationsCard } from '@/components/AirportStationsCard';
import { bengaluruAreaMoods, getMoodColor } from '@/data/moodData';
import { typography } from '@/lib/typography';

// ─── BLOOMBERG TERMINAL HERO ───────────────────────────────────────
// Pure black, dense, monospace. No rounded corners. No shadows.
// Layout: 28px header + 24px ticker + 240px main + 40px strip + 48px bar = 380px

const BLR_JUNCTIONS = [
  'SILK BOARD', 'HEBBAL', 'KORAMANGALA', 'WHITEFIELD',
  'MARATHAHALLI', 'KR CIRCLE', 'OUTER RING RD', 'SARJAPUR RD',
  'HOSUR RD', 'BANNERGHATTA RD', 'TUMKUR RD', 'OLD MADRAS RD',
] as const;

const FONT = "'Akzidenz-Grotesk', 'AkzidenzGroteskBQ-BoldExt', 'akzidenzgroteskboldext', 'akzidenzgroteskboldextention', 'Akzidenz-Grotesk BQ Extended', 'Courier New', 'IBM Plex Mono', monospace";
const C = {
  bg: '#000000', border: '#1a1a1a', orange: '#FF6600',
  green: '#00FF41', red: '#FF3333', amber: '#FFAA00',
  muted: '#444455', white: '#CCCCCC',
} as const;

const congColor = (v: number) => v < 40 ? C.green : v <= 70 ? C.amber : C.red;

const heatColor = (v: number) => {
  if (v <= 30) return '#003300';
  if (v <= 50) return '#664400';
  if (v <= 70) return '#884400';
  if (v <= 85) return '#882200';
  return '#FF2222';
};

const trendSymbol = (v: number) => {
  if (v > 80) return { sym: '↑↑↑', col: C.red };
  if (v > 60) return { sym: '↑', col: C.amber };
  if (v >= 40) return { sym: '→', col: C.muted };
  if (v >= 20) return { sym: '↓', col: C.green };
  return { sym: '↓↓', col: '#44FF88' };
};

const HeroMacroTrendChart = ({ data }: { data: Array<{ time: string; congestion?: number; predicted?: number }> }) => {
  const chartData = useMemo(
    () =>
      data
        .map((point) => ({
          label: point.time,
          congestion: typeof point.congestion === 'number' ? point.congestion : undefined,
          predicted: typeof point.predicted === 'number' ? point.predicted : undefined,
        }))
        .filter((point) => typeof point.congestion === 'number' || typeof point.predicted === 'number'),
    [data],
  );

  if (!chartData.length) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '10px', fontWeight: 700 }}>
        WAITING FOR TRAFFIC HISTORY
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 8, right: 10, left: -28, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: C.muted, fontSize: 8, fontWeight: 700 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={18}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tick={{ fill: C.muted, fontSize: 8, fontWeight: 700 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) => [`${Math.round(Number(value))}%`, 'Congestion']}
          contentStyle={{ background: '#050505', border: `1px solid ${C.border}`, borderRadius: 0, color: C.white, fontSize: 10 }}
          labelStyle={{ color: C.orange }}
        />
        <Line type="monotone" dataKey="congestion" stroke={C.orange} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="predicted" stroke={C.green} strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const BloombergTerminalHero = () => {
  const { trafficData, metrics, isLoading, userReportsCount, hourlyTrend } = useTrafficData();

  const hasTrafficData = typeof trafficData?.sentimentScore === 'number';
  const sentimentScore = trafficData?.sentimentScore;
  const moodScore = hasTrafficData ? Math.max(0, 100 - sentimentScore) : undefined;
  const rainRisk = metrics?.weather?.impactLevel === 'severe' ? 85
    : metrics?.weather?.impactLevel === 'moderate' ? 55
    : metrics?.weather?.impactLevel === 'low' ? 25
    : metrics?.weather ? 0 : undefined;

  const hotspots = useMemo(() =>
    (trafficData?.hotspots || []).slice().sort((a, b) => b.congestionLevel - a.congestionLevel).slice(0, 8),
    [trafficData?.hotspots],
  );

  const alerts = useMemo(() => [
    ...(metrics?.incidents || []).map(i => ({ loc: i.location, desc: i.description })),
    ...(metrics?.roadWorks || []).map(r => ({ loc: r.location, desc: r.description })),
  ], [metrics]);

  // Clock
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(
      new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
    );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const currentHour = new Date().getHours();
  const isPeak = (currentHour >= 8 && currentHour < 10) || (currentHour >= 17 && currentHour < 20);

  // Table rows: only measured hotspot numbers are shown.
  const tableRows = useMemo(() => {
    if (hotspots.length > 0) return hotspots.map((h) => {
      const now = h.congestionLevel;
      return { name: h.name, now, h1: h.congestion1h, h3: h.congestion3h, real: true };
    });
    return BLR_JUNCTIONS.map(name => ({ name, now: 0, h1: 0, h3: 0, real: false }));
  }, [hotspots]);

  // Ticker items
  const tickerItems = useMemo(() => {
    const items = hotspots.length > 0
      ? hotspots.map(h => ({ name: h.name, pct: h.congestionLevel }))
      : BLR_JUNCTIONS.map(n => ({ name: n, pct: 0 }));
    // Duplicate exactly once for seamless scroll
    return [...items, ...items];
  }, [hotspots]);

  // Corridor strip data
  // Corridor strip data
  const corridorStrip = useMemo(() => {
    const list: { name: string; congestionLevel: number; real: boolean }[] = [];
    if (hotspots.length > 0) {
      hotspots.forEach(h => {
        list.push({ name: h.name, congestionLevel: h.congestionLevel, real: true });
      });
    }
    for (const name of BLR_JUNCTIONS) {
      if (list.length >= 12) break;
      if (!list.some(item => item.name === name)) {
        list.push({ name, congestionLevel: 0, real: false });
      }
    }
    return list;
  }, [hotspots]);

  const kpis = [
    { label: 'CITY CONGESTION', value: sentimentScore, unit: '%', forceColor: hasTrafficData ? congColor(sentimentScore) : C.muted },
    { label: 'MOOD', value: moodScore, unit: '/100', forceColor: hasTrafficData ? '#FFCC00' : C.muted },
    { label: 'RAIN RISK', value: rainRisk, unit: '%', forceColor: typeof rainRisk === 'number' ? (rainRisk > 60 ? C.red : rainRisk >= 40 ? C.amber : C.green) : C.muted },
    { label: 'REPORTS', value: userReportsCount ?? 0, unit: '', forceColor: C.white },
  ];

  // ── Inline styles (no CSS classes except ticker animation) ──
  const S = {
    root: {
      height: '380px', width: '100%', backgroundColor: C.bg,
      fontFamily: FONT, color: C.white, overflowX: 'hidden',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column' as const,
      paddingLeft: '1rem', boxSizing: 'border-box' as const,
    },
    header: {
      height: '28px', minHeight: '28px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '0 10px', borderBottom: `1px solid ${C.border}`,
      fontSize: '10px',
    },
    ticker: {
      height: '24px', minHeight: '24px', overflow: 'hidden',
      borderBottom: `1px solid ${C.border}`, background: '#000',
      display: 'flex', alignItems: 'center', paddingLeft: '16px',
    },
    main: {
      height: '240px', minHeight: '240px', display: 'grid',
      gridTemplateColumns: '200px 1.2fr 1.5fr',
    },
    strip: {
      height: '40px', minHeight: '40px',
      borderTop: `1px solid ${C.border}`,
    },
    bottom: {
      height: '48px', minHeight: '48px', display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      borderTop: `1px solid ${C.border}`,
    },
  };

  return (
    <section
      className="hidden md:flex flex-col overflow-hidden -mx-4 md:-mx-8 xl:-mx-12 w-[calc(100%+2rem)] md:w-[calc(100%+4rem)] xl:w-[calc(100%+6rem)] -mt-6 md:-mt-8"
      style={S.root}
    >
      <style>{`
        @keyframes _tk { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        ._ticker { display:inline-block; animation: _tk 30s linear infinite; white-space:nowrap }
        .strip-scroll { overflow-x: auto; scrollbar-width: none; }
        .strip-scroll::-webkit-scrollbar { display: none; }
        .corridors-scroll { overflow-y: auto; scrollbar-width: none; }
        .corridors-scroll::-webkit-scrollbar { display: none; }
        .name-scroll { overflow-x: auto; scrollbar-width: none; }
        .name-scroll::-webkit-scrollbar { display: none; }
        .macro-chart-override .bg-card { background: transparent !important; border: none !important; border-radius: 0 !important; padding: 0 !important; }
        .macro-chart-override h3 { display: none !important; }
        .macro-chart-override .h-\\[280px\\] { height: 100% !important; min-height: 200px !important; }
        .macro-chart-override .mt-6 { display: none !important; }
      `}</style>

      {/* ─── ROW 1: HEADER 28px ─── */}
      <div style={S.header}>
        <span style={{ color: C.orange, fontWeight: 700, letterSpacing: '0.08em' }}>BINDAAS BLR TRMNL</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: C.white }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, background: isLoading ? C.amber : C.green }} />
            <span style={{ color: isLoading ? C.amber : C.green, fontSize: '9px' }}>
              {isLoading ? 'DATA STALE' : 'SYS NOM'}
            </span>
          </span>
        </div>
      </div>

      {/* ─── ROW 2: TICKER 24px ─── */}
      <div style={S.ticker}>
        <div className="_ticker" style={{ fontSize: '10px', fontWeight: 700 }}>
          {tickerItems.map((t, i) => (
            <span key={i}>
              <span style={{ color: C.white }}>{t.name}</span>
              <span style={{ color: C.muted, margin: '0 4px' }}>▪</span>
              <span style={{ color: congColor(t.pct) }}>{t.pct || '--'}%</span>
              <span style={{ color: C.muted, margin: '0 6px' }}>▪</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── ROW 3: MAIN GRID 240px ─── */}
      <div style={S.main}>

        {/* CELL A ── KPI STACK (200px) */}
        <div style={{ borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', minWidth: '200px', flexShrink: 0, overflow: 'hidden' }}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{
              flex: '1 1 25%', position: 'relative', overflow: 'hidden', padding: '6px 8px', paddingLeft: '12px',
              borderBottom: i < 3 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{ fontSize: '9px', color: C.orange, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1, display: 'block', whiteSpace: 'nowrap' }}>{kpi.label}</div>
              <div style={{
                position: 'absolute', bottom: '-4px', left: '12px',
                fontSize: '48px', fontWeight: 700, lineHeight: 1,
                color: kpi.forceColor, display: 'flex', alignItems: 'baseline',
              }}>
                {typeof kpi.value === 'number' ? kpi.value : '--'}
                <span style={{ fontSize: '16px', color: C.muted, marginLeft: '4px', transform: 'translateY(-6px)' }}>
                  {typeof kpi.value === 'number' ? kpi.unit : ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CELL B ── LIVE CORRIDORS (1.2fr) */}
        <div style={{ borderRight: `1px solid ${C.border}`, padding: '6px 8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: '8px', color: C.orange, fontWeight: 700, marginBottom: '4px' }}>LIVE CORRIDORS</div>
          {/* Header */}
          <div style={{ display: 'flex', fontSize: '9px', color: C.orange, fontWeight: 700, padding: '2px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ flex: 3 }}>NAME</span>
            <span style={{ flex: 1, textAlign: 'right' }}>NOW</span>
            <span style={{ flex: 1, textAlign: 'right' }}>1H</span>
            <span style={{ flex: 1, textAlign: 'right' }}>3H</span>
            <span style={{ width: 40, textAlign: 'right' }}>TRND</span>
          </div>
          {/* Data rows */}
          <div className="corridors-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {tableRows.slice(0, 8).map((row, i) => {
              const t = row.real ? trendSymbol(row.now) : { sym: '→', col: C.muted };
              return (
                <div key={i} style={{
                  display: 'flex', height: '26px', alignItems: 'center',
                  borderBottom: i < 7 ? `1px solid ${C.border}` : 'none',
                }}>
                  <span className="name-scroll" style={{ flex: 3, fontSize: '13px', color: C.white, fontWeight: 700, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                    {row.name}
                  </span>
                  <span style={{ flex: 1, textAlign: 'right', fontSize: '13px', fontWeight: 700, color: row.real ? congColor(row.now) : C.muted }}>
                    {row.real ? `${row.now}%` : '--'}
                  </span>
                  <span style={{ flex: 1, textAlign: 'right', fontSize: '13px', fontWeight: 700, color: row.real && typeof row.h1 === 'number' ? congColor(row.h1) : C.muted }}>
                    {row.real && typeof row.h1 === 'number' ? `${row.h1}%` : '--'}
                  </span>
                  <span style={{ flex: 1, textAlign: 'right', fontSize: '13px', fontWeight: 700, color: row.real && typeof row.h3 === 'number' ? congColor(row.h3) : C.muted }}>
                    {row.real && typeof row.h3 === 'number' ? `${row.h3}%` : '--'}
                  </span>
                  <span style={{ width: 40, textAlign: 'right', fontSize: '11px', color: t.col }}>
                    {t.sym}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CELL C ── MACRO TREND (1.5fr) */}
        <div className="macro-chart-override" style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '9px', color: '#FF6600', padding: '4px 8px' }}>
              MACRO TREND (24H)
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <HeroMacroTrendChart data={hourlyTrend} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROW 4: CORRIDOR STRIP 40px ─── */}
      <div style={S.strip}>
        <div className="strip-scroll" style={{ width: '100%', height: '100%', display: 'flex' }}>
          {corridorStrip.map((c, i) => (
            <div key={i} style={{
              flexShrink: 0, width: '120px', borderRight: `1px solid ${C.border}`,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '4px', paddingLeft: '8px', paddingRight: '8px',
            }}>
              <div style={{ fontSize: '8px', color: C.orange, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                {c.name}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1, color: c.real ? congColor(c.congestionLevel) : C.muted }}>
                {c.real ? `${c.congestionLevel}%` : '--'}
              </div>
              <div style={{ display: 'flex', height: '3px', gap: '1px', marginTop: '2px' }}>
                <div style={{ flex: 1, background: c.real ? C.green : '#111' }} />
                <div style={{ flex: 1, background: c.real && c.congestionLevel >= 40 ? C.amber : '#111' }} />
                <div style={{ flex: 1, background: c.real && c.congestionLevel > 70 ? C.red : '#111' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ROW 5: BOTTOM BAR 48px ─── */}
      <div style={S.bottom}>
        {/* Left: Incident feed */}
        <div style={{ padding: '6px 10px', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ fontSize: '8px', color: C.orange, fontWeight: 700, marginBottom: 2 }}>INCIDENT FEED</div>
          {alerts.length > 0 ? (
            <div style={{ fontSize: '9px', color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {alerts.map(a => `${a.loc}: ${a.desc}`).join(' ▪ ')}
            </div>
          ) : (
            <div style={{ fontSize: '9px', color: '#226633', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 5, height: 5, background: '#226633' }} />
              NO ACTIVE INCIDENTS
            </div>
          )}
        </div>
        {/* Right: Market status + weather */}
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '10px', fontWeight: 700 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, background: !hasTrafficData ? C.muted : isPeak ? C.red : C.green }} />
            <span style={{ color: !hasTrafficData ? C.muted : isPeak ? C.red : C.green }}>
              {hasTrafficData ? (isPeak ? 'PEAK TRAFFIC' : 'CITY MOVING') : 'NO TRAFFIC DATA'}
            </span>
          </div>
          <div style={{ fontSize: '9px', color: C.muted, marginTop: 2, textAlign: 'right' }}>
            {metrics?.weather
              ? `${(metrics.weather.condition || 'UNKNOWN').toUpperCase()} ${metrics.weather.condition === 'unknown' ? '--' : metrics.weather.temperature}°C`
              : 'WEATHER --'}
          </div>
        </div>
      </div>
    </section>
  );
};

const getCorridorBadge = (nowMin: number, baseMin: number) => {
  const delay = Number(nowMin) - Number(baseMin);
  if (delay <= 5) return { delay, label: 'CLEAR', dot: 'good' as const, chip: 'border-success/30 bg-success/10 text-success', bar: 'bg-success' };
  if (delay <= 10) return { delay, label: 'MODERATE', dot: 'moderate' as const, chip: 'border-warning/30 bg-warning/10 text-warning', bar: 'bg-warning' };
  if (delay <= 20) return { delay, label: 'HEAVY', dot: 'moderate' as const, chip: 'border-primary/30 bg-primary/10 text-primary', bar: 'bg-primary' };
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

  const TF = "'Courier New', 'IBM Plex Mono', monospace";
  const panelStyle = { background: '#0d0d0d', border: '1px solid #1a1a1a', padding: '10px 12px', fontFamily: TF } as const;
  const labelStyle = { fontSize: '9px', fontWeight: 700, color: '#FF6600', textTransform: 'uppercase' as const, letterSpacing: '0.05em', fontFamily: TF } as const;
  const valueStyle = { fontSize: '18px', fontWeight: 700, color: '#CCCCCC', fontFamily: TF, lineHeight: 1.2 } as const;
  const headingStyle = { fontSize: '11px', fontWeight: 700, color: '#FF6600', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontFamily: TF, fontStyle: 'normal' as const } as const;

  return (
    <ErrorBoundary>
      {/* Bloomberg Terminal Hero */}
      <BloombergTerminalHero />

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
