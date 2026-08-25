import { BatchStatus, Role } from '../../src/generated/prisma/enums.js';
import { addDays, dateOnly, seedId } from './helpers.js';
import type { SeedTransaction } from './types.js';

interface DemoBatchDefinition {
  readonly code: string;
  readonly piscoType: 'PURO' | 'ACHOLADO' | 'MOSTO_VERDE';
  readonly currentStage: number;
  readonly status: (typeof BatchStatus)[keyof typeof BatchStatus];
  readonly varieties: readonly (readonly [string, number])[];
}

export const DEMO_BATCHES: readonly DemoBatchDefinition[] = [
  {
    code: 'LT-2026-0001',
    piscoType: 'PURO',
    currentStage: 1,
    status: BatchStatus.EN_PROCESO,
    varieties: [['QUEBRANTA', 100]],
  },
  {
    code: 'LT-2026-0002',
    piscoType: 'ACHOLADO',
    currentStage: 2,
    status: BatchStatus.EN_PROCESO,
    varieties: [
      ['QUEBRANTA', 60],
      ['ITALIA', 40],
    ],
  },
  {
    code: 'LT-2026-0003',
    piscoType: 'PURO',
    currentStage: 3,
    status: BatchStatus.EN_OBSERVACION,
    varieties: [['TORONTEL', 100]],
  },
  {
    code: 'LT-2026-0004',
    piscoType: 'MOSTO_VERDE',
    currentStage: 4,
    status: BatchStatus.EN_OBSERVACION,
    varieties: [['ITALIA', 100]],
  },
  {
    code: 'LT-2026-0005',
    piscoType: 'ACHOLADO',
    currentStage: 5,
    status: BatchStatus.EN_PROCESO,
    varieties: [
      ['MOSCATEL', 50],
      ['ALBILLA', 50],
    ],
  },
];

const STAGE_CODES = [
  'RECEPCION_UVA',
  'MOLIENDA_DESPALILLADO',
  'FERMENTACION',
  'DESTILACION',
  'REPOSO',
  'EMBOTELLADO',
] as const;

const seedBatchVarieties = async (
  tx: SeedTransaction,
  definition: DemoBatchDefinition,
): Promise<void> => {
  for (const [varietyCode, percentage] of definition.varieties) {
    const batchId = seedId(`batch:${definition.code}`);
    const varietyId = seedId(`variety:${varietyCode}`);
    await tx.batchGrapeVariety.upsert({
      where: { batchId_varietyId: { batchId, varietyId } },
      create: {
        id: seedId(`batch-variety:${definition.code}:${varietyCode}`),
        batchId,
        varietyId,
        percentage,
      },
      update: { percentage },
    });
  }
};

const seedBatchStages = async (
  tx: SeedTransaction,
  definition: DemoBatchDefinition,
  startDate: Date,
): Promise<void> => {
  for (let index = 0; index < definition.currentStage; index += 1) {
    const stageCode = STAGE_CODES[index];
    if (stageCode === undefined) continue;
    const startedAt = addDays(startDate, index * 2);
    const finishedAt =
      index + 1 === definition.currentStage ? null : addDays(startedAt, 1);
    await tx.batchStage.upsert({
      where: {
        batchId_stageId: {
          batchId: seedId(`batch:${definition.code}`),
          stageId: seedId(`stage:${stageCode}`),
        },
      },
      create: {
        id: seedId(`batch-stage:${definition.code}:${stageCode}`),
        batchId: seedId(`batch:${definition.code}`),
        stageId: seedId(`stage:${stageCode}`),
        startedAt,
        finishedAt,
        responsibleId: seedId(`user:${Role.OPERARIO}`),
      },
      update: { startedAt, finishedAt },
    });
  }
};

const seedBatch = async (
  tx: SeedTransaction,
  definition: DemoBatchDefinition,
  index: number,
): Promise<void> => {
  const startDate = addDays(dateOnly('2026-08-01'), index * 3);
  const stageCode = STAGE_CODES[definition.currentStage - 1];
  if (stageCode === undefined) throw new Error('Etapa demo inválida.');
  await tx.batch.upsert({
    where: { code: definition.code },
    create: {
      id: seedId(`batch:${definition.code}`),
      code: definition.code,
      piscoTypeId: seedId(`pisco-type:${definition.piscoType}`),
      currentStageId: seedId(`stage:${stageCode}`),
      status: definition.status,
      startDate,
      volumeLiters: 500 + index * 125,
      harvestOrigin: 'Origen de demostración',
      notes: 'Dato DEMO; no corresponde a producción real.',
      createdById: seedId(`user:${Role.JEFE_CALIDAD}`),
      dataOrigin: 'DEMO',
    },
    update: {
      currentStageId: seedId(`stage:${stageCode}`),
      status: definition.status,
      dataOrigin: 'DEMO',
    },
  });
  await seedBatchVarieties(tx, definition);
  await seedBatchStages(tx, definition, startDate);
};

export const seedDemoBatches = async (tx: SeedTransaction): Promise<void> => {
  for (const [index, definition] of DEMO_BATCHES.entries()) {
    await seedBatch(tx, definition, index);
  }
};
