import { Router } from 'express';

import {
  AreaListQuerySchema,
  CreateAreaRequestSchema,
  EntityIdParamsSchema,
  Role,
  UpdateAreaRequestSchema,
} from '@sigecal/shared';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { AreasController } from './areas.controller.js';
import type { AreasUseCases } from './areas.types.js';

export const createAreasRouter = (
  auth: AuthUseCases,
  areas: AreasUseCases,
): Router => {
  const router = Router();
  const controller = new AreasController(areas);
  router.use(authenticate(auth), requirePasswordChanged);
  router.get('/', validate({ query: AreaListQuerySchema }), controller.list);
  router.post(
    '/',
    authorize(Role.ADMIN, Role.JEFE_CALIDAD),
    validate({ body: CreateAreaRequestSchema }),
    controller.create,
  );
  router.patch(
    '/:id',
    authorize(Role.ADMIN, Role.JEFE_CALIDAD),
    validate({ params: EntityIdParamsSchema, body: UpdateAreaRequestSchema }),
    controller.update,
  );
  return router;
};
