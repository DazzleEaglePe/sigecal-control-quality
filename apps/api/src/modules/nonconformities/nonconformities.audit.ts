import type { Prisma } from '../../generated/prisma/client.js';
import type { AuditAction } from '../../generated/prisma/enums.js';

export const nonConformityAuditSelection = {
  code: true,
  batchId: true,
  stageId: true,
  status: true,
  severity: true,
  description: true,
  rootCause: true,
  assignedToId: true,
  assignedAreaId: true,
  attentionStartedAt: true,
  closedAt: true,
  closeComment: true,
  dataOrigin: true,
} as const;

interface NonConformityAuditRecord {
  readonly code: string;
  readonly batchId: string;
  readonly stageId: string | null;
  readonly status: string;
  readonly severity: string;
  readonly description: string;
  readonly rootCause: string | null;
  readonly assignedToId: string | null;
  readonly assignedAreaId: string | null;
  readonly attentionStartedAt: Date | null;
  readonly closedAt: Date | null;
  readonly closeComment: string | null;
  readonly dataOrigin: string;
}

export const nonConformityAuditView = (record: NonConformityAuditRecord) => ({
  ...record,
  attentionStartedAt: record.attentionStartedAt?.toISOString() ?? null,
  closedAt: record.closedAt?.toISOString() ?? null,
});

export const actionAuditSelection = {
  type: true,
  description: true,
  responsibleId: true,
  committedDate: true,
  executedAt: true,
  status: true,
  isEffective: true,
  verifiedById: true,
  verifiedAt: true,
  verificationComment: true,
} as const;

interface ActionAuditRecord {
  readonly type: string;
  readonly description: string;
  readonly responsibleId: string;
  readonly committedDate: Date;
  readonly executedAt: Date | null;
  readonly status: string;
  readonly isEffective: boolean | null;
  readonly verifiedById: string | null;
  readonly verifiedAt: Date | null;
  readonly verificationComment: string | null;
}

export const actionAuditView = (record: ActionAuditRecord) => ({
  ...record,
  committedDate: record.committedDate.toISOString().slice(0, 10),
  executedAt: record.executedAt?.toISOString() ?? null,
  verifiedAt: record.verifiedAt?.toISOString() ?? null,
});

interface AuditInput {
  readonly userId: string;
  readonly action: AuditAction;
  readonly entity: 'NonConformity' | 'CorrectiveAction';
  readonly entityId: string;
  readonly before?: Prisma.InputJsonValue;
  readonly after?: Prisma.InputJsonValue;
  readonly ipAddress?: string | undefined;
}

export const writeNonConformityAudit = (
  tx: Prisma.TransactionClient,
  input: AuditInput,
): Promise<unknown> =>
  tx.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      ...(input.before === undefined ? {} : { before: input.before }),
      ...(input.after === undefined ? {} : { after: input.after }),
      ipAddress: input.ipAddress ?? null,
    },
  });
