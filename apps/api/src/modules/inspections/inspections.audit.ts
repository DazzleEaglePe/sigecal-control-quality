import type { Prisma } from '../../generated/prisma/client.js';
import type { AuditAction } from '../../generated/prisma/enums.js';

export const inspectionAuditSelection = {
  code: true,
  batchId: true,
  stageId: true,
  type: true,
  status: true,
  scheduledDate: true,
  executedAt: true,
  responsibleId: true,
  equipmentId: true,
  rescheduledFromId: true,
  changeReason: true,
  notes: true,
  dataOrigin: true,
} as const;

interface AuditRecord {
  readonly code: string;
  readonly batchId: string;
  readonly stageId: string;
  readonly type: string;
  readonly status: string;
  readonly scheduledDate: Date;
  readonly executedAt: Date | null;
  readonly responsibleId: string;
  readonly equipmentId: string | null;
  readonly rescheduledFromId: string | null;
  readonly changeReason: string | null;
  readonly notes: string | null;
  readonly dataOrigin: string;
}

export const inspectionAuditView = (record: AuditRecord) => ({
  ...record,
  scheduledDate: record.scheduledDate.toISOString(),
  executedAt: record.executedAt?.toISOString() ?? null,
});

interface AuditInput {
  readonly userId: string;
  readonly action: AuditAction;
  readonly entityId: string;
  readonly before?: Prisma.InputJsonValue;
  readonly after?: Prisma.InputJsonValue;
  readonly ipAddress?: string | undefined;
}

export const writeInspectionAudit = (
  tx: Prisma.TransactionClient,
  input: AuditInput,
): Promise<unknown> =>
  tx.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: 'Inspection',
      entityId: input.entityId,
      ...(input.before === undefined ? {} : { before: input.before }),
      ...(input.after === undefined ? {} : { after: input.after }),
      ipAddress: input.ipAddress ?? null,
    },
  });
