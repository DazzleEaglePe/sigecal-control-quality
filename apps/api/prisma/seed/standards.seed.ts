import { NCSeverity, Role } from '../../src/generated/prisma/enums.js';
import { dateOnly, seedId } from './helpers.js';
import type { SeedTransaction } from './types.js';

const PROVISIONAL_STANDARDS = [
  ['GRAD_ALC', 38, 48, 42],
  ['ACIDEZ_VOL', 0, 1.5, 0.7],
  ['METANOL', 0, 150, 50],
  ['ESTERES', 0, 400, 150],
  ['FURFURAL', 0, 5, 1],
  ['BRIX', 18, 26, 22],
  ['TEMPERATURA', 15, 30, 22],
  ['PH', 2.8, 4.2, 3.5],
] as const;

const PROVISIONAL_REFERENCE = 'DEMO — VALOR PROVISIONAL SIN VALIDEZ NORMATIVA';

const seedProvisionalStandards = async (tx: SeedTransaction): Promise<void> => {
  for (const [code, minValue, maxValue, targetValue] of PROVISIONAL_STANDARDS) {
    await tx.standard.upsert({
      where: { id: seedId(`standard:${code}:GENERAL`) },
      create: {
        id: seedId(`standard:${code}:GENERAL`),
        parameterId: seedId(`parameter:${code}`),
        minValue,
        maxValue,
        targetValue,
        referenceNorm: PROVISIONAL_REFERENCE,
        defaultSeverity: NCSeverity.MODERADA,
        isProvisional: true,
        validFrom: dateOnly('2026-01-01'),
      },
      update: {
        minValue,
        maxValue,
        targetValue,
        referenceNorm: PROVISIONAL_REFERENCE,
        isProvisional: true,
      },
    });
  }
};

const seedSensoryThreshold = async (tx: SeedTransaction): Promise<void> => {
  const id = seedId('sensory-threshold:GENERAL');
  await tx.sensoryThreshold.upsert({
    where: { id },
    create: {
      id,
      minAverage: 3,
      defaultSeverity: NCSeverity.MODERADA,
      referenceNorm: PROVISIONAL_REFERENCE,
      validFrom: dateOnly('2026-01-01'),
      isProvisional: true,
    },
    update: {
      minAverage: 3,
      referenceNorm: PROVISIONAL_REFERENCE,
      isProvisional: true,
    },
  });
};

const seedTemplateHeader = async (tx: SeedTransaction): Promise<void> => {
  const templateId = seedId('template:PURO:2026');
  await tx.inspectionTemplate.upsert({
    where: { code: 'DEMO-PURO-2026' },
    create: {
      id: templateId,
      code: 'DEMO-PURO-2026',
      name: 'Plantilla provisional para demostración',
      piscoTypeId: seedId('pisco-type:PURO'),
      validFrom: dateOnly('2026-01-01'),
      createdById: seedId(`user:${Role.ADMIN}`),
    },
    update: { name: 'Plantilla provisional para demostración', isActive: true },
  });
};

const seedTemplateItem = async (tx: SeedTransaction): Promise<void> => {
  const itemId = seedId('template-item:PURO:BRIX');
  await tx.inspectionTemplateItem.upsert({
    where: { id: itemId },
    create: {
      id: itemId,
      templateId: seedId('template:PURO:2026'),
      stageId: seedId('stage:FERMENTACION'),
      type: 'FISICOQUIMICO',
      offsetDaysFromBatchStart: 3,
      scheduledLocalTime: new Date('1970-01-01T09:00:00.000Z'),
      responsibleRole: Role.ANALISTA,
      equipmentId: seedId('equipment:DEMO-REFR-01'),
    },
    update: { offsetDaysFromBatchStart: 3 },
  });
};

const seedTemplateParameter = async (tx: SeedTransaction): Promise<void> => {
  const itemId = seedId('template-item:PURO:BRIX');
  await tx.inspectionTemplateParameter.upsert({
    where: {
      templateItemId_parameterId: {
        templateItemId: itemId,
        parameterId: seedId('parameter:BRIX'),
      },
    },
    create: {
      id: seedId('template-parameter:PURO:BRIX'),
      templateItemId: itemId,
      parameterId: seedId('parameter:BRIX'),
    },
    update: {},
  });
};

const seedInspectionTemplate = async (tx: SeedTransaction): Promise<void> => {
  await seedTemplateHeader(tx);
  await seedTemplateItem(tx);
  await seedTemplateParameter(tx);
};

export const seedStandards = async (tx: SeedTransaction): Promise<void> => {
  await seedProvisionalStandards(tx);
  await seedSensoryThreshold(tx);
  await seedInspectionTemplate(tx);
};
