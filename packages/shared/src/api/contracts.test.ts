import { describe, expect, it } from 'vitest';

import { DataOriginSchema, RoleSchema } from '../domain/enums.js';
import {
  ApiErrorSchema,
  PaginationQuerySchema,
  createApiSuccessSchema,
} from './contracts.js';
import {
  DATABASE_UNAVAILABLE_CODE,
  DatabaseUnavailableErrorResponseSchema,
  HealthResponseSchema,
  SERVICE_UNAVAILABLE_MESSAGE,
} from './health.schemas.js';

describe('respuestas uniformes de la API', () => {
  it('acepta la respuesta pública de salud documentada', () => {
    const result = HealthResponseSchema.safeParse({
      success: true,
      data: {
        status: 'ok',
        database: 'connected',
        timestamp: '2026-09-01T15:00:00.000Z',
      },
    });

    expect(result.success).toBe(true);
  });

  it('valida el error de base de datos sin detalles internos', () => {
    const result = DatabaseUnavailableErrorResponseSchema.safeParse({
      success: false,
      error: {
        code: DATABASE_UNAVAILABLE_CODE,
        message: SERVICE_UNAVAILABLE_MESSAGE,
        details: [],
      },
    });

    expect(result.success).toBe(true);
  });

  it('rechaza respuestas que no respetan el discriminante success', () => {
    const schema = createApiSuccessSchema(RoleSchema);
    const result = schema.safeParse({ success: false, data: 'ADMIN' });

    expect(result.success).toBe(false);
  });
});

describe('validaciones transversales de la API', () => {
  it('rechaza códigos de error que no siguen el formato canónico', () => {
    const result = ApiErrorSchema.safeParse({
      success: false,
      error: { code: 'database-unavailable', message: 'Error.', details: [] },
    });

    expect(result.success).toBe(false);
  });

  it('aplica los valores predeterminados y límites de paginación', () => {
    expect(PaginationQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 20,
    });
    expect(PaginationQuerySchema.safeParse({ pageSize: 101 }).success).toBe(
      false,
    );
  });

  it('distingue explícitamente datos reales y demostrativos', () => {
    expect(DataOriginSchema.options).toEqual(['REAL', 'DEMO']);
  });
});
