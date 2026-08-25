import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { AppShell } from '../components/AppShell.js';
import { ProtectedRoute } from '../features/auth/ProtectedRoute.js';
import { PermissionRoute } from '../features/auth/PermissionRoute.js';
import { Permission } from '@sigecal/shared';
import { HomePage } from '../pages/HomePage.js';
import { NotFoundPage } from '../pages/NotFoundPage.js';

const LoginPage = lazy(async () => {
  const module = await import('../pages/LoginPage.js');
  return { default: module.LoginPage };
});

const ChangePasswordPage = lazy(async () => {
  const module = await import('../pages/ChangePasswordPage.js');
  return { default: module.ChangePasswordPage };
});

const AreasPage = lazy(async () => {
  const module = await import('../pages/AreasPage.js');
  return { default: module.AreasPage };
});

const UsersPage = lazy(async () => {
  const module = await import('../pages/UsersPage.js');
  return { default: module.UsersPage };
});

const CatalogsPage = lazy(async () => {
  const module = await import('../pages/CatalogsPage.js');
  return { default: module.CatalogsPage };
});

const StandardsPage = lazy(async () => {
  const module = await import('../pages/StandardsPage.js');
  return { default: module.StandardsPage };
});

const BatchesPage = lazy(async () => {
  const module = await import('../pages/BatchesPage.js');
  return { default: module.BatchesPage };
});
const NewBatchPage = lazy(async () => {
  const module = await import('../pages/NewBatchPage.js');
  return { default: module.NewBatchPage };
});
const BatchDetailPage = lazy(async () => {
  const module = await import('../pages/BatchDetailPage.js');
  return { default: module.BatchDetailPage };
});

const deferred = (element: React.JSX.Element): React.JSX.Element => (
  <Suspense fallback={<p>Cargando módulo…</p>}>{element}</Suspense>
);

export const App = (): React.JSX.Element => (
  <Routes>
    <Route path="login" element={deferred(<LoginPage />)} />
    <Route element={<ProtectedRoute />}>
      <Route path="password" element={deferred(<ChangePasswordPage />)} />
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="lotes" element={deferred(<BatchesPage />)} />
        <Route path="lotes/:id" element={deferred(<BatchDetailPage />)} />
        <Route
          element={<PermissionRoute permission={Permission.BATCHES_OPERATE} />}
        >
          <Route path="lotes/nuevo" element={deferred(<NewBatchPage />)} />
        </Route>
        <Route
          element={<PermissionRoute permission={Permission.USERS_MANAGE} />}
        >
          <Route path="usuarios" element={deferred(<UsersPage />)} />
        </Route>
        <Route
          element={<PermissionRoute permission={Permission.MASTERS_MANAGE} />}
        >
          <Route path="configuracion/areas" element={deferred(<AreasPage />)} />
          <Route
            path="configuracion/maestros"
            element={deferred(<CatalogsPage />)}
          />
          <Route
            path="configuracion/estandares"
            element={deferred(<StandardsPage />)}
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>
);
