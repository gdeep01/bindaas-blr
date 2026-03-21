import { useEffect, useMemo, useState } from 'react';
import { GarbageReportForm } from '@/components/GarbageReportForm';
import { TrafficMap } from '@/components/TrafficMap';
import { useTrafficData } from '@/contexts/TrafficDataContext';
import { Trash2, MapPin, AlertTriangle, Trophy, ThumbsUp, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { DataCard } from '@/components/ui/DataCard';
import { typography } from '@/lib/typography';
import { StatusDot } from '@/components/ui/StatusDot';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LeaderboardEntry {
  reporter_name: string;
  reports: number;
}

type GarbageReportRow = Tables<'garbage_reports'>;
const IS_DEV = import.meta.env.DEV;

const formatReportedAt = (value?: string) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
};

const getReporterBadge = (index: number, reports: number) => {
  if (index === 0) return { icon: '\u{1F451}', label: 'Top Reporter', color: 'text-warning border-warning/30 bg-warning/10' };
  if (index === 1) return { icon: '\u{1F948}', label: 'Cleanup Crusader', color: 'text-muted-foreground border-white/10 bg-muted/30' };
  if (index === 2) return { icon: '\u{1F949}', label: 'Cleanup Crusader', color: 'text-primary border-primary/30 bg-primary/10' };
  if (reports >= 5) return { icon: '\u{1F6E1}\uFE0F', label: 'Eco-Warrior', color: 'text-primary border-primary/30 bg-primary/10' };
  return { icon: '\u{1F331}', label: 'Active Citizen', color: 'text-success border-success/30 bg-success/10' };
};

