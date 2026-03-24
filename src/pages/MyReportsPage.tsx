import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { DataCard } from '@/components/ui/DataCard';
import { typography } from '@/lib/typography';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/ui/StatusDot';
import { Skeleton } from '@/components/ui/skeleton';

type GarbageReportRow = Tables<'garbage_reports'>;
const IS_DEV = import.meta.env.DEV;

const statusToDot = (status?: string) => {
  if (status === 'confirmed') {
    return 'moderate' as const;
  }

  if (status === 'resolved') {
    return 'good' as const;
  }

  return 'high' as const;
};

const labelize = (value?: string) => {
  if (!value) {
    return 'Reported';
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
};

const formatReportedAt = (value?: string) => {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
};

const MyReportsPage = () => {
  const { user } = useAuth();
  const { profile, updateDisplayName, publicName, canSetUsername } = useProfile(user?.id);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [reports, setReports] = useState<GarbageReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setReports([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let active = true;

    const loadReports = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await supabase
          .from('garbage_reports')
          .select('id, location_name, description, reported_at, moderation_status, upvotes, user_id')
          .eq('user_id', user.id)
          .order('reported_at', { ascending: false });

        if (!active) {
          return;
        }

        if (error) {
          if (IS_DEV) {
            console.error('My reports fetch failed:', error.message);
          }
          setReports([]);
          setLoadError('Your reports could not be loaded right now.');
          setIsLoading(false);
          return;
        }

        setReports(data ?? []);
        setIsLoading(false);
      } catch (error) {
        if (IS_DEV) {
          console.error('My reports fetch failed:', error);
        }
        if (!active) {
          return;
        }
        setReports([]);
        setLoadError('Your reports could not be loaded right now.');
        setIsLoading(false);
      }
    };

    void loadReports();
    return () => {
      active = false;
    };
  }, [user]);

  const reportItems = useMemo(
    () =>
      reports.map((report) => ({
        id: report.id,
        name: report.location_name,
        description: report.description,
        moderationStatus: report.moderation_status,
        upvotes: report.upvotes,
        reportedAt: report.reported_at,
      })),
    [reports],
  );

  if (!user) {
    return (
      <DataCard>
        <h1 className={typography.h1}>My Reports</h1>
        <p className={`${typography.body} mt-3`}>Sign in from the garbage report flow to track your submitted reports.</p>
      </DataCard>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className={typography.label}>ACCOUNT</p>
        <h1 className={typography.h1}>My Reports</h1>
        <p className={`${typography.body} mt-2`}>
          {(user.user_metadata as { full_name?: string } | null)?.full_name ?? user.email ?? 'User'}
        </p>

        <div className="mt-4 space-y-2 max-w-sm">
          <p className="text-xs text-white/40 uppercase tracking-widest">Username</p>
          <p className="text-sm text-white/60">
            Showing as: <span className="text-white font-semibold">{publicName}</span>
          </p>

          {canSetUsername && (
            <>
              <p className="text-xs text-white/30">
                {profile?.display_name 
                  ? 'You have one username change remaining' 
                  : 'Set a username — you can change it once after this'}
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  maxLength={30}
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Choose a username"
                  className="max-w-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    setNameError('');
                    setNameSuccess('');
                    const result = await updateDisplayName(nameInput);
                    if (result.success) {
                      setNameSuccess('Username updated!');
                      setNameInput('');
                      setTimeout(() => setNameSuccess(''), 3000);
                    } else {
                      setNameError(result.error ?? 'Failed to update username');
                      setTimeout(() => setNameError(''), 3000);
                    }
                  }}
                >
                  Save
                </Button>
              </div>
              {nameError && <p className="text-xs text-red-400">{nameError}</p>}
              {nameSuccess && <p className="text-xs text-green-400">{nameSuccess}</p>}
            </>
          )}
        </div>
      </div>

      <DataCard>
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary not-italic" />
          <h3 className={typography.sectionTitle}>Submitted Garbage Reports</h3>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton.Card />
            <Skeleton.Card />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle size={32} className="mb-3 text-gray-600 not-italic" />
            <p className="text-sm text-gray-400">{loadError}</p>
            <p className="mt-1 text-xs text-gray-600">Try again in a moment.</p>
          </div>
        ) : reportItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList size={32} className="mb-3 text-gray-600 not-italic" />
            <p className="text-sm text-gray-400">
              No reports are linked to this account yet.
            </p>
            <p className="mt-1 text-xs text-gray-600">
              <Link to="/garbage" className="text-primary">Create one from the garbage page.</Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reportItems.map((report) => (
              <div key={report.id} className="rounded-xl border border-white/5 bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`${typography.body} text-foreground`}>{report.name}</p>
                    <p className={`${typography.body} mt-1`}>{report.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-2 py-1">
                    <StatusDot status={statusToDot(report.moderationStatus)} />
                    <span className={typography.label}>{labelize(report.moderationStatus)}</span>
                  </span>
                </div>
                <p className={`${typography.label} mt-2`}>
                  {report.upvotes ?? 0} UPVOTES
                </p>
                <p className={`${typography.label} mt-3`}>
                  {formatReportedAt(report.reportedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </DataCard>
    </div>
  );
};

export default MyReportsPage;
