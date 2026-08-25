import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './app/App.js';
import { AuthProvider } from './features/auth/AuthProvider.js';
import './styles.css';

const rootElement = document.querySelector('#root');

if (!rootElement)
  throw new Error('No se encontró el contenedor de la aplicación.');

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
