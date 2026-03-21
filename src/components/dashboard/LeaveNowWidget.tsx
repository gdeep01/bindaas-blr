import React, { useEffect, useState } from 'react';
import { Share2, CheckCircle2, AlertTriangle, XCircle, ArrowRight, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HotspotData, HourlyDataPoint } from '@/lib/trafficApi';
import { useToast } from '@/hooks/use-toast';
import { ALL_COMMUTE_LOCATIONS, parseHourLabel } from '@/lib/commute';
import { getTrackedRouteSummary, getWeightedRouteCongestion } from '@/lib/routeTiming';
import { typography } from '@/lib/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouteBestTime } from '@/hooks/useRouteBestTime';

interface LeaveNowWidgetProps {
  hotspots: HotspotData[];
  hourlyTrend: HourlyDataPoint[];
}

const STATUS_CONFIG = {
  good: {
    border: 'border-orange-500/40',
    accent: 'text-[hsl(var(--primary))]',
    panel: 'border-orange-500/40 bg-secondary',
    icon: <CheckCircle2 className="h-5 w-5 text-[hsl(var(--primary))] not-italic" />,
    label: 'Good',
  },
  moderate: {
    border: 'border-warning',
    accent: 'text-warning',
    panel: 'border-warning/40 bg-secondary',
    icon: <AlertTriangle className="h-5 w-5 text-warning not-italic" />,
    label: 'Moderate',
  },
  heavy: {
    border: 'border-danger',
    accent: 'text-danger',
    panel: 'border-danger/40 bg-secondary',
    icon: <XCircle className="h-5 w-5 text-danger not-italic" />,
    label: 'Heavy',
  },
} as const;

