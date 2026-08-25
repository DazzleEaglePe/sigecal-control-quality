import { Router } from 'express';
import type { z } from 'zod';

import {
  CatalogListQuerySchema,
  CreateEquipmentRequestSchema,
  CreateGrapeVarietyRequestSchema,
  CreateParameterRequestSchema,
  CreatePiscoTypeRequestSchema,
  CreateProcessStageRequestSchema,
  CreateSensoryAttributeRequestSchema,
  EntityIdParamsSchema,
  Role,
  UpdateEquipmentRequestSchema,
  UpdateGrapeVarietyRequestSchema,
  UpdateParameterRequestSchema,
  UpdatePiscoTypeRequestSchema,
  UpdateProcessStageRequestSchema,
  UpdateSensoryAttributeRequestSchema,
} from '@sigecal/shared';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { CatalogsController } from './catalogs.controller.js';
import type { CatalogKind, CatalogsUseCases } from './catalogs.types.js';

interface RouteConfig {
  readonly path: string;
  readonly kind: CatalogKind;
  readonly createSchema: z.ZodType;
  readonly updateSchema: z.ZodType;
}
const configurations: readonly RouteConfig[] = [
  {
    path: 'varieties',
    kind: 'varieties',
    createSchema: CreateGrapeVarietyRequestSchema,
    updateSchema: UpdateGrapeVarietyRequestSchema,
  },
  {
    path: 'pisco-types',
    kind: 'pisco-types',
    createSchema: CreatePiscoTypeRequestSchema,
    updateSchema: UpdatePiscoTypeRequestSchema,
  },
  {
    path: 'stages',
    kind: 'stages',
    createSchema: CreateProcessStageRequestSchema,
    updateSchema: UpdateProcessStageRequestSchema,
  },
  {
    path: 'equipment',
    kind: 'equipment',
    createSchema: CreateEquipmentRequestSchema,
    updateSchema: UpdateEquipmentRequestSchema,
  },
  {
    path: 'sensory-attributes',
    kind: 'sensory-attributes',
    createSchema: CreateSensoryAttributeRequestSchema,
    updateSchema: UpdateSensoryAttributeRequestSchema,
  },
  {
    path: 'parameters',
    kind: 'parameters',
    createSchema: CreateParameterRequestSchema,
    updateSchema: UpdateParameterRequestSchema,
  },
];

const register = (
  router: Router,
  controller: CatalogsController,
  config: RouteConfig,
): void => {
  const writers = authorize(Role.ADMIN, Role.JEFE_CALIDAD);
  router.get(
    `/${config.path}`,
    validate({ query: CatalogListQuerySchema }),
    controller.list(config.kind),
  );
  router.post(
    `/${config.path}`,
    writers,
    validate({ body: config.createSchema }),
    controller.create(config.kind),
  );
  router.patch(
    `/${config.path}/:id`,
    writers,
    validate({ params: EntityIdParamsSchema, body: config.updateSchema }),
    controller.update(config.kind),
  );
};

export const createCatalogsRouter = (
  auth: AuthUseCases,
  catalogs: CatalogsUseCases,
): Router => {
  const router = Router();
  const controller = new CatalogsController(catalogs);
  router.use(authenticate(auth), requirePasswordChanged);
  configurations.forEach((config) => {
    register(router, controller, config);
  });
  return router;
};
