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

const ForgotPasswordPage = lazy(async () => ({
  default: (await import('../pages/ForgotPasswordPage.js')).ForgotPasswordPage,
}));
const ActivateAccountPage = lazy(async () => ({
  default: (await import('../pages/ActivateAccountPage.js'))
    .ActivateAccountPage,
}));
const ResetPasswordPage = lazy(async () => ({
  default: (await import('../pages/ResetPasswordPage.js')).ResetPasswordPage,
}));

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
const InspectionsPage = lazy(async () => {
  const module = await import('../pages/InspectionsPage.js');
  return { default: module.InspectionsPage };
});
const NewInspectionPage = lazy(async () => {
  const module = await import('../pages/NewInspectionPage.js');
  return { default: module.NewInspectionPage };
});
const InspectionDetailPage = lazy(async () => {
  const module = await import('../pages/InspectionDetailPage.js');
  return { default: module.InspectionDetailPage };
});
const PhysChemAnalysisPage = lazy(async () => {
  const module = await import('../pages/PhysChemAnalysisPage.js');
  return { default: module.PhysChemAnalysisPage };
});
const SettingsPage = lazy(async () => {
  const module = await import('../pages/SettingsPage.js');
  return { default: module.SettingsPage };
});
const SensorySessionsPage = lazy(async () => ({
  default: (await import('../pages/SensorySessionsPage.js'))
    .SensorySessionsPage,
}));
const NewSensorySessionPage = lazy(async () => ({
  default: (await import('../pages/NewSensorySessionPage.js'))
    .NewSensorySessionPage,
}));
const SensorySessionDetailPage = lazy(async () => ({
  default: (await import('../pages/SensorySessionDetailPage.js'))
    .SensorySessionDetailPage,
}));
const NonConformitiesPage = lazy(async () => ({
  default: (await import('../pages/NonConformitiesPage.js'))
    .NonConformitiesPage,
}));
const NewNonConformityPage = lazy(async () => ({
  default: (await import('../pages/NewNonConformityPage.js'))
    .NewNonConformityPage,
}));
const NonConformityDetailPage = lazy(async () => ({
  default: (await import('../pages/NonConformityDetailPage.js'))
    .NonConformityDetailPage,
}));
const deferred = (element: React.JSX.Element): React.JSX.Element => (
  <Suspense fallback={<p>Cargando módulo…</p>}>{element}</Suspense>
);

const qualityRoutes = (
  <>
    <Route path="inspecciones" element={deferred(<InspectionsPage />)} />
    <Route
      path="inspecciones/:id"
      element={deferred(<InspectionDetailPage />)}
    />
    <Route path="analisis" element={deferred(<PhysChemAnalysisPage />)} />
    <Route path="organoleptico" element={deferred(<SensorySessionsPage />)} />
    <Route
      path="organoleptico/:id"
      element={deferred(<SensorySessionDetailPage />)}
    />
    <Route element={<PermissionRoute permission={Permission.SENSORY_RECORD} />}>
      <Route
        path="organoleptico/nueva"
        element={deferred(<NewSensorySessionPage />)}
      />
    </Route>
    <Route
      element={<PermissionRoute permission={Permission.INSPECTIONS_SCHEDULE} />}
    >
      <Route
        path="inspecciones/nueva"
        element={deferred(<NewInspectionPage />)}
      />
    </Route>
    <Route
      path="no-conformidades"
      element={deferred(<NonConformitiesPage />)}
    />
    <Route
      path="no-conformidades/:id"
      element={deferred(<NonConformityDetailPage />)}
    />
    <Route
      element={
        <PermissionRoute permission={Permission.NONCONFORMITIES_RECORD} />
      }
    >
      <Route
        path="no-conformidades/nueva"
        element={deferred(<NewNonConformityPage />)}
      />
    </Route>
  </>
);

const publicRoutes = (
  <>
    <Route path="login" element={deferred(<LoginPage />)} />
    <Route
      path="recuperar-contrasena"
      element={deferred(<ForgotPasswordPage />)}
    />
    <Route path="activar-cuenta" element={deferred(<ActivateAccountPage />)} />
    <Route
      path="restablecer-contrasena"
      element={deferred(<ResetPasswordPage />)}
    />
  </>
);

const protectedRoutes = (
  <>
    <Route element={<ProtectedRoute />}>
      <Route path="password" element={deferred(<ChangePasswordPage />)} />
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="ajustes" element={deferred(<SettingsPage />)} />
        <Route path="lotes" element={deferred(<BatchesPage />)} />
        <Route path="lotes/:id" element={deferred(<BatchDetailPage />)} />
        {qualityRoutes}
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
  </>
);

export const App = (): React.JSX.Element => (
  <Routes>
    {publicRoutes}
    {protectedRoutes}
  </Routes>
);
