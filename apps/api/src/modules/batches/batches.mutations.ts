import type { CreateBatchRequest, UpdateBatchRequest } from '@sigecal/shared';

import { ConflictError } from '../../errors/app-error.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import {
  batchAuditSelection,
  batchAuditView,
  writeBatchAudit,
} from './batches.audit.js';
import { BatchLifecycleRepository } from './batches.lifecycle.js';
import type { BatchMutationRepositoryPort } from './batches.types.js';

const TERMINAL_STATUSES = ['CERRADO', 'RECHAZADO'] as const;
const MAX_CODE_ATTEMPTS = 3;
const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const updateData = (input: UpdateBatchRequest) => ({
  ...(input.piscoTypeId === undefined
    ? {}
    : { piscoTypeId: input.piscoTypeId }),
  ...(input.startDate === undefined
    ? {}
    : { startDate: dateOnly(input.startDate) }),
  ...(input.volumeLiters === undefined
    ? {}
    : { volumeLiters: input.volumeLiters }),
  ...(input.harvestOrigin === undefined
    ? {}
    : { harvestOrigin: input.harvestOrigin }),
  ...(input.notes === undefined ? {} : { notes: input.notes }),
});
const retryable = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  ['P2002', 'P2034'].includes(error.code);

const nextCode = async (
  tx: Prisma.TransactionClient,
  year: string,
): Promise<string> => {
  const prefix = `LT-${year}-`;
  const latest = await tx.batch.findFirst({
    where: { code: { startsWith: prefix } },
    select: { code: true },
    orderBy: { code: 'desc' },
  });
  const sequence = latest ? Number(latest.code.slice(-4)) + 1 : 1;
  if (sequence > 9_999)
    throw new ConflictError(
      `Se agotó la numeración de lotes para ${year}.`,
      'BATCH_CODE_EXHAUSTED',
    );
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

const createData = (
  input: CreateBatchRequest,
  code: string,
  firstStageId: string,
  actorId: string,
) => ({
  code,
  piscoTypeId: input.piscoTypeId,
  currentStageId: firstStageId,
  startDate: dateOnly(input.startDate),
  volumeLiters: input.volumeLiters,
  harvestOrigin: input.harvestOrigin ?? null,
  notes: input.notes ?? null,
  createdById: actorId,
  dataOrigin: 'REAL' as const,
  varieties: {
    create: input.varieties.map((item) => ({
      varietyId: item.varietyId,
      percentage: item.percentage ?? null,
    })),
  },
  stages: {
    create: {
      stageId: firstStageId,
      startedAt: new Date(),
      responsibleId: actorId,
    },
  },
});

const replaceVarieties = async (
  tx: Prisma.TransactionClient,
  id: string,
  varieties: NonNullable<UpdateBatchRequest['varieties']>,
): Promise<void> => {
  await tx.batchGrapeVariety.deleteMany({ where: { batchId: id } });
  await tx.batchGrapeVariety.createMany({
    data: varieties.map((item) => ({
      batchId: id,
      varietyId: item.varietyId,
      percentage: item.percentage ?? null,
    })),
  });
};

export class BatchMutationRepository
  extends BatchLifecycleRepository
  implements BatchMutationRepositoryPort
{
  public async create(
    input: CreateBatchRequest,
    firstStageId: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<string> {
    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt += 1) {
      try {
        return await this.createOnce(input, firstStageId, actorId, ipAddress);
      } catch (error) {
        if (!retryable(error) || attempt === MAX_CODE_ATTEMPTS) throw error;
      }
    }
    throw new ConflictError('No fue posible generar el código del lote.');
  }

  private createOnce(
    input: CreateBatchRequest,
    firstStageId: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<string> {
    return this.client.$transaction(
      async (tx) => {
        const code = await nextCode(tx, input.startDate.slice(0, 4));
        const record = await tx.batch.create({
          data: createData(input, code, firstStageId, actorId),
          select: { id: true, ...batchAuditSelection },
        });
        await writeBatchAudit(tx, {
          userId: actorId,
          action: AuditAction.CREATE,
          entityId: record.id,
          after: batchAuditView(record),
          ipAddress,
        });
        return record.id;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  public update(
    id: string,
    input: UpdateBatchRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.client.$transaction(async (tx) => {
      const before = await tx.batch.findUniqueOrThrow({
        where: { id },
        select: {
          ...batchAuditSelection,
          currentStage: { select: { sequence: true } },
          _count: { select: { inspections: true } },
        },
      });
      this.ensureIdentityEditable(input, before);
      const updated = await tx.batch.updateMany({
        where: { id, status: { notIn: [...TERMINAL_STATUSES] } },
        data: updateData(input),
      });
      if (updated.count !== 1) this.terminalConflict();
      if (input.varieties) await replaceVarieties(tx, id, input.varieties);
      const after = await tx.batch.findUniqueOrThrow({
        where: { id },
        select: batchAuditSelection,
      });
      await writeBatchAudit(tx, {
        userId: actorId,
        action: AuditAction.UPDATE,
        entityId: id,
        before: batchAuditView(before),
        after: batchAuditView(after),
        ipAddress,
      });
    });
  }

  private ensureIdentityEditable(
    input: UpdateBatchRequest,
    batch: {
      currentStage: { sequence: number };
      _count: { inspections: number };
    },
  ): void {
    const changesIdentity =
      input.piscoTypeId !== undefined ||
      input.varieties !== undefined ||
      input.startDate !== undefined;
    if (
      changesIdentity &&
      (batch.currentStage.sequence > 1 || batch._count.inspections > 0)
    )
      throw new ConflictError(
        'El tipo, las variedades y la fecha inicial ya están congelados.',
        'BATCH_IDENTITY_FROZEN',
      );
  }
}
