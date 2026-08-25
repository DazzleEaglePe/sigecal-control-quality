import type { Prisma } from '../../src/generated/prisma/client.js';

export type SeedTransaction = Prisma.TransactionClient;

export interface SeedEnvironment {
  readonly adminEmail: string;
  readonly passwordHash: string;
}
