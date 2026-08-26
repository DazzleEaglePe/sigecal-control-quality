import {
  Role,
  type CreateInspectionPlanRequest,
  type CreateInspectionRequest,
} from '@sigecal/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type {
  InspectionActor,
  InspectionReadRepositoryPort,
} from './inspections.types.js';

const referenceSelection = { id: true, code: true, name: true } as const;
const batchSelection = { id: true, code: true } as const;
const personSelection = { id: true, firstName: true, lastName: true } as const;
const equipmentSelection = {
  ...referenceSelection,
  status: true,
  isActive: true,
} as const;
const parameterSelection = {
  ...referenceSelection,
  type: true,
  unit: true,
  isActive: true,
} as const;
const batchContextSelection = {
  ...batchSelection,
  piscoTypeId: true,
  startDate: true,
  status: true,
  dataOrigin: true,
} as const;
const userSelection = {
  ...personSelection,
  role: true,
  isActive: true,
} as const;
const planTemplateSelection = {
  id: true,
  piscoTypeId: true,
  validFrom: true,
  validTo: true,
  isActive: true,
  items: {
    select: {
      stageId: true,
      type: true,
      offsetDaysFromBatchStart: true,
      scheduledLocalTime: true,
      responsibleRole: true,
      equipmentId: true,
      parameters: { select: { parameterId: true } },
    },
  },
} as const;
export const inspectionSelection = {
  id: true,
  code: true,
  batchId: true,
  batch: { select: batchSelection },
  stageId: true,
  stage: { select: referenceSelection },
  type: true,
  status: true,
  scheduledDate: true,
  executedAt: true,
  responsibleId: true,
  responsible: { select: personSelection },
  equipmentId: true,
  equipment: { select: equipmentSelection },
  rescheduledFromId: true,
  rescheduledTo: { select: { id: true } },
  changeReason: true,
  notes: true,
  createdById: true,
  createdBy: { select: personSelection },
  dataOrigin: true,
  parameters: {
    select: { parameter: { select: parameterSelection } },
    orderBy: { parameter: { name: 'asc' as const } },
  },
  results: {
    where: { status: { not: 'ANULADO' as const } },
    select: { parameterId: true },
  },
} as const;

const accessWhere = (actor: InspectionActor): Prisma.InspectionWhereInput =>
  actor.role === Role.OPERARIO
    ? {
        OR: [{ responsibleId: actor.userId }, { createdById: actor.userId }],
      }
    : {};
