import type { SensoryProfile, SensorySessionItem } from '@sigecal/shared';
import type { SensorySessionRecord } from './sensory.types.js';

const date = (value: Date): string => value.toISOString().slice(0, 10);
const thresholdView = (record: SensorySessionRecord) => ({
  id: record.sensoryThreshold.id,
  minAverage: record.sensoryThreshold.minAverage.toString(),
  referenceNorm: record.sensoryThreshold.referenceNorm,
  validFrom: date(record.sensoryThreshold.validFrom),
  isProvisional: record.sensoryThreshold.isProvisional,
});
const panelistsView = (record: SensorySessionRecord) =>
  record.panelists.map((panelist) => ({
    id: panelist.id,
    user: panelist.user,
    externalName: panelist.externalName,
    scores: panelist.scores.map(({ attribute, score, descriptor }) => ({
      attribute: {
        id: attribute.id,
        code: attribute.code,
        name: attribute.name,
      },
      score,
      descriptor,
    })),
  }));

export const toSensorySession = (
  record: SensorySessionRecord,
): SensorySessionItem => ({
  id: record.id,
  inspection: { id: record.inspection.id, code: record.inspection.code },
  batch: record.inspection.batch,
  sessionDate: date(record.sessionDate),
  overallAverage: record.overallAverage.toString(),
  threshold: thresholdView(record),
  appliedThreshold: record.appliedThreshold.toString(),
  status: record.status,
  defectsFound: record.defectsFound,
  notes: record.notes,
  recordedBy: record.recordedBy,
  recordedAt: record.recordedAt.toISOString(),
  dataOrigin: record.dataOrigin,
  annulledBy: record.annulledBy,
  annulledAt: record.annulledAt?.toISOString() ?? null,
  annulReason: record.annulReason,
  replacesId: record.replacesId,
  replacementId: record.replacement?.id ?? null,
  panelists: panelistsView(record),
  nonConformity: record.nonConformity,
});

interface AttributeTotal {
  readonly attribute: {
    readonly id: string;
    readonly code: string;
    readonly name: string;
  };
  readonly total: number;
  readonly count: number;
  readonly sequence: number;
}
const attributeTotals = (record: SensorySessionRecord) => {
  const totals = new Map<string, AttributeTotal>();
  for (const panelist of record.panelists)
    for (const item of panelist.scores) {
      const current = totals.get(item.attribute.id);
      totals.set(
        item.attribute.id,
        current
          ? {
              ...current,
              total: current.total + item.score,
              count: current.count + 1,
            }
          : {
              attribute: {
                id: item.attribute.id,
                code: item.attribute.code,
                name: item.attribute.name,
              },
              total: item.score,
              count: 1,
              sequence: item.attribute.sequence,
            },
      );
    }
  return [...totals.values()]
    .sort((a, b) => a.sequence - b.sequence)
    .map(({ attribute, total, count }) => ({
      attribute,
      average: total / count,
    }));
};

export const toSensoryProfile = (
  record: SensorySessionRecord,
): SensoryProfile => ({
  sessionId: record.id,
  batchCode: record.inspection.batch.code,
  overallAverage: Number(record.overallAverage),
  status: record.status,
  points: attributeTotals(record),
});
