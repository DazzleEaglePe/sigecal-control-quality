import { describe, expect, it, vi } from 'vitest';

import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listAudit, searchRecords } from './discovery-api.js';

const requestMock = () =>
  vi.fn().mockResolvedValue({
    success: true,
    data: {
      batches: [],
      inspections: [],
      nonConformities: [],
      total: 0,
    },
  }) as unknown as AuthorizedRequest;

describe('discovery api', () => {
  it('serializa texto, tipos y límite de búsqueda', async () => {
    const request = requestMock();
    await searchRecords(request, 'LT 2026', ['BATCH', 'INSPECTION'], 4);
    expect(request).toHaveBeenCalledWith(
      '/search?q=LT+2026&limitPerType=4&types=BATCH%2CINSPECTION',
      undefined,
    );
  });

  it('serializa los filtros de la bitácora', async () => {
    const request = requestMock();
    await listAudit(request, {
      page: 2,
      pageSize: 20,
      action: 'EXPORT',
      entity: 'Report',
    });
    expect(request).toHaveBeenCalledWith(
      '/audit?page=2&pageSize=20&action=EXPORT&entity=Report',
      undefined,
    );
  });
});
