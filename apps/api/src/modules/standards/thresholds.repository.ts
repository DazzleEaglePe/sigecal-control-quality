import type {
  CreateSensoryThresholdRequest,
  EffectiveSensoryThresholdQuery,
  SensoryThresholdHistoryQuery,
} from '@sigecal/shared';

import type { PrismaClient } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import type {
  ThresholdRecord,
  ThresholdRepositoryPort,
} from './standards.types.js';

const selection = {
  id: true,
  piscoTypeId: true,
  minAverage: true,
  defaultSeverity: true,
  referenceNorm: true,
  validFrom: true,
  validTo: true,
  isActive: true,
  isProvisional: true,
} as const;
const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const dayBefore = (value: string): Date =>
  new Date(dateOnly(value).getTime() - 86_400_000);
const auditView = (record: ThresholdRecord) => ({
  piscoTypeId: record.piscoTypeId,
  minAverage: record.minAverage.toString(),
  defaultSeverity: record.defaultSeverity,
  referenceNorm: record.referenceNorm,
  validFrom: record.validFrom.toISOString().slice(0, 10),
  validTo: record.validTo?.toISOString().slice(0, 10) ?? null,
  isActive: record.isActive,
  isProvisional: record.isProvisional,
});

export class ThresholdRepository implements ThresholdRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public list(
    query: SensoryThresholdHistoryQuery,
  ): Promise<readonly ThresholdRecord[]> {
    return this.client.sensoryThreshold.findMany({
      where: {
        ...(query.piscoTypeId ? { piscoTypeId: query.piscoTypeId } : {}),
        ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      },
      select: selection,
      orderBy: { validFrom: 'desc' },
    });
  }

  public findOverlaps(
    input: CreateSensoryThresholdRequest,
  ): Promise<readonly ThresholdRecord[]> {
    const start = dateOnly(input.validFrom);
    return this.client.sensoryThreshold.findMany({
      where: {
        piscoTypeId: input.piscoTypeId ?? null,
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
    query: EffectiveSensoryThresholdQuery,
  ): Promise<readonly ThresholdRecord[]> {
    const date = dateOnly(query.date);
    return this.client.sensoryThreshold.findMany({
      where: {
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
        ],
      },
      select: selection,
      orderBy: { validFrom: 'desc' },
    });
  }

  public async piscoTypeExists(id: string): Promise<boolean> {
    return (
      (await this.client.piscoType.count({ where: { id, isActive: true } })) ===
      1
    );
  }

  public create(
    input: CreateSensoryThresholdRequest,
    actorId: string,
    previousId?: string,
    ipAddress?: string,
  ): Promise<ThresholdRecord> {
    return this.client.$transaction(async (tx) => {
      if (previousId)
        await tx.sensoryThreshold.update({
          where: { id: previousId },
          data: { validTo: dayBefore(input.validFrom) },
        });
      const record = await tx.sensoryThreshold.create({
        data: {
          piscoTypeId: input.piscoTypeId ?? null,
          minAverage: input.minAverage,
          defaultSeverity: input.defaultSeverity,
          referenceNorm: input.referenceNorm ?? null,
          validFrom: dateOnly(input.validFrom),
          validTo: input.validTo ? dateOnly(input.validTo) : null,
          isProvisional: input.isProvisional,
        },
        select: selection,
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: AuditAction.CREATE,
          entity: 'SensoryThreshold',
          entityId: record.id,
          after: auditView(record),
          ipAddress: ipAddress ?? null,
        },
      });
      return record;
    });
  }
}
