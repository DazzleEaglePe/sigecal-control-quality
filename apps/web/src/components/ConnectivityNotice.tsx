import { CloudOff, Wifi } from 'lucide-react';

import { useOnlineStatus } from '../features/shell/useOnlineStatus.js';

export const ConnectivityNotice = (): React.JSX.Element | null => {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="connectivity-notice" role="status" aria-live="polite">
      <CloudOff aria-hidden="true" />
      <span>
        Sin conexión. Los datos mostrados pueden estar desactualizados; no se
        pueden guardar cambios hasta reconectar.
      </span>
      <Wifi aria-hidden="true" />
    </div>
  );
};
