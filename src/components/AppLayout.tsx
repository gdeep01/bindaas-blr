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
          <div className="flex justify-center sm:justify-start items-center">
            <a 
              href="https://linkedin.com/in/gagan-deep-755130296" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-all duration-300 hover:scale-110 opacity-60 hover:opacity-100"
              aria-label="LinkedIn Profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                <path fill="#0077B5" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5z"/>
                <path fill="#FFF" d="M8 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>
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

