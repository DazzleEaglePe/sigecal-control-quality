import { describe, expect, it, vi } from 'vitest';

import { AccountAccessService } from './account-access.service.js';
import type {
  AccountAccessRepositoryPort,
  AccountMailPort,
  AccountTarget,
  AccountTokenKind,
} from './account-access.types.js';

const target = (verified = false): AccountTarget => ({
  id: '11111111-1111-4111-a111-111111111111',
  firstName: 'Ana',
  email: 'ana@example.com',
  isActive: true,
  emailVerifiedAt: verified ? new Date() : null,
});

class MemoryAccountAccess implements AccountAccessRepositoryPort {
  public user: AccountTarget | null = target();
  public issued: { type: AccountTokenKind; hash: string } | undefined;
  public consumeResult = true;
  public consumed:
    { type: AccountTokenKind; hash: string; password: string } | undefined;

  public findActiveByEmail(email: string) {
    return Promise.resolve(this.user?.email === email ? this.user : null);
  }
  public findActiveById(id: string) {
    return Promise.resolve(this.user?.id === id ? this.user : null);
  }
  public issueToken(
    _userId: string,
    type: AccountTokenKind,
    tokenHash: string,
  ) {
    this.issued = { type, hash: tokenHash };
    return Promise.resolve();
  }
  public consumeToken(
    tokenHash: string,
    type: AccountTokenKind,
    passwordHash: string,
  ) {
    this.consumed = { type, hash: tokenHash, password: passwordHash };
    return Promise.resolve(this.consumeResult);
  }
}

const setup = () => {
  const repository = new MemoryAccountAccess();
  const sendActivation = vi.fn(() => Promise.resolve());
  const sendPasswordReset = vi.fn(() => Promise.resolve());
  const mailer: AccountMailPort = {
    sendActivation,
    sendPasswordReset,
  };
  const service = new AccountAccessService(
    repository,
    { issue: () => 'token-aleatorio-seguro', hash: (value) => `hash:${value}` },
    { hash: (value) => Promise.resolve(`bcrypt:${value}`) },
    mailer,
  );
  return { repository, sendActivation, sendPasswordReset, service };
};

describe('AccountAccessService invitaciones', () => {
  it('persiste solo el hash y envía el token original por correo', async () => {
    const { repository, sendActivation, service } = setup();
    await service.sendInvitation(target().id);
    expect(repository.issued).toEqual({
      type: 'ACTIVATION',
      hash: 'hash:token-aleatorio-seguro',
    });
    expect(sendActivation).toHaveBeenCalledWith(
      target(),
      'token-aleatorio-seguro',
    );
  });

  it('no permite invitar una cuenta que ya fue activada', async () => {
    const { repository, service } = setup();
    repository.user = target(true);
    await expect(service.sendInvitation(target().id)).rejects.toMatchObject({
      code: 'ACCOUNT_ALREADY_ACTIVATED',
    });
  });
});

describe('AccountAccessService recuperación', () => {
  it('no revela ni envía mensajes cuando el correo no existe', async () => {
    const { repository, sendPasswordReset, service } = setup();
    repository.user = null;
    await expect(
      service.requestPasswordReset({ email: 'nadie@example.com' }),
    ).resolves.toBeUndefined();
    expect(sendPasswordReset).not.toHaveBeenCalled();
  });

  it('consume el token con contraseña hasheada', async () => {
    const { repository, service } = setup();
    await service.resetPassword({
      token: 'token-aleatorio-seguro-con-extension',
      newPassword: 'NuevaClave2',
    });
    expect(repository.consumed).toEqual({
      type: 'PASSWORD_RESET',
      hash: 'hash:token-aleatorio-seguro-con-extension',
      password: 'bcrypt:NuevaClave2',
    });
  });

  it('rechaza tokens vencidos, consumidos o desconocidos', async () => {
    const { repository, service } = setup();
    repository.consumeResult = false;
    await expect(
      service.activate({
        token: 'token-aleatorio-seguro-con-extension',
        newPassword: 'NuevaClave2',
      }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_TOKEN_INVALID' });
  });
});
