import { Router, type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

import {
  AccountEmailRequestSchema,
  AccountTokenPasswordRequestSchema,
} from '@sigecal/shared';

import { env } from '../../config/env.js';
import { TooManyRequestsError } from '../../errors/app-error.js';
import { validate } from '../../middleware/validate.js';
import { AccountAccessController } from './account-access.controller.js';
import type { AccountAccessUseCases } from './account-access.types.js';

const accountRateLimit = (): RequestHandler =>
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, _response, next) => {
      next(new TooManyRequestsError());
    },
  });

export const createAccountAccessRouter = (
  access: AccountAccessUseCases,
): Router => {
  const router = Router();
  const controller = new AccountAccessController(access);
  router.use(accountRateLimit());
  router.post(
    '/forgot-password',
    validate({ body: AccountEmailRequestSchema }),
    controller.forgotPassword,
  );
  router.post(
    '/activate',
    validate({ body: AccountTokenPasswordRequestSchema }),
    controller.activate,
  );
  router.post(
    '/reset-password',
    validate({ body: AccountTokenPasswordRequestSchema }),
    controller.resetPassword,
  );
  return router;
};
