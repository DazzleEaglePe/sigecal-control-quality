import { Role } from '@sigecal/shared';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../errors/app-error.js';
import { Prisma } from '../../generated/prisma/client.js';
import type { StandardRecord } from '../standards/standards.types.js';
import type {
  CorrectionContext,
  EvaluatedMeasurement,
  PhysChemActor,
  PhysChemInspectionContext,
} from './physchem.types.js';

export const ensureResultRecorder = (
  actor: PhysChemActor,
  inspection: PhysChemInspectionContext,
): void => {
  const allowed: readonly Role[] = [
    Role.ADMIN,
    Role.JEFE_CALIDAD,
    Role.ANALISTA,
  ];
  if (!allowed.includes(actor.role)) throw new ForbiddenError();
  if (actor.role === Role.ANALISTA && inspection.responsibleId !== actor.userId)
    throw new ForbiddenError(
      'Solo puede registrar resultados de sus inspecciones asignadas.',
    );
};

export const ensureReadyInspection: (
  inspection: PhysChemInspectionContext | null,
) => asserts inspection is PhysChemInspectionContext = (inspection) => {
  if (!inspection) throw new NotFoundError('La inspección no existe.');
  if (inspection.type !== 'FISICOQUIMICO')
    throw new ConflictError(
      'La inspección no es fisicoquímica.',
      'INVALID_INSPECTION_TYPE',
    );
  if (inspection.status !== 'EN_PROCESO')
    throw new ConflictError(
      'La inspección debe estar en proceso.',
      'INSPECTION_NOT_IN_PROGRESS',
    );
  if (
    !inspection.equipment?.isActive ||
    inspection.equipment.status !== 'OPERATIVO'
  )
    throw new UnprocessableEntityError(
      'El equipo asignado no está operativo.',
      'EQUIPMENT_NOT_OPERATIONAL',
    );
};

export const ensureExpectedParameters = (
  inspection: PhysChemInspectionContext,
  parameterIds: readonly string[],
  rejectRecorded: boolean,
): void => {
  const expected = inspection.parameters.map(({ parameter }) => parameter.id);
  if (parameterIds.some((id) => !expected.includes(id)))
    throw new ConflictError(
      'Se envió un parámetro no esperado para la inspección.',
      'UNEXPECTED_INSPECTION_PARAMETER',
    );
  if (
    rejectRecorded &&
    parameterIds.some((id) =>
      inspection.results.some((result) => result.parameterId === id),
    )
  )
    throw new ConflictError(
      'Algún parámetro ya tiene un resultado final vigente.',
      'PHYS_CHEM_RESULT_EXISTS',
    );
};

const selectStandard = (
  parameterId: string,
  standards: readonly StandardRecord[],
  inspection: PhysChemInspectionContext,
): StandardRecord => {
  const candidates = standards.filter(
    (standard) => standard.parameterId === parameterId,
  );
  const available =
    inspection.batch.dataOrigin === 'REAL'
      ? candidates.filter((standard) => !standard.isProvisional)
      : candidates;
  const selected = [...available].sort((left, right) => {
    const score = (item: StandardRecord) =>
      (item.piscoTypeId ? 2 : 0) + (item.stageId ? 1 : 0);
    return (
      score(right) - score(left) ||
      right.validFrom.getTime() - left.validFrom.getTime()
    );
  })[0];
  if (!selected)
    throw new UnprocessableEntityError(
      `No existe un estándar definitivo vigente para el parámetro ${parameterId}.`,
      'NO_EFFECTIVE_STANDARD',
    );
  return selected;
};

export const evaluateMeasurements = (
  values: readonly {
    readonly parameterId: string;
    readonly value: number;
    readonly observation?: string | null | undefined;
  }[],
  standards: readonly StandardRecord[],
  inspection: PhysChemInspectionContext,
): readonly EvaluatedMeasurement[] =>
  values.map((measurement) => {
    const standard = selectStandard(
      measurement.parameterId,
      standards,
      inspection,
    );
    const value = new Prisma.Decimal(measurement.value);
    const outOfRange =
      (standard.minValue !== null && value.lessThan(standard.minValue)) ||
      (standard.maxValue !== null && value.greaterThan(standard.maxValue));
    return {
      ...measurement,
      status: outOfRange ? 'NO_CONFORME' : 'CONFORME',
      standard,
    };
  });

export const ensureCorrectionContext: (
  context: CorrectionContext,
) => asserts context is CorrectionContext & {
  readonly result: NonNullable<CorrectionContext['result']>;
  readonly inspection: NonNullable<CorrectionContext['inspection']>;
  readonly equipment: NonNullable<CorrectionContext['equipment']>;
} = (context) => {
  if (!context.result || !context.inspection)
    throw new NotFoundError('El resultado no existe o no está a su alcance.');
  if (context.result.status === 'ANULADO' || context.result.replacement)
    throw new ConflictError(
      'El resultado ya fue anulado o reemplazado.',
      'PHYS_CHEM_RESULT_ALREADY_CORRECTED',
    );
  if (!context.equipment?.isActive || context.equipment.status !== 'OPERATIVO')
    throw new UnprocessableEntityError(
      'El equipo indicado no está operativo.',
      'EQUIPMENT_NOT_OPERATIONAL',
    );
};
