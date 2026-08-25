import { Navigate, Outlet } from 'react-router-dom';

import type { Permission } from '@sigecal/shared';

import { useAuth } from './useAuth.js';

export const PermissionRoute = ({
  permission,
}: {
  readonly permission: Permission;
}): React.JSX.Element => {
  const { user } = useAuth();
  return user?.permissions.includes(permission) ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
};
