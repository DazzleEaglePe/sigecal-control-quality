import {
  DATABASE_UNAVAILABLE_CODE,
  SERVICE_UNAVAILABLE_MESSAGE,
  type HealthData,
} from '@sigecal/shared';

import { ServiceUnavailableError } from '../../errors/app-error.js';
import type { HealthCheckUseCase, HealthDatabasePort } from './health.types.js';

export class HealthService implements HealthCheckUseCase {
  public constructor(private readonly database: HealthDatabasePort) {}

  public async execute(): Promise<HealthData> {
    try {
      await this.database.checkConnection();
    } catch (cause) {
      throw new ServiceUnavailableError(
        SERVICE_UNAVAILABLE_MESSAGE,
        DATABASE_UNAVAILABLE_CODE,
        { cause },
      );
    }

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
