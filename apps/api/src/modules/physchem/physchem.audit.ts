import type { Prisma } from '../../generated/prisma/client.js';
import type { AuditAction } from '../../generated/prisma/enums.js';

export const resultAuditSelection = {
  inspectionId: true,
  parameterId: true,
  standardId: true,
  value: true,
  status: true,
  equipmentId: true,
  calibrationRef: true,
  recordedById: true,
  recordedAt: true,
  dataOrigin: true,
  annulledById: true,
  annulledAt: true,
  annulReason: true,
  replacesId: true,
} as const;

interface ResultAuditRecord {
  readonly inspectionId: string;
  readonly parameterId: string;
  readonly standardId: string;
  readonly value: Prisma.Decimal;
  readonly status: string;
  readonly equipmentId: string;
  readonly calibrationRef: string | null;
  readonly recordedById: string;
  readonly recordedAt: Date;
  readonly dataOrigin: string;
  readonly annulledById: string | null;
  readonly annulledAt: Date | null;
  readonly annulReason: string | null;
  readonly replacesId: string | null;
}

export const resultAuditView = (record: ResultAuditRecord) => ({
  ...record,
  value: record.value.toString(),
  recordedAt: record.recordedAt.toISOString(),
  annulledAt: record.annulledAt?.toISOString() ?? null,
});

export const writeResultAudit = (
  tx: Prisma.TransactionClient,
  input: {
    readonly userId: string;
    readonly action: AuditAction;
    readonly entityId: string;
    readonly before?: Prisma.InputJsonValue;
    readonly after?: Prisma.InputJsonValue;
    readonly ipAddress?: string | undefined;
  },
): Promise<unknown> =>
  tx.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: 'PhysChemResult',
      entityId: input.entityId,
      ...(input.before === undefined ? {} : { before: input.before }),
      ...(input.after === undefined ? {} : { after: input.after }),
      ipAddress: input.ipAddress ?? null,
    },
  });
