import { Router } from 'express';
import { z } from 'zod';
import {
  CloseNonConformityRequestSchema,
  CreateActionRequestSchema,
  CreateNonConformityRequestSchema,
  EntityIdParamsSchema,
  NonConformityListQuerySchema,
  Role,
  UpdateActionRequestSchema,
  UpdateNonConformityRequestSchema,
  VerifyActionRequestSchema,
} from '@sigecal/shared';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { NonConformitiesController } from './nonconformities.controller.js';
import type { NonConformitiesUseCases } from './nonconformities.types.js';

const idValidation = { params: EntityIdParamsSchema };
const actionIdValidation = {
  params: z.object({ actionId: z.uuid() }).strict(),
};
/** A J N del acceso documentado en docs/06-API-CONTRACT.md §10. */
const managers = authorize(Role.ADMIN, Role.JEFE_CALIDAD, Role.ANALISTA);
/** A J: cierre y verificación de eficacia quedan reservados a Jefatura. */
const closers = authorize(Role.ADMIN, Role.JEFE_CALIDAD);

const registerReads = (
  router: Router,
  controller: NonConformitiesController,
): void => {
  router.get(
    '/',
    validate({ query: NonConformityListQuerySchema }),
    controller.list,
  );
  router.get('/:id', validate(idValidation), controller.detail);
  router.get('/:id/actions', validate(idValidation), controller.listActions);
};

const registerWrites = (
  router: Router,
  controller: NonConformitiesController,
): void => {
  router.post(
    '/',
    validate({ body: CreateNonConformityRequestSchema }),
    controller.create,
  );
  router.patch(
    '/:id',
    managers,
    validate({ ...idValidation, body: UpdateNonConformityRequestSchema }),
    controller.update,
  );
  router.post(
    '/:id/start-attention',
    managers,
    validate(idValidation),
    controller.startAttention,
  );
  router.post(
    '/:id/close',
    closers,
    validate({ ...idValidation, body: CloseNonConformityRequestSchema }),
    controller.close,
  );
};

const registerActions = (
  router: Router,
  controller: NonConformitiesController,
): void => {
  router.post(
    '/:id/actions',
    managers,
    validate({ ...idValidation, body: CreateActionRequestSchema }),
    controller.createAction,
  );
  router.patch(
    '/actions/:actionId',
    managers,
    validate({ ...actionIdValidation, body: UpdateActionRequestSchema }),
    controller.updateAction,
  );
  router.post(
    '/actions/:actionId/execute',
    managers,
    validate(actionIdValidation),
    controller.executeAction,
  );
  router.post(
    '/actions/:actionId/verify',
    closers,
    validate({ ...actionIdValidation, body: VerifyActionRequestSchema }),
    controller.verifyAction,
  );
};

export const createNonConformitiesRouter = (
  auth: AuthUseCases,
  nonConformities: NonConformitiesUseCases,
): Router => {
  const router = Router();
  const controller = new NonConformitiesController(nonConformities);
  router.use(authenticate(auth), requirePasswordChanged);
  registerReads(router, controller);
  registerWrites(router, controller);
  registerActions(router, controller);
  return router;
};
