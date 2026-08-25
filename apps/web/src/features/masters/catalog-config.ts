import {
  CreateEquipmentRequestSchema,
  CreateGrapeVarietyRequestSchema,
  CreateParameterRequestSchema,
  CreatePiscoTypeRequestSchema,
  CreateProcessStageRequestSchema,
  CreateSensoryAttributeRequestSchema,
} from '@sigecal/shared';

import { fieldValue } from '../admin/admin-ui.js';
import type { CatalogKind } from './catalog-api.js';

export const catalogLabels: Readonly<Record<CatalogKind, string>> = {
  varieties: 'Variedades de uva',
  'pisco-types': 'Tipos de pisco',
  stages: 'Etapas del proceso',
  equipment: 'Equipos',
  'sensory-attributes': 'Atributos sensoriales',
  parameters: 'Parámetros de calidad',
};

const optionalField = (form: HTMLFormElement, name: string) =>
  fieldValue(form, name) || undefined;

const commonFields = (form: HTMLFormElement) => ({
  code: fieldValue(form, 'code'),
  name: fieldValue(form, 'name'),
});

const orderedFields = (form: HTMLFormElement) => ({
  ...commonFields(form),
  sequence: Number(fieldValue(form, 'sequence')),
  description: optionalField(form, 'description'),
});

export const catalogInputFrom = (
  kind: CatalogKind,
  form: HTMLFormElement,
): unknown => {
  const common = commonFields(form);
  switch (kind) {
    case 'varieties':
      return CreateGrapeVarietyRequestSchema.parse(common);
    case 'pisco-types':
      return CreatePiscoTypeRequestSchema.parse({
        ...common,
        description: optionalField(form, 'description'),
      });
    case 'stages':
      return CreateProcessStageRequestSchema.parse(orderedFields(form));
    case 'equipment':
      return CreateEquipmentRequestSchema.parse({
        ...common,
        status: fieldValue(form, 'status'),
        lastCalibrationRef: optionalField(form, 'lastCalibrationRef'),
      });
    case 'sensory-attributes':
      return CreateSensoryAttributeRequestSchema.parse(orderedFields(form));
    case 'parameters':
      return CreateParameterRequestSchema.parse({
        ...common,
        unit: fieldValue(form, 'unit'),
        type: fieldValue(form, 'type'),
        testMethod: optionalField(form, 'testMethod'),
        decimals: Number(fieldValue(form, 'decimals')),
      });
  }
};
