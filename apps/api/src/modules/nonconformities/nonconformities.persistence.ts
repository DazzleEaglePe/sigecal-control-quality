import { ConflictError } from '../../errors/app-error.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import { nextNonConformityCode } from '../physchem/physchem.persistence.js';
import {
  actionAuditSelection,
  actionAuditView,
  nonConformityAuditSelection,
  nonConformityAuditView,
  writeNonConformityAudit,
} from './nonconformities.audit.js';

export { nextNonConformityCode };

export const retryableNCWrite = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  ['P2002', 'P2034'].includes(error.code);

export const invalidNCTransition = (): never => {
  throw new ConflictError(
    'La transición de la no conformidad no está permitida.',
    'INVALID_NC_TRANSITION',
  );
};

export const invalidActionTransition = (): never => {
  throw new ConflictError(
    'La transición de la acción no está permitida.',
    'INVALID_ACTION_TRANSITION',
  );
};

export const auditCreatedNC = async (
  tx: Prisma.TransactionClient,
  id: string,
  actorId: string,
  ipAddress?: string,
): Promise<void> => {
  const after = await tx.nonConformity.findUniqueOrThrow({
    where: { id },
    select: nonConformityAuditSelection,
  });
  await writeNonConformityAudit(tx, {
    userId: actorId,
    action: AuditAction.CREATE,
    entity: 'NonConformity',
    entityId: id,
    after: nonConformityAuditView(after),
    ipAddress,
  });
};

export const auditCreatedAction = async (
  tx: Prisma.TransactionClient,
  id: string,
  actorId: string,
  ipAddress?: string,
): Promise<void> => {
  const after = await tx.correctiveAction.findUniqueOrThrow({
    where: { id },
    select: actionAuditSelection,
  });
  await writeNonConformityAudit(tx, {
    userId: actorId,
    action: AuditAction.CREATE,
    entity: 'CorrectiveAction',
    entityId: id,
    after: actionAuditView(after),
    ipAddress,
  });
};