const GarbagePage = () => {
  const { garbagePoints, handleReportSubmitted, userReportsCount } = useTrafficData();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  const [votingIds, setVotingIds] = useState<string[]>([]);
  const [mockResolvedIds, setMockResolvedIds] = useState<string[]>([]);
  const { user } = useAuth();

  const userReports = useMemo(() => garbagePoints.filter((point) => point.type === 'user_report'), [garbagePoints]);
  const hotspots = useMemo(() => garbagePoints.filter((point) => point.type !== 'user_report'), [garbagePoints]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLeaderboardLoading(true);
      try {
        const { data, error } = await supabase
          .from('garbage_reports')
          .select('reporter_name, reported_at')
          .gte('reported_at', startOfMonth(new Date()).toISOString())
          .not('reporter_name', 'is', null);

        if (error) throw error;

        const counts = (data || []).reduce<Record<string, number>>((acc, report) => {
          const name = (report as Pick<GarbageReportRow, 'reporter_name'>).reporter_name?.trim();
          if (!name) return acc;
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});

        setLeaderboard(
          Object.entries(counts)
            .map(([reporter_name, reports]) => ({ reporter_name, reports }))
            .sort((a, b) => b.reports - a.reports)
            .slice(0, 5),
        );
      } catch (error) {
        if (IS_DEV) console.error('Leaderboard load failed:', error);
        setLeaderboard([]);
      } finally {
        setIsLeaderboardLoading(false);
      }
    };

    loadLeaderboard();
  }, [userReportsCount]);

  const hasVoted = (reportId: string) => {
    if (!user) return false;
    return window.localStorage.getItem(`blr_garbage_vote_${reportId}_${user.id}`) === '1';
  };

  const handleUpvote = async (reportId: string) => {
    if (!user) {
      toast.error('Sign in to verify community reports.');
      return;
    }

    if (hasVoted(reportId)) {
      toast.error('You have already upvoted this report.');
      return;
    }

    setVotingIds((current) => [...current, reportId]);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/garbage-upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ report_id: reportId }),
        cache: 'no-store',
        mode: 'cors',
        signal: AbortSignal.timeout(10000),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!data.success) throw new Error(data.error || 'Failed to upvote report');

      window.localStorage.setItem(`blr_garbage_vote_${reportId}_${user.id}`, '1');
      toast.success('Report verified. Community score updated.');
      handleReportSubmitted();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upvote report';
      toast.error(message);
    } finally {
      setVotingIds((current) => current.filter((id) => id !== reportId));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={typography.h1}>Garbage &amp; Cleanliness</h1>
          <p className={typography.h1Sub}>Report waste issues, track cleanup heroes, and review known garbage hotspots across Bengaluru.</p>
        </div>
        <div className="w-full sm:w-auto">
          <GarbageReportForm onReportSubmitted={handleReportSubmitted} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DataCard className="text-center">
          <Trash2 className="mx-auto mb-2 h-6 w-6 text-primary not-italic" />
          <p className={`${typography.statLarge} tabular-nums`}>{userReportsCount ?? 0}</p>
          <p className="eyebrow mt-1">USER REPORTS</p>
        </DataCard>
        <DataCard className="text-center">
          <MapPin className="mx-auto mb-2 h-6 w-6 text-warning not-italic" />
          <p className={`${typography.statLarge} tabular-nums`}>{hotspots.length}</p>
          <p className="eyebrow mt-1">KNOWN HOTSPOTS</p>
        </DataCard>
        <DataCard className="col-span-2 text-center sm:col-span-1">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-danger not-italic" />
          <p className={`${typography.statLarge} tabular-nums`}>{userReports.filter((report) => report.severity === 'high').length}</p>
          <p className="eyebrow mt-1">HIGH SEVERITY</p>
        </DataCard>
      </div>

      <div className="w-full overflow-hidden rounded-xl">
        <TrafficMap
          variant="fullpage"
          title="Garbage Hotspots"
          hideTitle
          locations={[]}
          incidents={[]}
          roadWorks={[]}
          garbagePoints={garbagePoints}
          allowMoodMode={false}
          initialView={{ center: [12.9716, 77.5946], zoom: 12 }}
          disableAutoFit
          hideLayerControls
          hiddenLayerKeys={['traffic', 'incidents', 'roadWorks', 'landslide', 'earthquakes', 'pricePerSqft', 'metroAccess']}
          initialLayers={{
            traffic: false,
            incidents: false,
            roadWorks: false,
            garbageOfficial: true,
            garbageCommunity: true,
            landslide: false,
            earthquakes: false,
            pricePerSqft: false,
            metroAccess: false,
          }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <DataCard>
          <h3 className={typography.h3}>Recent User Reports</h3>
          {userReports.length === 0 ? (
            <p className={`${typography.body} py-8 text-center`}>No garbage reports yet. Submit one above.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {userReports.map((report) => {
                const isResolved = report.moderationStatus === 'resolved' || mockResolvedIds.includes(report.id);
                return (
                  <div key={report.id} className={`relative overflow-hidden rounded-xl border border-white/5 bg-card p-4 ${isResolved ? 'ring-1 ring-success/30' : ''}`}>
                    {isResolved ? (
                      <div className="absolute -right-8 top-5 rotate-45 bg-success/20 px-6 py-1 text-[10px] font-bold uppercase tracking-widest text-success border-y border-success/30">
                        Resolved
                      </div>
                    ) : null}

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-serif italic text-foreground truncate">{report.name || 'Unnamed location'}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <StatusDot status={isResolved ? 'good' : report.severity === 'high' ? 'high' : report.severity === 'medium' ? 'moderate' : 'low'} />
                          <span className="text-[11px] text-muted-foreground">{report.reportType || report.type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">UPVOTES</div>
                        <div className="text-2xl font-bold text-foreground tabular-nums">{report.upvotes ?? 0}</div>
                      </div>
                    </div>

                    {report.description ? (
                      <p className={`${typography.body} mt-3 text-foreground`}>{report.description}</p>
                    ) : null}

                    {report.imageUrls?.length ? (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {report.imageUrls.slice(0, 2).map((imageUrl) => (
                          <a key={imageUrl} href={imageUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-white/10">
                            <img src={imageUrl} alt="Garbage report reference" width="320" height="192" className="h-24 w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-muted-foreground">
                      <span>{formatReportedAt(report.reportedAt)}</span>
                      <span>{report.reporterName ? report.reporterName : 'Anonymous'}</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpvote(report.id)}
                        disabled={votingIds.includes(report.id) || hasVoted(report.id) || isResolved}
                        className={`min-h-[44px] min-w-[44px] inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[0.75rem] font-bold transition-colors ${hasVoted(report.id)
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-white/10 text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <ThumbsUp className={`h-4 w-4 not-italic ${hasVoted(report.id) ? 'fill-primary' : ''}`} />
                        {hasVoted(report.id) ? 'Supported' : votingIds.includes(report.id) ? 'Upvoting' : 'Upvote'}
                      </button>

                      {!isResolved ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMockResolvedIds((prev) => [...prev, report.id]);
                            toast.success('Report visually marked as resolved (demo mode)');
                          }}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-3 py-2 text-[0.75rem] font-bold text-success transition-colors hover:border-success/50 hover:bg-success/15"
                          title="Mock Admin Action"
                        >
                          <CheckCircle2 className="h-4 w-4 not-italic" />
                          Resolve Site
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DataCard>

        <DataCard>
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary not-italic" />
            <h3 className={typography.h3}>Top Reporters This Month</h3>
          </div>

          {isLeaderboardLoading ? (
            <p className={typography.body}>Loading leaderboard…</p>
          ) : leaderboard.length === 0 ? (
            <p className={typography.body}>No named reports yet. Add a reporter name to appear here.</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => {
                const badge = getReporterBadge(index, entry.reports);
                return (
                  <div
                    key={entry.reporter_name}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-card p-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${badge.color}`}>
                        <span className="text-lg">{badge.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">
                          #{index + 1} {entry.reporter_name}
                        </p>
                        <p className={typography.label}>{badge.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary tabular-nums">{entry.reports}</span>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Reports</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DataCard>
      </div>
    </div>
  );
};

export default GarbagePage;

