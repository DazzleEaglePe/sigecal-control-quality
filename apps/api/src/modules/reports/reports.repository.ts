import { Role } from '@sigecal/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type {
  BatchStageMetricRecord,
  NonConformityMetricRecord,
  ResultMetricRecord,
  ReportActor,
  ReportRange,
  ReportsDataset,
  ReportsRepositoryPort,
} from './reports.types.js';

const metricStatus = (
  status: 'CONFORME' | 'NO_CONFORME' | 'ANULADO',
): ResultMetricRecord['status'] => {
  if (status === 'ANULADO') {
    throw new Error('El repositorio recibió un resultado anulado para KPI.');
  }
  return status;
};

const originWhere = (includeDemo: boolean) =>
  includeDemo ? {} : ({ dataOrigin: 'REAL' as const } as const);

const inspectionAccess = (actor: ReportActor): Prisma.InspectionWhereInput =>
  actor.role === Role.OPERARIO
    ? { OR: [{ responsibleId: actor.userId }, { createdById: actor.userId }] }
    : {};

const nonConformityAccess = (
  actor: ReportActor,
): Prisma.NonConformityWhereInput =>
  actor.role === Role.OPERARIO
    ? { OR: [{ detectedById: actor.userId }, { assignedToId: actor.userId }] }
    : {};

const batchAccess = (actor: ReportActor): Prisma.BatchWhereInput =>
  actor.role === Role.OPERARIO
    ? {
        OR: [
          { createdById: actor.userId },
          { stages: { some: { responsibleId: actor.userId } } },
          { inspections: { some: { responsibleId: actor.userId } } },
        ],
      }
    : {};

type ResultSource = Omit<ResultMetricRecord, 'kind' | 'covered' | 'status'> & {
  readonly status: 'CONFORME' | 'NO_CONFORME' | 'ANULADO';
};
type NonConformitySource = Omit<
  NonConformityMetricRecord,
  'stageId' | 'stageName' | 'stageSequence'
> & {
  readonly stage: {
    readonly id: string;
    readonly name: string;
    readonly sequence: number;
  } | null;
};
type BatchStageSource = Pick<
  BatchStageMetricRecord,
  'startedAt' | 'finishedAt'
> & {
  readonly batch: {
    readonly id: string;
    readonly status: BatchStageMetricRecord['batchStatus'];
    readonly dataOrigin: BatchStageMetricRecord['dataOrigin'];
  };
  readonly stage: {
    readonly id: string;
    readonly name: string;
    readonly sequence: number;
  };
};

const resultRecord = (
  row: ResultSource,
  kind: ResultMetricRecord['kind'],
  covered: boolean,
): ResultMetricRecord => ({
  ...row,
  status: metricStatus(row.status),
  kind,
  covered,
});

const nonConformityRecord = (
  row: NonConformitySource,
): NonConformityMetricRecord => ({
  ...row,
  stageId: row.stage?.id ?? null,
  stageName: row.stage?.name ?? null,
  stageSequence: row.stage?.sequence ?? null,
});

const batchStageRecord = (row: BatchStageSource): BatchStageMetricRecord => ({
  ...row,
  batchId: row.batch.id,
  batchStatus: row.batch.status,
  dataOrigin: row.batch.dataOrigin,
  stageId: row.stage.id,
  stageName: row.stage.name,
  stageSequence: row.stage.sequence,
});

export class ReportsRepository implements ReportsRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public async loadDashboard(range: ReportRange): Promise<ReportsDataset> {
    const [physchem, sensory, inspections, nonConformities, batchStages] =
      await Promise.all([
        this.physchem(range),
        this.sensory(range),
        this.inspections(range),
        this.nonConformities(range),
        this.batchStages(range),
      ]);
    return {
      results: [
        ...physchem.map((row) =>
          resultRecord(row, 'physchem', Boolean(row.standardId)),
        ),
        ...sensory.map((row) =>
          resultRecord(row, 'sensory', Boolean(row.sensoryThresholdId)),
        ),
      ],
      inspections,
      nonConformities: nonConformities.map(nonConformityRecord),
      batchStages: batchStages.map(batchStageRecord),
    };
  }

  private physchem(range: ReportRange) {
    return this.client.physChemResult.findMany({
      where: {
        recordedAt: { gte: range.from, lt: range.toExclusive },
        status: { in: ['CONFORME', 'NO_CONFORME'] },
        ...originWhere(range.includeDemo),
        inspection: inspectionAccess(range.actor),
      },
      select: {
        status: true,
        recordedAt: true,
        dataOrigin: true,
        standardId: true,
      },
    });
  }

  private sensory(range: ReportRange) {
    return this.client.sensorySession.findMany({
      where: {
        recordedAt: { gte: range.from, lt: range.toExclusive },
        status: { in: ['CONFORME', 'NO_CONFORME'] },
        ...originWhere(range.includeDemo),
        inspection: inspectionAccess(range.actor),
      },
      select: {
        status: true,
        recordedAt: true,
        dataOrigin: true,
        sensoryThresholdId: true,
      },
    });
  }

  private inspections(range: ReportRange) {
    const dueLimit =
      range.now < range.toExclusive ? range.now : range.toExclusive;
    return this.client.inspection.findMany({
      where: {
        scheduledDate: { gte: range.from, lt: dueLimit },
        status: { notIn: ['CANCELADA', 'REPROGRAMADA'] },
        ...originWhere(range.includeDemo),
        ...inspectionAccess(range.actor),
      },
      select: {
        status: true,
        scheduledDate: true,
        executedAt: true,
        dataOrigin: true,
      },
    });
  }

  private nonConformities(range: ReportRange) {
    return this.client.nonConformity.findMany({
      where: {
        detectedAt: { lt: range.toExclusive },
        ...originWhere(range.includeDemo),
        ...nonConformityAccess(range.actor),
      },
      select: {
        status: true,
        severity: true,
        detectedAt: true,
        attentionStartedAt: true,
        closedAt: true,
        annulledAt: true,
        dataOrigin: true,
        stage: { select: { id: true, name: true, sequence: true } },
      },
    });
  }

  private batchStages(range: ReportRange) {
    return this.client.batchStage.findMany({
      where: {
        startedAt: { lt: range.toExclusive },
        OR: [{ finishedAt: null }, { finishedAt: { gte: range.toExclusive } }],
        batch: {
          status: { notIn: ['CERRADO', 'RECHAZADO'] },
          ...originWhere(range.includeDemo),
          ...batchAccess(range.actor),
        },
      },
      select: {
        startedAt: true,
        finishedAt: true,
        batch: { select: { id: true, status: true, dataOrigin: true } },
        stage: { select: { id: true, name: true, sequence: true } },
      },
    });
  }
}
