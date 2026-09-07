import { describe, expect, it, vi } from 'vitest';

import { DiscoveryService } from './discovery.service.js';
import type { DiscoveryRepositoryPort } from './discovery.types.js';

const repository = (): DiscoveryRepositoryPort => ({
  search: vi.fn().mockResolvedValue({
    batches: [
      {
        id: '985ac730-41a7-4817-b39e-42e2360fd741',
        type: 'BATCH',
        code: 'LT-2026-0001',
        status: 'EN_PROCESO',
        context: 'Pisco puro · Fermentación',
      },
    ],
    inspections: [],
    nonConformities: [],
  }),
  audit: vi.fn().mockResolvedValue({
    total: 1,
    items: [
      {
        id: '02e1bb2f-10e0-4f4e-ae4f-9d5a1392292f',
        user: null,
        action: 'LOGIN',
        entity: 'Session',
        entityId: 'user',
        before: null,
        after: null,
        ipAddress: null,
        createdAt: new Date('2026-09-07T12:00:00.000Z'),
      },
    ],
  }),
});

describe('DiscoveryService', () => {
  it('totaliza solo resultados accesibles devueltos por el repositorio', async () => {
    const result = await new DiscoveryService(repository()).search(
      { q: 'LT', limitPerType: 8 },
      { userId: 'user', role: 'OPERARIO' },
    );
    expect(result.total).toBe(1);
  });

  it('serializa la fecha de auditoría', async () => {
    const result = await new DiscoveryService(repository()).audit({
      page: 1,
      pageSize: 20,
    });
    expect(result.items[0]?.createdAt).toBe('2026-09-07T12:00:00.000Z');
  });
});
