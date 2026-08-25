import { Router } from 'express';

import {
  CreateUserRequestSchema,
  EntityIdParamsSchema,
  ResetUserPasswordRequestSchema,
  Role,
  UpdateUserRequestSchema,
  UpdateUserStatusRequestSchema,
  UserListQuerySchema,
} from '@sigecal/shared';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { UsersController } from './users.controller.js';
import type { UsersUseCases } from './users.types.js';

const registerMutations = (
  router: Router,
  controller: UsersController,
): void => {
  router.patch(
    '/:id',
    validate({ params: EntityIdParamsSchema, body: UpdateUserRequestSchema }),
    controller.update,
  );
  router.patch(
    '/:id/status',
    validate({
      params: EntityIdParamsSchema,
      body: UpdateUserStatusRequestSchema,
    }),
    controller.setStatus,
  );
  router.post(
    '/:id/reset-password',
    validate({
      params: EntityIdParamsSchema,
      body: ResetUserPasswordRequestSchema,
    }),
    controller.resetPassword,
  );
};

export const createUsersRouter = (
  auth: AuthUseCases,
  users: UsersUseCases,
): Router => {
  const router = Router();
  const controller = new UsersController(users);
  router.use(authenticate(auth), requirePasswordChanged, authorize(Role.ADMIN));
  router.get('/', validate({ query: UserListQuerySchema }), controller.list);
  router.get(
    '/:id',
    validate({ params: EntityIdParamsSchema }),
    controller.get,
  );
  router.post(
    '/',
    validate({ body: CreateUserRequestSchema }),
    controller.create,
  );
  registerMutations(router, controller);
  return router;
};
