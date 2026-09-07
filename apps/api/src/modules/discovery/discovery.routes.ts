import { Router } from 'express';
import { Role } from '@sigecal/shared';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { DiscoveryController } from './discovery.controller.js';
import { AuditQuerySchema, SearchQuerySchema } from './discovery.schema.js';
import type { DiscoveryUseCases } from './discovery.types.js';

export const createDiscoveryRouter = (
  auth: AuthUseCases,
  discovery: DiscoveryUseCases,
): Router => {
  const router = Router();
  const controller = new DiscoveryController(discovery);
  router.get(
    '/search',
    authenticate(auth),
    requirePasswordChanged,
    validate({ query: SearchQuerySchema }),
    controller.search,
  );
  router.get(
    '/audit',
    authenticate(auth),
    requirePasswordChanged,
    authorize(Role.ADMIN, Role.JEFE_CALIDAD),
    validate({ query: AuditQuerySchema }),
    controller.audit,
  );
  return router;
};
