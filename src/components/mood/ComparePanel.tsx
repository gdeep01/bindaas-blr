import { useMemo } from 'react';
import { X, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EnrichedAreaMood } from './types';
import { getMoodColor } from '@/data/moodData';

const selectionText = (count: number) => {
  if (count <= 0) return '0 of 3 selected';
  if (count === 1) return '1 of 3 selected';
  if (count === 2) return '2 of 3 selected';
  return `3 of 3 \u2713 Ready to compare`;
};

export const ComparePanel = ({
  areas,
  onRemove,
  onClear,
  inline = false,
}: {
  areas: EnrichedAreaMood[];
  onRemove: (area: string) => void;
  onClear: () => void;
  inline?: boolean;
}) => {
  const selectionLabel = selectionText(areas.length);
  const topMetrics = useMemo(() => (areas[0]?.metrics ?? []).slice(0, 5), [areas]);

  if (!areas.length) {
    return null;
  }

  if (!inline) {
    return (
      <div className="fixed inset-x-0 bottom-4 z-40 px-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-xl border border-white/10 bg-card p-3">
          <div className="min-w-0">
            <div className="eyebrow">{selectionLabel}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {areas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => onRemove(area.area)}
                  className="min-h-[44px] rounded-xl border border-white/10 bg-muted/30 px-2 py-1 text-xs font-bold text-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="truncate max-w-[10rem]">{area.area}</span>
                    <X className="h-3 w-3 not-italic" />
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Button variant="ghost" className="min-h-[44px]" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-card p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Scale className="mt-0.5 h-4 w-4 text-primary not-italic" />
          <div>
            <div className="eyebrow">{selectionLabel}</div>
            <div className="mt-1 text-xs text-muted-foreground">Comparing {areas.length} areas</div>
          </div>
        </div>
        <Button variant="ghost" className="min-h-[44px]" onClick={onClear}>
          Clear
        </Button>
      </div>

      <div className={`grid gap-3 ${areas.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {areas.map((area) => (
          <div key={area.id} className="rounded-xl border border-white/10 bg-muted/30 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-foreground">{area.area}</div>
                <button
                  type="button"
                  onClick={() => onRemove(area.area)}
                  className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 px-2 py-1 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Remove <X className="h-3 w-3 not-italic" />
                </button>
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 text-3xl font-bold leading-none tabular-nums"
                style={{ borderColor: getMoodColor(area.overallMood), color: getMoodColor(area.overallMood) }}
              >
                {area.overallMood}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {topMetrics.map((metric) => {
                const score = area.metrics.find((m) => m.name === metric.name)?.score ?? 0;
                return (
                  <div key={`${area.id}-${metric.name}`} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{metric.name}</span>
                    <span className="font-bold text-foreground tabular-nums">{score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
