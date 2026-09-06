import type {
  CorrectiveActionItem,
  NonConformityDetail,
  NonConformityItem,
} from '@sigecal/shared';

import type {
  CorrectiveActionRecord,
  NonConformityDetailRecord,
  NonConformityRecord,
} from './nonconformities.types.js';

const MILLISECONDS_PER_HOUR = 3_600_000;

const hoursBetween = (from: Date, to: Date | null): number | null =>
  to === null
    ? null
    : Math.round(
        ((to.getTime() - from.getTime()) / MILLISECONDS_PER_HOUR) * 100,
      ) / 100;

export const toNonConformityItem = (
  record: NonConformityRecord,
): NonConformityItem => ({
  id: record.id,
  code: record.code,
  batch: record.batch,
  stage: record.stage,
  inspectionId: record.inspectionId,
  physChemResultId: record.physChemResultId,
  sensorySessionId: record.sensorySessionId,
  origin: record.origin,
  severity: record.severity,
  status: record.status,
  description: record.description,
  rootCause: record.rootCause,
  detectedAt: record.detectedAt.toISOString(),
  detectedBy: record.detectedBy,
  assignedTo: record.assignedTo,
  assignedArea: record.assignedArea,
  attentionStartedAt: record.attentionStartedAt?.toISOString() ?? null,
  responseTimeHours: hoursBetween(record.detectedAt, record.attentionStartedAt),
  closedAt: record.closedAt?.toISOString() ?? null,
  closedBy: record.closedBy,
  closeComment: record.closeComment,
  closureTimeHours: hoursBetween(record.detectedAt, record.closedAt),
  annulledAt: record.annulledAt?.toISOString() ?? null,
  annulledBy: record.annulledBy,
  annulReason: record.annulReason,
  dataOrigin: record.dataOrigin,
});

export const toCorrectiveActionItem = (
  record: CorrectiveActionRecord,
): CorrectiveActionItem => ({
  id: record.id,
  nonConformityId: record.nonConformityId,
  type: record.type,
  description: record.description,
  responsible: record.responsible,
  committedDate: record.committedDate.toISOString().slice(0, 10),
  executedAt: record.executedAt?.toISOString() ?? null,
  status: record.status,
  isEffective: record.isEffective,
  verifiedBy: record.verifiedBy,
  verifiedAt: record.verifiedAt?.toISOString() ?? null,
  verificationComment: record.verificationComment,
  replacesActionId: record.replacesActionId,
});

export const toNonConformityDetail = (
  record: NonConformityDetailRecord,
): NonConformityDetail => ({
  ...toNonConformityItem(record.nonConformity),
  actions: record.actions.map(toCorrectiveActionItem),
});
