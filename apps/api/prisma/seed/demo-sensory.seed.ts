import {
  DataOrigin,
  InspectionStatus,
  InspectionType,
  ResultStatus,
  Role,
} from '../../src/generated/prisma/enums.js';
import { dateOnly, dateTime, seedId } from './helpers.js';
import type { SeedTransaction } from './types.js';

const ATTRIBUTES = [
  'INTENSIDAD_AROMATICA',
  'CALIDAD_AROMATICA',
  'SABOR',
  'CUERPO',
  'PERSISTENCIA',
] as const;
const inspectionData = (code: string, status: 'EN_PROCESO' | 'COMPLETADA') => ({
  id: seedId(`inspection:${code}`),
  code,
  batchId: seedId('batch:LT-2026-0005'),
  stageId: seedId('stage:REPOSO'),
  type: InspectionType.ORGANOLEPTICO,
  status,
  scheduledDate: dateTime(
    status === 'COMPLETADA'
      ? '2026-08-28T15:00:00.000Z'
      : '2026-09-02T15:00:00.000Z',
  ),
  ...(status === 'COMPLETADA'
    ? { executedAt: dateTime('2026-08-28T15:00:00.000Z') }
    : {}),
  responsibleId: seedId(`user:${Role.ANALISTA}`),
  createdById: seedId(`user:${Role.JEFE_CALIDAD}`),
  notes: 'Inspección organoléptica de demostración.',
  dataOrigin: DataOrigin.DEMO,
});

const seedInspections = async (tx: SeedTransaction): Promise<void> => {
  for (const [code, status] of [
    ['INS-2026-0090', InspectionStatus.COMPLETADA],
    ['INS-2026-0091', InspectionStatus.EN_PROCESO],
  ] as const) {
    await tx.inspection.upsert({
      where: { code },
      create: inspectionData(code, status),
      update: { status, notes: 'Inspección organoléptica de demostración.' },
    });
  }
};
const seedScores = async (
  tx: SeedTransaction,
  sessionId: string,
  panelistId: string,
  offset: number,
) => {
  for (const [index, code] of ATTRIBUTES.entries()) {
    const attributeId = seedId(`sensory-attribute:${code}`);
    await tx.sensoryScore.upsert({
      where: { panelistId_attributeId: { panelistId, attributeId } },
      create: {
        id: seedId(`sensory-score:${panelistId}:${code}`),
        sessionId,
        panelistId,
        attributeId,
        score: 3 + ((index + offset) % 3),
        descriptor: 'Descriptor DEMO del producto.',
      },
      update: { descriptor: 'Descriptor DEMO del producto.' },
    });
  }
};
const seedPanel = async (
  tx: SeedTransaction,
  sessionId: string,
): Promise<void> => {
  const internalId = seedId('sensory-panelist:DEMO:INTERNAL');
  const externalId = seedId('sensory-panelist:DEMO:EXTERNAL');
  await tx.sensoryPanelist.upsert({
    where: { id: internalId },
    create: {
      id: internalId,
      sessionId,
      userId: seedId(`user:${Role.ANALISTA}`),
    },
    update: {},
  });
  await tx.sensoryPanelist.upsert({
    where: { id: externalId },
    create: {
      id: externalId,
      sessionId,
      externalName: 'Panelista externo DEMO',
    },
    update: {},
  });
  await seedScores(tx, sessionId, internalId, 0);
  await seedScores(tx, sessionId, externalId, 1);
};

export const seedDemoSensory = async (tx: SeedTransaction): Promise<void> => {
  await seedInspections(tx);
  const id = seedId('sensory-session:DEMO:001');
  await tx.sensorySession.upsert({
    where: { id },
    create: {
      id,
      inspectionId: seedId('inspection:INS-2026-0090'),
      sessionDate: dateOnly('2026-08-28'),
      overallAverage: 4,
      sensoryThresholdId: seedId('sensory-threshold:GENERAL'),
      appliedThreshold: 3,
      status: ResultStatus.CONFORME,
      notes: 'Sesión final exclusivamente DEMO.',
      recordedById: seedId(`user:${Role.ANALISTA}`),
      recordedAt: dateTime('2026-08-28T16:00:00.000Z'),
      dataOrigin: DataOrigin.DEMO,
    },
    update: { notes: 'Sesión final exclusivamente DEMO.' },
  });
  await seedPanel(tx, id);
};
