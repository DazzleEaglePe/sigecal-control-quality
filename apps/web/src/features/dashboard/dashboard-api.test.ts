import { describe, expect, it, vi } from 'vitest';

import { getDashboard } from './dashboard-api.js';

const response = {
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

describe('dashboard-api', () => {
  it('envía el periodo y valida la respuesta del servidor', async () => {
    const request = vi.fn().mockResolvedValue(response);
    const result = await getDashboard(request, {
      dateFrom: '2026-09-01',
      dateTo: '2026-09-30',
      includeDemo: false,
    });
    expect(request).toHaveBeenCalledWith(
      '/reports/dashboard?dateFrom=2026-09-01&dateTo=2026-09-30&includeDemo=false',
    );
    expect(result.period.timeZone).toBe('America/Lima');
  });
});
