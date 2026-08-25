import {
  Permission,
  Role,
  type Permission as PermissionName,
} from '@sigecal/shared';

const adminPermissions = Object.values(Permission);

export const PERMISSIONS_BY_ROLE: Readonly<
  Record<Role, readonly PermissionName[]>
> = {
  [Role.ADMIN]: adminPermissions,
  [Role.JEFE_CALIDAD]: adminPermissions.filter(
    (permission) => permission !== Permission.USERS_MANAGE,
  ),
  [Role.ANALISTA]: [
    Permission.RESULTS_RECORD,
    Permission.SENSORY_RECORD,
    Permission.NONCONFORMITIES_RECORD,
    Permission.ACTIONS_OPERATE,
    Permission.DASHBOARD_VIEW,
    Permission.REPORTS_EXPORT,
  ],
  [Role.OPERARIO]: [
    Permission.BATCHES_OPERATE,
    Permission.NONCONFORMITIES_RECORD,
    Permission.DASHBOARD_VIEW,
  ],
};

export const permissionsFor = (role: Role): readonly PermissionName[] =>
  PERMISSIONS_BY_ROLE[role];
