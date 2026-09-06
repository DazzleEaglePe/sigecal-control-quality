import type {
  CreateActionRequest,
  UpdateActionRequest,
  VerifyActionRequest,
} from '@sigecal/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import {
  lockActionParent,
  lockOpenNonConformity,
} from './nonconformities.lock.js';
import {
  actionAuditSelection,
  actionAuditView,
  writeNonConformityAudit,
} from './nonconformities.audit.js';
import {
  auditCreatedAction,
  invalidActionTransition,
} from './nonconformities.persistence.js';

const auditAction = async (
  tx: Prisma.TransactionClient,
  actionId: string,
  before: Prisma.CorrectiveActionGetPayload<{
    select: typeof actionAuditSelection;
  }>,
  actorId: string,
  action: AuditAction,
  ipAddress?: string,
): Promise<void> => {
  const after = await tx.correctiveAction.findUniqueOrThrow({
    where: { id: actionId },
    select: actionAuditSelection,
  });
  await writeNonConformityAudit(tx, {
    userId: actorId,
    action,
    entity: 'CorrectiveAction',
    entityId: actionId,
    before: actionAuditView(before),
    after: actionAuditView(after),
    ipAddress,
  });
};

export const createAction = (
  client: PrismaClient,
  nonConformityId: string,
  input: CreateActionRequest,
  actorId: string,
  ipAddress?: string,
): Promise<string> =>
  client.$transaction(async (tx) => {
    await lockOpenNonConformity(tx, nonConformityId);
    const record = await tx.correctiveAction.create({
      data: {
        nonConformityId,
        type: input.type,
        description: input.description,
        responsibleId: input.responsibleId,
        committedDate: new Date(input.committedDate),
        replacesActionId: input.replacesActionId ?? null,
      },
      select: { id: true },
    });
    await auditCreatedAction(tx, record.id, actorId, ipAddress);
    return record.id;
  });

export const updateAction = (
  client: PrismaClient,
  actionId: string,
  input: UpdateActionRequest,
  actorId: string,
  ipAddress?: string,
): Promise<void> =>
  client.$transaction(async (tx) => {
    await lockActionParent(tx, actionId);
    const before = await tx.correctiveAction.findUniqueOrThrow({
      where: { id: actionId },
      select: actionAuditSelection,
    });
    const changed = await tx.correctiveAction.updateMany({
      where: { id: actionId, status: 'PENDIENTE' },
      data: {
        ...(input.type === undefined ? {} : { type: input.type }),
        ...(input.description === undefined
          ? {}
          : { description: input.description }),
        ...(input.responsibleId === undefined
          ? {}
          : { responsibleId: input.responsibleId }),
        ...(input.committedDate === undefined
          ? {}
          : { committedDate: new Date(input.committedDate) }),
      },
    });
    if (changed.count !== 1) invalidActionTransition();
    await auditAction(
      tx,
      actionId,
      before,
      actorId,
      AuditAction.UPDATE,
      ipAddress,
    );
  });

/** Cuando ya no queda ninguna acción pendiente o en ejecución, la NC pasa a
 * EN_VERIFICACION para reflejar que el trabajo de campo terminó y falta el
 * visto bueno de calidad. No es una regla RF explícita; se infiere del
 * diagrama de estados y del ejemplo de docs/06-API-CONTRACT.md §10. */
const advanceAfterExecution = async (
  tx: Prisma.TransactionClient,
  nonConformityId: string,
): Promise<void> => {
  const nc = await tx.nonConformity.findUniqueOrThrow({
    where: { id: nonConformityId },
    select: { status: true },
  });
  if (nc.status !== 'EN_TRATAMIENTO') return;
  const pending = await tx.correctiveAction.count({
    where: { nonConformityId, status: { in: ['PENDIENTE', 'EN_EJECUCION'] } },
  });
  if (pending > 0) return;
  await tx.nonConformity.updateMany({
    where: { id: nonConformityId, status: 'EN_TRATAMIENTO' },
    data: { status: 'EN_VERIFICACION' },
  });
};

export const executeAction = (
  client: PrismaClient,
  actionId: string,
  actorId: string,
  ipAddress?: string,
): Promise<void> =>
  client.$transaction(async (tx) => {
    await lockActionParent(tx, actionId);
    const before = await tx.correctiveAction.findUniqueOrThrow({
      where: { id: actionId },
      select: { ...actionAuditSelection, nonConformityId: true },
    });
    const changed = await tx.correctiveAction.updateMany({
      where: { id: actionId, status: { in: ['PENDIENTE', 'EN_EJECUCION'] } },
      data: { status: 'EJECUTADA', executedAt: new Date() },
    });
    if (changed.count !== 1) invalidActionTransition();
    await auditAction(
      tx,
      actionId,
      before,
      actorId,
      AuditAction.STATE_CHANGE,
      ipAddress,
    );
    await advanceAfterExecution(tx, before.nonConformityId);
  });

export const verifyAction = (
  client: PrismaClient,
  actionId: string,
  input: VerifyActionRequest,
  actorId: string,
  ipAddress?: string,
): Promise<void> =>
  client.$transaction(async (tx) => {
    await lockActionParent(tx, actionId);
    const before = await tx.correctiveAction.findUniqueOrThrow({
      where: { id: actionId },
      select: { ...actionAuditSelection, nonConformityId: true },
    });
    const changed = await tx.correctiveAction.updateMany({
      where: { id: actionId, status: 'EJECUTADA' },
      data: {
        status: input.isEffective ? 'VERIFICADA' : 'NO_EFICAZ',
        isEffective: input.isEffective,
        verifiedById: actorId,
        verifiedAt: new Date(),
        verificationComment: input.verificationComment,
      },
    });
    if (changed.count !== 1) invalidActionTransition();
    await auditAction(
      tx,
      actionId,
      before,
      actorId,
      AuditAction.STATE_CHANGE,
      ipAddress,
    );
    if (!input.isEffective)
      // RF-M7: una acción no eficaz regresa la NC a EN_TRATAMIENTO.
      await tx.nonConformity.updateMany({
        where: { id: before.nonConformityId },
        data: { status: 'EN_TRATAMIENTO' },
      });
  });
