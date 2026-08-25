import type { Prisma } from '../../generated/prisma/client.js';
import type { AuditAction } from '../../generated/prisma/enums.js';

export interface BatchAuditInput {
  readonly userId: string;
  readonly action: AuditAction;
  readonly entityId: string;
  readonly before?: Prisma.InputJsonValue;
  readonly after?: Prisma.InputJsonValue;
  readonly ipAddress?: string | undefined;
}

export const writeBatchAudit = (
  tx: Prisma.TransactionClient,
  input: BatchAuditInput,
): Promise<unknown> =>
  tx.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: 'Batch',
      entityId: input.entityId,
      ...(input.before === undefined ? {} : { before: input.before }),
      ...(input.after === undefined ? {} : { after: input.after }),
      ipAddress: input.ipAddress ?? null,
    },
  });

export const batchAuditSelection = {
  code: true,
  piscoTypeId: true,
  currentStageId: true,
  status: true,
  startDate: true,
  volumeLiters: true,
  harvestOrigin: true,
  notes: true,
} as const;

export const batchAuditView = (record: {
  code: string;
  piscoTypeId: string;
  currentStageId: string;
  status: string;
  startDate: Date;
  volumeLiters: Prisma.Decimal;
  harvestOrigin: string | null;
  notes: string | null;
}) => ({
  ...record,
  startDate: record.startDate.toISOString().slice(0, 10),
  volumeLiters: record.volumeLiters.toString(),
});
