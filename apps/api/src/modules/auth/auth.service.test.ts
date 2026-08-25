import { describe, expect, it } from 'vitest';

import { AuthService } from './auth.service.js';
import {
  FakeTokenService,
  MemoryAuthRepository,
  fakePasswords,
  testUser,
} from './auth.test-helpers.js';

const setup = () => {
  const repository = new MemoryAuthRepository();
  const tokens = new FakeTokenService();
  const service = new AuthService(repository, tokens, fakePasswords);
  return { repository, tokens, service };
};

describe('AuthService login', () => {
  it('guarda únicamente el hash del refresh y devuelve permisos efectivos', async () => {
    const { repository, service } = setup();
    const result = await service.login({
      email: 'JEFE@SIGECAL.PE',
      password: 'Correcta1',
    });

    expect(result.accessToken).toContain('access-1');
    expect(result.user.permissions).toContain('MASTERS_MANAGE');
    expect(repository.refreshTokens.has('sha256:refresh-1')).toBe(true);
    expect(repository.refreshTokens.has('refresh-1')).toBe(false);
  });

  it('bloquea la cuenta al quinto intento fallido', async () => {
    const { repository, service } = setup();
    const attempt = () =>
      service.login({ email: 'jefe@sigecal.pe', password: 'Incorrecta1' });

    for (let index = 0; index < 4; index += 1) {
      await expect(attempt()).rejects.toMatchObject({ statusCode: 401 });
    }
    await expect(attempt()).rejects.toMatchObject({
      statusCode: 423,
      code: 'ACCOUNT_LOCKED',
    });
    expect(repository.user?.lockedUntil).toBeInstanceOf(Date);
  });

  it('no revela si el correo no existe', async () => {
    const { repository, service } = setup();
    repository.user = null;
    await expect(
      service.login({ email: 'nadie@sigecal.pe', password: 'Incorrecta1' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Correo o contraseña incorrectos.',
    });
  });
});

describe('AuthService rotación', () => {
  it('revoca el token usado y emite un par nuevo', async () => {
    const { repository, service } = setup();
    const login = await service.login({
      email: 'jefe@sigecal.pe',
      password: 'Correcta1',
    });
    const refreshed = await service.refresh(login.refreshToken);

    expect(refreshed.refreshToken).toBe('refresh-2');
    expect(
      repository.refreshTokens.get('sha256:refresh-1')?.revokedAt,
    ).toBeInstanceOf(Date);
    expect(repository.refreshTokens.has('sha256:refresh-2')).toBe(true);
  });

  it('revoca toda la sesión si se reutiliza un token rotado', async () => {
    const { repository, service } = setup();
    const login = await service.login({
      email: 'jefe@sigecal.pe',
      password: 'Correcta1',
    });
    await service.refresh(login.refreshToken);

    await expect(service.refresh(login.refreshToken)).rejects.toMatchObject({
      code: 'TOKEN_REUSE_DETECTED',
    });
    expect(repository.revokeAllCount).toBe(1);
  });
});

describe('AuthService sesión y contraseña', () => {
  it('rechaza un access token si el rol almacenado cambió', async () => {
    const { repository, service } = setup();
    repository.user = testUser({ role: 'ADMIN' });
    await expect(service.authenticate('valid-access')).rejects.toMatchObject({
      code: 'TOKEN_INVALID',
    });
  });

  it('cambia la clave y elimina la obligación de clave provisional', async () => {
    const { repository, service } = setup();
    await service.changePassword(testUser().id, {
      currentPassword: 'Correcta1',
      newPassword: 'NuevaClave2',
    });

    expect(repository.changedPasswordHash).toBe('bcrypt:NuevaClave2');
    expect(repository.user?.mustChangePassword).toBe(false);
  });
});
