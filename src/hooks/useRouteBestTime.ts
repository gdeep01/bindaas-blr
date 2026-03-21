import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

const IS_DEV = import.meta.env.DEV;

type RouteReliabilityRow = Tables<'route_reliability'>;

interface RouteBestTimeOptions {
  fromLocation: string;
  toLocation: string;
  weatherCondition?: string | null;
}

export interface RouteBestTimeResult {
  bestDepartureHour: number;
  avgDurationMins: number;
  fastestDurationMins: number;
  p90DurationMins: number;
  sampleCount: number;
  weatherCondition: string;
  isEstimated?: boolean;
  reliabilityPercent?: number;
  recommendedWindows?: string;
}

const normalizeWeather = (value?: string | null) => value?.trim().toLowerCase() || 'unknown';

const mapRowToBestTime = (row: RouteReliabilityRow): RouteBestTimeResult => ({
  bestDepartureHour: row.departure_hour,
  avgDurationMins: row.avg_duration_mins,
  fastestDurationMins: row.min_duration_mins,
  p90DurationMins: row.p90_duration_mins,
  sampleCount: row.sample_count,
  weatherCondition: row.weather_condition,
});

const formatHour = (hour: number) => {
  const h = hour % 24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour} ${ampm}`;
};

const escapeLike = (value: string) => value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

const seededBaselineFor = (normalizedWeather: string): RouteBestTimeResult => {
  const currentHour = new Date().getHours();
  const bestHour = currentHour <= 23 ? currentHour : currentHour;
  return {
    bestDepartureHour: bestHour,
    avgDurationMins: 0,
    fastestDurationMins: 0,
    p90DurationMins: 0,
    sampleCount: 0,
    weatherCondition: normalizedWeather,
    isEstimated: true,
    reliabilityPercent: 70,
    recommendedWindows: currentHour < 8 ? 'Before 8:00 AM' : currentHour >= 20 ? 'Now is fine' : 'After 8:00 PM',
  };
};

async function fetchPairRows(fromLocation: string, toLocation: string, dayOfWeek: number): Promise<RouteReliabilityRow[]> {
  const trimmedFrom = fromLocation.trim();
  const trimmedTo = toLocation.trim();

  const fromPattern = `%${escapeLike(trimmedFrom)}%`;
  const toPattern = `%${escapeLike(trimmedTo)}%`;

  const exactPairQuery = await supabase
    .from('route_reliability')
    .select('*')
    .ilike('from_location', fromPattern)
    .ilike('to_location', toPattern)
    .eq('day_of_week', dayOfWeek)
    .order('departure_hour', { ascending: true });

  if (!exactPairQuery.error && exactPairQuery.data && exactPairQuery.data.length > 0) {
    return exactPairQuery.data;
  }

  const reversePairQuery = await supabase
    .from('route_reliability')
    .select('*')
    .ilike('from_location', toPattern)
    .ilike('to_location', fromPattern)
    .eq('day_of_week', dayOfWeek)
    .order('departure_hour', { ascending: true });

  if (reversePairQuery.error) {
    throw reversePairQuery.error;
  }

  return reversePairQuery.data ?? [];
}

export const useRouteBestTime = ({ fromLocation, toLocation, weatherCondition }: RouteBestTimeOptions) => {
  return useQuery({
    queryKey: ['route-best-time', fromLocation, toLocation, weatherCondition],
    enabled: Boolean(fromLocation && toLocation),
    staleTime: 60 * 1000,
    queryFn: async () => {
      const dayOfWeek = new Date().getDay();
      const currentHour = new Date().getHours();
      const normalizedWeather = normalizeWeather(weatherCondition);

      try {
        // Fix: Use the route_reliability table for the specific route
        // Actual columns are departure_hour and avg_duration_mins
        const { data: hourlyData, error: dbError } = await supabase
          .from('route_reliability')
          .select('departure_hour, avg_duration_mins, min_duration_mins, p90_duration_mins, sample_count, weather_condition')
          .ilike('from_location', `%${fromLocation}%`)
          .ilike('to_location', `%${toLocation}%`)
          .eq('day_of_week', dayOfWeek)
          .gte('departure_hour', currentHour) // only future hours
          .lte('departure_hour', 23)
          .order('avg_duration_mins', { ascending: true }) // lowest duration first
          .limit(24);

        if (dbError) throw dbError;

        if (hourlyData && hourlyData.length > 0) {
          // Best window = lowest avg_duration_mins hour
          const bestRow = hourlyData[0];
          const bestHour = bestRow.departure_hour;
          
          const result: RouteBestTimeResult = {
            bestDepartureHour: bestHour,
            avgDurationMins: bestRow.avg_duration_mins,
            fastestDurationMins: bestRow.min_duration_mins,
            p90DurationMins: bestRow.p90_duration_mins,
            sampleCount: bestRow.sample_count,
            weatherCondition: bestRow.weather_condition,
            recommendedWindows: `${formatHour(bestHour)} – ${formatHour(Math.min(bestHour + 2, 23))}`
          };

          return {
            bestTime: result,
            learning: result,
          };
        }

        // Fallback if no data
        const seededBaseline = seededBaselineFor(normalizedWeather);
        return {
          bestTime: seededBaseline,
          learning: seededBaseline,
        };
      } catch (error) {
        if (IS_DEV) {
          console.warn('Route reliability unavailable:', error);
        }
        const seededBaseline = seededBaselineFor(normalizedWeather);
        return {
          bestTime: seededBaseline,
          learning: seededBaseline,
        };
      }
    },
  });
};
