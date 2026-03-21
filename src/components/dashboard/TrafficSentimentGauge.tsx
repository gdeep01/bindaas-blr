import { useMemo } from 'react';

const getCongestionLabel = (value: number) => {
  if (value < 30) return { label: 'Smooth', className: 'border-white/20 text-white/90' };
  if (value < 55) return { label: 'Moderate', className: 'border-white/20 text-white/90' };
  if (value < 75) return { label: 'Heavy', className: 'border-white/20 text-white/90' };
  return { label: 'Severe', className: 'border-white/20 text-white/90' };
};

export const TrafficSentimentGauge = ({ value }: { value: number }) => {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
  const meta = useMemo(() => getCongestionLabel(safeValue), [safeValue]);

  return (
    <div className="w-full max-w-sm bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 text-white overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow text-orange-400">
            LIVE CITY TRAFFIC
          </div>
          <div className="mt-1 font-serif italic font-bold text-white text-xl tracking-tight">Congestion</div>
        </div>
        <div
          className={`shrink-0 rounded-full border px-2 py-1 font-display font-black text-xs tracking-widest uppercase ${meta.className}`}
        >
          {meta.label}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="font-display font-black text-5xl text-white tracking-tighter leading-none tabular-nums [font-variant-numeric:normal] [font-feature-settings:'kern'_0]">
          {safeValue}%
        </div>
        <div className="flex-1">
          <div className="h-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${Math.max(safeValue, 6)}%` }} />
          </div>
          <div className="mt-2 font-sans text-xs text-white/40 font-light">Updated every 30 minutes</div>
        </div>
      </div>
    </div>
  );
};
