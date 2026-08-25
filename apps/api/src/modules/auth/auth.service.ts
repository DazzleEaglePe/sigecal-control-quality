import type {
  ChangePasswordRequest,
  LoginRequest,
  Role,
  UserSession,
} from '@sigecal/shared';

import { permissionsFor } from '../../config/permissions.js';
import { LockedError, UnauthorizedError } from '../../errors/app-error.js';
import { env } from '../../config/env.js';
import type {
  AuthRepositoryPort,
  AuthUseCases,
  AuthUserRecord,
  AuthenticatedRequestUser,
  LoginResult,
  NewRefreshToken,
  PasswordPort,
  RefreshResult,
  TokenPort,
} from './auth.types.js';

const INVALID_PASSWORD_HASH =
  '$2b$10$AFX9gc5f900h1Dk2l2I3JOX4VbF9ibDi1STMV2Vgh1UA0vYr0mHaC';
const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos.';

const sessionFrom = (user: AuthUserRecord): UserSession => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
  permissions: [...permissionsFor(user.role)],
});

export class AuthService implements AuthUseCases {
  public constructor(
    private readonly repository: AuthRepositoryPort,
    private readonly tokens: TokenPort,
    private readonly passwords: PasswordPort,
  ) {}

  public async login(
    input: LoginRequest,
    ipAddress?: string,
  ): Promise<LoginResult> {
    const email = input.email.toLowerCase();
    const user = await this.repository.findUserByEmail(email);
    if (!user?.isActive) {
      await this.passwords.compare(input.password, INVALID_PASSWORD_HASH);
      throw new UnauthorizedError(INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
    }
    this.ensureNotLocked(user);
    const validPassword = await this.passwords.compare(
      input.password,
      user.passwordHash,
    );
    if (!validPassword) return this.rejectFailedLogin(user);

    const issued = await this.tokens.issuePair(user.id, user.role);
    await this.repository.completeLogin(
      this.newRefresh(user.id, issued),
      ipAddress,
    );
    return {
      accessToken: issued.accessToken,
      refreshToken: issued.refreshToken,
      user: sessionFrom(user),
    };
  }

  public async refresh(refreshToken: string): Promise<RefreshResult> {
    const claims = await this.verifyRefresh(refreshToken);
    const stored = await this.repository.findRefreshByHash(
      this.tokens.hash(refreshToken),
    );
    if (!stored) throw this.invalidToken();
    if (
      stored.revokedAt ||
      stored.id !== claims.tokenId ||
      stored.userId !== claims.userId
    ) {
      await this.repository.revokeAllForUser(stored.userId);
      throw new UnauthorizedError(
        'La sesión fue revocada por seguridad.',
        'TOKEN_REUSE_DETECTED',
      );
    }
    if (stored.expiresAt <= new Date() || !stored.user.isActive) {
      await this.repository.revokeAllForUser(stored.userId);
      throw new UnauthorizedError('La sesión ha vencido.', 'TOKEN_EXPIRED');
    }

    const issued = await this.tokens.issuePair(stored.userId, stored.user.role);
    const rotated = await this.repository.rotateRefresh(
      stored.id,
      this.newRefresh(stored.userId, issued),
    );
    if (!rotated) {
      await this.repository.revokeAllForUser(stored.userId);
      throw this.invalidToken();
    }
    return {
      accessToken: issued.accessToken,
      refreshToken: issued.refreshToken,
    };
  }

  public async logout(
    userId: string,
    refreshToken?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.repository.completeLogout(
      userId,
      refreshToken ? this.tokens.hash(refreshToken) : undefined,
      ipAddress,
    );
  }

  public async authenticate(
    accessToken: string,
  ): Promise<AuthenticatedRequestUser> {
    let claims: { readonly userId: string; readonly role: Role };
    try {
      claims = await this.tokens.verifyAccess(accessToken);
    } catch {
      throw this.invalidToken();
    }
    const user = await this.repository.findUserById(claims.userId);
    if (!user?.isActive || user.role !== claims.role) throw this.invalidToken();
    return {
      userId: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
  }

  public async me(userId: string): Promise<UserSession> {
    const user = await this.repository.findUserById(userId);
    if (!user?.isActive) throw this.invalidToken();
    return sessionFrom(user);
  }

  public async changePassword(
    userId: string,
    input: ChangePasswordRequest,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.repository.findUserById(userId);
    if (!user?.isActive) throw this.invalidToken();
    const matches = await this.passwords.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!matches) {
      throw new UnauthorizedError(
        'La contraseña actual no es correcta.',
        'INVALID_CREDENTIALS',
      );
    }
    const passwordHash = await this.passwords.hash(input.newPassword);
    await this.repository.changePassword(userId, passwordHash, ipAddress);
  }

  private ensureNotLocked(user: AuthUserRecord): void {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new LockedError(
        'La cuenta está bloqueada temporalmente. Intente más tarde.',
      );
    }
  }

  private async rejectFailedLogin(user: AuthUserRecord): Promise<never> {
    const attempts = user.failedAttempts + 1;
    const lockedUntil =
      attempts >= env.MAX_LOGIN_ATTEMPTS
        ? new Date(Date.now() + env.LOCKOUT_MINUTES * 60_000)
        : null;
    await this.repository.registerFailedAttempt(user.id, attempts, lockedUntil);
    if (lockedUntil) {
      throw new LockedError(
        'La cuenta está bloqueada temporalmente. Intente más tarde.',
      );
    }
    throw new UnauthorizedError(INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
  }

  private async verifyRefresh(token: string) {
    try {
      return await this.tokens.verifyRefresh(token);
    } catch {
      throw this.invalidToken();
    }
  }

  private invalidToken(): UnauthorizedError {
    return new UnauthorizedError('La sesión no es válida.', 'TOKEN_INVALID');
  }

  private newRefresh(
    userId: string,
    issued: Awaited<ReturnType<TokenPort['issuePair']>>,
  ): NewRefreshToken {
    return {
      id: issued.refreshId,
      userId,
      tokenHash: this.tokens.hash(issued.refreshToken),
      expiresAt: issued.refreshExpiresAt,
    };
  }
}
