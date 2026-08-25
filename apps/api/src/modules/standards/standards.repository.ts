import type {
  CreateStandardRequest,
  EffectiveStandardQuery,
  StandardHistoryQuery,
  UpdateStandardRequest,
} from '@sigecal/shared';

import type { PrismaClient } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import type {
  StandardRecord,
  StandardRepositoryPort,
} from './standards.types.js';

const selection = {
  id: true,
  parameterId: true,
  piscoTypeId: true,
  stageId: true,
  minValue: true,
  maxValue: true,
  targetValue: true,
  referenceNorm: true,
  defaultSeverity: true,
  isProvisional: true,
  validFrom: true,
  validTo: true,
  isActive: true,
} as const;
const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const dayBefore = (value: string): Date =>
  new Date(dateOnly(value).getTime() - 86_400_000);
const auditView = (record: StandardRecord) => ({
  parameterId: record.parameterId,
  piscoTypeId: record.piscoTypeId,
  stageId: record.stageId,
  minValue: record.minValue?.toString() ?? null,
  maxValue: record.maxValue?.toString() ?? null,
  targetValue: record.targetValue?.toString() ?? null,
  referenceNorm: record.referenceNorm,
  defaultSeverity: record.defaultSeverity,
  isProvisional: record.isProvisional,
  validFrom: record.validFrom.toISOString().slice(0, 10),
  validTo: record.validTo?.toISOString().slice(0, 10) ?? null,
  isActive: record.isActive,
});
const createData = (input: CreateStandardRequest) => ({
  parameterId: input.parameterId,
  piscoTypeId: input.piscoTypeId ?? null,
  stageId: input.stageId ?? null,
  minValue: input.minValue ?? null,
  maxValue: input.maxValue ?? null,
  targetValue: input.targetValue ?? null,
  referenceNorm: input.referenceNorm ?? null,
  defaultSeverity: input.defaultSeverity,
  isProvisional: input.isProvisional,
  validFrom: dateOnly(input.validFrom),
  validTo: input.validTo ? dateOnly(input.validTo) : null,
});
const updateData = (input: UpdateStandardRequest) => ({
  ...(input.minValue === undefined ? {} : { minValue: input.minValue }),
  ...(input.maxValue === undefined ? {} : { maxValue: input.maxValue }),
  ...(input.targetValue === undefined
    ? {}
    : { targetValue: input.targetValue }),
  ...(input.referenceNorm === undefined
    ? {}
    : { referenceNorm: input.referenceNorm }),
  ...(input.defaultSeverity === undefined
    ? {}
    : { defaultSeverity: input.defaultSeverity }),
  ...(input.isProvisional === undefined
    ? {}
    : { isProvisional: input.isProvisional }),
  ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
});

export class StandardRepository implements StandardRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public list(query: StandardHistoryQuery): Promise<readonly StandardRecord[]> {
    return this.client.standard.findMany({
      where: { parameterId: query.parameterId },
      select: selection,
      orderBy: [
        { validFrom: 'desc' },
        { piscoTypeId: 'asc' },
        { stageId: 'asc' },
      ],
    });
  }

  public findById(id: string): Promise<StandardRecord | null> {
    return this.client.standard.findUnique({
      where: { id },
      select: selection,
    });
  }

  public findOverlaps(
    input: CreateStandardRequest,
  ): Promise<readonly StandardRecord[]> {
    const start = dateOnly(input.validFrom);
    return this.client.standard.findMany({
      where: {
        parameterId: input.parameterId,
        piscoTypeId: input.piscoTypeId ?? null,
        stageId: input.stageId ?? null,
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

  public findCandidates(
    query: EffectiveStandardQuery,
  ): Promise<readonly StandardRecord[]> {
    const date = dateOnly(query.date);
    return this.client.standard.findMany({
      where: {
        parameterId: query.parameterId,
        isActive: true,
        validFrom: { lte: date },
        AND: [
          { OR: [{ validTo: null }, { validTo: { gte: date } }] },
          {
            OR: [
              { piscoTypeId: null },
              ...(query.piscoTypeId
                ? [{ piscoTypeId: query.piscoTypeId }]
                : []),
            ],
          },
          {
            OR: [
              { stageId: null },
              ...(query.stageId ? [{ stageId: query.stageId }] : []),
            ],
          },
        ],
      },
      select: selection,
      orderBy: { validFrom: 'desc' },
    });
  }

  public async referencesExist(input: CreateStandardRequest): Promise<boolean> {
    const [parameter, piscoType, stage] = await this.client.$transaction([
      this.client.parameter.count({
        where: { id: input.parameterId, isActive: true },
      }),
      this.client.piscoType.count({
        where: { id: input.piscoTypeId ?? '', isActive: true },
      }),
      this.client.processStage.count({
        where: { id: input.stageId ?? '', isActive: true },
      }),
    ]);
    return (
      parameter === 1 &&
      (!input.piscoTypeId || piscoType === 1) &&
      (!input.stageId || stage === 1)
    );
  }

  public resultCount(id: string): Promise<number> {
    return this.client.physChemResult.count({ where: { standardId: id } });
  }

  public create(
    input: CreateStandardRequest,
    actorId: string,
    previousId?: string,
    ipAddress?: string,
  ): Promise<StandardRecord> {
    return this.client.$transaction(async (tx) => {
      if (previousId)
        await tx.standard.update({
          where: { id: previousId },
          data: { validTo: dayBefore(input.validFrom) },
        });
      const record = await tx.standard.create({
        data: createData(input),
        select: selection,
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: AuditAction.CREATE,
          entity: 'Standard',
          entityId: record.id,
          after: auditView(record),
          ipAddress: ipAddress ?? null,
        },
      });
      return record;
    });
  }

  public update(
    id: string,
    input: UpdateStandardRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<StandardRecord> {
    return this.client.$transaction(async (tx) => {
      const before = await tx.standard.findUniqueOrThrow({
        where: { id },
        select: selection,
      });
      const record = await tx.standard.update({
        where: { id },
        data: updateData(input),
        select: selection,
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: AuditAction.UPDATE,
          entity: 'Standard',
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
