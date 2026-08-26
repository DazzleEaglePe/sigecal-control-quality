import { Router } from 'express';
import {
  CorrectPhysChemResultRequestSchema,
  CreatePhysChemResultsRequestSchema,
  EntityIdParamsSchema,
  PhysChemControlChartQuerySchema,
  PhysChemHistoryQuerySchema,
  PhysChemResultListQuerySchema,
  Role,
  ValidatePhysChemResultsRequestSchema,
} from '@sigecal/shared';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { PhysChemController } from './physchem.controller.js';
import type { PhysChemUseCases } from './physchem.types.js';

const registerWriteRoutes = (
  router: Router,
  controller: PhysChemController,
): void => {
  const recorders = authorize(Role.ADMIN, Role.JEFE_CALIDAD, Role.ANALISTA);
  router.post(
    '/results/validate',
    recorders,
    validate({ body: ValidatePhysChemResultsRequestSchema }),
    controller.validate,
  );
  router.post(
    '/results',
    recorders,
    validate({ body: CreatePhysChemResultsRequestSchema }),
    controller.create,
  );
  router.post(
    '/results/:id/correct',
    recorders,
    validate({
      params: EntityIdParamsSchema,
      body: CorrectPhysChemResultRequestSchema,
    }),
    controller.correct,
  );
};

export const createPhysChemRouter = (
  auth: AuthUseCases,
  physChem: PhysChemUseCases,
): Router => {
  const router = Router();
  const controller = new PhysChemController(physChem);
  router.use(authenticate(auth), requirePasswordChanged);
  router.get(
    '/results',
    validate({ query: PhysChemResultListQuerySchema }),
    controller.list,
  );
  registerWriteRoutes(router, controller);
  router.get(
    '/history',
    validate({ query: PhysChemHistoryQuerySchema }),
    controller.history,
  );
  router.get(
    '/control-chart',
    validate({ query: PhysChemControlChartQuerySchema }),
    controller.controlChart,
  );
  return router;
};
