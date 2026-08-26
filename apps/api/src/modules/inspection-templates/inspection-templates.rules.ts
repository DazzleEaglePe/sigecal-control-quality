import { Role, type CreateInspectionTemplateRequest } from '@sigecal/shared';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../errors/app-error.js';
import type {
  InspectionTemplateRecord,
  TemplateActor,
  TemplateCatalogReferences,
} from './inspection-templates.types.js';

export const ensureTemplateManager = (actor: TemplateActor): void => {
  if (actor.role !== Role.ADMIN && actor.role !== Role.JEFE_CALIDAD)
    throw new ForbiddenError();
};

const sameIds = (expected: readonly string[], actual: readonly string[]) =>
  expected.length === actual.length &&
  expected.every((id) => actual.includes(id));

export const ensureTemplateReferences = (
  input: CreateInspectionTemplateRequest,
  references: TemplateCatalogReferences,
): void => {
  if (!references.piscoTypeActive)
    throw new NotFoundError('El tipo de pisco no está activo.');
  const stageIds = [...new Set(input.items.map((item) => item.stageId))];
  const equipmentIds = [
    ...new Set(
      input.items.flatMap((item) =>
        item.equipmentId ? [item.equipmentId] : [],
      ),
    ),
  ];
  if (!sameIds(stageIds, references.activeStageIds))
    throw new NotFoundError('Alguna etapa de la plantilla no está activa.');
  if (!sameIds(equipmentIds, references.activeEquipmentIds))
    throw new NotFoundError('Algún equipo de la plantilla no está activo.');
  ensureParameterReferences(input, references);
};

const ensureParameterReferences = (
  input: CreateInspectionTemplateRequest,
  references: TemplateCatalogReferences,
): void => {
  const parameterIds = [
    ...new Set(input.items.flatMap((item) => item.parameterIds)),
  ];
  if (
    references.parameters.length !== parameterIds.length ||
    references.parameters.some((item) => !item.isActive)
  )
    throw new NotFoundError('Algún parámetro de la plantilla no está activo.');
  for (const item of input.items) {
    const expected =
      item.type === 'FISICOQUIMICO' ? 'FISICOQUIMICO' : 'SENSORIAL';
    const invalid = item.parameterIds.some(
      (id) =>
        references.parameters.find((entry) => entry.id === id)?.type !==
        expected,
    );
    if (invalid)
      throw new ConflictError(
        'El tipo de parámetro no corresponde al tipo de inspección.',
        'PARAMETER_TYPE_MISMATCH',
      );
  }
};

export const previousTemplateId = (
  overlaps: readonly InspectionTemplateRecord[],
  validFrom: string,
): string | undefined => {
  if (overlaps.length === 0) return undefined;
  const previous = overlaps[0];
  if (
    overlaps.length === 1 &&
    previous?.validTo === null &&
    previous.validFrom < new Date(`${validFrom}T00:00:00.000Z`)
  )
    return previous.id;
  throw new ConflictError(
    'La vigencia se superpone con otra plantilla del tipo de pisco.',
    'INSPECTION_TEMPLATE_OVERLAP',
  );
};
