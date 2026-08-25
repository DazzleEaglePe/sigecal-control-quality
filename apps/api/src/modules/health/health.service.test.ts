import { describe, expect, it, vi } from 'vitest';

import {
  DATABASE_UNAVAILABLE_CODE,
  HealthDataSchema,
  SERVICE_UNAVAILABLE_MESSAGE,
} from '@sigecal/shared';

import type { ServiceUnavailableError } from '../../errors/app-error.js';
import { HealthService } from './health.service.js';
import type { HealthDatabasePort } from './health.types.js';

const databasePort = (reject = false): HealthDatabasePort => ({
  checkConnection: reject
    ? vi.fn().mockRejectedValue(new Error('connection refused'))
    : vi.fn().mockResolvedValue(undefined),
});

describe('HealthService', () => {
  it('informa que la aplicación y PostgreSQL están disponibles', async () => {
    const result = await new HealthService(databasePort()).execute();

    expect(HealthDataSchema.safeParse(result).success).toBe(true);
    expect(result).toMatchObject({ status: 'ok', database: 'connected' });
  });

  it('convierte el fallo de PostgreSQL en un error 503 controlado', async () => {
    const result = new HealthService(databasePort(true)).execute();

    await expect(result).rejects.toMatchObject({
      statusCode: 503,
      code: DATABASE_UNAVAILABLE_CODE,
      message: SERVICE_UNAVAILABLE_MESSAGE,
    } satisfies Partial<ServiceUnavailableError>);
  });
});
