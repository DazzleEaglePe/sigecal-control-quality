import type { ReportsDashboard } from '@sigecal/shared';

import { limaMonth } from './reports.time.js';
import type {
  BatchStageMetricRecord,
  InspectionMetricRecord,
  NonConformityMetricRecord,
  ReportRange,
  ReportsDataset,
  ResultMetricRecord,
} from './reports.types.js';

const HOUR_MS = 3_600_000;
const round = (value: number, digits = 1): number =>
  Number(value.toFixed(digits));
const rate = (part: number, total: number): number | null =>
  total === 0 ? null : round((part / total) * 100);
const isRealEnough = (
  record: { readonly dataOrigin: 'REAL' | 'DEMO' },
  includeDemo: boolean,
): boolean => includeDemo || record.dataOrigin === 'REAL';
const inPeriod = (date: Date, range: ReportRange): boolean =>
  date >= range.from && date < range.toExclusive;

const conformity = (
  rows: readonly ResultMetricRecord[],
  range: ReportRange,
): ReportsDashboard['conformityRate'] => {
  const eligible = rows.filter(
    (row) =>
      isRealEnough(row, range.includeDemo) && inPeriod(row.recordedAt, range),
  );
  const conforming = eligible.filter((row) => row.status === 'CONFORME').length;
  const byKind = (kind: ResultMetricRecord['kind']) => {
    const values = eligible.filter((row) => row.kind === kind);
    return rate(
      values.filter((row) => row.status === 'CONFORME').length,
      values.length,
    );
  };
  const covered = eligible.filter((row) => row.covered).length;
  return {
    value: rate(conforming, eligible.length),
    conforming,
    total: eligible.length,
    physchem: byKind('physchem'),
    sensory: byKind('sensory'),
    standardCoverage: {
      value: rate(covered, eligible.length),
      covered,
      total: eligible.length,
    },
  };
};

const schedule = (
  rows: readonly InspectionMetricRecord[],
  range: ReportRange,
): ReportsDashboard['scheduleCompliance'] => {
  const dueLimit =
    range.now < range.toExclusive ? range.now : range.toExclusive;
  const due = rows.filter(
    (row) =>
      isRealEnough(row, range.includeDemo) &&
      inPeriod(row.scheduledDate, range) &&
      row.scheduledDate < dueLimit &&
      !['CANCELADA', 'REPROGRAMADA'].includes(row.status),
  );
  const completed = due.filter(
    (row) => row.status === 'COMPLETADA' && row.executedAt !== null,
  );
  const onTime = completed.filter(
    (row) => row.executedAt !== null && row.executedAt <= row.scheduledDate,
  ).length;
  const late = completed.length - onTime;
  return {
    value: rate(onTime, due.length),
    onTime,
    due: due.length,
    late,
    overdue: due.length - completed.length,
  };
};

const responseTime = (
  rows: readonly NonConformityMetricRecord[],
  range: ReportRange,
): ReportsDashboard['avgResponseTime'] => {
  const eligible = rows.filter(
    (row) =>
      isRealEnough(row, range.includeDemo) &&
      row.annulledAt === null &&
      inPeriod(row.detectedAt, range),
  );
  const attended = eligible.filter((row) => row.attentionStartedAt !== null);
  const hours = attended.map(
    (row) =>
      ((row.attentionStartedAt?.getTime() ?? row.detectedAt.getTime()) -
        row.detectedAt.getTime()) /
      HOUR_MS,
  );
  const unattended = eligible.filter((row) => row.attentionStartedAt === null);
  const oldest = unattended.reduce<number | null>((current, row) => {
    const age = Math.max(
      0,
      (range.now.getTime() - row.detectedAt.getTime()) / HOUR_MS,
    );
    return current === null || age > current ? age : current;
  }, null);
  return {
    hours:
      hours.length === 0
        ? null
        : round(hours.reduce((a, b) => a + b, 0) / hours.length, 2),
    attended: attended.length,
    unattended: unattended.length,
    oldestUnattendedHours: oldest === null ? null : round(oldest, 2),
  };
};

