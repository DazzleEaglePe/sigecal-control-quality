import request from 'supertest';
import { describe, expect, it } from 'vitest';

import type {
  AccountEmailRequest,
  AccountTokenPasswordRequest,
} from '@sigecal/shared';
import { MessageResponseSchema } from '@sigecal/shared';

import { createApp } from '../../app.js';
import { env } from '../../config/env.js';
import type { AccountAccessUseCases } from './account-access.types.js';

class FakeAccountAccess implements AccountAccessUseCases {
  public requestedEmail = '';
  public sendInvitation(): Promise<void> {
    return Promise.resolve();
  }
  public requestPasswordReset(input: AccountEmailRequest): Promise<void> {
    this.requestedEmail = input.email;
    return Promise.resolve();
  }
  public requestPasswordResetForUser(): Promise<void> {
    return Promise.resolve();
  }
  public activate(_input: AccountTokenPasswordRequest): Promise<void> {
    void _input;
    return Promise.resolve();
  }
  public resetPassword(_input: AccountTokenPasswordRequest): Promise<void> {
    void _input;
    return Promise.resolve();
  }
}

describe('rutas públicas de acceso a cuenta', () => {
  it('responde de forma genérica a la recuperación', async () => {
    const access = new FakeAccountAccess();
    const response = await request(createApp({ accountAccessService: access }))
      .post(`${env.API_PREFIX}/auth/forgot-password`)
      .send({ email: 'ANA@EXAMPLE.COM' })
      .expect(202);
    const responseBody: unknown = response.body;
    const body = MessageResponseSchema.parse(responseBody);
    expect(body.data.message).not.toContain('ANA@EXAMPLE.COM');
    expect(access.requestedEmail).toBe('ANA@EXAMPLE.COM');
  });

  it('valida la política de contraseña antes de activar', async () => {
    await request(createApp({ accountAccessService: new FakeAccountAccess() }))
      .post(`${env.API_PREFIX}/auth/activate`)
      .send({ token: 'a'.repeat(43), newPassword: 'sin-numeros' })
      .expect(400);
  });

  it('activa con un token y contraseña válidos', async () => {
    await request(createApp({ accountAccessService: new FakeAccountAccess() }))
      .post(`${env.API_PREFIX}/auth/activate`)
      .send({ token: 'a'.repeat(43), newPassword: 'Segura1234' })
      .expect(204);
  });
});
