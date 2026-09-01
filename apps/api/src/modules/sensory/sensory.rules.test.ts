import { describe, expect, it } from 'vitest';
import { Prisma } from '../../generated/prisma/client.js';
import {
  calculateOverallAverage,
  ensureCompleteMatrix,
  prepareSensoryContext,
} from './sensory.rules.js';

const ids = {
  inspection: '11111111-1111-4111-8111-111111111111',
  attribute: '22222222-2222-4222-8222-222222222222',
  user: '33333333-3333-4333-8333-333333333333',
  threshold: '44444444-4444-4444-8444-444444444444',
  batch: '55555555-5555-4555-8555-555555555555',
  pisco: '66666666-6666-4666-8666-666666666666',
  stage: '77777777-7777-4777-8777-777777777777',
};
const input = {
  inspectionId: ids.inspection,
  sessionDate: '2026-11-10',
  panelists: [
    {
      externalName: 'Panel uno',
      scores: [{ attributeId: ids.attribute, score: 3 }],
    },
    {
      externalName: 'Panel dos',
      scores: [{ attributeId: ids.attribute, score: 4 }],
    },
  ],
};
const inspection = {
  id: ids.inspection,
  code: 'INS-2026-0001',
  type: 'ORGANOLEPTICO' as const,
  status: 'EN_PROCESO' as const,
  scheduledDate: new Date('2026-11-10'),
  responsibleId: ids.user,
  stageId: ids.stage,
  batch: {
    id: ids.batch,
    code: 'LT-2026-0001',
    piscoTypeId: ids.pisco,
    dataOrigin: 'REAL' as const,
  },
};
const threshold = {
  id: ids.threshold,
  minAverage: new Prisma.Decimal(3.5),
  defaultSeverity: 'MODERADA' as const,
  referenceNorm: 'Protocolo',
  validFrom: new Date('2026-01-01'),
  isProvisional: false,
  piscoTypeId: ids.pisco,
};

describe('reglas de evaluación sensorial', () => {
  it('calcula el promedio general del producto y aplica el borde inclusivo', () => {
    expect(calculateOverallAverage(input)).toBe(3.5);
    expect(
      prepareSensoryContext(inspection, threshold, input, {
        userId: ids.user,
        role: 'ANALISTA',
      }).status,
    ).toBe('CONFORME');
  });

  it('marca no conforme un promedio inferior al umbral', () => {
    const context = prepareSensoryContext(
      inspection,
      { ...threshold, minAverage: new Prisma.Decimal(3.51) },
      input,
      { userId: ids.user, role: 'ANALISTA' },
    );
    expect(context.status).toBe('NO_CONFORME');
  });

  it('exige una matriz completa por atributo, no promedios por persona', () => {
    expect(() => {
      ensureCompleteMatrix(input, [
        { id: ids.attribute, code: 'AROMA', name: 'Aroma', sequence: 1 },
        { id: ids.stage, code: 'SABOR', name: 'Sabor', sequence: 2 },
      ]);
    }).toThrow(expect.objectContaining({ code: 'INCOMPLETE_SENSORY_MATRIX' }));
  });

  it('bloquea umbrales provisionales para lotes reales', () => {
    expect(() =>
      prepareSensoryContext(
        inspection,
        { ...threshold, isProvisional: true },
        input,
        { userId: ids.user, role: 'ANALISTA' },
      ),
    ).toThrow(
      expect.objectContaining({ code: 'PROVISIONAL_STANDARD_FOR_REAL_DATA' }),
    );
  });
});
