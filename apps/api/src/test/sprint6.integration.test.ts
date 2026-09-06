import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, expect, it as test } from 'vitest';
import { PrismaClient } from '../generated/prisma/client.js';
import { AccountAccessRepository } from '../modules/account-access/account-access.repository.js';
import { AuthRepository } from '../modules/auth/auth.repository.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { JwtTokenService } from '../modules/auth/auth.tokens.js';
import { UserRepository } from '../modules/users/users.repository.js';
import { createTestUser } from './sprint6.fixtures.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const it = test.skipIf(!databaseUrl);
let db: PrismaClient;
let access: AccountAccessRepository;
let users: UserRepository;
let actorId: string;
const createUser = (isActive = true) => createTestUser(db, isActive);
beforeAll(async () => {
  if (!databaseUrl) return;
  if (new URL(databaseUrl).pathname !== '/sigecal_test')
    throw new Error('Se requiere la BD aislada del script.');
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  access = new AccountAccessRepository(db);
  users = new UserRepository(db);
  actorId = (await createUser()).id;
});
afterAll(async () => {
  if (databaseUrl) await db.$disconnect();
});

it('rechaza expiración, tipo incorrecto y reutilización con persistencia real', async () => {
  const user = await createUser();
  await access.issueToken(
    user.id,
    'PASSWORD_RESET',
    'expired',
    new Date(Date.now() - 1_000),
  );
  expect(await access.consumeToken('expired', 'PASSWORD_RESET', 'bad')).toBe(
    false,
  );
  await access.issueToken(
    user.id,
    'PASSWORD_RESET',
    'valid',
    new Date(Date.now() + 60_000),
  );
  expect(await access.consumeToken('valid', 'ACTIVATION', 'bad')).toBe(false);
  expect(await access.consumeToken('valid', 'PASSWORD_RESET', 'new')).toBe(
    true,
  );
  expect(await access.consumeToken('valid', 'PASSWORD_RESET', 'bad')).toBe(
    false,
  );
  expect(
    (await db.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash,
  ).toBe('new');
});

it('consume una sola vez ante dos solicitudes simultáneas', async () => {
  const user = await createUser();
  await access.issueToken(
    user.id,
    'PASSWORD_RESET',
    'race',
    new Date(Date.now() + 60_000),
  );
  const result = await Promise.all([
    access.consumeToken('race', 'PASSWORD_RESET', 'a'),
    access.consumeToken('race', 'PASSWORD_RESET', 'b'),
  ]);
  expect(result.sort()).toEqual([false, true]);
  expect(
    (await db.user.findUniqueOrThrow({ where: { id: user.id } }))
      .sessionVersion,
  ).toBe(1);
});

it('serializa dos reenvíos y deja un solo enlace vigente', async () => {
  const user = await createUser();
  await Promise.all(
    ['resend-a', 'resend-b'].map((hash) =>
      access.issueToken(
        user.id,
        'PASSWORD_RESET',
        hash,
        new Date(Date.now() + 60_000),
      ),
    ),
  );
  expect(
    await db.accountToken.count({ where: { userId: user.id, usedAt: null } }),
  ).toBe(1);
});

it('restablecer contraseña revoca access y refresh JWT reales', async () => {
  const user = await createUser();
  const tokens = new JwtTokenService();
  const auth = new AuthService(new AuthRepository(db), tokens, {
    compare: () => Promise.resolve(true),
    hash: (value) => Promise.resolve(value),
  });
  const login = await auth.login({ email: user.email, password: 'test' });
  await expect(auth.authenticate(login.accessToken)).resolves.toBeDefined();
  await access.issueToken(
    user.id,
    'PASSWORD_RESET',
    'reset-jwt',
    new Date(Date.now() + 60_000),
  );
  expect(await access.consumeToken('reset-jwt', 'PASSWORD_RESET', 'new')).toBe(
    true,
  );
  await expect(auth.authenticate(login.accessToken)).rejects.toMatchObject({
    code: 'TOKEN_INVALID',
  });
  await expect(auth.refresh(login.refreshToken)).rejects.toBeDefined();
});

it('cambiar correo invalida enlaces anteriores y rechaza una emisión para el correo viejo', async () => {
  const user = await createUser();
  await access.issueToken(
    user.id,
    'PASSWORD_RESET',
    'old-email',
    new Date(Date.now() + 60_000),
  );
  await users.update(user.id, { email: 'updated@example.test' }, actorId);
  expect(await access.consumeToken('old-email', 'PASSWORD_RESET', 'bad')).toBe(
    false,
  );
  await expect(
    access.issueToken(
      user.id,
      'PASSWORD_RESET',
      'stale-email',
      new Date(Date.now() + 60_000),
      undefined,
      undefined,
      user.email,
    ),
  ).rejects.toMatchObject({ code: 'ACCOUNT_CHANGED' });
});

it('cambio de contraseña y desactivación invalidan enlaces pendientes', async () => {
  const user = await createUser();
  await access.issueToken(
    user.id,
    'PASSWORD_RESET',
    'before-password',
    new Date(Date.now() + 60_000),
  );
  await new AuthRepository(db).changePassword(user.id, 'changed');
  expect(
    await access.consumeToken('before-password', 'PASSWORD_RESET', 'bad'),
  ).toBe(false);
  await access.issueToken(
    user.id,
    'PASSWORD_RESET',
    'before-disable',
    new Date(Date.now() + 60_000),
  );
  await users.setStatus(user.id, false, actorId);
  await users.setStatus(user.id, true, actorId);
  expect(
    await access.consumeToken('before-disable', 'PASSWORD_RESET', 'bad'),
  ).toBe(false);
  expect(
    (await db.user.findUniqueOrThrow({ where: { id: user.id } }))
      .sessionVersion,
  ).toBe(2);
});

it('pagina responsables activos y no permite buscar por su correo', async () => {
  const user = await createUser();
  await createUser(false);
  const page = await users.assignmentOptions({ page: 1, pageSize: 1 });
  expect(page.data).toHaveLength(1);
  expect(page.total).toBe(await db.user.count({ where: { isActive: true } }));
  expect(Object.keys(page.data[0] ?? {}).sort()).toEqual([
    'firstName',
    'id',
    'isActive',
    'lastName',
    'role',
  ]);
  expect(
    (
      await users.assignmentOptions({
        page: 1,
        pageSize: 20,
        search: user.email,
      })
    ).total,
  ).toBe(0);
});
