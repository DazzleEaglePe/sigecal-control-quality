import { Router } from 'express';
import { Role } from '@sigecal/shared';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { ReportsController } from './reports.controller.js';
import {
  ReportBatchParamsSchema,
  ReportsDashboardQuerySchema,
} from './reports.schema.js';
import type { ReportsUseCases } from './reports.types.js';

export const createReportsRouter = (
  auth: AuthUseCases,
  reports: ReportsUseCases,
): Router => {
  const router = Router();
  const controller = new ReportsController(reports);
  router.use(authenticate(auth), requirePasswordChanged);
  router.get(
    '/dashboard',
    validate({ query: ReportsDashboardQuerySchema }),
    controller.dashboard,
  );
  router.get(
    '/traceability/:batchId/pdf',
    authorize(Role.ADMIN, Role.JEFE_CALIDAD, Role.ANALISTA),
    validate({ params: ReportBatchParamsSchema }),
    controller.traceabilityPdf,
  );
  return router;
};
