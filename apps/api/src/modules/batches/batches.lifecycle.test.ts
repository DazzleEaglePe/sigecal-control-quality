import { describe, expect, it, vi } from 'vitest';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { BatchMutationRepository } from './batches.mutations.js';

const BATCH_ID = '11111111-1111-4111-a111-111111111111';
const USER_ID = '22222222-2222-4222-a222-222222222222';

describe('BatchLifecycleRepository', () => {
  it('impide cerrar un lote con no conformidades abiertas', async () => {
    const updateMany = vi.fn();
    const tx = {
      nonConformity: { count: vi.fn().mockResolvedValue(1) },
      batch: { updateMany },
      auditLog: { create: vi.fn() },
    } as unknown as Prisma.TransactionClient;
    const transaction = vi.fn(
      (work: (client: Prisma.TransactionClient) => Promise<unknown>) =>
        work(tx),
    );
    const repository = new BatchMutationRepository({
      $transaction: transaction,
    } as unknown as PrismaClient);

    await expect(repository.close(BATCH_ID, USER_ID)).rejects.toMatchObject({
      code: 'OPEN_NONCONFORMITIES',
    });
    expect(updateMany).not.toHaveBeenCalled();
  });
});
