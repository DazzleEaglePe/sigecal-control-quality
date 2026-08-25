import {
  CreateSensoryThresholdRequestSchema,
  CreateStandardRequestSchema,
} from '@sigecal/shared';

import { fieldValue } from '../admin/admin-ui.js';

const optionalText = (form: HTMLFormElement, name: string) =>
  fieldValue(form, name) || undefined;

const optionalNumber = (form: HTMLFormElement, name: string) => {
  const value = fieldValue(form, name);
  return value === '' ? undefined : Number(value);
};

const isChecked = (form: HTMLFormElement, name: string): boolean => {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement && field.checked;
};

export const standardInputFrom = (form: HTMLFormElement) =>
  CreateStandardRequestSchema.parse({
    parameterId: fieldValue(form, 'parameterId'),
    piscoTypeId: optionalText(form, 'piscoTypeId'),
    stageId: optionalText(form, 'stageId'),
    minValue: optionalNumber(form, 'minValue'),
    maxValue: optionalNumber(form, 'maxValue'),
    targetValue: optionalNumber(form, 'targetValue'),
    referenceNorm: optionalText(form, 'referenceNorm'),
    defaultSeverity: fieldValue(form, 'defaultSeverity'),
    isProvisional: isChecked(form, 'isProvisional'),
    validFrom: fieldValue(form, 'validFrom'),
    validTo: optionalText(form, 'validTo'),
  });

export const thresholdInputFrom = (form: HTMLFormElement) =>
  CreateSensoryThresholdRequestSchema.parse({
    piscoTypeId: optionalText(form, 'piscoTypeId'),
    minAverage: Number(fieldValue(form, 'minAverage')),
    defaultSeverity: fieldValue(form, 'defaultSeverity'),
    referenceNorm: optionalText(form, 'referenceNorm'),
    validFrom: fieldValue(form, 'validFrom'),
    validTo: optionalText(form, 'validTo'),
    isProvisional: isChecked(form, 'isProvisional'),
  });
