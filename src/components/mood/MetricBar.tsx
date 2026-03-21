import { getMoodColorClass } from '@/data/moodData';
import { cleanMetricLabel, getMetricIcon } from './metricUtils';

const metricColor = (score: number) => {
  if (score >= 75) return 'bg-traffic-low';
  if (score >= 50) return 'bg-traffic-moderate';
  if (score >= 30) return 'bg-traffic-high';
  return 'bg-traffic-severe';
};

export const MetricBar = ({ name, score, source }: { name: string; score: number; icon: string; source?: string }) => {
  const barColor = metricColor(score);
  const Icon = getMetricIcon(name);

  return (
    <div className="group flex items-center gap-2" title={source || cleanMetricLabel(name)}>
      <span className="flex w-5 flex-shrink-0 justify-center sm:w-6">
        <Icon className="h-3.5 w-3.5 text-muted-foreground not-italic sm:h-4 sm:w-4" />
      </span>
      <span className="flex-1 min-w-0 truncate text-xs text-muted-foreground">{cleanMetricLabel(name)}</span>
      <div className="w-24 flex-shrink-0 relative">
        <div className="h-1 bg-border overflow-hidden rounded-full">
          <div
            className={`h-full ${barColor}`}
            style={{ width: `${Math.max(score, 5)}%` }}
          />
        </div>
      </div>
      <span className={`w-6 flex-shrink-0 text-right text-xs font-bold tabular-nums ${getMoodColorClass(score)}`}>{score}</span>
    </div>
  );
};
