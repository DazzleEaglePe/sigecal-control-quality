import { Router, type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

import {
  ChangePasswordRequestSchema,
  LoginRequestSchema,
} from '@sigecal/shared';

import { env } from '../../config/env.js';
import { TooManyRequestsError } from '../../errors/app-error.js';
import { validate } from '../../middleware/validate.js';
import { AuthController } from './auth.controller.js';
import { authenticate } from './auth.middleware.js';
import type { AuthUseCases } from './auth.types.js';

const loginRateLimit = (): RequestHandler =>
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, _response, next) => {
      next(new TooManyRequestsError());
    },
  });

export const createAuthRouter = (auth: AuthUseCases): Router => {
  const router = Router();
  const controller = new AuthController(auth);
  const authenticated = authenticate(auth);

  router.post(
    '/login',
    loginRateLimit(),
    validate({ body: LoginRequestSchema }),
    controller.login,
  );
  router.post('/refresh', controller.refresh);
  router.post('/logout', authenticated, controller.logout);
  router.get('/me', authenticated, controller.me);
  router.patch(
    '/password',
    authenticated,
    validate({ body: ChangePasswordRequestSchema }),
    controller.changePassword,
  );
  return router;
};
