import { describe, expect, it, vi } from 'vitest';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { DiscoveryRepository } from './discovery.repository.js';

const clientMock = () => {
  const batch = vi
    .fn<(args: Prisma.BatchFindManyArgs) => Promise<never[]>>()
    .mockResolvedValue([]);
  const inspection = vi
    .fn<(args: Prisma.InspectionFindManyArgs) => Promise<never[]>>()
    .mockResolvedValue([]);
  const nonConformity = vi
    .fn<(args: Prisma.NonConformityFindManyArgs) => Promise<never[]>>()
    .mockResolvedValue([]);
  const client = {
    batch: { findMany: batch },
    inspection: { findMany: inspection },
    nonConformity: { findMany: nonConformity },
  } as unknown as PrismaClient;
  return { client, batch, inspection, nonConformity };
};

describe('DiscoveryRepository', () => {
  it('aplica pertenencia de OPERARIO antes de limitar cada grupo', async () => {
    const memory = clientMock();
    await new DiscoveryRepository(memory.client).search(
      { q: 'LT', limitPerType: 8 },
      { userId: 'operator-id', role: 'OPERARIO' },
    );
    const batchArgs = memory.batch.mock.calls[0]?.[0];
    const inspectionArgs = memory.inspection.mock.calls[0]?.[0];
    const nonConformityArgs = memory.nonConformity.mock.calls[0]?.[0];
    expect(JSON.stringify(batchArgs?.where)).toContain(
      '"createdById":"operator-id"',
    );
    expect(batchArgs?.take).toBe(8);
    expect(JSON.stringify(inspectionArgs?.where)).toContain(
      '"responsibleId":"operator-id"',
    );
    expect(JSON.stringify(nonConformityArgs?.where)).toContain(
      '"detectedById":"operator-id"',
    );
  });
});
