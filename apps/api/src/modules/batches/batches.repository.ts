import { Role, type BatchListQuery } from '@sigecal/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type {
  BatchActor,
  BatchReadRepositoryPort,
  BatchRecord,
  BatchSortField,
} from './batches.types.js';

const personSelection = {
  id: true,
  firstName: true,
  lastName: true,
} as const;
const referenceSelection = { id: true, code: true, name: true } as const;
const stageSelection = {
  ...referenceSelection,
  sequence: true,
} as const;
const openNCWhere: Prisma.NonConformityWhereInput = {
  status: { notIn: ['CERRADA', 'ANULADA'] },
};

const batchSelection = {
  id: true,
  code: true,
  piscoType: { select: referenceSelection },
  currentStage: { select: stageSelection },
  status: true,
  startDate: true,
  closeDate: true,
  rejectedAt: true,
  rejectedBy: { select: personSelection },
  rejectionReason: true,
  volumeLiters: true,
  harvestOrigin: true,
  notes: true,
  createdBy: { select: personSelection },
  dataOrigin: true,
  createdAt: true,
  updatedAt: true,
  varieties: {
    select: {
      variety: { select: referenceSelection },
      percentage: true,
    },
    orderBy: { variety: { name: 'asc' as const } },
  },
  _count: {
    select: {
      inspections: true,
      nonConformities: { where: openNCWhere },
    },
  },
} as const;

type SelectedBatch = Prisma.BatchGetPayload<{ select: typeof batchSelection }>;
const toRecord = (value: SelectedBatch): BatchRecord => ({
  ...value,
  openNonConformities: value._count.nonConformities,
  hasInspections: value._count.inspections > 0,
});
const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

const accessWhere = (actor: BatchActor): Prisma.BatchWhereInput =>
  actor.role === Role.OPERARIO
    ? {
        OR: [
          { createdById: actor.userId },
          { stages: { some: { responsibleId: actor.userId } } },
          { inspections: { some: { responsibleId: actor.userId } } },
        ],
      }
    : {};

const searchWhere = (search?: string): Prisma.BatchWhereInput =>
  search
    ? {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { harvestOrigin: { contains: search, mode: 'insensitive' } },
          { piscoType: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }
    : {};

const listWhere = (
  query: BatchListQuery,
  actor: BatchActor,
): Prisma.BatchWhereInput => ({
  ...(query.status ? { status: query.status } : {}),
  ...(query.piscoTypeId ? { piscoTypeId: query.piscoTypeId } : {}),
  ...(query.stageId ? { currentStageId: query.stageId } : {}),
  ...(query.dataOrigin ? { dataOrigin: query.dataOrigin } : {}),
  ...(query.varietyId
    ? { varieties: { some: { varietyId: query.varietyId } } }
    : {}),
  ...(query.dateFrom || query.dateTo
    ? {
        startDate: {
          ...(query.dateFrom ? { gte: dateOnly(query.dateFrom) } : {}),
          ...(query.dateTo ? { lte: dateOnly(query.dateTo) } : {}),
        },
      }
    : {}),
  AND: [accessWhere(actor), searchWhere(query.search)],
});

const stagesQuery = (client: PrismaClient) =>
  client.processStage.findMany({
    select: stageSelection,
    orderBy: { sequence: 'asc' },
  });
const visitsQuery = (client: PrismaClient, id: string) =>
  client.batchStage.findMany({
    where: { batchId: id },
    select: {
      stageId: true,
      startedAt: true,
      finishedAt: true,
      responsible: { select: personSelection },
      observations: true,
    },
  });
const inspectionsQuery = (client: PrismaClient, id: string) =>
  client.inspection.findMany({
    where: { batchId: id },
    select: {
      id: true,
      code: true,
      stageId: true,
      type: true,
      status: true,
      scheduledDate: true,
    },
    orderBy: { scheduledDate: 'asc' },
  });
const nonConformitiesQuery = (client: PrismaClient, id: string) =>
  client.nonConformity.findMany({
    where: { batchId: id },
    select: {
      id: true,
      code: true,
      stageId: true,
      inspection: { select: { stageId: true } },
      status: true,
      severity: true,
      description: true,
    },
    orderBy: { detectedAt: 'asc' },
  });

export class BatchRepository implements BatchReadRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public async list(
    query: BatchListQuery,
    actor: BatchActor,
    sortBy: BatchSortField,
  ) {
    const where = listWhere(query, actor);
    const [items, total] = await this.client.$transaction([
      this.client.batch.findMany({
        where,
        select: batchSelection,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [sortBy]: query.sortOrder ?? 'desc' },
      }),
      this.client.batch.count({ where }),
    ]);
    return { items: items.map(toRecord), total };
  }

  public async findAccessibleById(id: string, actor: BatchActor) {
    const record = await this.client.batch.findFirst({
      where: { id, ...accessWhere(actor) },
      select: batchSelection,
    });
    return record ? toRecord(record) : null;
  }

  public findPiscoType(id: string) {
    return this.client.piscoType.findUnique({
      where: { id },
      select: { ...referenceSelection, isActive: true },
    });
  }

  public findVarieties(ids: readonly string[]) {
    return this.client.grapeVariety.findMany({
      where: { id: { in: [...ids] } },
      select: { ...referenceSelection, isActive: true },
    });
  }

  public findFirstStage() {
    return this.client.processStage.findFirst({
      where: { isActive: true },
      select: stageSelection,
      orderBy: { sequence: 'asc' },
    });
  }

  public findNextStage(sequence: number) {
    return this.client.processStage.findFirst({
      where: { sequence: sequence + 1, isActive: true },
      select: stageSelection,
    });
  }

  public async activeUserExists(id: string): Promise<boolean> {
    return (
      (await this.client.user.count({ where: { id, isActive: true } })) === 1
    );
  }

  public async timeline(id: string) {
    const [stages, visits, inspections, nonConformities] =
      await this.client.$transaction([
        stagesQuery(this.client),
        visitsQuery(this.client, id),
        inspectionsQuery(this.client, id),
        nonConformitiesQuery(this.client, id),
      ]);
    return {
      stages,
      visits,
      inspections,
      nonConformities: nonConformities.map((item) => ({
        ...item,
        inspectionStageId: item.inspection?.stageId ?? null,
      })),
    };
  }

  public async advanceWarnings(batchId: string, stageId: string) {
    const [pendingInspections, openNonConformities] =
      await this.client.$transaction([
        this.client.inspection.count({
          where: {
            batchId,
            stageId,
            status: { in: ['PROGRAMADA', 'EN_PROCESO', 'VENCIDA'] },
          },
        }),
        this.client.nonConformity.count({
          where: { batchId, ...openNCWhere },
        }),
      ]);
    return [
      ...(pendingInspections > 0 ? (['PENDING_INSPECTIONS'] as const) : []),
      ...(openNonConformities > 0 ? (['OPEN_NONCONFORMITIES'] as const) : []),
    ];
  }
}
