import type { Role } from '@sigecal/shared';

import type {
  AuthRepositoryPort,
  AuthUserRecord,
  NewRefreshToken,
  PasswordPort,
  StoredRefreshToken,
  TokenPort,
} from './auth.types.js';

const TEST_USER_ID = '11111111-1111-4111-a111-111111111111';

export const testUser = (
  overrides: Partial<AuthUserRecord> = {},
): AuthUserRecord => ({
  id: TEST_USER_ID,
  firstName: 'Jefatura',
  lastName: 'Calidad',
  email: 'jefe@sigecal.pe',
  passwordHash: 'Correcta1',
  role: 'JEFE_CALIDAD',
  isActive: true,
  mustChangePassword: true,
  failedAttempts: 0,
  lockedUntil: null,
  ...overrides,
});

export class MemoryAuthRepository implements AuthRepositoryPort {
  public user: AuthUserRecord | null = testUser();
  public readonly refreshTokens = new Map<string, StoredRefreshToken>();
  public revokeAllCount = 0;
  public changedPasswordHash: string | undefined;

  public async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return Promise.resolve(this.user?.email === email ? this.user : null);
  }

  public findUserById(id: string): Promise<AuthUserRecord | null> {
    return Promise.resolve(this.user?.id === id ? this.user : null);
  }

  public findRefreshByHash(hash: string): Promise<StoredRefreshToken | null> {
    return Promise.resolve(this.refreshTokens.get(hash) ?? null);
  }

  public registerFailedAttempt(
    _userId: string,
    attempts: number,
    lockedUntil: Date | null,
  ): Promise<void> {
    if (this.user)
      this.user = { ...this.user, failedAttempts: attempts, lockedUntil };
    return Promise.resolve();
  }

  public completeLogin(token: NewRefreshToken): Promise<void> {
    this.storeToken(token);
    if (this.user) {
      this.user = { ...this.user, failedAttempts: 0, lockedUntil: null };
    }
    return Promise.resolve();
  }

  public rotateRefresh(
    currentId: string,
    next: NewRefreshToken,
  ): Promise<boolean> {
    const current = [...this.refreshTokens.values()].find(
      (token) => token.id === currentId,
    );
    if (!current || current.revokedAt) return Promise.resolve(false);
    this.refreshTokens.set(current.tokenHash, {
      ...current,
      revokedAt: new Date(),
    });
    this.storeToken(next);
    return Promise.resolve(true);
  }

  public completeLogout(_userId: string, tokenHash?: string): Promise<void> {
    void _userId;
    for (const [hash, token] of this.refreshTokens) {
      if (!tokenHash || tokenHash === hash) {
        this.refreshTokens.set(hash, { ...token, revokedAt: new Date() });
      }
    }
    return Promise.resolve();
  }

  public revokeAllForUser(): Promise<void> {
    this.revokeAllCount += 1;
    for (const [hash, token] of this.refreshTokens) {
      this.refreshTokens.set(hash, { ...token, revokedAt: new Date() });
    }
    return Promise.resolve();
  }

  public changePassword(_userId: string, passwordHash: string): Promise<void> {
    this.changedPasswordHash = passwordHash;
    if (this.user) {
      this.user = { ...this.user, passwordHash, mustChangePassword: false };
    }
    return Promise.resolve();
  }

  private storeToken(token: NewRefreshToken): void {
    if (!this.user) throw new Error('Se requiere un usuario de prueba.');
    this.refreshTokens.set(token.tokenHash, {
      ...token,
      revokedAt: null,
      user: this.user,
    });
  }
}

export class FakeTokenService implements TokenPort {
  private sequence = 0;

  public issuePair(userId: string, role: Role) {
    this.sequence += 1;
    const suffix = String(this.sequence).padStart(12, '0');
    return Promise.resolve({
      accessToken: `access-${String(this.sequence)}-${userId}-${role}`,
      refreshToken: `refresh-${String(this.sequence)}`,
      refreshId: `22222222-2222-4222-a222-${suffix}`,
      refreshExpiresAt: new Date(Date.now() + 86_400_000),
    });
  }

  public issueAccess(userId: string, role: Role): Promise<string> {
    return Promise.resolve(`access-${userId}-${role}`);
  }

  public verifyAccess(token: string) {
    if (!token.startsWith('valid-access'))
      return Promise.reject(new Error('invalid'));
    return Promise.resolve({
      userId: TEST_USER_ID,
      role: 'JEFE_CALIDAD' as const,
    });
  }

  public verifyRefresh(token: string) {
    const sequence = Number(token.replace('refresh-', ''));
    if (!Number.isInteger(sequence))
      return Promise.reject(new Error('invalid'));
    const suffix = String(sequence).padStart(12, '0');
    return Promise.resolve({
      userId: TEST_USER_ID,
      tokenId: `22222222-2222-4222-a222-${suffix}`,
    });
  }

  public hash(token: string): string {
    return `sha256:${token}`;
  }
}

export const fakePasswords: PasswordPort = {
  compare: (plain, passwordHash) => Promise.resolve(plain === passwordHash),
  hash: (plain) => Promise.resolve(`bcrypt:${plain}`),
};
