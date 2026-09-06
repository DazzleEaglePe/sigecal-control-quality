import type {
  AccountEmailRequest,
  AccountTokenPasswordRequest,
} from '@sigecal/shared';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from '../../errors/app-error.js';
import type {
  AccountAccessRepositoryPort,
  AccountAccessUseCases,
  AccountMailPort,
  AccountPasswordHasher,
  AccountTarget,
  AccountTokenKind,
  AccountTokenPort,
} from './account-access.types.js';

export class AccountAccessService implements AccountAccessUseCases {
  public constructor(
    private readonly repository: AccountAccessRepositoryPort,
    private readonly tokens: AccountTokenPort,
    private readonly passwords: AccountPasswordHasher,
    private readonly mailer: AccountMailPort,
  ) {}

  public async sendInvitation(
    userId: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<void> {
    const target = await this.repository.findActiveById(userId);
    if (!target) throw new NotFoundError('El usuario activo no existe.');
    if (target.emailVerifiedAt) {
      throw new BadRequestError(
        'La cuenta ya fue activada.',
        'ACCOUNT_ALREADY_ACTIVATED',
      );
    }
    await this.issue(target, 'ACTIVATION', actorId, ipAddress);
  }

  public async requestPasswordReset(input: AccountEmailRequest): Promise<void> {
    const target = await this.repository.findActiveByEmail(
      input.email.toLowerCase(),
    );
    if (!target?.emailVerifiedAt) return;
    try {
      await this.issue(target, 'PASSWORD_RESET');
    } catch (error) {
      if (error instanceof ConflictError && error.code === 'ACCOUNT_CHANGED')
        return;
      if (!(error instanceof ServiceUnavailableError)) throw error;
      // No registrar el error SMTP: puede contener destinatario o enlace sensible.
      logger.error(
        { code: 'EMAIL_DELIVERY_FAILED' },
        'Falló el envío de recuperación de cuenta.',
      );
    }
  }

  public async requestPasswordResetForUser(
    userId: string,
    actorId?: string,
    ipAddress?: string,
  ): Promise<void> {
    const target = await this.repository.findActiveById(userId);
    if (!target) throw new NotFoundError('El usuario activo no existe.');
    await this.issue(
      target,
      target.emailVerifiedAt ? 'PASSWORD_RESET' : 'ACTIVATION',
      actorId,
      ipAddress,
    );
  }

  public activate(input: AccountTokenPasswordRequest): Promise<void> {
    return this.consume(input, 'ACTIVATION');
  }

  public resetPassword(input: AccountTokenPasswordRequest): Promise<void> {
    return this.consume(input, 'PASSWORD_RESET');
  }

  private async issue(
    target: AccountTarget,
    type: AccountTokenKind,
    actorId?: string,
    ipAddress?: string,
  ): Promise<void> {
    const token = this.tokens.issue();
    const minutes =
      type === 'ACTIVATION'
        ? env.ACTIVATION_TOKEN_MINUTES
        : env.PASSWORD_RESET_TOKEN_MINUTES;
    await this.repository.issueToken(
      target.id,
      type,
      this.tokens.hash(token),
      new Date(Date.now() + minutes * 60_000),
      actorId,
      ipAddress,
      target.email,
    );
    try {
      if (type === 'ACTIVATION')
        await this.mailer.sendActivation(target, token);
      else await this.mailer.sendPasswordReset(target, token);
    } catch (cause) {
      throw new ServiceUnavailableError(
        'No fue posible enviar el correo. Puede reintentar la operación.',
        'EMAIL_DELIVERY_FAILED',
        { cause },
      );
    }
  }

  private async consume(
    input: AccountTokenPasswordRequest,
    type: AccountTokenKind,
  ): Promise<void> {
    const passwordHash = await this.passwords.hash(input.newPassword);
    const consumed = await this.repository.consumeToken(
      this.tokens.hash(input.token),
      type,
      passwordHash,
    );
    if (!consumed) {
      throw new BadRequestError(
        'El enlace no es válido o ya venció.',
        'ACCOUNT_TOKEN_INVALID',
      );
    }
  }
}
