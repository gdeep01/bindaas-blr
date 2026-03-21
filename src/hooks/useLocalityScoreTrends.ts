import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type LocalityScoreHistoryRow = Tables<'locality_score_history'>;
const IS_DEV = import.meta.env.DEV;

export interface LocalityScoreTrend {
  localityName: string;
  currentScore: number;
  previousScore: number;
  delta: number;
  snapshotDate: string;
  previousSnapshotDate: string;
}

export const useLocalityScoreTrends = () => {
  return useQuery({
    queryKey: ['locality-score-trends'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const lookbackDate = subDays(new Date(), 60).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('locality_score_history')
        .select('*')
        .gte('snapshot_date', lookbackDate)
        .order('snapshot_date', { ascending: false })
        .limit(5000);

      if (error) {
        if (IS_DEV) {
          console.error('Error fetching locality score history:', error);
        }
        return new Map<string, LocalityScoreTrend>();
      }

      const rows = (data || []) as LocalityScoreHistoryRow[];
      const threshold = subDays(new Date(), 30).toISOString().slice(0, 10);
      const trendMap = new Map<string, LocalityScoreTrend>();

      const groupedRows = rows.reduce<Map<string, LocalityScoreHistoryRow[]>>((accumulator, row) => {
        const existing = accumulator.get(row.locality_name) ?? [];
        existing.push(row);
        accumulator.set(row.locality_name, existing);
        return accumulator;
      }, new Map());

      groupedRows.forEach((localityRows, localityName) => {
        const sortedRows = [...localityRows].sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date));
        const current = sortedRows[0];
        const previous = sortedRows.find((row) => row.snapshot_date <= threshold) ?? sortedRows[1];

        if (!current || !previous) {
          return;
        }

        trendMap.set(localityName, {
          localityName,
          currentScore: current.overall_mood_score,
          previousScore: previous.overall_mood_score,
          delta: current.overall_mood_score - previous.overall_mood_score,
          snapshotDate: current.snapshot_date,
          previousSnapshotDate: previous.snapshot_date,
        });
      });

      return trendMap;
    },
  });
};
