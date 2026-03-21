import { useEffect, useMemo, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const VISITS_KEY = 'installPrompt_visits';
const DISMISSED_KEY = 'installPrompt_dismissed';
const SESSION_KEY = 'installPrompt_session_seen';

export const useInstallPrompt = () => {
  const [visitCount, setVisitCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const storedVisits = Number(localStorage.getItem(VISITS_KEY) || '0');
    const hasSeenThisSession = sessionStorage.getItem(SESSION_KEY) === 'true';
    const nextVisits = hasSeenThisSession ? storedVisits : storedVisits + 1;

    if (!hasSeenThisSession) {
      localStorage.setItem(VISITS_KEY, String(nextVisits));
      sessionStorage.setItem(SESSION_KEY, 'true');
    }

    setVisitCount(nextVisits);
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const isVisible = useMemo(() => {
    return visitCount >= 3 && !dismissed && !isInstalled && !!deferredPrompt;
  }, [deferredPrompt, dismissed, isInstalled, visitCount]);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
      return true;
    }

    return false;
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return {
    canInstall: !!deferredPrompt,
    isVisible,
    promptInstall,
    dismiss,
  };
};
