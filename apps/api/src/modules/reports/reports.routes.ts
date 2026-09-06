import { Router } from 'express';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { ReportsController } from './reports.controller.js';
import { ReportsDashboardQuerySchema } from './reports.schema.js';
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
  return router;
};
