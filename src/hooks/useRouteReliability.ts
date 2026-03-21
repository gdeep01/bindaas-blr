import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type RouteReliabilityRow = Tables<'route_reliability'>;

interface RouteReliabilityOptions {
  fromLocation: string;
  toLocation: string;
  dayOfWeek?: number;
  hourOfDay?: number;
}

export const useRouteReliability = ({ fromLocation, toLocation, dayOfWeek, hourOfDay }: RouteReliabilityOptions) => {
  return useQuery({
    queryKey: ['route-reliability', fromLocation, toLocation, dayOfWeek, hourOfDay],
    enabled: Boolean(fromLocation && toLocation),
    queryFn: async () => {
      const today = dayOfWeek ?? new Date().getDay();
      const nowHour = hourOfDay ?? new Date().getHours();

      // Primary — exact day + hour match
      const { data: routeData, error: queryError } = await supabase
        .from('route_reliability')
        .select('sample_count, avg_duration_mins')
        .ilike('from_location', `%${fromLocation}%`)
        .ilike('to_location', `%${toLocation}%`)
        .eq('day_of_week', today)
        .eq('departure_hour', nowHour)
        .limit(1)
        .maybeSingle();

      if (queryError) throw queryError;
      let data = routeData;

      // Fallback — same day, highest sample_count
      if (!data) {
        const { data: fallback, error: fallbackError } = await supabase
          .from('route_reliability')
          .select('sample_count, avg_duration_mins')
          .ilike('from_location', `%${fromLocation}%`)
          .ilike('to_location', `%${toLocation}%`)
          .eq('day_of_week', today)
          .order('sample_count', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (fallbackError) throw fallbackError;
        data = fallback;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
