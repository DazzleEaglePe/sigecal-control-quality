import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '../generated/prisma/client.js';

export const createTestUser = (db: PrismaClient, isActive = true) =>
  db.user.create({
    data: {
      firstName: 'Prueba',
      lastName: randomUUID(),
      email: `${randomUUID()}@example.test`,
      role: 'ADMIN',
      passwordHash: 'test-hash',
      mustChangePassword: false,
      emailVerifiedAt: new Date(),
      isActive,
    },
  });

export const createTestNC = (
  db: PrismaClient,
  batchId: string,
  actorId: string,
) =>
  db.nonConformity.create({
    data: {
      code: `TEST-${randomUUID()}`,
      batchId,
      origin: 'MANUAL',
      severity: 'MODERADA',
      description: 'Solo prueba aislada',
      detectedAt: new Date(),
      detectedById: actorId,
      dataOrigin: 'DEMO',
    },
  });

export const testActionInput = () => ({
  type: 'CORRECTIVA' as const,
  description: 'Acción de prueba aislada',
  responsibleId: '',
  committedDate: '2026-09-05',
});

export const createTestBatch = async (db: PrismaClient, actorId: string) => {
  const stage = await db.processStage.create({
    data: { code: 'TEST', name: 'Etapa de prueba', sequence: 1 },
  });
  const piscoType = await db.piscoType.create({
    data: { code: 'TEST', name: 'Tipo de prueba' },
  });
  return db.batch.create({
    data: {
      code: 'TEST',
      piscoTypeId: piscoType.id,
      currentStageId: stage.id,
      startDate: new Date(),
      volumeLiters: 1,
      createdById: actorId,
      dataOrigin: 'DEMO',
    },
  });
};
