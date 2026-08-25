import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ApiErrorSchema } from '@sigecal/shared';

import { errorHandler } from './error-handler.js';
import { validate } from './validate.js';

const QuerySchema = z
  .object({ limit: z.coerce.number().int().min(1).max(10) })
  .strict();

const createValidationApp = (): express.Express => {
  const app = express();
  app.get(
    '/validated',
    validate({ query: QuerySchema }),
    (request_, response) => {
      response.json(request_.query);
    },
  );
  app.use(errorHandler);
  return app;
};

describe('validate', () => {
  it('reemplaza la query por el objeto validado y convertido', async () => {
    const response = await request(createValidationApp())
      .get('/validated?limit=3')
      .expect(200);

    expect(response.body).toEqual({ limit: 3 });
  });

  it('devuelve el detalle por campo sin ejecutar el controlador', async () => {
    const response = await request(createValidationApp())
      .get('/validated?limit=99')
      .expect(400);

    const body = ApiErrorSchema.parse(response.body);
    expect(body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(body.error.details[0]).toMatchObject({ field: 'limit' });
  });
});
