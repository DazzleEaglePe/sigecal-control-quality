import type { CreateInspectionPlanRequest } from '@sigecal/shared';

import { ConflictError } from '../../errors/app-error.js';
import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import {
  auditCreatedInspection,
  nextInspectionCode,
} from './inspections.persistence.js';
import { scheduledFromTemplate } from './inspections.time.js';
import type {
  PlanTemplateRecord,
  ReadyInspectionPlanContext,
} from './inspections.types.js';

const responsibleFor = (
  input: CreateInspectionPlanRequest,
  role: PlanTemplateRecord['items'][number]['responsibleRole'],
): string => {
  const responsibleId = input.responsibleByRole[role];
  if (!responsibleId)
    throw new ConflictError(
      'Falta una persona responsable para un rol de la plantilla.',
      'MISSING_TEMPLATE_RESPONSIBLE',
    );
  return responsibleId;
};

const createPlanItem = async (
  tx: Prisma.TransactionClient,
  context: ReadyInspectionPlanContext,
  input: CreateInspectionPlanRequest,
  index: number,
  actorId: string,
  ipAddress?: string,
): Promise<string> => {
  const item = context.template.items[index];
  if (!item) throw new ConflictError('El ítem de plantilla no existe.');
  const scheduledDate = scheduledFromTemplate(
    context.batch.startDate,
    item.offsetDaysFromBatchStart,
    item.scheduledLocalTime,
  );
  const record = await tx.inspection.create({
    data: {
      code: await nextInspectionCode(tx, scheduledDate),
      batchId: context.batch.id,
      stageId: item.stageId,
      type: item.type,
      scheduledDate,
      responsibleId: responsibleFor(input, item.responsibleRole),
      equipmentId: item.equipmentId,
      createdById: actorId,
      dataOrigin: context.batch.dataOrigin,
      parameters: {
        create: item.parameters.map(({ parameterId }) => ({ parameterId })),
      },
    },
    select: { id: true },
  });
  await auditCreatedInspection(tx, record.id, actorId, ipAddress);
  return record.id;
};

export const createInspectionPlan = (
  client: PrismaClient,
  context: ReadyInspectionPlanContext,
  input: CreateInspectionPlanRequest,
  actorId: string,
  ipAddress?: string,
): Promise<readonly string[]> =>
  client.$transaction(
    async (tx) => {
      const ids: string[] = [];
      for (let index = 0; index < context.template.items.length; index += 1)
        ids.push(
          await createPlanItem(tx, context, input, index, actorId, ipAddress),
        );
      return ids;
    },
    { isolationLevel: 'Serializable' },
  );
