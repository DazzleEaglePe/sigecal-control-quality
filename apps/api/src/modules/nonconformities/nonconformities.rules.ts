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
  requestedReplacementId?: string,
) => asserts references is {
  readonly nonConformity: NonNullable<ActionReferences['nonConformity']>;
  readonly responsible: NonNullable<ActionReferences['responsible']>;
  readonly replacesAction: ActionReferences['replacesAction'];
} = (references, requestedReplacementId) => {
  if (!references.nonConformity)
    throw new NotFoundError('La no conformidad no existe.');
  ensureNCEditable(references.nonConformity.status);
  if (!references.responsible?.isActive)
    throw new NotFoundError('La persona responsable no está activa.');
  if (requestedReplacementId && !references.replacesAction)
    throw new NotFoundError('La acción que desea reemplazar no existe.');
  if (
    references.replacesAction &&
    (references.replacesAction.nonConformityId !==
      references.nonConformity.id ||
      references.replacesAction.status !== 'NO_EFICAZ')
  )
    throw new ConflictError(
      'Solo puede reemplazar una acción no eficaz de la misma no conformidad.',
      'INVALID_ACTION_REPLACEMENT',
    );
  if (references.replacesAction?.replacementAction)
    throw new ConflictError(
      'La acción no eficaz ya tiene una acción de reemplazo.',
      'ACTION_ALREADY_REPLACED',
    );
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

/** RF-M7-13: verificar sin eficacia no resuelve la no conformidad. */
const actionResolved = (
  action: Pick<CorrectiveActionRecord, 'id' | 'status' | 'replacesActionId'>,
  actions: readonly Pick<
    CorrectiveActionRecord,
    'id' | 'status' | 'replacesActionId'
  >[],
): boolean => {
  if (action.status === 'VERIFICADA') return true;
  if (action.status !== 'NO_EFICAZ') return false;
  const replacement = actions.find(
    (candidate) => candidate.replacesActionId === action.id,
  );
  return replacement ? actionResolved(replacement, actions) : false;
};

export const hasUnverifiedActions = (
  actions: readonly Pick<
    CorrectiveActionRecord,
    'id' | 'status' | 'replacesActionId'
  >[],
): boolean => actions.some((action) => !actionResolved(action, actions));

export const ensureCloseable = (
  status: string,
  actions: readonly Pick<
    CorrectiveActionRecord,
    'id' | 'status' | 'replacesActionId'
  >[],
): void => {
  if (status === 'CERRADA' || status === 'ANULADA')
    throw new ConflictError(
      'La no conformidad ya está cerrada.',
      'NC_ALREADY_CLOSED',
    );
  if (actions.length === 0 || hasUnverifiedActions(actions))
    throw new ConflictError(
      'El cierre requiere al menos una acción y todas deben estar verificadas como eficaces.',
      'NC_HAS_UNVERIFIED_ACTIONS',
    );
};
