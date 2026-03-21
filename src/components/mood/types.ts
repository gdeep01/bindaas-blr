import type { AreaMood } from '@/data/moodData';

export interface EnrichedAreaMood extends AreaMood {
  isLiveData?: boolean;
  isStale?: boolean;
  scoreTrend?: number;
}

export const AREA_ACCENTS = [
  {
    bar: 'hsl(var(--primary))',
    chipClass: 'border-primary text-primary',
  },
  {
    bar: 'hsl(var(--info))',
    chipClass: 'border-info text-info',
  },
  {
    bar: 'hsl(var(--warning))',
    chipClass: 'border-warning text-warning',
  },
] as const;
