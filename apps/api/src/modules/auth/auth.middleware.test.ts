import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { ApiErrorSchema } from '@sigecal/shared';

import { errorHandler } from '../../middleware/error-handler.js';
import { authorize, requirePasswordChanged } from './auth.middleware.js';

const appFor = (role: 'ADMIN' | 'OPERARIO', mustChangePassword: boolean) => {
  const app = express();
  app.use((request_, _response, next) => {
    request_.auth = {
      userId: '11111111-1111-4111-a111-111111111111',
      role,
      mustChangePassword,
    };
    next();
  });
  app.get('/admin', authorize('ADMIN'), (_request, response) => {
    response.status(204).send();
  });
  app.get('/ready', requirePasswordChanged, (_request, response) => {
    response.status(204).send();
  });
  app.use(errorHandler);
  return app;
};

describe('autorización transversal', () => {
  it('permite únicamente los roles declarados por la ruta', async () => {
    await request(appFor('ADMIN', false)).get('/admin').expect(204);
    const denied = await request(appFor('OPERARIO', false))
      .get('/admin')
      .expect(403);
    expect(ApiErrorSchema.parse(denied.body).error.code).toBe(
      'INSUFFICIENT_PERMISSIONS',
    );
  });

  it('restringe módulos mientras la contraseña sea provisional', async () => {
    const denied = await request(appFor('ADMIN', true))
      .get('/ready')
      .expect(403);
    expect(ApiErrorSchema.parse(denied.body).error.message).toContain(
      'contraseña provisional',
    );
    await request(appFor('ADMIN', false)).get('/ready').expect(204);
  });
});
