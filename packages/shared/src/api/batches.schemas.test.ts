import { describe, expect, it } from 'vitest';

import {
  BatchListQuerySchema,
  CreateBatchRequestSchema,
  UpdateBatchRequestSchema,
} from './batches.schemas.js';

const id = (number: number): string =>
  `${String(number).padStart(8, '0')}-1111-4111-a111-111111111111`;

const base = {
  piscoTypeId: id(1),
  startDate: '2026-10-01',
  volumeLiters: 800,
};

describe('contratos de lotes', () => {
  it('acepta una composición única cuyos porcentajes suman 100', () => {
    expect(
      CreateBatchRequestSchema.safeParse({
        ...base,
        varieties: [
          { varietyId: id(2), percentage: 60 },
          { varietyId: id(3), percentage: 40 },
        ],
      }).success,
    ).toBe(true);
  });

  it('rechaza variedades duplicadas, porcentajes parciales o suma distinta', () => {
    const invalid = [
      [{ varietyId: id(2) }, { varietyId: id(2) }],
      [{ varietyId: id(2), percentage: 60 }, { varietyId: id(3) }],
      [
        { varietyId: id(2), percentage: 60 },
        { varietyId: id(3), percentage: 30 },
      ],
    ];
    for (const varieties of invalid) {
      expect(
        CreateBatchRequestSchema.safeParse({ ...base, varieties }).success,
      ).toBe(false);
    }
  });
});

describe('consultas y actualización de lotes', () => {
  it('impide actualizaciones vacías y rangos de fecha invertidos', () => {
    expect(UpdateBatchRequestSchema.safeParse({}).success).toBe(false);
    expect(
      BatchListQuerySchema.safeParse({
        dateFrom: '2026-10-10',
        dateTo: '2026-10-01',
      }).success,
    ).toBe(false);
  });

  it('pagina de forma segura por defecto', () => {
    expect(BatchListQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 20,
    });
  });
});
