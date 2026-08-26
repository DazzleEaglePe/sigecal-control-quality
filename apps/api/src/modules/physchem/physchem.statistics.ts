import type { PhysChemControlChart } from '@sigecal/shared';

import type { PhysChemReadRepositoryPort } from './physchem.types.js';

const MIN_CONTROL_SAMPLE = 8;

type ControlRow = Awaited<
  ReturnType<PhysChemReadRepositoryPort['controlChart']>
>[number];

const average = (values: readonly number[]): number | null =>
  values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;

const sampleDeviation = (
  values: readonly number[],
  centerLine: number | null,
): number | null =>
  values.length >= MIN_CONTROL_SAMPLE && centerLine !== null
    ? Math.sqrt(
        values.reduce((sum, value) => sum + (value - centerLine) ** 2, 0) /
          (values.length - 1),
      )
    : null;

const chartPoint = (
  row: ControlRow,
  lower: number | null,
  upper: number | null,
) => {
  const value = row.value.toNumber();
  return {
    date: row.recordedAt.toISOString().slice(0, 10),
    value,
    batchCode: row.batchCode,
    outOfControl:
      lower !== null && upper !== null ? value < lower || value > upper : false,
  };
};

export const buildControlChart = (
  rows: Awaited<ReturnType<PhysChemReadRepositoryPort['controlChart']>>,
  includesDemo: boolean,
): PhysChemControlChart => {
  const values = rows.map((row) => row.value.toNumber());
  const sampleSize = values.length;
  const centerLine = average(values);
  const sufficientData = sampleSize >= MIN_CONTROL_SAMPLE;
  const deviation = sampleDeviation(values, centerLine);
  const upperControlLimit =
    centerLine !== null && deviation !== null
      ? centerLine + 3 * deviation
      : null;
  const lowerControlLimit =
    centerLine !== null && deviation !== null
      ? centerLine - 3 * deviation
      : null;
  return {
    points: rows.map((row) =>
      chartPoint(row, lowerControlLimit, upperControlLimit),
    ),
    centerLine,
    upperControlLimit,
    lowerControlLimit,
    sampleSize,
    sufficientData,
    includesDemo,
  };
};
