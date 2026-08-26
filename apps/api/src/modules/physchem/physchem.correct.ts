import type { CorrectPhysChemResultRequest } from '@sigecal/shared';

import { ConflictError } from '../../errors/app-error.js';
import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import {
  resultAuditSelection,
  resultAuditView,
  writeResultAudit,
} from './physchem.audit.js';
import {
  auditCreatedResult,
  createAutomaticNC,
} from './physchem.persistence.js';
import type {
  CorrectionContext,
  EvaluatedMeasurement,
  PhysChemEquipment,
  PhysChemInspectionContext,
  PhysChemResultRecord,
} from './physchem.types.js';

interface ReadyCorrectionContext extends CorrectionContext {
  readonly result: PhysChemResultRecord;
  readonly inspection: PhysChemInspectionContext;
  readonly equipment: PhysChemEquipment;
}

const annulPrevious = async (
  tx: Prisma.TransactionClient,
  context: ReadyCorrectionContext,
  input: CorrectPhysChemResultRequest,
  actorId: string,
  annulledAt: Date,
): Promise<void> => {
  const changed = await tx.physChemResult.updateMany({
    where: { id: context.result.id, status: { not: 'ANULADO' } },
    data: {
      status: 'ANULADO',
      annulledById: actorId,
      annulledAt,
      annulReason: input.reason,
    },
  });
  if (changed.count !== 1)
    throw new ConflictError(
      'El resultado ya fue corregido.',
      'PHYS_CHEM_RESULT_ALREADY_CORRECTED',
    );
  if (context.result.nonConformity)
    await tx.nonConformity.update({
      where: { id: context.result.nonConformity.id },
      data: {
        status: 'ANULADA',
        annulledAt,
        annulledById: actorId,
        annulReason: input.reason,
      },
    });
};

const createReplacement = async (
  tx: Prisma.TransactionClient,
  context: ReadyCorrectionContext,
  input: CorrectPhysChemResultRequest,
  evaluation: EvaluatedMeasurement,
  actorId: string,
  recordedAt: Date,
): Promise<string> => {
  const replacement = await tx.physChemResult.create({
    data: {
      inspectionId: context.inspection.id,
      parameterId: context.result.parameterId,
      standardId: evaluation.standard.id,
      value: new Prisma.Decimal(evaluation.value),
      status: evaluation.status,
      observation: input.observation ?? null,
      equipmentId: context.equipment.id,
      calibrationRef: context.equipment.lastCalibrationRef,
      recordedById: actorId,
      recordedAt,
      dataOrigin: context.result.dataOrigin,
      replacesId: context.result.id,
    },
    select: { id: true },
  });
  if (evaluation.status === 'NO_CONFORME')
    await createAutomaticNC(
      tx,
      replacement.id,
      context.inspection,
      evaluation,
      actorId,
      recordedAt,
    );
  return replacement.id;
};

const auditCorrection = async (
  tx: Prisma.TransactionClient,
  context: ReadyCorrectionContext,
  replacementId: string,
  actorId: string,
  ipAddress?: string,
): Promise<void> => {
  const after = await tx.physChemResult.findUniqueOrThrow({
    where: { id: context.result.id },
    select: resultAuditSelection,
  });
  await writeResultAudit(tx, {
    userId: actorId,
    action: AuditAction.UPDATE,
    entityId: context.result.id,
    before: resultAuditView(context.result),
    after: resultAuditView(after),
    ipAddress,
  });
  await auditCreatedResult(tx, replacementId, actorId, ipAddress);
};

export const correctPhysChemResult = (
  client: PrismaClient,
  context: ReadyCorrectionContext,
  input: CorrectPhysChemResultRequest,
  evaluation: EvaluatedMeasurement,
  actorId: string,
  ipAddress?: string,
): Promise<{ readonly annulledId: string; readonly replacementId: string }> =>
  client.$transaction(
    async (tx) => {
      const recordedAt = new Date();
      await annulPrevious(tx, context, input, actorId, recordedAt);
      const replacementId = await createReplacement(
        tx,
        context,
        input,
        evaluation,
        actorId,
        recordedAt,
      );
      await auditCorrection(tx, context, replacementId, actorId, ipAddress);
      return { annulledId: context.result.id, replacementId };
    },
    { isolationLevel: 'Serializable' },
  );
