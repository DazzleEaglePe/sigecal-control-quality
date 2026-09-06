import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './app/App.js';
import { ConfirmProvider } from './components/ui/confirm-provider.js';
import { Toaster } from './components/ui/toaster.js';
import { AuthProvider } from './features/auth/AuthProvider.js';
import { applyStoredTheme } from './features/shell/useTheme.js';
import './styles.css';
import './styles/shell-refresh.css';
import './styles/shell-responsive.css';
import './styles/typography-refresh.css';
import './styles/dashboard-refresh.css';
import './styles/dashboard-visual.css';
import './styles/components-refresh.css';
import './styles/quality-refresh.css';
import './styles/quality-table.css';
import './styles/quality-calendar.css';
import './styles/quality-forms.css';
import './styles/quality-execution.css';
import './styles/quality-measurements.css';
import './styles/quality-review.css';
import './styles/quality-traceability.css';
import './styles/quality-analysis.css';
import './styles/sensory.css';
import './styles/account-access.css';
import './styles/auth-refresh.css';
import './styles/auth-form-refresh.css';
import './styles/state-colors.css';
import './styles/sidebar-collapse.css';
import './styles/notifications.css';

const rootElement = document.querySelector('#root');

if (!rootElement)
  throw new Error('No se encontró el contenedor de la aplicación.');

// Antes de montar React, para que cualquier ruta cargue con el tema
// guardado y no parpadee al oscuro por defecto.
applyStoredTheme();

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <App />
          <Toaster />
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
