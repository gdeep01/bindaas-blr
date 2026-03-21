import { MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { typography } from '@/lib/typography';

interface HotspotCardProps {
  name: string;
  congestionLevel: number;
  trend: 'up' | 'down' | 'stable';
  eta: string;
  onClick?: () => void;
}

const getStatusStyles = (level: number) => {
  if (level <= 25) return { border: 'border-traffic-low', text: 'text-traffic-low', barColor: 'bg-traffic-low' };
  if (level <= 50) return { border: 'border-traffic-moderate', text: 'text-traffic-moderate', barColor: 'bg-traffic-moderate' };
  if (level <= 75) return { border: 'border-traffic-high', text: 'text-traffic-high', barColor: 'bg-traffic-high' };
  return { border: 'border-traffic-severe', text: 'text-traffic-severe', barColor: 'bg-traffic-severe' };
};

export const HotspotCard = ({ name, congestionLevel, trend, eta, onClick }: HotspotCardProps) => {
  const styles = getStatusStyles(congestionLevel);
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  const trendColor = trend === 'up' ? 'text-traffic-high' : 'text-traffic-low';

  return (
    <div 
      className={`glass-card group rounded-xl border border-white/5 bg-card p-4 ${onClick ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl border ${styles.border}`}>
            <MapPin className={`w-4 h-4 ${styles.text} not-italic`} />
          </div>
          <div>
            <h3 className={`${typography.h4} text-foreground transition-colors group-hover:text-foreground`}>{name}</h3>
            <p className={typography.label}>ETA: {eta || 'N/A'}</p>
          </div>
        </div>
        {TrendIcon ? <TrendIcon className={`w-4 h-4 ${trendColor} not-italic`} /> : null}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-0.5 bg-border overflow-hidden">
            <div className={`h-full ${styles.barColor}`} style={{ width: `${Math.max(congestionLevel, 5)}%` }} />
          </div>
        </div>
        <span className={`min-w-[3.5rem] text-right text-sm stat-display ${styles.text}`}>
          {congestionLevel}%
        </span>
      </div>
    </div>
  );
};
