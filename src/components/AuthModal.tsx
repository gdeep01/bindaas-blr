import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { typography } from '@/lib/typography';
import { supabase } from '@/integrations/supabase/client';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GoogleLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.6-2.5C17 4.3 14.8 3 12 3 6.9 3 2.8 7.1 2.8 12.2S6.9 21.4 12 21.4c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7H12z"
    />
    <path
      fill="#FBBC05"
      d="M12 21.4c2.7 0 5-1 6.6-2.7l-3.1-2.4c-.8.6-1.9 1.1-3.5 1.1-3.2 0-5.9-2.1-6.9-5l-3.3 2.5c1.5 3.8 5.2 6.5 10.2 6.5z"
    />
    <path
      fill="#4285F4"
      d="M21.8 11.5c0-.7-.1-1.2-.2-1.7H12v3.9h5.5c-.3 1.6-1.4 3-3.1 3.9l3.1 2.4c1.9-1.7 3.3-4.3 3.3-7.5z"
    />
    <path
      fill="#34A853"
      d="M3.8 7.4l3.2 2.3c.9-1.8 2.7-3.1 5-3.1 1.9 0 3.2.8 3.9 1.5l2.6-2.5C17 4.3 14.8 3 12 3 8.4 3 5.2 5.1 3.8 7.4z"
    />
  </svg>
);

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [isOauthStarting, setIsOauthStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setIsOauthStarting(false);
    setErrorMessage(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onOpenChange, open]);

  const handleGoogleOauth = useCallback(async () => {
    setErrorMessage(null);
    setIsOauthStarting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMessage('Something went wrong. Please try again.');
        setIsOauthStarting(false);
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setIsOauthStarting(false);
    }
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div className="relative z-[10000] w-full max-w-md rounded-sm border border-border bg-card p-5 sm:p-6">
        {errorMessage ? (
          <div className="mb-4 rounded-sm border border-danger/40 bg-danger/10 p-3 text-sm font-bold text-danger">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <h2 className={typography.sectionTitle}>Sign in to Bindaas BLR</h2>
            <p className={`${typography.body} mt-1 text-muted-foreground`}>
              Sign in to submit reports and track your contributions.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void handleGoogleOauth()}
            disabled={isOauthStarting}
            className="w-full"
            variant="outline"
          >
            {isOauthStarting ? (
              <Loader2 className="h-4 w-4 animate-spin not-italic" />
            ) : (
              <GoogleLogo className="h-4 w-4" />
            )}
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
};
