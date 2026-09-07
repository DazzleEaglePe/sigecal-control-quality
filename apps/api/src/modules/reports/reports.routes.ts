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
  InspectionExportQuerySchema,
  NonConformityExportQuerySchema,
  ReportsDashboardQuerySchema,
  ResultExportQuerySchema,
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
  router.get(
    '/inspections/excel',
    authorize(Role.ADMIN, Role.JEFE_CALIDAD, Role.ANALISTA),
    validate({ query: InspectionExportQuerySchema }),
    controller.inspectionsExcel,
  );
  router.get(
    '/nonconformities/excel',
    authorize(Role.ADMIN, Role.JEFE_CALIDAD, Role.ANALISTA),
    validate({ query: NonConformityExportQuerySchema }),
    controller.nonConformitiesExcel,
  );
  router.get(
    '/results/excel',
    authorize(Role.ADMIN, Role.JEFE_CALIDAD, Role.ANALISTA),
    validate({ query: ResultExportQuerySchema }),
    controller.resultsExcel,
  );
  return router;
};
