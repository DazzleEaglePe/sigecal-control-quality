import { describe, expect, it } from 'vitest';

import {
  CorrectPhysChemResultRequestSchema,
  PhysChemControlChartQuerySchema,
  ValidatePhysChemResultsRequestSchema,
} from './physchem.schemas.js';

const id = (number: number): string =>
  `${String(number).padStart(8, '0')}-1111-4111-a111-111111111111`;

describe('contratos fisicoquímicos', () => {
  it('exige mediciones finitas y parámetros únicos', () => {
    const inspectionId = id(1);
    expect(
      ValidatePhysChemResultsRequestSchema.safeParse({
        inspectionId,
        results: [
          { parameterId: id(2), value: 41.5 },
          { parameterId: id(2), value: 42 },
        ],
      }).success,
    ).toBe(false);
    expect(
      ValidatePhysChemResultsRequestSchema.safeParse({
        inspectionId,
        results: [{ parameterId: id(2), value: Number.NaN }],
      }).success,
    ).toBe(false);
  });

  it('no permite alterar metadatos resueltos por el servidor', () => {
    expect(
      ValidatePhysChemResultsRequestSchema.safeParse({
        inspectionId: id(1),
        results: [{ parameterId: id(2), value: 41.5, status: 'CONFORME' }],
      }).success,
    ).toBe(false);
  });
});

describe('corrección y consulta fisicoquímica', () => {
  it('exige motivo e instrumento al corregir', () => {
    expect(
      CorrectPhysChemResultRequestSchema.safeParse({
        reason: 'Error de transcripción',
        value: 40.8,
        equipmentId: id(3),
      }).success,
    ).toBe(true);
    expect(
      CorrectPhysChemResultRequestSchema.safeParse({
        reason: '',
        value: 40.8,
      }).success,
    ).toBe(false);
  });

  it('limita el gráfico a un rango cronológico válido', () => {
    const base = { parameterId: id(1), piscoTypeId: id(2), stageId: id(3) };
    expect(PhysChemControlChartQuerySchema.parse(base).includeDemo).toBe(false);
    expect(
      PhysChemControlChartQuerySchema.safeParse({
        ...base,
        dateFrom: '2026-09-10',
        dateTo: '2026-09-01',
      }).success,
    ).toBe(false);
  });
});
