import { Role } from '@sigecal/shared';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../errors/app-error.js';
import type {
  ActionReferences,
  CorrectiveActionRecord,
  NonConformityActor,
  NonConformityReferences,
} from './nonconformities.types.js';

export const ensureNCManager = (actor: NonConformityActor): void => {
  const allowed: readonly Role[] = [
    Role.ADMIN,
    Role.JEFE_CALIDAD,
    Role.ANALISTA,
  ];
  if (!allowed.includes(actor.role)) throw new ForbiddenError();
};

export const ensureNCCloser = (actor: NonConformityActor): void => {
  if (actor.role !== Role.ADMIN && actor.role !== Role.JEFE_CALIDAD)
    throw new ForbiddenError(
      'Solo Jefatura de Calidad puede cerrar una no conformidad.',
    );
};

export const ensureActionVerifier = (actor: NonConformityActor): void => {
  if (actor.role !== Role.ADMIN && actor.role !== Role.JEFE_CALIDAD)
    throw new ForbiddenError(
      'Solo Jefatura de Calidad verifica la eficacia de una acción.',
    );
};

export const ensureNCReferences = (
  references: NonConformityReferences,
  requestedStageId: string | null | undefined,
  requestedAssignedToId: string | null | undefined,
  requestedAssignedAreaId: string | null | undefined,
): void => {
  if (!references.batch) throw new NotFoundError('El lote no existe.');
  if (requestedStageId && !references.stage?.isActive)
    throw new NotFoundError('La etapa seleccionada no está activa.');
  if (requestedAssignedToId && !references.assignedTo?.isActive)
    throw new NotFoundError('La persona responsable no está activa.');
  if (requestedAssignedAreaId && !references.assignedArea?.isActive)
    throw new NotFoundError('El área seleccionada no está activa.');
};

export const ensureNCEditable = (status: string): void => {
  if (status === 'CERRADA' || status === 'ANULADA')
    throw new ConflictError(
      'No se puede modificar una no conformidad cerrada o anulada.',
      'NC_ALREADY_CLOSED',
    );
};

export const ensureActionReferences: (
  references: ActionReferences,
) => asserts references is {
  readonly nonConformity: NonNullable<ActionReferences['nonConformity']>;
  readonly responsible: NonNullable<ActionReferences['responsible']>;
} = (references) => {
  if (!references.nonConformity)
    throw new NotFoundError('La no conformidad no existe.');
  ensureNCEditable(references.nonConformity.status);
  if (!references.responsible?.isActive)
    throw new NotFoundError('La persona responsable no está activa.');
};

export const ensureActionExecuted = (action: CorrectiveActionRecord): void => {
  if (action.status !== 'EJECUTADA')
    throw new ConflictError(
      'No se puede verificar una acción no ejecutada.',
      'ACTION_NOT_EXECUTED',
    );
};

export const ensureVerifierDifferentFromResponsible = (
  action: CorrectiveActionRecord,
  actor: NonConformityActor,
): void => {
  if (action.responsibleId === actor.userId)
    throw new ConflictError(
      'La misma persona no puede ejecutar y verificar la acción.',
      'VERIFIER_SAME_AS_RESPONSIBLE',
    );
};

/** RF-M7-13: una acción "sin verificar" es la que aún no pasó por el paso de
 * verificación (pendiente, en ejecución o ejecutada). Una acción NO_EFICAZ ya
 * fue verificada, aunque el resultado exija registrar una nueva acción. */
export const hasUnverifiedActions = (
  actions: readonly CorrectiveActionRecord[],
): boolean =>
  actions.some((action) =>
    ['PENDIENTE', 'EN_EJECUCION', 'EJECUTADA'].includes(action.status),
  );

export const ensureCloseable = (
  status: string,
  actions: readonly CorrectiveActionRecord[],
): void => {
  if (status === 'CERRADA' || status === 'ANULADA')
    throw new ConflictError(
      'La no conformidad ya está cerrada.',
      'NC_ALREADY_CLOSED',
    );
  if (hasUnverifiedActions(actions))
    throw new ConflictError(
      'No se puede cerrar la no conformidad mientras existan acciones sin verificar.',
      'NC_HAS_UNVERIFIED_ACTIONS',
    );
};
