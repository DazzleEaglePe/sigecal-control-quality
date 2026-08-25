import type { ErrorRequestHandler } from 'express';

import type { ApiError } from '@sigecal/shared';

import { AppError } from '../errors/app-error.js';
import { logger } from '../config/logger.js';

const INTERNAL_ERROR: ApiError = {
  success: false,
  error: {
    code: 'INTERNAL_ERROR',
    message: 'Ocurrió un error inesperado. Intente nuevamente.',
    details: [],
  },
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
): void => {
  void _next;
  if (error instanceof AppError) {
    const body: ApiError = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
    response.status(error.statusCode).json(body);
    return;
  }

  logger.error({ err: error }, 'Error no controlado en la API');
  response.status(500).json(INTERNAL_ERROR);
};
