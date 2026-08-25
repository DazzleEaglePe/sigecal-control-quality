import {
  ActionStatus,
  ActionType,
  DataOrigin,
  InspectionStatus,
  InspectionType,
  NCOrigin,
  NCSeverity,
  NCStatus,
  ResultStatus,
  Role,
} from '../../src/generated/prisma/enums.js';
import { DEMO_BATCHES } from './demo-batches.seed.js';
import { addDays, dateTime, seedId } from './helpers.js';
import type { SeedTransaction } from './types.js';

const DEMO_VALUES = [21.2, 22, 21.8, 22.4, 20.9, 23.1, 27.2, 16.8] as const;
const MEASUREMENT_BATCHES = [0, 1, 2, 3, 4, 0, 2, 3] as const;
const STAGE_CODES = [
  'RECEPCION_UVA',
  'MOLIENDA_DESPALILLADO',
  'FERMENTACION',
  'DESTILACION',
  'REPOSO',
] as const;

interface MeasurementContext {
  readonly code: string;
  readonly inspectionId: string;
  readonly batchCode: string;
  readonly stageCode: (typeof STAGE_CODES)[number];
  readonly recordedAt: Date;
  readonly value: number;
}

const resultStatus = (value: number): 'CONFORME' | 'NO_CONFORME' =>
  value < 18 || value > 26 ? ResultStatus.NO_CONFORME : ResultStatus.CONFORME;

const getMeasurementContext = (
  value: number,
  index: number,
): MeasurementContext => {
  const batchIndex = MEASUREMENT_BATCHES[index];
  const batch = batchIndex === undefined ? undefined : DEMO_BATCHES[batchIndex];
  if (batch === undefined) throw new Error('Lote demo inválido.');
  const stageCode = STAGE_CODES[batch.currentStage - 1];
  if (stageCode === undefined) throw new Error('Etapa demo inválida.');
  const code = `INS-2026-${String(index + 1).padStart(4, '0')}`;
  return {
    code,
    inspectionId: seedId(`inspection:${code}`),
    batchCode: batch.code,
    stageCode,
    recordedAt: addDays(dateTime('2026-08-20T15:00:00.000Z'), index),
    value,
  };
};

const seedInspection = async (
  tx: SeedTransaction,
  context: MeasurementContext,
): Promise<void> => {
  await tx.inspection.upsert({
    where: { code: context.code },
    create: {
      id: context.inspectionId,
      code: context.code,
      batchId: seedId(`batch:${context.batchCode}`),
      stageId: seedId(`stage:${context.stageCode}`),
      type: InspectionType.FISICOQUIMICO,
      status: InspectionStatus.COMPLETADA,
      scheduledDate: context.recordedAt,
      executedAt: context.recordedAt,
      responsibleId: seedId(`user:${Role.ANALISTA}`),
      equipmentId: seedId('equipment:DEMO-REFR-01'),
      createdById: seedId(`user:${Role.JEFE_CALIDAD}`),
      dataOrigin: DataOrigin.DEMO,
    },
    update: {
      status: InspectionStatus.COMPLETADA,
      executedAt: context.recordedAt,
    },
  });
};

const seedInspectionParameter = async (
  tx: SeedTransaction,
  context: MeasurementContext,
): Promise<void> => {
  await tx.inspectionParameter.upsert({
    where: {
      inspectionId_parameterId: {
        inspectionId: context.inspectionId,
        parameterId: seedId('parameter:BRIX'),
      },
    },
    create: {
      id: seedId(`inspection-parameter:${context.code}:BRIX`),
      inspectionId: context.inspectionId,
      parameterId: seedId('parameter:BRIX'),
    },
    update: {},
  });
};

const seedResult = async (
  tx: SeedTransaction,
  context: MeasurementContext,
): Promise<void> => {
  await tx.physChemResult.upsert({
    where: { id: seedId(`result:${context.code}:BRIX`) },
    create: {
      id: seedId(`result:${context.code}:BRIX`),
      inspectionId: context.inspectionId,
      parameterId: seedId('parameter:BRIX'),
      standardId: seedId('standard:BRIX:GENERAL'),
      value: context.value,
      status: resultStatus(context.value),
      observation: 'Medición generada exclusivamente para demostración.',
      equipmentId: seedId('equipment:DEMO-REFR-01'),
      calibrationRef: 'DEMO-CAL-2026',
      recordedById: seedId(`user:${Role.ANALISTA}`),
      recordedAt: context.recordedAt,
      dataOrigin: DataOrigin.DEMO,
    },
    update: {
      observation: 'Medición generada exclusivamente para demostración.',
    },
  });
};

