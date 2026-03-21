import type { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { typography } from '@/lib/typography';

interface InsightCardProps {
  icon: LucideIcon;
  title: ReactNode;
  value: string;
  change?: ReactNode;
  changeType?: 'positive' | 'negative' | 'neutral';
  changeUppercase?: boolean;
}

export const InsightCard = ({ icon: Icon, title, value, change, changeUppercase = false }: InsightCardProps) => {
  return (
    <div className="h-full rounded-sm border border-border bg-card p-4">
      <div className="flex h-full flex-col justify-center gap-2">
        <div className="flex items-center gap-2">
          <Icon size={18} className="shrink-0 text-muted-foreground not-italic" />
          <span className="min-w-0 truncate text-[10px] uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
        </div>

        {typeof change === 'string' ? (
          <div className={`text-[11px] text-muted-foreground ${changeUppercase ? 'uppercase' : 'normal-case'}`}>
            {change || '\u00A0'}
          </div>
        ) : (
          <div>{change ?? '\u00A0'}</div>
        )}

        <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
      </div>
    </div>
  );
};