const searchWhere = (search?: string): Prisma.InspectionWhereInput =>
  search
    ? {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { batch: { code: { contains: search, mode: 'insensitive' } } },
          { stage: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }
    : {};
const requestedSort = (sortBy?: string) =>
  ['code', 'scheduledDate', 'status', 'type'].includes(sortBy ?? '')
    ? sortBy
    : 'scheduledDate';

const listWhere = (
  query: Parameters<InspectionReadRepositoryPort['list']>[0],
  actor: InspectionActor,
): Prisma.InspectionWhereInput => ({
  ...(query.batchId ? { batchId: query.batchId } : {}),
  ...(query.status ? { status: query.status } : {}),
  ...(query.type ? { type: query.type } : {}),
  ...(query.responsibleId ? { responsibleId: query.responsibleId } : {}),
  ...(query.stageId ? { stageId: query.stageId } : {}),
  ...(query.dateFrom || query.dateTo
    ? {
        scheduledDate: {
          ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
          ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
        },
      }
    : {}),
  AND: [accessWhere(actor), searchWhere(query.search)],
});

const calendarRange = (
  query: Parameters<InspectionReadRepositoryPort['calendar']>[0],
) => {
  if (query.dateFrom && query.dateTo)
    return { gte: new Date(query.dateFrom), lte: new Date(query.dateTo) };
  const month = query.month ?? 1;
  const year = query.year ?? 2000;
  const yearText = String(year);
  const nextYearText = String(month === 12 ? year + 1 : year);
  const monthText = String(month).padStart(2, '0');
  const nextMonthText = String((month % 12) + 1).padStart(2, '0');
  return {
    gte: new Date(`${yearText}-${monthText}-01T00:00:00-05:00`),
    lt: new Date(`${nextYearText}-${nextMonthText}-01T00:00:00-05:00`),
  };
};

export class InspectionRepository implements InspectionReadRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  private async paginated(
    where: Prisma.InspectionWhereInput,
    page: number,
    pageSize: number,
    sortBy = 'scheduledDate',
    sortOrder: 'asc' | 'desc' = 'asc',
  ) {
    const total = await this.client.inspection.count({ where });
    const items = await this.client.inspection.findMany({
      where,
      select: inspectionSelection,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    });
    return { items, total };
  }

  public list(
    query: Parameters<InspectionReadRepositoryPort['list']>[0],
    actor: InspectionActor,
  ) {
    return this.paginated(
      listWhere(query, actor),
      query.page,
      query.pageSize,
      requestedSort(query.sortBy),
      query.sortOrder ?? 'desc',
    );
  }

  public calendar(
    query: Parameters<InspectionReadRepositoryPort['calendar']>[0],
    actor: InspectionActor,
  ) {
    return this.paginated(
      { scheduledDate: calendarRange(query), ...accessWhere(actor) },
      query.page,
      query.pageSize,
    );
  }

  public myPending(
    query: Parameters<InspectionReadRepositoryPort['myPending']>[0],
    actor: InspectionActor,
  ) {
    return this.paginated(
      {
        responsibleId: actor.userId,
        status: { in: ['PROGRAMADA', 'VENCIDA', 'EN_PROCESO'] },
      },
      query.page,
      query.pageSize,
    );
  }

  public findAccessibleById(id: string, actor: InspectionActor) {
    return this.client.inspection.findFirst({
      where: { id, ...accessWhere(actor) },
      select: inspectionSelection,
    });
  }

  public async findReferences(input: CreateInspectionRequest) {
    const batch = await this.client.batch.findUnique({
      where: { id: input.batchId },
      select: batchContextSelection,
    });
    const stage = await this.client.processStage.findUnique({
      where: { id: input.stageId },
      select: { ...referenceSelection, isActive: true },
    });
    const responsible = await this.client.user.findUnique({
      where: { id: input.responsibleId },
      select: userSelection,
    });
    const equipment = await this.client.equipment.findUnique({
      where: { id: input.equipmentId ?? '' },
      select: equipmentSelection,
    });
    const parameters = await this.client.parameter.findMany({
      where: { id: { in: input.parameterIds } },
      select: parameterSelection,
    });
    return { batch, stage, responsible, equipment, parameters };
  }

  public async findPlanContext(input: CreateInspectionPlanRequest) {
    const userIds = Object.values(input.responsibleByRole);
    const batch = await this.client.batch.findUnique({
      where: { id: input.batchId },
      select: batchContextSelection,
    });
    const template = await this.client.inspectionTemplate.findUnique({
      where: { id: input.templateId },
      select: planTemplateSelection,
    });
    const users = await this.client.user.findMany({
      where: { id: { in: userIds } },
      select: userSelection,
    });
    return { batch, template, users };
  }

  public async coverage(batchId: string) {
    const batch = await this.client.batch.findUnique({
      where: { id: batchId },
      select: batchSelection,
    });
    const stages = await this.client.processStage.findMany({
      where: { isActive: true },
      select: referenceSelection,
      orderBy: { sequence: 'asc' },
    });
    const counts = await this.client.inspection.groupBy({
      by: ['stageId'],
      where: {
        batchId,
        status: { notIn: ['CANCELADA', 'REPROGRAMADA'] },
      },
      _count: { _all: true },
    });
    return {
      batch,
      stages: stages.map((stage) => ({
        ...stage,
        count:
          counts.find((entry) => entry.stageId === stage.id)?._count._all ?? 0,
      })),
    };
  }
}
