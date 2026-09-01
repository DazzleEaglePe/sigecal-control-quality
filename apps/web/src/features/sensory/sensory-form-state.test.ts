import { describe, expect, it } from 'vitest';
import {
  attributeAverage,
  generalAverage,
  type PanelistDraft,
} from './sensory-form-state.js';

const attribute = '11111111-1111-4111-8111-111111111111';
const preparation = {
  attributes: [{ id: attribute, code: 'AROMA', name: 'Aroma' }],
  threshold: {
    id: '22222222-2222-4222-8222-222222222222',
    minAverage: '3.50',
    referenceNorm: null,
    validFrom: '2026-01-01',
    isProvisional: false,
  },
};
const panelists: readonly PanelistDraft[] = [
  {
    key: 'a',
    kind: 'external',
    identity: 'Panel A',
    scores: { [attribute]: 3 },
    descriptors: {},
  },
  {
    key: 'b',
    kind: 'external',
    identity: 'Panel B',
    scores: { [attribute]: 5 },
    descriptors: {},
  },
];

describe('promedios sensoriales en el formulario', () => {
  it('calcula por atributo y por producto, nunca por panelista', () => {
    expect(attributeAverage(panelists, attribute)).toBe(4);
    expect(generalAverage(panelists, preparation)).toBe(4);
  });

  it('no muestra promedio hasta completar toda la matriz', () => {
    const [first, second] = panelists;
    if (!first || !second) throw new Error('Faltan datos de prueba.');
    expect(
      generalAverage([{ ...first, scores: {} }, second], preparation),
    ).toBeNull();
  });
});
