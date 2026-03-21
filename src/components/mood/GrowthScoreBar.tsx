import { AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import type { AreaMood } from '@/data/moodData';

const getGrowthColor = (score: number) => {
  if (score >= 75) return 'text-traffic-low';
  if (score >= 55) return 'text-primary';
  if (score >= 40) return 'text-traffic-moderate';
  return 'text-traffic-high';
};

const getGrowthLabel = (score: number) => {
  if (score >= 75) return 'High Growth';
  if (score >= 55) return 'Moderate Growth';
  if (score >= 40) return 'Steady';
  return 'Low Growth';
};

export const GrowthScoreBar = ({ area }: { area: AreaMood }) => {
  const { growthScore, growthData } = area;
  const segments = [
    { label: 'Infra', value: growthData.infra, max: 30, color: 'bg-foreground' },
    { label: 'Commercial', value: growthData.commercial, max: 20, color: 'bg-primary' },
    { label: 'Price', value: growthData.priceMomentum, max: 20, color: 'bg-traffic-low' },
    { label: 'Connect', value: growthData.connectivity, max: 15, color: 'bg-traffic-moderate' },
    { label: 'Underval', value: growthData.undervaluation, max: 15, color: 'bg-muted-foreground' },
  ];

  return (
    <div className="mt-3 border-t border-border/30 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="eyebrow">Future Growth Potential</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${getGrowthColor(growthScore)}`}>{getGrowthLabel(growthScore)}</span>
          <span className={`text-sm font-bold ${getGrowthColor(growthScore)}`}>{growthScore}</span>
        </div>
      </div>

      <div className="mb-4 flex h-1 overflow-hidden bg-border">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={seg.color}
            style={{ width: `${seg.value}%` }}
            title={`${seg.label}: ${seg.value}/${seg.max}`}
          />
        ))}
      </div>

      <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1">
        {segments.map((seg) => (
          <span key={seg.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${seg.color}`} />
            {seg.label} {seg.value}/{seg.max}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-traffic-low" />
            <span className="eyebrow text-traffic-low">Growth Drivers</span>
          </div>
          {growthData.drivers.map((driver, index) => (
            <p key={index} className="border-l-2 border-traffic-low/30 pl-2 text-sm leading-tight text-muted-foreground">
              {driver}
            </p>
          ))}
        </div>
        <div>
          <div className="mb-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-traffic-moderate" />
            <span className="eyebrow text-traffic-moderate">Risk Factors</span>
          </div>
          {growthData.risks.map((risk, index) => (
            <p key={index} className="border-l-2 border-traffic-moderate/30 pl-2 text-sm leading-tight text-muted-foreground">
              {risk}
            </p>
          ))}
        </div>
      </div>

      <p className="mt-2 text-[9px] italic text-muted-foreground/50">
        Score estimates development potential based on publicly announced projects and historical trends.
      </p>
    </div>
  );
};

