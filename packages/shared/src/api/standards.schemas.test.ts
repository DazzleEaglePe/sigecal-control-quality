import { describe, expect, it } from 'vitest';

import {
  CreateSensoryThresholdRequestSchema,
  CreateStandardRequestSchema,
  EffectiveStandardQuerySchema,
} from './standards.schemas.js';

const base = {
  parameterId: '11111111-1111-4111-a111-111111111111',
  defaultSeverity: 'MODERADA' as const,
  validFrom: '2026-09-01',
};

describe('contratos de estándares', () => {
  it('exige límites ordenados y fechas de vigencia válidas', () => {
    expect(
      CreateStandardRequestSchema.safeParse({
        ...base,
        minValue: 10,
        targetValue: 8,
        maxValue: 12,
      }).success,
    ).toBe(false);
    expect(
      CreateStandardRequestSchema.safeParse({
        ...base,
        minValue: 8,
        maxValue: 12,
        validTo: '2026-08-31',
      }).success,
    ).toBe(false);
    expect(
      CreateStandardRequestSchema.parse({ ...base, minValue: 8 }),
    ).toMatchObject({
      isProvisional: true,
    });
  });

  it('resuelve consultas reales por defecto', () => {
    expect(
      EffectiveStandardQuerySchema.parse({
        parameterId: base.parameterId,
        date: '2026-09-01',
      }).dataOrigin,
    ).toBe('REAL');
  });
});

describe('contratos de umbrales sensoriales', () => {
  it('limita el promedio a la escala de producto entre 1 y 5', () => {
    expect(
      CreateSensoryThresholdRequestSchema.safeParse({
        minAverage: 5.1,
        defaultSeverity: 'LEVE',
        validFrom: '2026-09-01',
      }).success,
    ).toBe(false);
  });
});
