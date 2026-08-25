import type {
  AdvanceBatchStageRequest,
  RejectBatchRequest,
} from '@sigecal/shared';

import { ConflictError } from '../../errors/app-error.js';
import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import { writeBatchAudit } from './batches.audit.js';

const TERMINAL_STATUSES = ['CERRADO', 'RECHAZADO'] as const;
const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const limaDate = (now: Date): Date =>
  dateOnly(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now),
  );

const closeCurrentStage = async (
  tx: Prisma.TransactionClient,
  batchId: string,
  stageId: string,
  now: Date,
): Promise<void> => {
  const closed = await tx.batchStage.updateMany({
    where: { batchId, stageId, finishedAt: null },
    data: { finishedAt: now },
  });
  if (closed.count !== 1)
    throw new ConflictError(
      'La etapa actual ya fue cerrada.',
      'BATCH_STAGE_ALREADY_CLOSED',
    );
};

const openNextStage = (
  tx: Prisma.TransactionClient,
  batchId: string,
  stageId: string,
  input: AdvanceBatchStageRequest,
  now: Date,
) =>
  tx.batchStage.create({
    data: {
      batchId,
      stageId,
      startedAt: now,
      responsibleId: input.responsibleId,
      observations: input.observations ?? null,
    },
  });

export abstract class BatchLifecycleRepository {
  public constructor(protected readonly client: PrismaClient) {}

  public advance(
    id: string,
    currentStageId: string,
    nextStageId: string,
    input: AdvanceBatchStageRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.client.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.batch.updateMany({
        where: {
          id,
          currentStageId,
          status: { notIn: [...TERMINAL_STATUSES] },
        },
        data: { currentStageId: nextStageId },
      });
      if (updated.count !== 1) this.terminalConflict();
      await closeCurrentStage(tx, id, currentStageId, now);
      await openNextStage(tx, id, nextStageId, input, now);
      await writeBatchAudit(tx, {
        userId: actorId,
        action: AuditAction.STATE_CHANGE,
        entityId: id,
        before: { currentStageId },
        after: { currentStageId: nextStageId },
        ipAddress,
      });
    });
  }

  public close(id: string, actorId: string, ipAddress?: string): Promise<void> {
    return this.client.$transaction(async (tx) => {
      const open = await tx.nonConformity.count({
        where: { batchId: id, status: { notIn: ['CERRADA', 'ANULADA'] } },
      });
      if (open > 0)
        throw new ConflictError(
          'El lote tiene no conformidades abiertas.',
          'OPEN_NONCONFORMITIES',
        );
      const updated = await tx.batch.updateMany({
        where: { id, status: { notIn: [...TERMINAL_STATUSES] } },
        data: { status: 'CERRADO', closeDate: limaDate(new Date()) },
      });
      if (updated.count !== 1) this.terminalConflict();
      await writeBatchAudit(tx, {
        userId: actorId,
        action: AuditAction.STATE_CHANGE,
        entityId: id,
        after: { status: 'CERRADO' },
        ipAddress,
      });
    });
  }

  public reject(
    id: string,
    input: RejectBatchRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.client.$transaction(async (tx) => {
      const updated = await tx.batch.updateMany({
        where: { id, status: { notIn: [...TERMINAL_STATUSES] } },
        data: {
          status: 'RECHAZADO',
          rejectedAt: new Date(),
          rejectedById: actorId,
          rejectionReason: input.reason,
        },
      });
      if (updated.count !== 1) this.terminalConflict();
      await writeBatchAudit(tx, {
        userId: actorId,
        action: AuditAction.STATE_CHANGE,
        entityId: id,
        after: { status: 'RECHAZADO', reason: input.reason },
        ipAddress,
      });
    });
  }

  protected terminalConflict(): never {
    throw new ConflictError(
      'El lote está cerrado, rechazado o cambió simultáneamente.',
      'BATCH_NOT_MUTABLE',
    );
  }
}
