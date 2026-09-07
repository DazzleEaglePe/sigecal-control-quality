import type {
  InspectionExportQuery,
  NonConformityExportQuery,
  ResultExportQuery,
} from '@sigecal/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type {
  InspectionExportRow,
  NonConformityExportRow,
  ReportExportRepositoryPort,
  ResultExportRow,
} from './reports.types.js';

const personSelection = { firstName: true, lastName: true } as const;
const fullName = (person: { firstName: string; lastName: string }): string =>
  `${person.firstName} ${person.lastName}`;
const originWhere = (includeDemo: boolean): { dataOrigin?: 'REAL' } =>
  includeDemo ? {} : { dataOrigin: 'REAL' };
const dateWhere = (from?: string, to?: string) =>
  from || to
    ? {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    : undefined;
const nonConformitySelection = {
  code: true,
  batch: { select: { code: true } },
  stage: { select: { name: true } },
  origin: true,
  severity: true,
  status: true,
  description: true,
  rootCause: true,
  detectedAt: true,
  assignedTo: { select: personSelection },
  assignedArea: { select: { name: true } },
  attentionStartedAt: true,
  closedAt: true,
  dataOrigin: true,
  actions: {
    select: {
      type: true,
      description: true,
      responsible: { select: personSelection },
      committedDate: true,
      executedAt: true,
      status: true,
      isEffective: true,
      verifiedBy: { select: personSelection },
      verifiedAt: true,
    },
    orderBy: { committedDate: 'asc' as const },
  },
} as const;
const resultSelection = {
  inspection: {
    select: {
      code: true,
      batch: { select: { code: true } },
      stage: { select: { name: true } },
    },
  },
  parameter: { select: { code: true, name: true, unit: true } },
  value: true,
  status: true,
  standard: { select: { referenceNorm: true } },
  recordedAt: true,
  recordedBy: { select: personSelection },
  equipment: { select: { code: true } },
  observation: true,
  dataOrigin: true,
} as const;

export class ReportsExportRepository implements ReportExportRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public async generator(userId: string) {
    const user = await this.client.user.findUniqueOrThrow({
      where: { id: userId },
      select: { ...personSelection, email: true },
    });
    return { fullName: fullName(user), email: user.email };
  }

  public async inspections(
    query: InspectionExportQuery,
  ): Promise<readonly InspectionExportRow[]> {
    const rows = await this.client.inspection.findMany({
      where: this.inspectionWhere(query),
      select: {
        code: true,
        batch: { select: { code: true } },
        stage: { select: { name: true } },
        type: true,
        status: true,
        scheduledDate: true,
        executedAt: true,
        responsible: { select: personSelection },
        equipment: { select: { code: true } },
        dataOrigin: true,
      },
      orderBy: { scheduledDate: 'desc' },
    });
    return rows.map((row) => ({
      ...row,
      batchCode: row.batch.code,
      stageName: row.stage.name,
      responsible: fullName(row.responsible),
      equipment: row.equipment?.code ?? null,
    }));
  }

  public async nonConformities(
    query: NonConformityExportQuery,
  ): Promise<readonly NonConformityExportRow[]> {
    const rows = await this.client.nonConformity.findMany({
      where: this.nonConformityWhere(query),
      select: nonConformitySelection,
      orderBy: { detectedAt: 'desc' },
    });
    return rows.map((row) => ({
      ...row,
      batchCode: row.batch.code,
      stageName: row.stage?.name ?? null,
      assignedTo: row.assignedTo ? fullName(row.assignedTo) : null,
      assignedArea: row.assignedArea?.name ?? null,
      actions: row.actions.map((action) => ({
        ...action,
        responsible: fullName(action.responsible),
        verifiedBy: action.verifiedBy ? fullName(action.verifiedBy) : null,
      })),
    }));
  }

  public async results(
    query: ResultExportQuery,
  ): Promise<readonly ResultExportRow[]> {
    const rows = await this.client.physChemResult.findMany({
      where: this.resultWhere(query),
      select: resultSelection,
      orderBy: { recordedAt: 'desc' },
    });
    return rows.map((row) => ({
      inspectionCode: row.inspection.code,
      batchCode: row.inspection.batch.code,
      stageName: row.inspection.stage.name,
      parameterCode: row.parameter.code,
      parameterName: row.parameter.name,
      unit: row.parameter.unit,
      value: Number(row.value),
      status: row.status,
      standardReference: row.standard.referenceNorm,
      recordedAt: row.recordedAt,
      recordedBy: fullName(row.recordedBy),
      equipmentCode: row.equipment.code,
      observation: row.observation,
      dataOrigin: row.dataOrigin,
    }));
  }

  public async recordExport(
    input: Parameters<ReportExportRepositoryPort['recordExport']>[0],
  ): Promise<void> {
    await this.client.auditLog.create({
      data: {
        userId: input.actorId,
        action: 'EXPORT',
        entity: input.entity,
        entityId: input.entityId,
        after: {
          fileName: input.fileName,
          format: input.format,
          filters: (input.filters ?? {}) as Prisma.InputJsonObject,
        } satisfies Prisma.InputJsonObject,
        ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
      },
    });
  }

  private inspectionWhere(
    query: InspectionExportQuery,
  ): Prisma.InspectionWhereInput {
    const scheduledDate = dateWhere(query.dateFrom, query.dateTo);
    return {
      ...originWhere(query.includeDemo),
      ...(query.batchId ? { batchId: query.batchId } : {}),
      ...(query.stageId ? { stageId: query.stageId } : {}),
      ...(query.responsibleId ? { responsibleId: query.responsibleId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(scheduledDate ? { scheduledDate } : {}),
    };
  }

  private nonConformityWhere(
    query: NonConformityExportQuery,
  ): Prisma.NonConformityWhereInput {
    const detectedAt = dateWhere(query.dateFrom, query.dateTo);
    return {
      ...originWhere(query.includeDemo),
      ...(query.batchId ? { batchId: query.batchId } : {}),
      ...(query.stageId ? { stageId: query.stageId } : {}),
      ...(query.assignedToId ? { assignedToId: query.assignedToId } : {}),
      ...(query.assignedAreaId ? { assignedAreaId: query.assignedAreaId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.origin ? { origin: query.origin } : {}),
      ...(detectedAt ? { detectedAt } : {}),
    };
  }

  private resultWhere(
    query: ResultExportQuery,
  ): Prisma.PhysChemResultWhereInput {
    const recordedAt = dateWhere(query.dateFrom, query.dateTo);
    return {
      ...originWhere(query.includeDemo),
      ...(query.inspectionId ? { inspectionId: query.inspectionId } : {}),
      ...(query.parameterId ? { parameterId: query.parameterId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(recordedAt ? { recordedAt } : {}),
      ...(query.batchId ? { inspection: { batchId: query.batchId } } : {}),
    };
  }
}
