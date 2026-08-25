import type { HealthData } from '@sigecal/shared';

export interface HealthDatabasePort {
  checkConnection(): Promise<void>;
}

export interface HealthCheckUseCase {
  execute(): Promise<HealthData>;
}
