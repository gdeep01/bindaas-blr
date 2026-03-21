import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export const InstallPromptBanner = () => {
  const { isVisible, canInstall, promptInstall, dismiss } = useInstallPrompt();
  const [isInstalling, setIsInstalling] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (!isVisible || !canInstall) {
    return null;
  }

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      await promptInstall();
    } finally {
      if (isMountedRef.current) {
        setIsInstalling(false);
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1800px] px-4 pt-4 md:px-8 xl:px-12">
      <div className="glass-card rounded-xl border border-white/5 bg-card px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-body text-sm font-bold text-foreground">
              Add Bindaas BLR to your home screen for quick access.
            </p>
            <p className="font-body text-xs font-bold text-muted-foreground">
              Install the app for a faster launch and better offline resilience.
            </p>
	          </div>
	          <div className="flex items-center gap-2 self-end sm:self-auto">
	            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={dismiss} disabled={isInstalling}>
	              <X className="mr-1 h-4 w-4 not-italic" />
	              Maybe later
	            </Button>
	            <Button size="sm" onClick={handleInstall} disabled={isInstalling}>
	              <Download className="mr-1 h-4 w-4 not-italic" />
	              {isInstalling ? 'Adding App' : 'Add App'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
