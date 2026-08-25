import type { RequestHandler } from 'express';

import { NotFoundError } from '../errors/app-error.js';

export const notFoundHandler: RequestHandler = (
  _request,
  _response,
  next,
): void => {
  next(new NotFoundError('La ruta solicitada no existe.'));
};
