import { describe, expect, it } from 'vitest';

import { Prisma } from '../../generated/prisma/client.js';
import { buildControlChart } from './physchem.statistics.js';

const rows = (values: readonly number[]) =>
  values.map((value, index) => ({
    recordedAt: new Date(
      `2026-08-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
    ),
    value: new Prisma.Decimal(value),
    batchCode: `LOT-${String(index + 1)}`,
  }));

describe('gráfico de control fisicoquímico', () => {
  it('no calcula límites con menos de ocho resultados reales', () => {
    const result = buildControlChart(rows([10, 11, 12, 13, 14, 15, 16]), false);
    expect(result).toMatchObject({
      sampleSize: 7,
      sufficientData: false,
      lowerControlLimit: null,
      upperControlLimit: null,
      includesDemo: false,
    });
  });

  it('calcula límites de tres sigmas y marca valores fuera de control', () => {
    const result = buildControlChart(
      rows([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100]),
      true,
    );
    expect(result.sampleSize).toBe(11);
    expect(result.sufficientData).toBe(true);
    expect(result.centerLine).toBeCloseTo(100 / 11);
    expect(result.points.at(-1)?.outOfControl).toBe(true);
    expect(result.includesDemo).toBe(true);
  });
});
