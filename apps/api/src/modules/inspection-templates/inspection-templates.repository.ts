import type {
  CreateInspectionTemplateRequest,
  InspectionTemplateListQuery,
} from '@sigecal/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import type {
  InspectionTemplateRecord,
  InspectionTemplateRepositoryPort,
} from './inspection-templates.types.js';

const referenceSelection = { id: true, code: true, name: true } as const;
const personSelection = { id: true, firstName: true, lastName: true } as const;
const equipmentSelection = {
  ...referenceSelection,
  status: true,
} as const;
const parameterSelection = {
  ...referenceSelection,
  type: true,
  unit: true,
} as const;
const selection = {
  id: true,
  code: true,
  name: true,
  piscoTypeId: true,
  piscoType: { select: referenceSelection },
  validFrom: true,
  validTo: true,
  isActive: true,
  createdBy: { select: personSelection },
  items: {
    select: {
      id: true,
      stage: { select: referenceSelection },
      type: true,
      offsetDaysFromBatchStart: true,
      scheduledLocalTime: true,
      responsibleRole: true,
      equipment: { select: equipmentSelection },
      parameters: {
        select: { parameter: { select: parameterSelection } },
      },
    },
    orderBy: { offsetDaysFromBatchStart: 'asc' as const },
  },
} as const;

const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const dayBefore = (value: string): Date =>
  new Date(dateOnly(value).getTime() - 86_400_000);
const timeOnly = (value: string): Date =>
  new Date(`1970-01-01T${value.length === 5 ? `${value}:00` : value}.000Z`);
const auditView = (record: InspectionTemplateRecord) => ({
  code: record.code,
  piscoTypeId: record.piscoTypeId,
  validFrom: record.validFrom.toISOString().slice(0, 10),
  validTo: record.validTo?.toISOString().slice(0, 10) ?? null,
  isActive: record.isActive,
  itemCount: record.items.length,
});

const createData = (
  input: CreateInspectionTemplateRequest,
  actorId: string,
) => ({
  code: input.code,
  name: input.name,
  piscoTypeId: input.piscoTypeId,
  validFrom: dateOnly(input.validFrom),
  validTo: input.validTo ? dateOnly(input.validTo) : null,
  createdById: actorId,
  items: {
    create: input.items.map((item) => ({
      stageId: item.stageId,
      type: item.type,
      offsetDaysFromBatchStart: item.offsetDaysFromBatchStart,
      scheduledLocalTime: timeOnly(item.scheduledLocalTime),
      responsibleRole: item.responsibleRole,
      equipmentId: item.equipmentId ?? null,
      parameters: {
        create: item.parameterIds.map((parameterId) => ({ parameterId })),
      },
    })),
  },
});

const searchWhere = (search?: string): Prisma.InspectionTemplateWhereInput =>
  search
    ? {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

export class InspectionTemplateRepository implements InspectionTemplateRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public async list(query: InspectionTemplateListQuery) {
    const where: Prisma.InspectionTemplateWhereInput = {
      ...(query.piscoTypeId ? { piscoTypeId: query.piscoTypeId } : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...searchWhere(query.search),
    };
    const total = await this.client.inspectionTemplate.count({ where });
    const items = await this.client.inspectionTemplate.findMany({
      where,
      select: selection,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { validFrom: query.sortOrder ?? 'desc' },
    });
    return { items, total };
  }

  public findById(id: string): Promise<InspectionTemplateRecord | null> {
    return this.client.inspectionTemplate.findUnique({
      where: { id },
      select: selection,
    });
  }

  public findByCode(code: string): Promise<InspectionTemplateRecord | null> {
    return this.client.inspectionTemplate.findUnique({
      where: { code },
      select: selection,
    });
  }

  public findOverlaps(input: CreateInspectionTemplateRequest) {
    const start = dateOnly(input.validFrom);
    return this.client.inspectionTemplate.findMany({
      where: {
        piscoTypeId: input.piscoTypeId,
        isActive: true,
        validFrom: {
          lte: input.validTo
            ? dateOnly(input.validTo)
            : new Date('9999-12-31T00:00:00.000Z'),
        },
        OR: [{ validTo: null }, { validTo: { gte: start } }],
      },
      select: selection,
      orderBy: { validFrom: 'desc' },
    });
  }

  public async findReferences(input: CreateInspectionTemplateRequest) {
    const stageIds = [...new Set(input.items.map((item) => item.stageId))];
    const equipmentIds = [
      ...new Set(
        input.items.flatMap((item) =>
          item.equipmentId ? [item.equipmentId] : [],
        ),
      ),
    ];
    const parameterIds = [
      ...new Set(input.items.flatMap((item) => item.parameterIds)),
    ];
    const piscoType = await this.client.piscoType.count({
      where: { id: input.piscoTypeId, isActive: true },
    });
    const stages = await this.client.processStage.findMany({
      where: { id: { in: stageIds }, isActive: true },
      select: { id: true },
    });
    const equipment = await this.client.equipment.findMany({
      where: { id: { in: equipmentIds }, isActive: true },
      select: { id: true },
    });
    const parameters = await this.client.parameter.findMany({
      where: { id: { in: parameterIds } },
      select: { id: true, type: true, isActive: true },
    });
    return {
      piscoTypeActive: piscoType === 1,
      activeStageIds: stages.map((item) => item.id),
      activeEquipmentIds: equipment.map((item) => item.id),
      parameters,
    };
  }

  public create(
    input: CreateInspectionTemplateRequest,
    actorId: string,
    previousId?: string,
    ipAddress?: string,
  ): Promise<InspectionTemplateRecord> {
    return this.client.$transaction(async (tx) => {
      if (previousId)
        await tx.inspectionTemplate.update({
          where: { id: previousId },
          data: { validTo: dayBefore(input.validFrom) },
        });
      const record = await tx.inspectionTemplate.create({
        data: createData(input, actorId),
        select: selection,
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: AuditAction.CREATE,
          entity: 'InspectionTemplate',
          entityId: record.id,
          after: auditView(record),
          ipAddress: ipAddress ?? null,
        },
      });
      return record;
    });
  }

  public deactivate(
    id: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<InspectionTemplateRecord> {
    return this.client.$transaction(async (tx) => {
      const before = await tx.inspectionTemplate.findUniqueOrThrow({
        where: { id },
        select: selection,
      });
      const record = await tx.inspectionTemplate.update({
        where: { id },
        data: { isActive: false },
        select: selection,
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: AuditAction.STATE_CHANGE,
          entity: 'InspectionTemplate',
          entityId: id,
          before: auditView(before),
          after: auditView(record),
          ipAddress: ipAddress ?? null,
        },
      });
      return record;
    });
  }
}
