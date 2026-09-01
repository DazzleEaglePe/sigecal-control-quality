import { describe, expect, it } from 'vitest';

import {
  CreateSensorySessionRequestSchema,
  SensoryCompareQuerySchema,
} from './sensory.schemas.js';

const id = (digit: number) =>
  `00000000-0000-4000-8000-00000000000${String(digit)}`;

describe('contrato sensorial', () => {
  it('acepta una matriz completa con escala de 1 a 5', () => {
    const result = CreateSensorySessionRequestSchema.safeParse({
      inspectionId: id(1),
      sessionDate: '2026-11-10',
      panelists: [
        {
          externalName: 'Panelista externo',
          scores: [{ attributeId: id(2), score: 5 }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rechaza puntajes fuera de escala y atributos duplicados', () => {
    const result = CreateSensorySessionRequestSchema.safeParse({
      inspectionId: id(1),
      sessionDate: '2026-11-10',
      panelists: [
        {
          externalName: 'Panelista externo',
          scores: [
            { attributeId: id(2), score: 6 },
            { attributeId: id(2), score: 4 },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('exige al menos dos sesiones para comparar perfiles', () => {
    expect(
      SensoryCompareQuerySchema.safeParse({ sessionIds: id(1) }).success,
    ).toBe(false);
    expect(
      SensoryCompareQuerySchema.parse({ sessionIds: `${id(1)},${id(2)}` })
        .sessionIds,
    ).toHaveLength(2);
  });
});
