import { Router } from 'express';
import {
  AdvanceBatchStageRequestSchema,
  BatchListQuerySchema,
  CreateBatchRequestSchema,
  EntityIdParamsSchema,
  RejectBatchRequestSchema,
  Role,
  UpdateBatchRequestSchema,
} from '@sigecal/shared';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { BatchesController } from './batches.controller.js';
import type { BatchesUseCases } from './batches.types.js';

const idValidation = { params: EntityIdParamsSchema };
const operators = authorize(Role.ADMIN, Role.JEFE_CALIDAD, Role.OPERARIO);
const decisionMakers = authorize(Role.ADMIN, Role.JEFE_CALIDAD);

const registerReads = (router: Router, controller: BatchesController): void => {
  router.get('/', validate({ query: BatchListQuerySchema }), controller.list);
  router.get('/:id', validate(idValidation), controller.get);
  router.get('/:id/timeline', validate(idValidation), controller.timeline);
  router.get(
    '/:id/traceability',
    validate(idValidation),
    controller.traceability,
  );
  router.get('/:id/qr', validate(idValidation), controller.qr);
};

const registerOperations = (
  router: Router,
  controller: BatchesController,
): void => {
  router.post(
    '/',
    operators,
    validate({ body: CreateBatchRequestSchema }),
    controller.create,
  );
  router.patch(
    '/:id',
    operators,
    validate({ ...idValidation, body: UpdateBatchRequestSchema }),
    controller.update,
  );
  router.post(
    '/:id/advance-stage',
    operators,
    validate({ ...idValidation, body: AdvanceBatchStageRequestSchema }),
    controller.advance,
  );
};

export const createBatchesRouter = (
  auth: AuthUseCases,
  batches: BatchesUseCases,
): Router => {
  const router = Router();
  const controller = new BatchesController(batches);
  router.use(authenticate(auth), requirePasswordChanged);
  registerReads(router, controller);
  registerOperations(router, controller);
  router.post(
    '/:id/close',
    decisionMakers,
    validate(idValidation),
    controller.close,
  );
  router.post(
    '/:id/reject',
    decisionMakers,
    validate({ ...idValidation, body: RejectBatchRequestSchema }),
    controller.reject,
  );
  return router;
};
