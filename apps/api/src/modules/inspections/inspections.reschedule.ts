import type { RescheduleInspectionRequest } from '@sigecal/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import {
  inspectionAuditSelection,
  inspectionAuditView,
  writeInspectionAudit,
} from './inspections.audit.js';
import {
  auditCreatedInspection,
  invalidInspectionTransition,
  nextInspectionCode,
} from './inspections.persistence.js';
import type { InspectionRecord } from './inspections.types.js';

const replacementData = (
  current: InspectionRecord,
  input: RescheduleInspectionRequest,
  code: string,
  actorId: string,
) => ({
  code,
  batchId: current.batchId,
  stageId: current.stageId,
  type: current.type,
  scheduledDate: new Date(input.newDate),
  responsibleId: current.responsibleId,
  equipmentId: current.equipmentId,
  rescheduledFromId: current.id,
  notes: current.notes,
  createdById: actorId,
  dataOrigin: current.dataOrigin,
  parameters: {
    create: current.parameters.map(({ parameter }) => ({
      parameterId: parameter.id,
    })),
  },
});

const auditReschedule = async (
  tx: Prisma.TransactionClient,
  current: InspectionRecord,
  replacementId: string,
  actorId: string,
  ipAddress?: string,
): Promise<void> => {
  const after = await tx.inspection.findUniqueOrThrow({
    where: { id: current.id },
    select: inspectionAuditSelection,
  });
  await writeInspectionAudit(tx, {
    userId: actorId,
    action: AuditAction.STATE_CHANGE,
    entityId: current.id,
    before: inspectionAuditView(current),
    after: inspectionAuditView(after),
    ipAddress,
  });
  await auditCreatedInspection(tx, replacementId, actorId, ipAddress);
};

export const rescheduleInspection = (
  client: PrismaClient,
  current: InspectionRecord,
  input: RescheduleInspectionRequest,
  actorId: string,
  ipAddress?: string,
): Promise<string> =>
  client.$transaction(
    async (tx) => {
      const changed = await tx.inspection.updateMany({
        where: { id: current.id, status: { in: ['PROGRAMADA', 'VENCIDA'] } },
        data: { status: 'REPROGRAMADA', changeReason: input.reason },
      });
      if (changed.count !== 1) invalidInspectionTransition();
      const date = new Date(input.newDate);
      const replacement = await tx.inspection.create({
        data: replacementData(
          current,
          input,
          await nextInspectionCode(tx, date),
          actorId,
        ),
        select: { id: true },
      });
      await auditReschedule(tx, current, replacement.id, actorId, ipAddress);
      return replacement.id;
    },
    { isolationLevel: 'Serializable' },
  );
