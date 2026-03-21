import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { InstallPromptBanner } from '@/components/InstallPromptBanner';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';

export const AppLayout = () => {
  const location = useLocation();

  useEffect(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('error') === 'auth_failed') {
    // Clean the URL immediately
    window.history.replaceState({}, '', window.location.pathname);

    // Only show error if genuinely not signed in
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        toast.error('Sign in failed', {
          description: 'Please check your internet connection or try again.',
        });
      }
    });
  }
}, [location.search]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <InstallPromptBanner />

      <main className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-6 md:px-8 xl:px-12 md:py-8">
        <div key={location.pathname + location.search} className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-white/5 px-4 py-6 md:px-6">
        <div className="mx-auto grid max-w-[1800px] gap-2 text-center sm:grid-cols-3 sm:text-left">
          <span className="font-sans text-[10px] tracking-[0.15em] text-white/30 uppercase sm:text-left">
            BENGALURU CITY INTELLIGENCE, UPDATED THROUGHOUT THE DAY.
          </span>
          <span className="font-serif italic font-bold text-white/60 text-xl tracking-tight sm:text-center">
            Navigate Bengaluru, bindaas.
          </span>
          <span className="font-sans text-white/30 text-xs sm:text-right flex items-center gap-3 justify-end">
  © 2026 Bindaas BLR
  <a href="/privacy-policy.html" className="hover:text-white/60 transition-colors underline underline-offset-2">Privacy Policy</a>
  <a href="/terms.html" className="hover:text-white/60 transition-colors underline underline-offset-2">Terms</a>
</span>
        </div>
      </footer>
    </div>
  );
};

