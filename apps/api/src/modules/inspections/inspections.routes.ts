import { Router } from 'express';
import {
  CancelInspectionRequestSchema,
  CreateInspectionPlanRequestSchema,
  CreateInspectionRequestSchema,
  EntityIdParamsSchema,
  InspectionCalendarQuerySchema,
  InspectionCoverageQuerySchema,
  InspectionListQuerySchema,
  MyPendingInspectionQuerySchema,
  RescheduleInspectionRequestSchema,
  Role,
  UpdateInspectionRequestSchema,
} from '@sigecal/shared';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { InspectionsController } from './inspections.controller.js';
import type { InspectionsUseCases } from './inspections.types.js';

const idValidation = { params: EntityIdParamsSchema };
const managers = authorize(Role.ADMIN, Role.JEFE_CALIDAD);
const starters = authorize(Role.ADMIN, Role.JEFE_CALIDAD, Role.ANALISTA);

const registerReads = (router: Router, controller: InspectionsController) => {
  router.get(
    '/',
    validate({ query: InspectionListQuerySchema }),
    controller.list,
  );
  router.get(
    '/calendar',
    validate({ query: InspectionCalendarQuerySchema }),
    controller.calendar,
  );
  router.get(
    '/my-pending',
    validate({ query: MyPendingInspectionQuerySchema }),
    controller.myPending,
  );
  router.get(
    '/coverage',
    managers,
    validate({ query: InspectionCoverageQuerySchema }),
    controller.coverage,
  );
  router.get('/:id', validate(idValidation), controller.get);
};

const registerScheduling = (
  router: Router,
  controller: InspectionsController,
) => {
  router.post(
    '/',
    managers,
    validate({ body: CreateInspectionRequestSchema }),
    controller.create,
  );
  router.patch(
    '/:id',
    managers,
    validate({ ...idValidation, body: UpdateInspectionRequestSchema }),
    controller.update,
  );
  router.post(
    '/:id/reschedule',
    managers,
    validate({ ...idValidation, body: RescheduleInspectionRequestSchema }),
    controller.reschedule,
  );
  router.post(
    '/:id/cancel',
    managers,
    validate({ ...idValidation, body: CancelInspectionRequestSchema }),
    controller.cancel,
  );
};

export const createInspectionsRouter = (
  auth: AuthUseCases,
  inspections: InspectionsUseCases,
): Router => {
  const router = Router();
  const controller = new InspectionsController(inspections);
  router.use(authenticate(auth), requirePasswordChanged);
  registerReads(router, controller);
  registerScheduling(router, controller);
  router.post(
    '/plans/from-template',
    managers,
    validate({ body: CreateInspectionPlanRequestSchema }),
    controller.createPlan,
  );
  router.post('/:id/start', starters, validate(idValidation), controller.start);
  return router;
};
