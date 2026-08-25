import { Router } from 'express';

import {
  CreateSensoryThresholdRequestSchema,
  CreateStandardRequestSchema,
  EffectiveSensoryThresholdQuerySchema,
  EffectiveStandardQuerySchema,
  EntityIdParamsSchema,
  Role,
  SensoryThresholdHistoryQuerySchema,
  StandardHistoryQuerySchema,
  UpdateStandardRequestSchema,
} from '@sigecal/shared';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { StandardsController } from './standards.controller.js';
import type { StandardsUseCases } from './standards.types.js';

const registerStandardRoutes = (
  router: Router,
  controller: StandardsController,
): void => {
  router.get(
    '/standards',
    validate({ query: StandardHistoryQuerySchema }),
    controller.list,
  );
  router.get(
    '/standards/effective',
    validate({ query: EffectiveStandardQuerySchema }),
    controller.effective,
  );
  router.post(
    '/standards',
    authorize(Role.ADMIN, Role.JEFE_CALIDAD),
    validate({ body: CreateStandardRequestSchema }),
    controller.create,
  );
  router.patch(
    '/standards/:id',
    authorize(Role.ADMIN, Role.JEFE_CALIDAD),
    validate({
      params: EntityIdParamsSchema,
      body: UpdateStandardRequestSchema,
    }),
    controller.update,
  );
};

const registerThresholdRoutes = (
  router: Router,
  controller: StandardsController,
): void => {
  router.get(
    '/sensory-thresholds',
    validate({ query: SensoryThresholdHistoryQuerySchema }),
    controller.listThresholds,
  );
  router.get(
    '/sensory-thresholds/effective',
    validate({ query: EffectiveSensoryThresholdQuerySchema }),
    controller.effectiveThreshold,
  );
  router.post(
    '/sensory-thresholds',
    authorize(Role.ADMIN, Role.JEFE_CALIDAD),
    validate({ body: CreateSensoryThresholdRequestSchema }),
    controller.createThreshold,
  );
};

export const createStandardsRouter = (
  auth: AuthUseCases,
  standards: StandardsUseCases,
): Router => {
  const router = Router();
  const controller = new StandardsController(standards);
  router.use(authenticate(auth), requirePasswordChanged);
  registerStandardRoutes(router, controller);
  registerThresholdRoutes(router, controller);
  return router;
};
