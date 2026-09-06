import type { Prisma } from '../../generated/prisma/client.js';

/** El llamador bloquea/actualiza primero User para serializar cambios de acceso. */
export const revokeAccountCredentials = async (
  tx: Prisma.TransactionClient,
  userId: string,
) => {
  const now = new Date();
  await tx.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: now },
  });
  await tx.accountToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: now },
  });
};

export const lockAccount = async (
  tx: Prisma.TransactionClient,
  userId: string,
) => {
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId}::uuid FOR UPDATE`;
};
