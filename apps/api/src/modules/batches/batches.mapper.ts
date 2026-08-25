import type { BatchItem, BatchTimelineEntry } from '@sigecal/shared';

import type {
  BatchRecord,
  TimelineNCRecord,
  TimelineRecords,
} from './batches.types.js';

const dateText = (date: Date): string => date.toISOString().slice(0, 10);
const dateTime = (date: Date | null): string | null =>
  date ? date.toISOString() : null;

export const toBatchItem = (record: BatchRecord): BatchItem => ({
  id: record.id,
  code: record.code,
  piscoType: record.piscoType,
  currentStage: record.currentStage,
  status: record.status,
  startDate: dateText(record.startDate),
  closeDate: record.closeDate ? dateText(record.closeDate) : null,
  rejectedAt: dateTime(record.rejectedAt),
  rejectedBy: record.rejectedBy,
  rejectionReason: record.rejectionReason,
  volumeLiters: record.volumeLiters.toString(),
  harvestOrigin: record.harvestOrigin,
  notes: record.notes,
  createdBy: record.createdBy,
  dataOrigin: record.dataOrigin,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
  varieties: record.varieties.map((item) => ({
    variety: item.variety,
    percentage: item.percentage?.toString() ?? null,
  })),
  openNonConformities: record.openNonConformities,
  hasInspections: record.hasInspections,
});

const ncStage = (item: TimelineNCRecord, currentStageId: string): string =>
  item.stageId ?? item.inspectionStageId ?? currentStageId;

export const toTimeline = (
  records: TimelineRecords,
  currentStageId: string,
): readonly BatchTimelineEntry[] =>
  records.stages.map((stage) => {
    const visit = records.visits.find((item) => item.stageId === stage.id);
    return {
      stage,
      state: visit?.finishedAt ? 'COMPLETED' : visit ? 'CURRENT' : 'PENDING',
      startedAt: dateTime(visit?.startedAt ?? null),
      finishedAt: dateTime(visit?.finishedAt ?? null),
      responsible: visit?.responsible ?? null,
      observations: visit?.observations ?? null,
      inspections: records.inspections
        .filter((item) => item.stageId === stage.id)
        .map((item) => ({
          id: item.id,
          code: item.code,
          type: item.type,
          status: item.status,
          scheduledDate: item.scheduledDate.toISOString(),
        })),
      nonConformities: records.nonConformities
        .filter((item) => ncStage(item, currentStageId) === stage.id)
        .map((item) => ({
          id: item.id,
          code: item.code,
          status: item.status,
          severity: item.severity,
          description: item.description,
        })),
    };
  });
