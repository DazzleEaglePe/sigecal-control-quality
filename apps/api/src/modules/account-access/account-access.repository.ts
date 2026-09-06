import { AuditAction, AccountTokenType } from '../../generated/prisma/enums.js';
import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import {
  lockAccount,
  revokeAccountCredentials,
} from '../auth/auth.revocation.js';
import { ConflictError } from '../../errors/app-error.js';
import type {
  AccountAccessRepositoryPort,
  AccountTarget,
  AccountTokenKind,
} from './account-access.types.js';

const targetSelection = {
  id: true,
  firstName: true,
  email: true,
  isActive: true,
  emailVerifiedAt: true,
} as const;

interface ConsumableAccountToken {
  readonly id: string;
  readonly userId: string;
  readonly type: AccountTokenType;
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
  readonly user: { readonly isActive: boolean };
}

const ensureCurrentTarget = (
  user: AccountTarget,
  expectedEmail?: string,
): void => {
  if (
    !user.isActive ||
    (expectedEmail !== undefined && user.email !== expectedEmail)
  )
    throw new ConflictError(
      'La cuenta cambió. Reintente la solicitud.',
      'ACCOUNT_CHANGED',
    );
};

export class AccountAccessRepository implements AccountAccessRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public findActiveByEmail(email: string): Promise<AccountTarget | null> {
    return this.client.user.findFirst({
      where: { email, isActive: true },
      select: targetSelection,
    });
  }

  public findActiveById(id: string): Promise<AccountTarget | null> {
    return this.client.user.findFirst({
      where: { id, isActive: true },
      select: targetSelection,
    });
  }

  public async issueToken(
    userId: string,
    type: AccountTokenKind,
    tokenHash: string,
    expiresAt: Date,
    actorId?: string,
    ipAddress?: string,
    expectedEmail?: string,
  ): Promise<void> {
    const kind = AccountTokenType[type];
    await this.client.$transaction(async (tx) => {
      await lockAccount(tx, userId);
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: targetSelection,
      });
      ensureCurrentTarget(user, expectedEmail);
      await tx.accountToken.updateMany({
        where: { userId, type: kind, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.accountToken.create({
        data: { userId, type: kind, tokenHash, expiresAt },
      });
      await tx.auditLog.create({
        data: {
          userId: actorId ?? userId,
          action: AuditAction.CREATE,
          entity: 'AccountToken',
          entityId: userId,
          ipAddress: ipAddress ?? null,
          after: { type, expiresAt: expiresAt.toISOString() },
        },
      });
    });
  }

  public async consumeToken(
    tokenHash: string,
    type: AccountTokenKind,
    passwordHash: string,
  ): Promise<boolean> {
    return this.client.$transaction(async (tx) => {
      const target = await tx.accountToken.findUnique({
        where: { tokenHash },
        select: { userId: true },
      });
      if (!target) return false;
      await lockAccount(tx, target.userId);
      const now = new Date();
      const token = await tx.accountToken.findUnique({
        where: { tokenHash },
        include: { user: { select: targetSelection } },
      });
      if (!this.canConsume(token, type, now)) return false;
      const consumed = await tx.accountToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) return false;
      await this.completeAccess(tx, token.userId, type, passwordHash, now);
      return true;
    });
  }

  private canConsume(
    token: ConsumableAccountToken | null,
    type: AccountTokenKind,
    now: Date,
  ): token is NonNullable<typeof token> {
    return Boolean(
      token?.user.isActive &&
      token.type === AccountTokenType[type] &&
      token.usedAt === null &&
      token.expiresAt > now,
    );
  }

  private async completeAccess(
    tx: Prisma.TransactionClient,
    userId: string,
    type: AccountTokenKind,
    passwordHash: string,
    now: Date,
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
        mustChangePassword: false,
        failedAttempts: 0,
        lockedUntil: null,
        ...(type === 'ACTIVATION' ? { emailVerifiedAt: now } : {}),
      },
    });
    await revokeAccountCredentials(tx, userId);
    await tx.auditLog.create({
      data: {
        userId,
        action: AuditAction.UPDATE,
        entity: type === 'ACTIVATION' ? 'UserActivation' : 'UserPassword',
        entityId: userId,
        after: { completed: true },
      },
    });
  }
}