const seedMeasurement = async (
  tx: SeedTransaction,
  value: number,
  index: number,
): Promise<void> => {
  const context = getMeasurementContext(value, index);
  await seedInspection(tx, context);
  await seedInspectionParameter(tx, context);
  await seedResult(tx, context);
};

const seedOpenNonConformity = async (tx: SeedTransaction): Promise<void> => {
  const resultId = seedId('result:INS-2026-0007:BRIX');
  await tx.nonConformity.upsert({
    where: { code: 'NC-2026-0001' },
    create: {
      id: seedId('nc:NC-2026-0001'),
      code: 'NC-2026-0001',
      batchId: seedId('batch:LT-2026-0003'),
      stageId: seedId('stage:FERMENTACION'),
      inspectionId: seedId('inspection:INS-2026-0007'),
      physChemResultId: resultId,
      origin: NCOrigin.AUTOMATICA_FISICOQUIMICA,
      severity: NCSeverity.MODERADA,
      status: NCStatus.ABIERTA,
      description:
        'Resultado DEMO de °Brix por encima del estándar provisional.',
      detectedAt: dateTime('2026-08-26T15:00:00.000Z'),
      detectedById: seedId(`user:${Role.ANALISTA}`),
      assignedToId: seedId(`user:${Role.JEFE_CALIDAD}`),
      assignedAreaId: seedId('area:CALIDAD'),
      dataOrigin: DataOrigin.DEMO,
    },
    update: {
      description:
        'Resultado DEMO de °Brix por encima del estándar provisional.',
    },
  });
};

const seedTreatedNonConformityRecord = async (
  tx: SeedTransaction,
): Promise<void> => {
  const ncId = seedId('nc:NC-2026-0002');
  await tx.nonConformity.upsert({
    where: { code: 'NC-2026-0002' },
    create: {
      id: ncId,
      code: 'NC-2026-0002',
      batchId: seedId('batch:LT-2026-0004'),
      stageId: seedId('stage:DESTILACION'),
      inspectionId: seedId('inspection:INS-2026-0008'),
      physChemResultId: seedId('result:INS-2026-0008:BRIX'),
      origin: NCOrigin.AUTOMATICA_FISICOQUIMICA,
      severity: NCSeverity.MODERADA,
      status: NCStatus.EN_TRATAMIENTO,
      description:
        'Resultado DEMO de °Brix por debajo del estándar provisional.',
      rootCause: 'Causa de demostración pendiente de validación empresarial.',
      detectedAt: dateTime('2026-08-27T15:00:00.000Z'),
      detectedById: seedId(`user:${Role.ANALISTA}`),
      assignedToId: seedId(`user:${Role.JEFE_CALIDAD}`),
      assignedAreaId: seedId('area:CALIDAD'),
      attentionStartedAt: dateTime('2026-08-27T17:00:00.000Z'),
      dataOrigin: DataOrigin.DEMO,
    },
    update: {
      rootCause: 'Causa de demostración pendiente de validación empresarial.',
    },
  });
};

const seedCorrectiveAction = async (tx: SeedTransaction): Promise<void> => {
  await tx.correctiveAction.upsert({
    where: { id: seedId('action:NC-2026-0002:1') },
    create: {
      id: seedId('action:NC-2026-0002:1'),
      nonConformityId: seedId('nc:NC-2026-0002'),
      type: ActionType.CORRECTIVA,
      description: 'Acción DEMO para revisar el punto de muestreo.',
      responsibleId: seedId(`user:${Role.OPERARIO}`),
      committedDate: new Date('2026-09-05T00:00:00.000Z'),
      status: ActionStatus.EN_EJECUCION,
    },
    update: { description: 'Acción DEMO para revisar el punto de muestreo.' },
  });
};

const seedTreatedNonConformity = async (tx: SeedTransaction): Promise<void> => {
  await seedTreatedNonConformityRecord(tx);
  await seedCorrectiveAction(tx);
};

export const seedDemoQuality = async (tx: SeedTransaction): Promise<void> => {
  for (const [index, value] of DEMO_VALUES.entries()) {
    await seedMeasurement(tx, value, index);
  }
  await seedOpenNonConformity(tx);
  await seedTreatedNonConformity(tx);
};