export const LeaveNowWidget: React.FC<LeaveNowWidgetProps> = ({ hotspots, hourlyTrend }) => {
  const { toast } = useToast();
  const [fromLocation, setFromLocation] = useState<string>(() => localStorage.getItem('leaveNow_from') || 'Koramangala Inner Ring Road');
  const [toLocation, setToLocation] = useState<string>(() => localStorage.getItem('leaveNow_to') || 'Whitefield Main Road');

  const [homeRoute, setHomeRoute] = useState<{ from: string; to: string } | null>(() => {
    const saved = localStorage.getItem('leaveNow_homeRoute');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [officeRoute, setOfficeRoute] = useState<{ from: string; to: string } | null>(() => {
    const saved = localStorage.getItem('leaveNow_officeRoute');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSaveHome = () => {
    const route = { from: fromLocation, to: toLocation };
    setHomeRoute(route);
    localStorage.setItem('leaveNow_homeRoute', JSON.stringify(route));
    toast({ title: 'Saved Home Route', description: `${fromLocation} to ${toLocation}`, duration: 2000 });
  };

  const handleLoadHome = () => {
    if (!homeRoute) return;
    setFromLocation(homeRoute.from);
    setToLocation(homeRoute.to);
  };

  const handleSaveOffice = () => {
    const route = { from: fromLocation, to: toLocation };
    setOfficeRoute(route);
    localStorage.setItem('leaveNow_officeRoute', JSON.stringify(route));
    toast({ title: 'Saved Office Route', description: `${fromLocation} to ${toLocation}`, duration: 2000 });
  };

  const handleLoadOffice = () => {
    if (!officeRoute) return;
    setFromLocation(officeRoute.from);
    setToLocation(officeRoute.to);
  };

  useEffect(() => {
    localStorage.setItem('leaveNow_from', fromLocation);
  }, [fromLocation]);

  useEffect(() => {
    localStorage.setItem('leaveNow_to', toLocation);
  }, [toLocation]);

  const isDataLoaded = hotspots.length > 0;
  const { trackedFrom, trackedTo, baseTime } = getTrackedRouteSummary(fromLocation, toLocation);
  const fromData = hotspots.find((h) => h.name.includes(trackedFrom) || trackedFrom.includes(h.name));
  const toData = hotspots.find((h) => h.name.includes(trackedTo) || trackedTo.includes(h.name));
  const fromCongestion = fromData?.congestionLevel ?? 0;
  const toCongestion = toData?.congestionLevel ?? 0;
  const routeCongestion = getWeightedRouteCongestion(fromCongestion, toCongestion);
  const currentEstTime = Math.round(baseTime + routeCongestion * 0.4);

  const { data: routeReliability } = useRouteBestTime({
    fromLocation,
    toLocation,
  });

  const formatDepartureHour = (hour: number) => {
    const normalized = ((hour % 24) + 24) % 24;
    const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
    const period = normalized >= 12 ? 'PM' : 'AM';
    return `${hour12}:00 ${period}`;
  };

  let status: 'good' | 'moderate' | 'heavy' = 'good';
  let rec = { title: 'Good time to leave now', subtitle: `Est. ${currentEstTime} min` };

  if (routeCongestion > 65) {
    status = 'heavy';
    const nowHour = new Date().getHours();
    const betterWindow = hourlyTrend.find((h) => {
      const hHour = parseHourLabel(h.time);
      const pointCongestion = h.predicted ?? h.congestion ?? 100;
      const weightedPointCongestion = getWeightedRouteCongestion(pointCongestion, pointCongestion);
      return hHour > nowHour && weightedPointCongestion < 55;
    });

    if (betterWindow) {
      const betterCongestion = getWeightedRouteCongestion(
        betterWindow.predicted ?? betterWindow.congestion ?? routeCongestion,
        betterWindow.predicted ?? betterWindow.congestion ?? routeCongestion,
      );
      const savedMins = Math.round((routeCongestion - betterCongestion) * 0.4);
      rec = { title: 'Heavy traffic', subtitle: `Better around ${betterWindow.time}. Saves about ${Math.max(5, savedMins)} min.` };
    } else {
      rec = { title: 'Heavy traffic', subtitle: 'Delay if you can.' };
    }
  } else if (routeCongestion >= 45) {
    status = 'moderate';
    rec = { title: 'Moderate traffic', subtitle: `Est. ${currentEstTime} min` };
  }

  const learnedBestTime = routeReliability?.bestTime;
  const learningState = routeReliability?.learning;

  if (learnedBestTime) {
    const isLowConfidence = learnedBestTime.avgDurationMins === 0 || learnedBestTime.sampleCount < 50;
    if (isLowConfidence) {
      rec = {
        title: 'BEST TIME TO LEAVE',
        subtitle: `Estimated ${currentEstTime} min based on typical Bengaluru traffic patterns`,
      };
    } else {
      const minutesSaved = Math.max(1, currentEstTime - Math.round(learnedBestTime.avgDurationMins));
      rec = {
        title: `Leave by ${formatDepartureHour(learnedBestTime.bestDepartureHour)}`,
        subtitle: `Route history avg ${Math.round(learnedBestTime.avgDurationMins)} min, about ${minutesSaved} min faster.`,
      };
    }
  } else if (learningState) {
    rec = {
      title: 'Chart updating',
      subtitle: 'Check back in a few minutes as fresh route samples arrive.',
    };
  }

  const cfg = STATUS_CONFIG[status];
  const commuteUrl = `/commute?from=${encodeURIComponent(fromLocation)}&to=${encodeURIComponent(toLocation)}`;
  const shareText = `${'\u{1F6A6}'} ${fromLocation} ${'\u2192'} ${toLocation} ${'\u2014'} ${routeCongestion}% congestion ${'\u2014'} Est. ${currentEstTime} min ${'\u2014'} ${window.location.origin}${commuteUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast({ title: 'Link Copied', description: 'Commute info copied to clipboard.', duration: 2000 });
    } catch {
      // Ignore clipboard failures.
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  if (!isDataLoaded) {
    return (
      <div className="mb-6">
        <Skeleton.Card className="p-4" />
      </div>
    );
  }

  if (!homeRoute && !officeRoute) {
    return (
      <motion.div
        layout
        className="mb-6 rounded-xl bg-card border-l-4 border-l-primary shadow-[0_0_15px_rgba(255,107,0,0.15)] border border-white/5"
      >
        <div className="p-4">
          <p className="font-sans text-sm text-white/60 font-light">
            Set up your daily commute for smart departure times.{' '}
            <Link
              to="/commute"
              className="font-display font-black text-orange-400 hover:text-orange-300 tracking-tight transition-colors text-sm"
            >
              {'\u2192'} Set Home & Office Route
            </Link>
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className={`mb-6 rounded-xl bg-card p-4 border-l-4 border-l-primary shadow-[0_0_15px_rgba(255,107,0,0.15)] border border-white/5 ${cfg.border}`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:w-auto">
          <div className="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap md:w-auto">
            <div className="flex flex-col">
              <label htmlFor="leaveNow-from" className={`${typography.label} mb-2 ml-0.5`}>
                LEAVE FROM
              </label>
              <select
                id="leaveNow-from"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/5 bg-background px-3 py-3 text-[0.75rem] font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-56"
              >
                {ALL_COMMUTE_LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="mt-6 hidden h-4 w-4 shrink-0 text-muted-foreground not-italic sm:block" />

            <div className="mt-2 flex flex-col sm:mt-0">
              <label htmlFor="leaveNow-to" className={`${typography.label} mb-2 ml-0.5`}>
                GOING TO
              </label>
              <select
                id="leaveNow-to"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/5 bg-background px-3 py-3 text-[0.75rem] font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-56"
              >
                {ALL_COMMUTE_LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex w-full items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => (homeRoute ? handleLoadHome() : handleSaveHome())}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-[0.7rem] font-bold uppercase tracking-wider transition-colors ${
                  homeRoute ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/5 text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {homeRoute ? 'Home' : 'Save Home'}
              </button>
              {homeRoute ? (
                <button
                  type="button"
                  onClick={handleSaveHome}
                  className="min-h-[44px] px-2 text-[10px] text-muted-foreground underline underline-offset-2 transition-colors hover:text-primary"
                >
                  Update
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => (officeRoute ? handleLoadOffice() : handleSaveOffice())}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-[0.7rem] font-bold uppercase tracking-wider transition-colors ${
                  officeRoute ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/5 text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {officeRoute ? 'Office' : 'Save Office'}
              </button>
              {officeRoute ? (
                <button
                  type="button"
                  onClick={handleSaveOffice}
                  className="min-h-[44px] px-2 text-[10px] text-muted-foreground underline underline-offset-2 transition-colors hover:text-primary"
                >
                  Update
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className={`flex flex-1 flex-col justify-center rounded-xl border p-4 ${cfg.panel}`}>
          <div className="flex items-start gap-3 sm:items-center">
            <div className="mt-0.5 shrink-0 sm:mt-0">{cfg.icon}</div>
            <div>
              <p className="text-sm text-foreground">
                {status === 'good' ? (
                  rec.title
                ) : (
                  <>
                    <span className={cfg.accent}>{cfg.label}</span> {rec.title}
                  </>
                )}
              </p>
              <p className={typography.body}>{rec.subtitle}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-xl border border-white/5 bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground normal-case">
                  Route avg: {routeCongestion}%
                </span>
                <span className="rounded-xl border border-white/5 bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground normal-case">
                  {fromLocation}: {fromCongestion}%
                </span>
                <span className="rounded-xl border border-white/5 bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground normal-case">
                  {toLocation}: {toCongestion}%
                </span>
              </div>
              <Link to={commuteUrl} className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-[0.75rem] font-bold text-primary transition-colors hover:text-foreground">
                See Full Commute Analysis
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-2 flex w-full items-center justify-end gap-2 self-end md:mt-0 md:w-auto md:self-auto">
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-white/5 px-4 py-3 text-[0.75rem] font-bold text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Copy to clipboard"
          >
            <span className="inline-flex items-center gap-2">
              <Share2 className="h-4 w-4 not-italic" />
              <span className="hidden sm:inline">Copy</span>
            </span>
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-[hsl(var(--primary))] px-4 py-3 text-[0.75rem] font-bold text-[hsl(var(--primary))] transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Share on WhatsApp"
          >
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4 not-italic" />
              <span className="hidden sm:inline">WhatsApp</span>
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
