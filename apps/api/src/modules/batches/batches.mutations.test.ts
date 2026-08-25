import { describe, expect, it, vi } from 'vitest';
import type { CreateBatchRequest } from '@sigecal/shared';

import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import { BatchMutationRepository } from './batches.mutations.js';

const IDS = {
  batch: '11111111-1111-4111-a111-111111111111',
  pisco: '22222222-2222-4222-a222-222222222222',
  stage: '33333333-3333-4333-a333-333333333333',
  user: '44444444-4444-4444-a444-444444444444',
  variety: '55555555-5555-4555-a555-555555555555',
} as const;
const input: CreateBatchRequest = {
  piscoTypeId: IDS.pisco,
  varieties: [{ varietyId: IDS.variety, percentage: 100 }],
  startDate: '2026-08-24',
  volumeLiters: 500,
};

const createdRecord = {
  id: IDS.batch,
  code: 'LT-2026-0042',
  piscoTypeId: IDS.pisco,
  currentStageId: IDS.stage,
  status: 'EN_PROCESO',
  startDate: new Date('2026-08-24T00:00:00.000Z'),
  volumeLiters: new Prisma.Decimal(500),
  harvestOrigin: null,
  notes: null,
};

describe('BatchMutationRepository', () => {
  it('reintenta una colisión de código antes de confirmar la creación', async () => {
    const create = vi.fn((input: unknown) => {
      void input;
      return Promise.resolve(createdRecord);
    });
    const tx = {
      batch: {
        findFirst: vi.fn().mockResolvedValue({ code: 'LT-2026-0041' }),
        create,
      },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    } as unknown as Prisma.TransactionClient;
    const collision = new Prisma.PrismaClientKnownRequestError('collision', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const transaction = vi
      .fn()
      .mockRejectedValueOnce(collision)
      .mockImplementationOnce(
        (work: (client: Prisma.TransactionClient) => Promise<unknown>) =>
          work(tx),
      );
    const repository = new BatchMutationRepository({
      $transaction: transaction,
    } as unknown as PrismaClient);

    await expect(repository.create(input, IDS.stage, IDS.user)).resolves.toBe(
      IDS.batch,
    );
    expect(transaction).toHaveBeenCalledTimes(2);
    const createCall = create.mock.calls[0]?.[0] as
      { readonly data?: { readonly code?: unknown } } | undefined;
    expect(createCall?.data?.code).toBe('LT-2026-0042');
  });
});
