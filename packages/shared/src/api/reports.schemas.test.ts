import { describe, expect, it } from 'vitest';

import {
  InspectionExportQuerySchema,
  NonConformityExportQuerySchema,
  ReportsDashboardQuerySchema,
  ReportsDashboardResponseSchema,
  ResultExportQuerySchema,
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

describe('filtros de exportación', () => {
  it('excluye DEMO por defecto y acepta filtros aplicables', () => {
    expect(
      InspectionExportQuerySchema.parse({ status: 'COMPLETADA' }).includeDemo,
    ).toBe(false);
    expect(
      NonConformityExportQuerySchema.parse({ severity: 'CRITICA' }).severity,
    ).toBe('CRITICA');
    expect(
      ResultExportQuerySchema.parse({
        dateFrom: '2026-09-01T00:00:00-05:00',
        dateTo: '2026-09-30T23:59:59-05:00',
      }).dateTo,
    ).toBe('2026-09-30T23:59:59-05:00');
  });

  it('rechaza rangos invertidos y parámetros desconocidos', () => {
    expect(
      InspectionExportQuerySchema.safeParse({
        dateFrom: '2026-09-02T00:00:00-05:00',
        dateTo: '2026-09-01T00:00:00-05:00',
      }).success,
    ).toBe(false);
    expect(ResultExportQuerySchema.safeParse({ hidden: 'value' }).success).toBe(
      false,
    );
  });
});
