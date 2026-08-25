import type { PrismaClient } from '../../generated/prisma/client.js';
import type { HealthDatabasePort } from './health.types.js';

export class HealthRepository implements HealthDatabasePort {
  public constructor(private readonly client: PrismaClient) {}

  public async checkConnection(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }
}
