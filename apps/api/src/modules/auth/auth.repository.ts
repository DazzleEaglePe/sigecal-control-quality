import { AuditAction } from '../../generated/prisma/enums.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import type {
  AuthRepositoryPort,
  AuthUserRecord,
  NewRefreshToken,
  StoredRefreshToken,
} from './auth.types.js';

const userSelection = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  passwordHash: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  failedAttempts: true,
  lockedUntil: true,
} as const;

export class AuthRepository implements AuthRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.client.user.findUnique({
      where: { email },
      select: userSelection,
    });
  }

  public findUserById(id: string): Promise<AuthUserRecord | null> {
    return this.client.user.findUnique({
      where: { id },
      select: userSelection,
    });
  }

  public findRefreshByHash(hash: string): Promise<StoredRefreshToken | null> {
    return this.client.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: { user: { select: userSelection } },
    });
  }

  public async registerFailedAttempt(
    userId: string,
    attempts: number,
    lockedUntil: Date | null,
  ): Promise<void> {
    await this.client.user.update({
      where: { id: userId },
      data: { failedAttempts: attempts, lockedUntil },
    });
  }

  public async completeLogin(
    token: NewRefreshToken,
    ipAddress?: string,
  ): Promise<void> {
    await this.client.$transaction([
      this.client.user.update({
        where: { id: token.userId },
        data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      }),
      this.client.refreshToken.create({ data: token }),
      this.client.auditLog.create({
        data: {
          userId: token.userId,
          action: AuditAction.LOGIN,
          entity: 'User',
          entityId: token.userId,
          ipAddress: ipAddress ?? null,
        },
      }),
    ]);
  }

  public async rotateRefresh(
    currentId: string,
    next: NewRefreshToken,
  ): Promise<boolean> {
    return this.client.$transaction(async (transaction) => {
      const revoked = await transaction.refreshToken.updateMany({
        where: { id: currentId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (revoked.count !== 1) return false;
      await transaction.refreshToken.create({ data: next });
      return true;
    });
  }

  public async completeLogout(
    userId: string,
    tokenHash?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.client.$transaction([
      this.client.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
          ...(tokenHash ? { tokenHash } : {}),
        },
        data: { revokedAt: new Date() },
      }),
      this.client.auditLog.create({
        data: {
          userId,
          action: AuditAction.LOGOUT,
          entity: 'User',
          entityId: userId,
          ipAddress: ipAddress ?? null,
        },
      }),
    ]);
  }

  public async revokeAllForUser(userId: string): Promise<void> {
    await this.client.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async changePassword(
    userId: string,
    passwordHash: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.client.$transaction([
      this.client.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: false,
          failedAttempts: 0,
          lockedUntil: null,
        },
      }),
      this.client.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.client.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          entity: 'UserPassword',
          entityId: userId,
          before: { mustChangePassword: true },
          after: { mustChangePassword: false },
          ipAddress: ipAddress ?? null,
        },
      }),
    ]);
  }
}
