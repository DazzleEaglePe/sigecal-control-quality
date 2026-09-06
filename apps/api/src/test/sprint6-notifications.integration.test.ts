import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, expect, it as test } from 'vitest';

import { PrismaClient } from '../generated/prisma/client.js';
import {
  NotificationGenerationRepository,
  NotificationRepository,
} from '../modules/notifications/notifications.repository.js';
import {
  createTestBatch,
  createTestNC,
  createTestUser,
} from './sprint6.fixtures.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const it = test.skipIf(!databaseUrl);
let db: PrismaClient;
let userId: string;
let otherUserId: string;
let nonConformityId: string;

beforeAll(async () => {
  if (!databaseUrl) return;
  if (new URL(databaseUrl).pathname !== '/sigecal_test') {
    throw new Error('Se requiere la BD aislada del script.');
  }
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  userId = (await createTestUser(db)).id;
  otherUserId = (await createTestUser(db)).id;
  const batch = await createTestBatch(db, userId);
  const nc = await createTestNC(db, batch.id, userId);
  nonConformityId = nc.id;
  await db.nonConformity.update({
    where: { id: nc.id },
    data: { assignedToId: userId },
  });
  await db.correctiveAction.create({
    data: {
      nonConformityId: nc.id,
      type: 'CORRECTIVA',
      description: 'Acción que requiere aviso',
      responsibleId: userId,
      committedDate: new Date('2026-09-08T00:00:00.000Z'),
    },
  });
});

afterAll(async () => {
  if (databaseUrl) await db.$disconnect();
});

it('genera avisos idempotentes y aísla su lectura por usuario', async () => {
  const generation = new NotificationGenerationRepository(db);
  const now = new Date('2026-09-06T00:00:00.000Z');
  const dueAt = new Date('2026-09-08T23:59:59.000Z');
  const created = await Promise.all([
    generation.generate(now, dueAt),
    generation.generate(now, dueAt),
  ]);
  expect(created.reduce((sum, value) => sum + value, 0)).toBe(3);

  const notifications = new NotificationRepository(db);
  const query = { page: 1, pageSize: 20 };
  const own = await notifications.list(userId, query);
  expect(own.total).toBe(3);
  expect(await notifications.list(otherUserId, query)).toMatchObject({
    total: 0,
  });
  expect(
    await notifications.markRead(otherUserId, own.items[0]?.id ?? ''),
  ).toBeNull();
  expect(await notifications.markAllRead(userId)).toBe(3);
  expect(await notifications.unreadCount(userId)).toBe(0);
  expect(own.items.every((item) => item.entityId === nonConformityId)).toBe(
    true,
  );
});
