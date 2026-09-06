import type {
  AccountEmailRequest,
  AccountTokenPasswordRequest,
} from '@sigecal/shared';

export type AccountTokenKind = 'ACTIVATION' | 'PASSWORD_RESET';

export interface AccountTarget {
  readonly id: string;
  readonly firstName: string;
  readonly email: string;
  readonly isActive: boolean;
  readonly emailVerifiedAt: Date | null;
}

export interface AccountAccessRepositoryPort {
  findActiveByEmail(email: string): Promise<AccountTarget | null>;
  findActiveById(id: string): Promise<AccountTarget | null>;
  issueToken(
    userId: string,
    type: AccountTokenKind,
    tokenHash: string,
    expiresAt: Date,
    actorId?: string,
    ipAddress?: string,
    expectedEmail?: string,
  ): Promise<void>;
  consumeToken(
    tokenHash: string,
    type: AccountTokenKind,
    passwordHash: string,
  ): Promise<boolean>;
}

export interface AccountTokenPort {
  issue(): string;
  hash(token: string): string;
}

export interface AccountMailPort {
  sendActivation(target: AccountTarget, token: string): Promise<void>;
  sendPasswordReset(target: AccountTarget, token: string): Promise<void>;
}

export interface AccountPasswordHasher {
  hash(plain: string): Promise<string>;
}

export interface AccountAccessUseCases {
  sendInvitation(
    userId: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<void>;
  requestPasswordReset(input: AccountEmailRequest): Promise<void>;
  requestPasswordResetForUser(
    userId: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<void>;
  activate(input: AccountTokenPasswordRequest): Promise<void>;
  resetPassword(input: AccountTokenPasswordRequest): Promise<void>;
}
