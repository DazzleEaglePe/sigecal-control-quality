import { Router } from 'express';
import {
  CorrectSensorySessionRequestSchema,
  CreateSensorySessionRequestSchema,
  EntityIdParamsSchema,
  Role,
  SensoryCompareQuerySchema,
  SensoryPreparationQuerySchema,
  SensorySessionListQuerySchema,
} from '@sigecal/shared';
import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { SensoryController } from './sensory.controller.js';
import type { SensoryUseCases } from './sensory.types.js';

type RecorderGuard = ReturnType<typeof authorize>;
const registerReadRoutes = (
  router: Router,
  controller: SensoryController,
  recorders: RecorderGuard,
): void => {
  router.get(
    '/sessions',
    validate({ query: SensorySessionListQuerySchema }),
    controller.list,
  );
  router.get('/panelist-options', recorders, controller.panelistOptions);
  router.get(
    '/preparation',
    recorders,
    validate({ query: SensoryPreparationQuerySchema }),
    controller.preparation,
  );
  router.get(
    '/sessions/:id',
    validate({ params: EntityIdParamsSchema }),
    controller.detail,
  );
  router.get(
    '/sessions/:id/profile',
    validate({ params: EntityIdParamsSchema }),
    controller.profile,
  );
  router.get(
    '/compare',
    validate({ query: SensoryCompareQuerySchema }),
    controller.compare,
  );
};

const registerWriteRoutes = (
  router: Router,
  controller: SensoryController,
  recorders: RecorderGuard,
): void => {
  router.post(
    '/sessions',
    recorders,
    validate({ body: CreateSensorySessionRequestSchema }),
    controller.create,
  );
  router.post(
    '/sessions/:id/correct',
    recorders,
    validate({
      params: EntityIdParamsSchema,
      body: CorrectSensorySessionRequestSchema,
    }),
    controller.correct,
  );
};

export const createSensoryRouter = (
  auth: AuthUseCases,
  sensory: SensoryUseCases,
): Router => {
  const router = Router();
  const controller = new SensoryController(sensory);
  const recorders = authorize(Role.ADMIN, Role.JEFE_CALIDAD, Role.ANALISTA);
  router.use(authenticate(auth), requirePasswordChanged);
  registerReadRoutes(router, controller, recorders);
  registerWriteRoutes(router, controller, recorders);
  return router;
};
