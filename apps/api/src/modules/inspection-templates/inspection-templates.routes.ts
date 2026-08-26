import { Router } from 'express';
import {
  CreateInspectionTemplateRequestSchema,
  EntityIdParamsSchema,
  InspectionTemplateListQuerySchema,
  Role,
} from '@sigecal/shared';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { InspectionTemplatesController } from './inspection-templates.controller.js';
import type { InspectionTemplatesUseCases } from './inspection-templates.types.js';

export const createInspectionTemplatesRouter = (
  auth: AuthUseCases,
  templates: InspectionTemplatesUseCases,
): Router => {
  const router = Router();
  const controller = new InspectionTemplatesController(templates);
  const managers = authorize(Role.ADMIN, Role.JEFE_CALIDAD);
  router.use(authenticate(auth), requirePasswordChanged, managers);
  router.get(
    '/inspection-templates',
    validate({ query: InspectionTemplateListQuerySchema }),
    controller.list,
  );
  router.post(
    '/inspection-templates',
    validate({ body: CreateInspectionTemplateRequestSchema }),
    controller.create,
  );
  router.post(
    '/inspection-templates/:id/deactivate',
    validate({ params: EntityIdParamsSchema }),
    controller.deactivate,
  );
  return router;
};
