import { describe, expect, it } from 'vitest';

import { AuditQuerySchema, SearchQuerySchema } from './discovery.schemas.js';

describe('SearchQuerySchema', () => {
  it('normaliza tipos y límite por grupo', () => {
    expect(
      SearchQuerySchema.parse({
        q: ' LT-2026 ',
        types: 'BATCH,INSPECTION',
        limitPerType: '5',
      }),
    ).toEqual({
      q: 'LT-2026',
      types: ['BATCH', 'INSPECTION'],
      limitPerType: 5,
    });
  });

  it('rechaza consultas de un carácter', () => {
    expect(SearchQuerySchema.safeParse({ q: 'a' }).success).toBe(false);
  });
});

describe('AuditQuerySchema', () => {
  it('aplica paginación y acepta filtros de auditoría', () => {
    expect(
      AuditQuerySchema.parse({ action: 'EXPORT', entity: 'Report' }),
    ).toMatchObject({ page: 1, pageSize: 20, action: 'EXPORT' });
  });
});
