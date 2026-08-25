import { Role, type UpdateBatchRequest } from '@sigecal/shared';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../errors/app-error.js';
import type {
  BatchActor,
  BatchRecord,
  BatchSortField,
  CatalogRecord,
} from './batches.types.js';
import { BATCH_SORT_FIELDS } from './batches.types.js';

interface CompositionItem {
  readonly varietyId: string;
  readonly percentage?: number | undefined;
}

export const ensureOperationRole = (actor: BatchActor): void => {
  if (
    actor.role !== Role.ADMIN &&
    actor.role !== Role.JEFE_CALIDAD &&
    actor.role !== Role.OPERARIO
  )
    throw new ForbiddenError();
};

export const ensureDecisionRole = (actor: BatchActor): void => {
  if (actor.role !== Role.ADMIN && actor.role !== Role.JEFE_CALIDAD)
    throw new ForbiddenError();
};

export const ensureMutable = (batch: BatchRecord): void => {
  if (batch.status === 'CERRADO' || batch.status === 'RECHAZADO')
    throw new ConflictError(
      'El lote está en un estado terminal.',
      'BATCH_NOT_MUTABLE',
    );
};

export const selectSort = (requested?: string): BatchSortField =>
  BATCH_SORT_FIELDS.includes(requested as BatchSortField)
    ? (requested as BatchSortField)
    : 'createdAt';

export const currentComposition = (
  batch: BatchRecord,
): readonly CompositionItem[] =>
  batch.varieties.map((item) => ({
    varietyId: item.variety.id,
    ...(item.percentage === null
      ? {}
      : { percentage: item.percentage.toNumber() }),
  }));

export const identityChanges = (input: UpdateBatchRequest): boolean =>
  input.piscoTypeId !== undefined ||
  input.varieties !== undefined ||
  input.startDate !== undefined;

export const ensureIdentityNotFrozen = (
  batch: BatchRecord,
  input: UpdateBatchRequest,
): void => {
  if (
    identityChanges(input) &&
    (batch.currentStage.sequence > 1 || batch.hasInspections)
  )
    throw new ConflictError(
      'El tipo, las variedades y la fecha inicial ya están congelados.',
      'BATCH_IDENTITY_FROZEN',
    );
};

export const ensureActiveCatalogs = (
  piscoType: CatalogRecord | null,
  varieties: readonly CatalogRecord[],
  requestedIds: readonly string[],
): CatalogRecord => {
  if (!piscoType?.isActive)
    throw new NotFoundError('El tipo de pisco seleccionado no está activo.');
  if (
    varieties.length !== requestedIds.length ||
    varieties.some((item) => !item.isActive)
  )
    throw new NotFoundError('Alguna variedad seleccionada no está activa.');
  return piscoType;
};

export const ensureCompositionForType = (
  piscoCode: string,
  varieties: readonly CompositionItem[],
): void => {
  if (piscoCode === 'PURO' && varieties.length !== 1)
    throw new ConflictError(
      'Un pisco puro debe tener exactamente una variedad.',
      'INVALID_PISCO_COMPOSITION',
    );
  if (piscoCode === 'ACHOLADO' && varieties.length < 2)
    throw new ConflictError(
      'Un pisco acholado debe tener al menos dos variedades.',
      'INVALID_PISCO_COMPOSITION',
    );
};
