import type { PhysChemResultItem, PhysChemValidation } from '@sigecal/shared';

import type {
  EvaluatedMeasurement,
  PhysChemResultRecord,
} from './physchem.types.js';

const standardItem = (record: EvaluatedMeasurement['standard']) => ({
  id: record.id,
  minValue: record.minValue?.toString() ?? null,
  maxValue: record.maxValue?.toString() ?? null,
  targetValue: record.targetValue?.toString() ?? null,
  referenceNorm: record.referenceNorm,
});

export const toValidation = (
  measurement: EvaluatedMeasurement,
): PhysChemValidation => ({
  parameterId: measurement.parameterId,
  value: measurement.value,
  status: measurement.status,
  standard: standardItem(measurement.standard),
});

export const toPhysChemResult = (
  record: PhysChemResultRecord,
): PhysChemResultItem => ({
  id: record.id,
  inspection: record.inspection,
  batch: record.batch,
  parameter: {
    id: record.parameter.id,
    code: record.parameter.code,
    name: record.parameter.name,
    unit: record.parameter.unit,
  },
  standard: standardItem(record.standard),
  value: record.value.toString(),
  status: record.status,
  observation: record.observation,
  equipment: record.equipment,
  calibrationRef: record.calibrationRef,
  recordedBy: record.recordedBy,
  recordedAt: record.recordedAt.toISOString(),
  dataOrigin: record.dataOrigin,
  annulledBy: record.annulledBy,
  annulledAt: record.annulledAt?.toISOString() ?? null,
  annulReason: record.annulReason,
  replacesId: record.replacesId,
  replacementId: record.replacement?.id ?? null,
  nonConformity: record.nonConformity,
});
