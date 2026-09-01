import { describe, expect, it } from 'vitest';

import {
  CloseNonConformityRequestSchema,
  CreateNonConformityRequestSchema,
} from './nonconformities.schemas.js';

const id = (number: number): string =>
  `${String(number).padStart(8, '0')}-1111-4111-a111-111111111111`;

describe('contrato de cierre de no conformidades', () => {
  it('exige un comentario de cierre no vacío', () => {
    expect(CloseNonConformityRequestSchema.safeParse({}).success).toBe(false);
    expect(
      CloseNonConformityRequestSchema.safeParse({ closeComment: '   ' })
        .success,
    ).toBe(false);
  });

  it('acepta el comentario de cierre recortado', () => {
    const parsed = CloseNonConformityRequestSchema.parse({
      closeComment: '  Resuelto tras reemplazar la válvula.  ',
    });
    expect(parsed.closeComment).toBe('Resuelto tras reemplazar la válvula.');
  });
});

describe('registro manual de no conformidades', () => {
  it('exige lote, descripción y severidad', () => {
    expect(
      CreateNonConformityRequestSchema.safeParse({
        batchId: id(1),
        description: 'Fuga en la línea de fermentación.',
        severity: 'MODERADA',
      }).success,
    ).toBe(true);
    expect(
      CreateNonConformityRequestSchema.safeParse({ batchId: id(1) }).success,
    ).toBe(false);
  });
});
