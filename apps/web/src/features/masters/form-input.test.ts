import { describe, expect, it } from 'vitest';

import { catalogInputFrom } from './catalog-config.js';
import {
  standardInputFrom,
  thresholdInputFrom,
} from './standard-form-input.js';

interface FieldDefinition {
  readonly name: string;
  readonly value?: string;
  readonly checked?: boolean;
}

const formWith = (definitions: readonly FieldDefinition[]): HTMLFormElement => {
  const form = document.createElement('form');
  definitions.forEach((definition) => {
    const input = document.createElement('input');
    input.name = definition.name;
    input.value = definition.value ?? '';
    if (definition.checked !== undefined) {
      input.type = 'checkbox';
      input.checked = definition.checked;
    }
    form.append(input);
  });
  return form;
};

describe('entradas de catálogos maestros', () => {
  it('convierte secuencias y conserva los campos opcionales', () => {
    const form = formWith([
      { name: 'code', value: 'fermentacion' },
      { name: 'name', value: 'Fermentación' },
      { name: 'sequence', value: '3' },
      { name: 'description', value: '' },
    ]);
    expect(catalogInputFrom('stages', form)).toEqual({
      code: 'FERMENTACION',
      name: 'Fermentación',
      sequence: 3,
      description: undefined,
    });
  });

  it('valida los datos específicos de un parámetro', () => {
    const form = formWith([
      { name: 'code', value: 'alcohol' },
      { name: 'name', value: 'Grado alcohólico' },
      { name: 'unit', value: '% v/v' },
      { name: 'type', value: 'FISICOQUIMICO' },
      { name: 'decimals', value: '2' },
      { name: 'testMethod', value: 'Método confirmado' },
    ]);
    expect(catalogInputFrom('parameters', form)).toMatchObject({
      code: 'ALCOHOL',
      decimals: 2,
      type: 'FISICOQUIMICO',
    });
  });
});

describe('entradas de estándares y umbrales', () => {
  it('omite límites vacíos y mantiene el estándar como provisional', () => {
    const form = formWith([
      { name: 'parameterId', value: '11111111-1111-4111-a111-111111111111' },
      { name: 'piscoTypeId' },
      { name: 'stageId' },
      { name: 'minValue', value: '38' },
      { name: 'maxValue' },
      { name: 'targetValue' },
      { name: 'referenceNorm' },
      { name: 'defaultSeverity', value: 'MODERADA' },
      { name: 'isProvisional', checked: true },
      { name: 'validFrom', value: '2026-08-24' },
      { name: 'validTo' },
    ]);
    expect(standardInputFrom(form)).toMatchObject({
      minValue: 38,
      maxValue: undefined,
      isProvisional: true,
    });
  });

  it('convierte el promedio sensorial sin asociarlo a una persona', () => {
    const form = formWith([
      { name: 'piscoTypeId' },
      { name: 'minAverage', value: '3.75' },
      { name: 'defaultSeverity', value: 'LEVE' },
      { name: 'referenceNorm' },
      { name: 'validFrom', value: '2026-08-24' },
      { name: 'validTo' },
      { name: 'isProvisional', checked: true },
    ]);
    expect(thresholdInputFrom(form)).toMatchObject({
      minAverage: 3.75,
      isProvisional: true,
    });
  });
});
