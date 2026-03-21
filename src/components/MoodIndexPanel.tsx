import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Car,
  ChevronDown,
  ChevronUp,
  Flame,
  GraduationCap,
  HeartPulse,
  Home,
  Scale,
  Shield,
  Smile,
  Sparkles,
  Trees,
  TrendingUp,
  X,
} from 'lucide-react';
import { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { bengaluruAreaMoods, getMoodLabel, getMoodColorClass, getMoodBg, AreaMood, BestForTag } from '@/data/moodData';
import { useLocalityMetrics } from '@/hooks/useLocalityMetrics';
import { useLocalityScoreTrends } from '@/hooks/useLocalityScoreTrends';
import { differenceInDays, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { typography } from '@/lib/typography';
import { StatusDot } from '@/components/ui/StatusDot';
import { toast } from 'sonner';
import { ComparePanel, AreaMoodCard, type EnrichedAreaMood } from './mood';

const MAX_COMPARE = 3;



export const MoodIndexPanel = ({ 
  embedded = false,
  onLocationSelect
}: { 
  embedded?: boolean;
  onLocationSelect?: (lat: number, lng: number, name: string) => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isComparePage = location.pathname === '/compare';
  const [sortBy, setSortBy] = useState<'name' | 'mood' | 'growth'>('mood');
  const [compareAreas, setCompareAreas] = useState<string[]>([]);
  const { data: liveMetrics, isLoading: isMetricsLoading } = useLocalityMetrics();
  const { data: scoreTrends, isLoading: isTrendsLoading } = useLocalityScoreTrends();
  const [showSkeleton, setShowSkeleton] = useState(true);
  const isPanelLoading = isMetricsLoading || isTrendsLoading;
  const metricsByLocality = useMemo(
    () => new Map((liveMetrics || []).map((metric) => [metric.locality_name, metric])),
    [liveMetrics],
  );

  const enrichedMoods: EnrichedAreaMood[] = useMemo(() => bengaluruAreaMoods.map((area) => {
    const liveData = metricsByLocality.get(area.area);
    const scoreTrend = scoreTrends?.get(area.area)?.delta;
    if (!liveData) {
      return {
        ...area,
        scoreTrend,
      };
    }

    const lastUpdatedDate = parseISO(liveData.last_updated);
    const isStale = Number.isNaN(lastUpdatedDate.getTime()) ? true : differenceInDays(new Date(), lastUpdatedDate) > 7;
    const newMetrics = area.metrics.map((metric) => {
      if (metric.name === 'Schools') return { ...metric, score: liveData.schools_score };
      if (metric.name === 'Healthcare') return { ...metric, score: liveData.healthcare_score };
      if (metric.name === 'Parks & Green') return { ...metric, score: liveData.parks_score };
      if (metric.name === 'Entertainment') return { ...metric, score: liveData.entertainment_score };
      if (metric.name === 'Fire Station') return { ...metric, score: liveData.fire_score };
      if (metric.name === 'Industrial Safety') return { ...metric, score: liveData.industrial_score };
      return metric;
    });

    return {
      ...area,
      overallMood: liveData.overall_mood_score || area.overallMood,
      metrics: newMetrics,
      isLiveData: true,
      isStale,
      scoreTrend,
    };
  }), [metricsByLocality, scoreTrends]);

  useEffect(() => {
    const areasParam = searchParams.get('areas');
    if (!areasParam) {
      if (location.pathname === '/compare') {
        setCompareAreas([]);
      }
      return;
    }

    const decoded = areasParam.split(',').map((area) => decodeURIComponent(area).trim()).filter(Boolean).slice(0, MAX_COMPARE);
    setCompareAreas(decoded);
  }, [location.pathname, searchParams]);

  useEffect(() => {
    if (isPanelLoading) {
      setShowSkeleton(true);
      return;
    }

    const timer = window.setTimeout(() => setShowSkeleton(false), 300);
    return () => window.clearTimeout(timer);
  }, [isPanelLoading]);

  const sorted = useMemo(() => [...enrichedMoods].sort((a, b) => {
    const aLive = a.isLiveData ? 1 : 0;
    const bLive = b.isLiveData ? 1 : 0;
    if (aLive !== bLive) return bLive - aLive;
    if (sortBy === 'mood') return b.overallMood - a.overallMood;
    if (sortBy === 'growth') return b.growthScore - a.growthScore;
    return a.area.localeCompare(b.area);
  }), [enrichedMoods, sortBy]);

  const cityAvg = useMemo(() => Math.round(enrichedMoods.reduce((sum, area) => sum + area.overallMood, 0) / enrichedMoods.length), [enrichedMoods]);
  const comparedAreas = useMemo(
    () => enrichedMoods.filter((area) => compareAreas.includes(area.area)),
    [compareAreas, enrichedMoods],
  );
  const listRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 260,
    overscan: 4,
  });

  const syncCompareRoute = (areas: string[]) => {
    const comparePath = areas.length > 0 ? `/compare?areas=${areas.map(encodeURIComponent).join(',')}` : '/compare';
    if (areas.length >= 2) {
      navigate(comparePath, { replace: false });
      return;
    }

    if (isComparePage) {
      navigate(comparePath, { replace: false });
    }
  };

  const handleToggleCompare = (areaName: string) => {
    setCompareAreas((current) => {
      const isSelected = current.includes(areaName);
      if (!isSelected && current.length >= MAX_COMPARE) {
        toast.message('Maximum 3 areas. Remove one to add another.', { duration: 2000 });
        return current;
      }

      const next = current.includes(areaName)
        ? current.filter((area) => area !== areaName)
        : [...current, areaName];
      syncCompareRoute(next);
      return next;
    });
  };

  const clearCompare = () => {
    setCompareAreas([]);
    if (isComparePage) {
      navigate('/compare');
    }
  };

  return (
    <>
      <div className={embedded ? '' : 'rounded-xl border border-white/5 bg-card p-4'}>
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/5 bg-muted/30 p-4">
          <span className="eyebrow whitespace-nowrap">City Avg</span>
          <div className="flex-1 relative">
            <div className="h-0.5 bg-border overflow-hidden">
              <div
                className={getMoodBg(cityAvg)}
                style={{ width: `${cityAvg}%` }}
              />
            </div>
          </div>
          <span className={`font-body text-sm font-bold tabular-nums ${getMoodColorClass(cityAvg)}`}>{cityAvg}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
          <div className="flex gap-2">
            {(['mood', 'growth', 'name'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`rounded-xl border px-3 py-2 ${typography.navLink} transition-colors ${
                  sortBy === key ? 'border-primary text-primary' : 'border-white/10 text-muted-foreground hover:text-foreground'
                }`}
              >
                {key === 'mood' ? 'By Score' : key === 'growth' ? 'Growth' : 'A-Z'}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Select up to 3 cards with <span className="text-foreground font-medium">Compare</span>.</p>
        </div>

        {isComparePage && (
          <div className="mb-6">
            <ComparePanel
              areas={comparedAreas}
              onRemove={(area) => handleToggleCompare(area)}
              onClear={clearCompare}
              inline
            />
          </div>
        )}

        <div ref={listRef} className={`max-h-[520px] overflow-y-auto scrollbar-hide ${isComparePage ? '' : 'pb-36'}`}>
          {showSkeleton ? (
            <div className="space-y-3 pb-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="glass-card rounded-xl border border-white/5 bg-card p-4 min-h-[148px]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 flex items-center gap-3">
                      <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-secondary" />
                      <div className="space-y-2">
                        <div className="h-4 w-40 animate-pulse rounded-sm bg-secondary" />
                        <div className="h-3 w-28 animate-pulse rounded-sm bg-secondary" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-secondary" />
                      <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-secondary" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <div className="h-[22px] w-28 animate-pulse rounded-sm bg-secondary" />
                    <div className="h-[22px] w-24 animate-pulse rounded-sm bg-secondary" />
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-secondary" />
                    <div className="h-3 w-24 animate-pulse rounded-sm bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const area = sorted[virtualRow.index];

                return (
                  <div
                    key={area.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="absolute left-0 top-0 w-full pb-3"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <AreaMoodCard
                      area={area}
                      compared={compareAreas.includes(area.area)}
                      compareCount={compareAreas.length}
                      onToggleCompare={handleToggleCompare}
                      onLocationSelect={onLocationSelect}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {!isComparePage && (
        <ComparePanel
          areas={comparedAreas}
          onRemove={(area) => handleToggleCompare(area)}
          onClear={clearCompare}
        />
      )}
    </>
  );
};


