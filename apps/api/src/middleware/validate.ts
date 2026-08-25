import type { Request, RequestHandler } from 'express';
import type { z } from 'zod';

import { BadRequestError } from '../errors/app-error.js';

interface ValidationSchemas {
  readonly body?: z.ZodType;
  readonly params?: z.ZodType;
  readonly query?: z.ZodType;
}

const validationDetails = (error: z.ZodError): readonly unknown[] =>
  error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

const replaceInput = (
  request: Request,
  target: 'body' | 'params' | 'query',
  schema: z.ZodType,
): void => {
  const value = schema.parse(request[target]);
  Object.defineProperty(request, target, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

const parseInputs = (request: Request, schemas: ValidationSchemas): void => {
  if (schemas.body) replaceInput(request, 'body', schemas.body);
  if (schemas.params) replaceInput(request, 'params', schemas.params);
  if (schemas.query) replaceInput(request, 'query', schemas.query);
};

export const validate =
  (schemas: ValidationSchemas): RequestHandler =>
  (request, _response, next): void => {
    try {
      parseInputs(request, schemas);
      next();
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(
          new BadRequestError(
            'La solicitud contiene datos inválidos.',
            'VALIDATION_ERROR',
            validationDetails(error as z.ZodError),
          ),
        );
        return;
      }
      next(error);
    }
  };
