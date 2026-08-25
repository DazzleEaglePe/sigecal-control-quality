import type { RequestHandler } from 'express';

import type { Role } from '@sigecal/shared';

import { ForbiddenError, UnauthorizedError } from '../../errors/app-error.js';
import type { AuthUseCases } from './auth.types.js';

const bearerToken = (authorization: string | undefined): string => {
  const match = /^Bearer ([^\s]+)$/.exec(authorization ?? '');
  if (!match?.[1]) throw new UnauthorizedError();
  return match[1];
};

export const authenticate =
  (auth: AuthUseCases): RequestHandler =>
  async (request, _response, next): Promise<void> => {
    try {
      request.auth = await auth.authenticate(
        bearerToken(request.headers.authorization),
      );
      next();
    } catch (error) {
      next(error);
    }
  };

export const authorize =
  (...roles: readonly Role[]): RequestHandler =>
  (request, _response, next): void => {
    if (!request.auth) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(request.auth.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };

export const requirePasswordChanged: RequestHandler = (
  request,
  _response,
  next,
): void => {
  if (request.auth?.mustChangePassword) {
    next(
      new ForbiddenError(
        'Debe cambiar la contraseña provisional antes de continuar.',
      ),
    );
    return;
  }
  next();
};
