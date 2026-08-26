import type { InspectionItem } from '@sigecal/shared';

import type { InspectionRecord } from './inspections.types.js';

export const toInspectionItem = (record: InspectionRecord): InspectionItem => ({
  id: record.id,
  code: record.code,
  batch: record.batch,
  stage: record.stage,
  type: record.type,
  status: record.status,
  scheduledDate: record.scheduledDate.toISOString(),
  executedAt: record.executedAt?.toISOString() ?? null,
  responsible: record.responsible,
  equipment: record.equipment
    ? {
        id: record.equipment.id,
        code: record.equipment.code,
        name: record.equipment.name,
        status: record.equipment.status,
      }
    : null,
  rescheduledFromId: record.rescheduledFromId,
  rescheduledToId: record.rescheduledTo?.id ?? null,
  changeReason: record.changeReason,
  notes: record.notes,
  createdBy: record.createdBy,
  dataOrigin: record.dataOrigin,
  parameters: record.parameters.map(({ parameter }) => ({
    id: parameter.id,
    code: parameter.code,
    name: parameter.name,
    type: parameter.type,
    unit: parameter.unit,
  })),
  recordedParameterIds: record.results.map((result) => result.parameterId),
});
