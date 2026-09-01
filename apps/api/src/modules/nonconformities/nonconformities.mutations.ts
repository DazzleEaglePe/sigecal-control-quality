import type {
  CloseNonConformityRequest,
  CreateActionRequest,
  CreateNonConformityRequest,
  DataOrigin,
  UpdateActionRequest,
  UpdateNonConformityRequest,
  VerifyActionRequest,
} from '@sigecal/shared';

import { ConflictError } from '../../errors/app-error.js';
import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import * as actionMutations from './nonconformities.action-mutations.js';
import {
  nonConformityAuditSelection,
  nonConformityAuditView,
  writeNonConformityAudit,
} from './nonconformities.audit.js';
import {
  auditCreatedNC,
  invalidNCTransition,
  nextNonConformityCode,
  retryableNCWrite,
} from './nonconformities.persistence.js';
import type { NonConformityMutationRepositoryPort } from './nonconformities.types.js';

const MAX_CODE_ATTEMPTS = 3;
type NCOpenStatus =
  'ABIERTA' | 'EN_ANALISIS' | 'EN_TRATAMIENTO' | 'EN_VERIFICACION';

export class NonConformityMutationRepository implements NonConformityMutationRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public async create(
    input: CreateNonConformityRequest,
    dataOrigin: DataOrigin,
    actorId: string,
    ipAddress?: string,
  ): Promise<string> {
    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt += 1) {
      try {
        return await this.createOnce(input, dataOrigin, actorId, ipAddress);
      } catch (error) {
        if (!retryableNCWrite(error) || attempt === MAX_CODE_ATTEMPTS)
          throw error;
      }
    }
    throw new ConflictError(
      'No fue posible generar el código de la no conformidad.',
    );
  }

  private createOnce(
    input: CreateNonConformityRequest,
    dataOrigin: DataOrigin,
    actorId: string,
    ipAddress?: string,
  ): Promise<string> {
    return this.client.$transaction(
      async (tx) => {
        const now = new Date();
        const code = await nextNonConformityCode(tx, now);
        const record = await tx.nonConformity.create({
          data: {
            code,
            batchId: input.batchId,
            stageId: input.stageId ?? null,
            origin: 'MANUAL',
            severity: input.severity,
            description: input.description,
            rootCause: input.rootCause ?? null,
            detectedAt: now,
            detectedById: actorId,
            assignedToId: input.assignedToId ?? null,
            assignedAreaId: input.assignedAreaId ?? null,
            dataOrigin,
          },
          select: { id: true },
        });
        await auditCreatedNC(tx, record.id, actorId, ipAddress);
        return record.id;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  public update(
    id: string,
    input: UpdateNonConformityRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.client.$transaction(async (tx) => {
      const before = await tx.nonConformity.findUniqueOrThrow({
        where: { id },
        select: nonConformityAuditSelection,
      });
      const changed = await tx.nonConformity.updateMany({
        where: { id, status: { notIn: ['CERRADA', 'ANULADA'] } },
        data: {
          ...(input.description === undefined
            ? {}
            : { description: input.description }),
          ...(input.severity === undefined ? {} : { severity: input.severity }),
          ...(input.rootCause === undefined
            ? {}
            : { rootCause: input.rootCause }),
          ...(input.assignedToId === undefined
            ? {}
            : { assignedToId: input.assignedToId }),
          ...(input.assignedAreaId === undefined
            ? {}
            : { assignedAreaId: input.assignedAreaId }),
        },
      });
      if (changed.count !== 1) invalidNCTransition();
      await this.auditNC(
        tx,
        id,
        before,
        actorId,
        AuditAction.UPDATE,
        ipAddress,
      );
    });
  }

  public startAttention(
    id: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.transitionNC(
      id,
      ['ABIERTA', 'EN_ANALISIS'],
      { status: 'EN_TRATAMIENTO', attentionStartedAt: new Date() },
      actorId,
      ipAddress,
    );
  }

  public close(
    id: string,
    input: CloseNonConformityRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.transitionNC(
      id,
      ['ABIERTA', 'EN_ANALISIS', 'EN_TRATAMIENTO', 'EN_VERIFICACION'],
      {
        status: 'CERRADA',
        closedAt: new Date(),
        closedById: actorId,
        closeComment: input.closeComment ?? null,
      },
      actorId,
      ipAddress,
    );
  }

  private transitionNC(
    id: string,
    allowed: readonly NCOpenStatus[],
    data: Prisma.NonConformityUncheckedUpdateManyInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.client.$transaction(async (tx) => {
      const before = await tx.nonConformity.findUniqueOrThrow({
        where: { id },
        select: nonConformityAuditSelection,
      });
      const changed = await tx.nonConformity.updateMany({
        where: { id, status: { in: [...allowed] } },
        data,
      });
      if (changed.count !== 1) invalidNCTransition();
      await this.auditNC(
        tx,
        id,
        before,
        actorId,
        AuditAction.STATE_CHANGE,
        ipAddress,
      );
    });
  }

  private async auditNC(
    tx: Prisma.TransactionClient,
    id: string,
    before: Prisma.NonConformityGetPayload<{
      select: typeof nonConformityAuditSelection;
    }>,
    actorId: string,
    action: AuditAction,
    ipAddress?: string,
  ): Promise<void> {
    const after = await tx.nonConformity.findUniqueOrThrow({
      where: { id },
      select: nonConformityAuditSelection,
    });
    await writeNonConformityAudit(tx, {
      userId: actorId,
      action,
      entity: 'NonConformity',
      entityId: id,
      before: nonConformityAuditView(before),
      after: nonConformityAuditView(after),
      ipAddress,
    });
  }

  public createAction(
    nonConformityId: string,
    input: CreateActionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<string> {
    return actionMutations.createAction(
      this.client,
      nonConformityId,
      input,
      actorId,
      ipAddress,
    );
  }

  public updateAction(
    actionId: string,
    input: UpdateActionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return actionMutations.updateAction(
      this.client,
      actionId,
      input,
      actorId,
      ipAddress,
    );
  }

  public executeAction(
    actionId: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return actionMutations.executeAction(
      this.client,
      actionId,
      actorId,
      ipAddress,
    );
  }

  public verifyAction(
    actionId: string,
    input: VerifyActionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return actionMutations.verifyAction(
      this.client,
      actionId,
      input,
      actorId,
      ipAddress,
    );
  }
}
