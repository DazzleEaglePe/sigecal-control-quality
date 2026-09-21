import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isInstallPromptEvent = (event: Event): event is InstallPromptEvent =>
  'prompt' in event && 'userChoice' in event;

export const PwaInstallButton = (): React.JSX.Element | null => {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent>();

  useEffect(() => {
    const capturePrompt = (event: Event): void => {
      if (!isInstallPromptEvent(event)) return;
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', capturePrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
    };
  }, []);

  const install = async (): Promise<void> => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(undefined);
  };

  if (!installPrompt) return null;
  return (
    <button
      className="icon-button"
      type="button"
      title="Instalar SIGECAL"
      aria-label="Instalar SIGECAL en este dispositivo"
      onClick={() => void install()}
    >
      <Download aria-hidden="true" />
    </button>
  );
};
