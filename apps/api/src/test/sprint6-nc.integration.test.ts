import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, expect, it as test } from 'vitest';
import { PrismaClient } from '../generated/prisma/client.js';
import { NonConformityMutationRepository } from '../modules/nonconformities/nonconformities.mutations.js';
import { NonConformityRepository } from '../modules/nonconformities/nonconformities.repository.js';
import { NonConformitiesService } from '../modules/nonconformities/nonconformities.service.js';
import {
  createTestBatch,
  createTestNC,
  createTestUser,
  testActionInput,
} from './sprint6.fixtures.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const it = test.skipIf(!databaseUrl);
let db: PrismaClient;
let mutations: NonConformityMutationRepository;
let batchId: string;
let actorId: string;
const createUser = () => createTestUser(db);
const createNC = () => createTestNC(db, batchId, actorId);
const closeNC = (id: string) =>
  mutations.close(id, { closeComment: 'Resuelto' }, actorId);

beforeAll(async () => {
  if (!databaseUrl) return;
  if (new URL(databaseUrl).pathname !== '/sigecal_test')
    throw new Error('Se requiere la BD aislada del script.');
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  mutations = new NonConformityMutationRepository(db);
  actorId = (await createUser()).id;
  batchId = (await createTestBatch(db, actorId)).id;
});
afterAll(async () => {
  if (databaseUrl) await db.$disconnect();
});

it('edita la NC verificando el lote real y cierra con una acción eficaz', async () => {
  const nc = await createNC();
  const service = new NonConformitiesService(
    new NonConformityRepository(db),
    mutations,
  );
  const actor = { userId: actorId, role: 'ADMIN' as const };
  await expect(
    service.update(nc.id, { rootCause: 'Causa documentada' }, actor),
  ).resolves.toMatchObject({ rootCause: 'Causa documentada' });
  const responsible = await createUser();
  const actionId = await mutations.createAction(
    nc.id,
    { ...testActionInput(), responsibleId: responsible.id },
    actorId,
  );
  await service.startAttention(nc.id, actor);
  await service.executeAction(actionId, actor);
  await service.verifyAction(
    actionId,
    { isEffective: true, verificationComment: 'Eficacia comprobada' },
    actor,
  );
  await expect(
    service.close(nc.id, { closeComment: 'Resuelto' }, actor),
  ).resolves.toMatchObject({ status: 'CERRADA' });
});

it('exige reemplazar y verificar una acción no eficaz para cerrar', async () => {
  const nc = await createNC();
  await expect(closeNC(nc.id)).rejects.toMatchObject({
    code: 'NC_HAS_UNVERIFIED_ACTIONS',
  });
  const responsible = await createUser();
  const actionId = await mutations.createAction(
    nc.id,
    { ...testActionInput(), responsibleId: responsible.id },
    actorId,
  );
  await mutations.executeAction(actionId, actorId);
  await mutations.verifyAction(
    actionId,
    { isEffective: false, verificationComment: 'No resolvió la causa' },
    actorId,
  );
  await expect(closeNC(nc.id)).rejects.toMatchObject({
    code: 'NC_HAS_UNVERIFIED_ACTIONS',
  });
  const replacementId = await mutations.createAction(
    nc.id,
    {
      ...testActionInput(),
      responsibleId: actorId,
      replacesActionId: actionId,
    },
    actorId,
  );
  await mutations.executeAction(replacementId, actorId);
  const verifier = await createUser();
  await mutations.verifyAction(
    replacementId,
    { isEffective: true, verificationComment: 'Reemplazo eficaz' },
    verifier.id,
  );
  await expect(closeNC(nc.id)).resolves.toBeUndefined();
});

it('serializa el alta de acción concurrente con el cierre', async () => {
  const nc = await createNC();
  const responsible = await createUser();
  const actionId = await mutations.createAction(
    nc.id,
    { ...testActionInput(), responsibleId: responsible.id },
    actorId,
  );
  await mutations.executeAction(actionId, actorId);
  await mutations.verifyAction(
    actionId,
    { isEffective: true, verificationComment: 'Resolvió la causa' },
    actorId,
  );
  const results = await Promise.allSettled([
    closeNC(nc.id),
    mutations.createAction(
      nc.id,
      { ...testActionInput(), responsibleId: actorId },
      actorId,
    ),
  ]);
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  const current = await db.nonConformity.findUniqueOrThrow({
    where: { id: nc.id },
    include: { actions: true },
  });
  if (current.status === 'CERRADA')
    expect(
      current.actions.every((action) => action.status === 'VERIFICADA'),
    ).toBe(true);
});
