import type {
  ChangePasswordRequest,
  LoginData,
  LoginRequest,
  Role,
  UserSession,
} from '@sigecal/shared';

export interface AuthUserRecord {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: Role;
  readonly isActive: boolean;
  readonly mustChangePassword: boolean;
  readonly emailVerifiedAt: Date | null;
  readonly failedAttempts: number;
  readonly lockedUntil: Date | null;
}

export interface StoredRefreshToken {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly user: AuthUserRecord;
}

export interface NewRefreshToken {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

export interface AuthRepositoryPort {
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  findUserById(id: string): Promise<AuthUserRecord | null>;
  findRefreshByHash(hash: string): Promise<StoredRefreshToken | null>;
  registerFailedAttempt(
    userId: string,
    attempts: number,
    lockedUntil: Date | null,
  ): Promise<void>;
  completeLogin(token: NewRefreshToken, ipAddress?: string): Promise<void>;
  rotateRefresh(currentId: string, next: NewRefreshToken): Promise<boolean>;
  completeLogout(
    userId: string,
    tokenHash?: string,
    ipAddress?: string,
  ): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  changePassword(
    userId: string,
    passwordHash: string,
    ipAddress?: string,
  ): Promise<void>;
}

export interface IssuedTokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly refreshId: string;
  readonly refreshExpiresAt: Date;
}

export interface AccessClaims {
  readonly userId: string;
  readonly role: Role;
}
export interface RefreshClaims {
  readonly userId: string;
  readonly tokenId: string;
}

export interface TokenPort {
  issuePair(userId: string, role: Role): Promise<IssuedTokenPair>;
  issueAccess(userId: string, role: Role): Promise<string>;
  verifyAccess(token: string): Promise<AccessClaims>;
  verifyRefresh(token: string): Promise<RefreshClaims>;
  hash(token: string): string;
}

export interface PasswordPort {
  compare(plain: string, hash: string): Promise<boolean>;
  hash(plain: string): Promise<string>;
}

export interface AuthenticatedRequestUser {
  readonly userId: string;
  readonly role: Role;
  readonly mustChangePassword: boolean;
}

export interface LoginResult extends LoginData {
  readonly refreshToken: string;
}
export interface RefreshResult {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface AuthUseCases {
  login(input: LoginRequest, ipAddress?: string): Promise<LoginResult>;
  refresh(refreshToken: string): Promise<RefreshResult>;
  logout(
    userId: string,
    refreshToken?: string,
    ipAddress?: string,
  ): Promise<void>;
  authenticate(accessToken: string): Promise<AuthenticatedRequestUser>;
  me(userId: string): Promise<UserSession>;
  changePassword(
    userId: string,
    input: ChangePasswordRequest,
    ipAddress?: string,
  ): Promise<void>;
}
