import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './useAuth.js';

const SessionLoading = (): React.JSX.Element => (
  <main className="auth-screen" aria-busy="true">
    <div className="auth-loading">
      <span className="status-indicator is-loading" aria-hidden="true" />
      <p>Recuperando sesión segura…</p>
    </div>
  </main>
);

export const ProtectedRoute = (): React.JSX.Element => {
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === 'booting') return <SessionLoading />;
  if (auth.status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (auth.user?.mustChangePassword && location.pathname !== '/password') {
    return <Navigate to="/password" replace />;
  }
  if (!auth.user?.mustChangePassword && location.pathname === '/password') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};
