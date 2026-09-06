import type { Prisma } from '../../generated/prisma/client.js';
import { ensureNCEditable } from './nonconformities.rules.js';
import { NotFoundError } from '../../errors/app-error.js';

/** Todas las escrituras de acciones y el cierre toman primero el mismo bloqueo. */
export const lockOpenNonConformity = async (
  tx: Prisma.TransactionClient,
  id: string,
) => {
  const rows = await tx.$queryRaw<{ status: string }[]>`
    SELECT "status" FROM "NonConformity" WHERE "id" = ${id}::uuid FOR UPDATE
  `;
  const record = rows[0];
  if (!record) throw new NotFoundError('La no conformidad no existe.');
  ensureNCEditable(record.status);
  return record.status;
};

export const lockActionParent = async (
  tx: Prisma.TransactionClient,
  actionId: string,
) => {
  const action = await tx.correctiveAction.findUniqueOrThrow({
    where: { id: actionId },
    select: { nonConformityId: true },
  });
  await lockOpenNonConformity(tx, action.nonConformityId);
};