const openNonConformities = (
  rows: readonly NonConformityMetricRecord[],
  range: ReportRange,
): ReportsDashboard['openNonConformities'] => {
  const counts = { LEVE: 0, MODERADA: 0, CRITICA: 0 };
  for (const row of rows) {
    const openAtCutoff =
      row.detectedAt < range.toExclusive &&
      (row.closedAt === null || row.closedAt >= range.toExclusive) &&
      (row.annulledAt === null || row.annulledAt >= range.toExclusive);
    if (isRealEnough(row, range.includeDemo) && openAtCutoff)
      counts[row.severity] += 1;
  }
  return counts;
};

const activeByStage = (
  rows: readonly BatchStageMetricRecord[],
  range: ReportRange,
): ReportsDashboard['activeBatchesByStage'] => {
  const active = rows.filter(
    (row) =>
      isRealEnough(row, range.includeDemo) &&
      !['CERRADO', 'RECHAZADO'].includes(row.batchStatus) &&
      row.startedAt < range.toExclusive &&
      (row.finishedAt === null || row.finishedAt >= range.toExclusive),
  );
  const groups = new Map<
    string,
    ReportsDashboard['activeBatchesByStage'][number]
  >();
  for (const row of active) {
    const current = groups.get(row.stageId);
    groups.set(row.stageId, {
      stageId: row.stageId,
      stageName: row.stageName,
      sequence: row.stageSequence,
      count: (current?.count ?? 0) + 1,
      inObservation:
        (current?.inObservation ?? 0) +
        (row.batchStatus === 'EN_OBSERVACION' ? 1 : 0),
    });
  }
  return [...groups.values()].sort((a, b) => a.sequence - b.sequence);
};

const ncByStage = (
  rows: readonly NonConformityMetricRecord[],
  range: ReportRange,
): ReportsDashboard['ncByStage'] => {
  const groups = new Map<string, ReportsDashboard['ncByStage'][number]>();
  for (const row of rows) {
    if (
      !isRealEnough(row, range.includeDemo) ||
      row.annulledAt !== null ||
      !inPeriod(row.detectedAt, range)
    )
      continue;
    const key = row.stageId ?? 'without-stage';
    const current = groups.get(key);
    groups.set(key, {
      stageId: row.stageId,
      stageName: row.stageName ?? 'Sin etapa',
      sequence: row.stageSequence,
      count: (current?.count ?? 0) + 1,
    });
  }
  return [...groups.values()].sort(
    (a, b) =>
      (a.sequence ?? Number.MAX_SAFE_INTEGER) -
      (b.sequence ?? Number.MAX_SAFE_INTEGER),
  );
};

const conformityTrend = (
  rows: readonly ResultMetricRecord[],
  range: ReportRange,
): ReportsDashboard['conformityTrend'] => {
  const groups = new Map<string, { conforming: number; sampleSize: number }>();
  for (const row of rows) {
    if (
      !isRealEnough(row, range.includeDemo) ||
      !inPeriod(row.recordedAt, range)
    )
      continue;
    const month = limaMonth(row.recordedAt);
    const current = groups.get(month) ?? { conforming: 0, sampleSize: 0 };
    groups.set(month, {
      conforming: current.conforming + (row.status === 'CONFORME' ? 1 : 0),
      sampleSize: current.sampleSize + 1,
    });
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, value]) => ({
      month,
      ...value,
      rate: rate(value.conforming, value.sampleSize),
    }));
};

export const calculateDashboard = (
  dataset: ReportsDataset,
  range: ReportRange,
): Omit<ReportsDashboard, 'period' | 'includesDemo'> => ({
  conformityRate: conformity(dataset.results, range),
  scheduleCompliance: schedule(dataset.inspections, range),
  avgResponseTime: responseTime(dataset.nonConformities, range),
  openNonConformities: openNonConformities(dataset.nonConformities, range),
  activeBatchesByStage: activeByStage(dataset.batchStages, range),
  ncByStage: ncByStage(dataset.nonConformities, range),
  conformityTrend: conformityTrend(dataset.results, range),
});
