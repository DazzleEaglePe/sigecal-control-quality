import { z } from 'zod';

export const PermissionSchema = z.enum([
  'USERS_MANAGE',
  'AREAS_MANAGE',
  'MASTERS_MANAGE',
  'BATCHES_OPERATE',
  'BATCHES_CLOSE',
  'BATCHES_REJECT',
  'INSPECTIONS_SCHEDULE',
  'RESULTS_RECORD',
  'SENSORY_RECORD',
  'NONCONFORMITIES_RECORD',
  'ACTIONS_OPERATE',
  'NONCONFORMITIES_CLOSE',
  'DASHBOARD_VIEW',
  'REPORTS_EXPORT',
  'AUDIT_VIEW',
]);

export type Permission = z.infer<typeof PermissionSchema>;
export const Permission = PermissionSchema.enum;
