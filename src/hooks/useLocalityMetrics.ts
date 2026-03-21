import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type LocalityMetric = Tables<'locality_metrics'>;
const IS_DEV = import.meta.env.DEV;

export const useLocalityMetrics = () => {
  return useQuery({
    queryKey: ['locality_metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locality_metrics')
        .select('*')
        .limit(200);
      
      if (error) {
        if (IS_DEV) {
          console.error('Error fetching locality metrics:', error);
        }
        return [];
      }
      
      return data ?? [];
    },
    // Cache the metrics for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
};
