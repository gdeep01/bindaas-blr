import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { typography } from '@/lib/typography';

// MANUAL: Add http://192.168.1.2:8080/auth/callback to Google Cloud Console
// OAuth → Clients → Authorized redirect URIs for local mobile testing
// Production URI https://bindaas-blr.vercel.app/auth/callback must also be present
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (hasRun.current) return;
      hasRun.current = true;

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (!code) {
          throw new Error('Missing auth code.');
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        if (mounted) {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        if (mounted) {
          navigate('/?error=auth_failed', { replace: true });
        }
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-4">
      <Loader2 className="h-7 w-7 animate-spin text-muted-foreground not-italic" />
      <div className="text-center">
        <p className={typography.sectionTitle}>Signing you in…</p>
        <p className={`${typography.body} mt-1 text-muted-foreground`}>Please wait while we finish authentication.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
