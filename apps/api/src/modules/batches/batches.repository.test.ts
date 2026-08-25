import { describe, expect, it, vi } from 'vitest';
import { Role, type BatchListQuery } from '@sigecal/shared';

import type { PrismaClient } from '../../generated/prisma/client.js';
import { BatchRepository } from './batches.repository.js';

const USER_ID = '11111111-1111-4111-a111-111111111111';
const query: BatchListQuery = { page: 1, pageSize: 20 };

describe('BatchRepository', () => {
  it('aplica el alcance del OPERARIO antes de listar y contar', async () => {
    const findMany = vi.fn((input: unknown) => {
      void input;
      return Promise.resolve([]);
    });
    const count = vi.fn((input: unknown) => {
      void input;
      return Promise.resolve(0);
    });
    const transaction = vi.fn((operations: readonly Promise<unknown>[]) =>
      Promise.all(operations),
    );
    const repository = new BatchRepository({
      batch: { findMany, count },
      $transaction: transaction,
    } as unknown as PrismaClient);

    await repository.list(
      query,
      { userId: USER_ID, role: Role.OPERARIO },
      'createdAt',
    );

    const listWhere = inputWhere(findMany.mock.calls[0]?.[0]);
    const countWhere = inputWhere(count.mock.calls[0]?.[0]);
    expect(listWhere).toEqual(countWhere);
    expect(listWhere).toMatchObject({
      AND: [
        {
          OR: [
            { createdById: USER_ID },
            { stages: { some: { responsibleId: USER_ID } } },
            { inspections: { some: { responsibleId: USER_ID } } },
          ],
        },
        {},
      ],
    });
  });
});

const inputWhere = (input: unknown): unknown => {
  if (!input || typeof input !== 'object' || !('where' in input)) return null;
  return input.where;
};
