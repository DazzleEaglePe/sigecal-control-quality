import { describe, expect, it } from 'vitest';

import {
  ReportsDashboardQuerySchema,
  ReportsDashboardResponseSchema,
} from './reports.schemas.js';

const emptyMetricResponse = {
  success: true,
  data: {
    period: {
      dateFrom: '2026-09-01',
      dateTo: '2026-09-30',
      timeZone: 'America/Lima',
    },
    includesDemo: false,
    conformityRate: {
      value: null,
      conforming: 0,
      total: 0,
      physchem: null,
      sensory: null,
      standardCoverage: { value: null, covered: 0, total: 0 },
    },
    scheduleCompliance: {
      value: null,
      onTime: 0,
      due: 0,
      late: 0,
      overdue: 0,
    },
    avgResponseTime: {
      hours: null,
      attended: 0,
      unattended: 0,
      oldestUnattendedHours: null,
    },
    openNonConformities: { LEVE: 0, MODERADA: 0, CRITICA: 0 },
    activeBatchesByStage: [],
    ncByStage: [],
    conformityTrend: [],
  },
};

describe('contratos de indicadores', () => {
  it('excluye demostración por defecto y valida el periodo', () => {
    expect(
      ReportsDashboardQuerySchema.parse({
        dateFrom: '2026-09-01',
        dateTo: '2026-09-30',
      }).includeDemo,
    ).toBe(false);
    expect(
      ReportsDashboardQuerySchema.safeParse({
        dateFrom: '2026-10-01',
        dateTo: '2026-09-30',
      }).success,
    ).toBe(false);
  });

  it('acepta métricas sin denominador como null', () => {
    expect(
      ReportsDashboardResponseSchema.safeParse(emptyMetricResponse).success,
    ).toBe(true);
  });
});
