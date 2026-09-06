import { describe, expect, it } from 'vitest';

import type { ReportsDataset, ReportsRepositoryPort } from './reports.types.js';
import { ReportsService } from './reports.service.js';

const STAGE_ID = '11111111-1111-4111-a111-111111111111';
const NOW = new Date('2026-09-20T17:00:00.000Z');
const query = {
  dateFrom: '2026-08-01',
  dateTo: '2026-09-30',
  includeDemo: false,
} as const;

const emptyDataset = (): ReportsDataset => ({
  results: [],
  inspections: [],
  nonConformities: [],
  batchStages: [],
});

class MemoryReportsRepository implements ReportsRepositoryPort {
  public constructor(private readonly dataset: ReportsDataset) {}
  public loadDashboard(): Promise<ReportsDataset> {
    return Promise.resolve(this.dataset);
  }
}

const serviceFor = (dataset: ReportsDataset) =>
  new ReportsService(new MemoryReportsRepository(dataset), () => NOW);

const demoDataset: ReportsDataset = {
  ...emptyDataset(),
  results: [
    {
      kind: 'physchem',
      status: 'NO_CONFORME',
      recordedAt: new Date('2026-09-10T15:00:00.000Z'),
      dataOrigin: 'REAL',
      covered: true,
    },
    {
      kind: 'sensory',
      status: 'CONFORME',
      recordedAt: new Date('2026-09-10T15:00:00.000Z'),
      dataOrigin: 'DEMO',
      covered: true,
    },
  ],
};

const operationsDataset: ReportsDataset = {
  ...emptyDataset(),
  batchStages: [
    {
      batchId: 'active-batch',
      batchStatus: 'EN_OBSERVACION',
      dataOrigin: 'REAL',
      stageId: STAGE_ID,
      stageName: 'Fermentación',
      stageSequence: 3,
      startedAt: new Date('2026-08-15T15:00:00.000Z'),
      finishedAt: null,
    },
    {
      batchId: 'closed-batch',
      batchStatus: 'CERRADO',
      dataOrigin: 'REAL',
      stageId: STAGE_ID,
      stageName: 'Fermentación',
      stageSequence: 3,
      startedAt: new Date('2026-08-15T15:00:00.000Z'),
      finishedAt: null,
    },
  ],
  inspections: [
    {
      status: 'COMPLETADA',
      scheduledDate: new Date('2026-09-10T15:00:00.000Z'),
      executedAt: new Date('2026-09-10T14:00:00.000Z'),
      dataOrigin: 'REAL',
    },
    {
      status: 'COMPLETADA',
      scheduledDate: new Date('2026-09-11T15:00:00.000Z'),
      executedAt: new Date('2026-09-11T18:00:00.000Z'),
      dataOrigin: 'REAL',
    },
    {
      status: 'VENCIDA',
      scheduledDate: new Date('2026-09-12T15:00:00.000Z'),
      executedAt: null,
      dataOrigin: 'REAL',
    },
  ],
  nonConformities: [
    {
      status: 'EN_ANALISIS',
      severity: 'MODERADA',
      detectedAt: new Date('2026-09-18T17:00:00.000Z'),
      attentionStartedAt: new Date('2026-09-18T19:00:00.000Z'),
      closedAt: null,
      annulledAt: null,
      dataOrigin: 'REAL',
      stageId: STAGE_ID,
      stageName: 'Fermentación',
      stageSequence: 3,
    },
    {
      status: 'ABIERTA',
      severity: 'CRITICA',
      detectedAt: new Date('2026-09-19T17:00:00.000Z'),
      attentionStartedAt: null,
      closedAt: null,
      annulledAt: null,
      dataOrigin: 'REAL',
      stageId: null,
      stageName: null,
      stageSequence: null,
    },
  ],
};

const monthlyDataset: ReportsDataset = {
  ...emptyDataset(),
  results: [
    {
      kind: 'physchem',
      status: 'CONFORME',
      recordedAt: new Date('2026-09-01T04:30:00.000Z'),
      dataOrigin: 'REAL',
      covered: true,
    },
    {
      kind: 'physchem',
      status: 'NO_CONFORME',
      recordedAt: new Date('2026-09-01T05:30:00.000Z'),
      dataOrigin: 'REAL',
      covered: true,
    },
  ],
};

describe('indicadores sin datos', () => {
  it('devuelve null cuando no existe denominador', async () => {
    const result = await serviceFor(emptyDataset()).dashboard(query, {
      userId: 'operator',
      role: 'OPERARIO',
    });
    expect(result.conformityRate.value).toBeNull();
    expect(result.scheduleCompliance.value).toBeNull();
    expect(result.avgResponseTime.hours).toBeNull();
  });
});

describe('separación de datos DEMO', () => {
  it('excluye DEMO por defecto y permite su inclusión autorizada', async () => {
    const service = serviceFor(demoDataset);
    const real = await service.dashboard(query, {
      userId: 'manager',
      role: 'JEFE_CALIDAD',
    });
    expect(real.conformityRate).toMatchObject({ value: 0, total: 1 });
    const withDemo = await service.dashboard(
      { ...query, includeDemo: true },
      { userId: 'admin', role: 'ADMIN' },
    );
    expect(withDemo.conformityRate).toMatchObject({ value: 50, total: 2 });
  });

  it('rechaza includeDemo para un rol sin permiso', async () => {
    const service = serviceFor(demoDataset);
    await expect(
      service.dashboard(
        { ...query, includeDemo: true },
        { userId: 'analyst', role: 'ANALISTA' },
      ),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_PERMISSIONS' });
  });
});

describe('indicadores operativos', () => {
  it('separa inspecciones tardías y NC todavía sin atención', async () => {
    const result = await serviceFor(operationsDataset).dashboard(query, {
      userId: 'manager',
      role: 'JEFE_CALIDAD',
    });
    expect(result.scheduleCompliance).toMatchObject({
      value: 33.3,
      due: 3,
      onTime: 1,
      late: 1,
      overdue: 1,
    });
    expect(result.avgResponseTime).toEqual({
      hours: 2,
      attended: 1,
      unattended: 1,
      oldestUnattendedHours: 24,
    });
    expect(result.openNonConformities).toEqual({
      LEVE: 0,
      MODERADA: 1,
      CRITICA: 1,
    });
    expect(result.activeBatchesByStage).toEqual([
      {
        stageId: STAGE_ID,
        stageName: 'Fermentación',
        sequence: 3,
        count: 1,
        inObservation: 1,
      },
    ]);
    expect(result.ncByStage.at(-1)?.stageName).toBe('Sin etapa');
  });
});

describe('corte mensual de Lima', () => {
  it('agrupa el corte mensual con la zona America/Lima', async () => {
    const result = await serviceFor(monthlyDataset).dashboard(query, {
      userId: 'analyst',
      role: 'ANALISTA',
    });
    expect(result.conformityTrend).toEqual([
      { month: '2026-08', conforming: 1, sampleSize: 1, rate: 100 },
      { month: '2026-09', conforming: 0, sampleSize: 1, rate: 0 },
    ]);
  });
});
