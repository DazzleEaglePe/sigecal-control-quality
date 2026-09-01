import { Role, type CreateSensorySessionRequest } from '@sigecal/shared';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../errors/app-error.js';
import type {
  PreparedSensorySession,
  SensoryActor,
  SensoryAttributeRecord,
  SensoryInspection,
  SensoryThresholdRecord,
} from './sensory.types.js';

export const calculateOverallAverage = (
  input: CreateSensorySessionRequest,
): number => {
  const scores = input.panelists.flatMap((panelist) =>
    panelist.scores.map(({ score }) => score),
  );
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

export const ensureCompleteMatrix = (
  input: CreateSensorySessionRequest,
  attributes: readonly SensoryAttributeRecord[],
): void => {
  if (attributes.length === 0)
    throw new ConflictError(
      'No existen atributos sensoriales activos.',
      'NO_SENSORY_ATTRIBUTES',
    );
  const expected = new Set(attributes.map(({ id }) => id));
  const complete = input.panelists.every(
    ({ scores }) =>
      scores.length === expected.size &&
      scores.every(({ attributeId }) => expected.has(attributeId)),
  );
  if (!complete)
    throw new UnprocessableEntityError(
      'Cada panelista debe calificar todos los atributos sensoriales activos.',
      'INCOMPLETE_SENSORY_MATRIX',
    );
};

export const prepareSensoryContext = (
  inspection: SensoryInspection | null,
  threshold: SensoryThresholdRecord | null,
  input: CreateSensorySessionRequest,
  actor: SensoryActor,
  correction = false,
): PreparedSensorySession => {
  if (!inspection)
    throw new NotFoundError('La inspección no existe o no está disponible.');
  if (inspection.type !== 'ORGANOLEPTICO')
    throw new ConflictError(
      'La inspección no es organoléptica.',
      'INVALID_INSPECTION_TYPE',
    );
  if (
    inspection.status !== 'EN_PROCESO' &&
    !(correction && inspection.status === 'COMPLETADA')
  )
    throw new ConflictError(
      'La inspección debe estar en proceso.',
      'INSPECTION_NOT_STARTED',
    );
  ensureRecorder(actor, inspection);
  const effectiveThreshold = ensureEffectiveThreshold(inspection, threshold);
  const overallAverage = calculateOverallAverage(input);
  return {
    inspection,
    threshold: effectiveThreshold,
    overallAverage,
    status:
      overallAverage < Number(effectiveThreshold.minAverage)
        ? 'NO_CONFORME'
        : 'CONFORME',
  };
};

const ensureEffectiveThreshold = (
  inspection: SensoryInspection,
  threshold: SensoryThresholdRecord | null,
): SensoryThresholdRecord => {
  if (!threshold)
    throw new UnprocessableEntityError(
      'No existe un umbral sensorial vigente.',
      'NO_EFFECTIVE_SENSORY_THRESHOLD',
    );
  if (inspection.batch.dataOrigin === 'REAL' && threshold.isProvisional)
    throw new UnprocessableEntityError(
      'Un umbral provisional no puede evaluar un lote real.',
      'PROVISIONAL_STANDARD_FOR_REAL_DATA',
    );
  return threshold;
};

const ensureRecorder = (
  actor: SensoryActor,
  inspection: SensoryInspection,
): void => {
  const denied =
    actor.role === Role.OPERARIO ||
    (actor.role === Role.ANALISTA && inspection.responsibleId !== actor.userId);
  if (denied)
    throw new ForbiddenError(
      'Solo el responsable o la jefatura puede registrar la sesión.',
    );
};
