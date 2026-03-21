import { useState, memo } from 'react';
import { ChevronDown, ChevronUp, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMoodLabel, getMoodColor, getMoodColorClass, type BestForTag } from '@/data/moodData';
import { LOCALITY_PRICE_MAP } from '@/lib/localityPrices';
import { StatusDot } from '@/components/ui/StatusDot';
import { MetricBar } from './MetricBar';
import { GrowthScoreBar } from './GrowthScoreBar';
import type { EnrichedAreaMood } from './types';

const MAX_COMPARE = 3;

export const AreaMoodCard = memo(({
  area,
  compared,
  compareCount,
  onToggleCompare,
  onLocationSelect,
}: {
  area: EnrichedAreaMood;
  compared: boolean;
  compareCount: number;
  onToggleCompare: (areaName: string) => void;
  onLocationSelect?: (lat: number, lng: number, name: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const compareLimitReached = !compared && compareCount >= MAX_COMPARE;
  const price = LOCALITY_PRICE_MAP[area.area];

  const handleToggleExpanded = () => {
    setExpanded((current) => !current);
    onLocationSelect?.(area.lat, area.lng, area.area);
  };

  return (
    <div
      className="cursor-pointer card-elevated card-interactive p-4"
      role="button"
      tabIndex={0}
      onClick={handleToggleExpanded}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleToggleExpanded();
        }
      }}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-display font-black text-white text-lg tracking-tight leading-tight flex items-center gap-2">
                <span className="min-w-0 break-words">{area.area}</span>
                {area.isLiveData && !area.isStale ? (
                  <span className="inline-flex items-center gap-2 font-display font-black text-[10px] tracking-widest text-success uppercase">
                    <StatusDot status="live" />
                    LIVE
                  </span>
                ) : null}
              </h4>
              <span className={`font-serif italic font-bold text-lg ${getMoodColorClass(area.overallMood)}`}>
                {getMoodLabel(area.overallMood)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 font-display font-black text-2xl tracking-tighter tabular-nums"
                style={{ borderColor: getMoodColor(area.overallMood), color: getMoodColor(area.overallMood) }}
              >
                {area.overallMood}
              </div>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {area.bestFor.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {area.bestFor.map((tag: BestForTag, index) => {
                const hideOnMobile = index >= 2;
                return (
                  <span
                    key={tag}
                    className={`${hideOnMobile ? 'hidden sm:inline-flex' : 'inline-flex'} rounded-xl border border-white/10 px-2 py-0.5 font-display font-black text-[10px] tracking-widest text-muted-foreground`}
                  >
                    {tag}
                  </span>
                );
              })}
              {area.bestFor.length > 2 ? (
                <span className="inline-flex rounded-xl border border-white/10 px-2 py-0.5 font-display font-black text-[10px] tracking-widest text-muted-foreground sm:hidden">
                  +{area.bestFor.length - 2} more
                </span>
              ) : null}
            </div>
          ) : null}

          {typeof price === 'number' ? (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Home className="h-3 w-3 not-italic" />
              <span>{`\u20B9${price.toLocaleString('en-IN')}/sqft`}</span>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleCompare(area.area);
          }}
          disabled={compareLimitReached}
          className={`min-h-[44px] w-full shrink-0 rounded-xl border px-2 py-1 font-display font-black text-xs tracking-widest uppercase transition-colors sm:w-auto ${
            compared
              ? 'border-primary bg-primary text-primary-foreground'
              : compareLimitReached
                ? 'border-white/5 bg-muted/30 text-muted-foreground'
                : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20'
          }`}
        >
          {compared ? 'Comparing' : 'Compare'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2.5 border-t border-white/5 pt-4">
              {area.metrics.map((metric) => (
                <MetricBar key={metric.name} name={metric.name} score={metric.score} icon={metric.icon} source={metric.source} />
              ))}
              <GrowthScoreBar area={area} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

AreaMoodCard.displayName = 'AreaMoodCard';
