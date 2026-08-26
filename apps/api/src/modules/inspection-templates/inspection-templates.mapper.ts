import type { InspectionTemplateItem } from '@sigecal/shared';

import type { InspectionTemplateRecord } from './inspection-templates.types.js';

const dateOnly = (value: Date): string => value.toISOString().slice(0, 10);
const localTime = (value: Date): string => value.toISOString().slice(11, 19);

export const toInspectionTemplateItem = (
  record: InspectionTemplateRecord,
): InspectionTemplateItem => ({
  id: record.id,
  code: record.code,
  name: record.name,
  piscoType: record.piscoType,
  validFrom: dateOnly(record.validFrom),
  validTo: record.validTo ? dateOnly(record.validTo) : null,
  isActive: record.isActive,
  createdBy: record.createdBy,
  items: record.items.map((item) => ({
    id: item.id,
    stage: item.stage,
    type: item.type,
    offsetDaysFromBatchStart: item.offsetDaysFromBatchStart,
    scheduledLocalTime: localTime(item.scheduledLocalTime),
    responsibleRole: item.responsibleRole,
    equipment: item.equipment,
    parameters: item.parameters.map((entry) => entry.parameter),
  })),
});
