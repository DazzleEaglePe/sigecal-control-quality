import request from 'supertest';
import { describe, expect, it } from 'vitest';

import {
  DATABASE_UNAVAILABLE_CODE,
  DatabaseUnavailableErrorResponseSchema,
  HealthResponseSchema,
  SERVICE_UNAVAILABLE_MESSAGE,
  type HealthData,
} from '@sigecal/shared';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { ServiceUnavailableError } from './errors/app-error.js';
import type { HealthCheckUseCase } from './modules/health/health.types.js';

const healthyService: HealthCheckUseCase = {
  execute: (): Promise<HealthData> =>
    Promise.resolve({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    }),
};

const unavailableService: HealthCheckUseCase = {
  execute: (): Promise<HealthData> =>
    Promise.reject(
      new ServiceUnavailableError(
        SERVICE_UNAVAILABLE_MESSAGE,
        DATABASE_UNAVAILABLE_CODE,
      ),
    ),
};

describe('API base', () => {
  it('responde el contrato de salud y las cabeceras de seguridad', async () => {
    const response = await request(createApp({ healthService: healthyService }))
      .get(`${env.API_PREFIX}/health`)
      .expect(200);

    expect(HealthResponseSchema.safeParse(response.body).success).toBe(true);
    expect(response.headers).toHaveProperty(
      'x-content-type-options',
      'nosniff',
    );
    expect(response.headers).not.toHaveProperty('x-powered-by');
  });

  it('habilita credenciales únicamente para el origen configurado', async () => {
    const app = createApp({ healthService: healthyService });
    const allowed = await request(app)
      .get(`${env.API_PREFIX}/health`)
      .set('Origin', env.CORS_ORIGIN)
      .expect(200);
    const denied = await request(app)
      .get(`${env.API_PREFIX}/health`)
      .set('Origin', 'https://origen-no-autorizado.example')
      .expect(200);

    expect(allowed.headers).toMatchObject({
      'access-control-allow-origin': env.CORS_ORIGIN,
      'access-control-allow-credentials': 'true',
    });
    expect(denied.headers).not.toHaveProperty('access-control-allow-origin');
  });
});

describe('respuestas de error de la API', () => {
  it('responde 404 con el formato uniforme', async () => {
    const response = await request(createApp({ healthService: healthyService }))
      .get(`${env.API_PREFIX}/ruta-inexistente`)
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'La ruta solicitada no existe.',
        details: [],
      },
    });
  });

  it('responde 503 sin filtrar el error interno de PostgreSQL', async () => {
    const response = await request(
      createApp({ healthService: unavailableService }),
    )
      .get(`${env.API_PREFIX}/health`)
      .expect(503);

    expect(
      DatabaseUnavailableErrorResponseSchema.safeParse(response.body).success,
    ).toBe(true);
    expect(JSON.stringify(response.body)).not.toContain('connection refused');
  });
});
