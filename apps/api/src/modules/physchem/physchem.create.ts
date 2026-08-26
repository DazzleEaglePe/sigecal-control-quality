import { ConflictError } from '../../errors/app-error.js';
import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import {
  inspectionAuditSelection,
  inspectionAuditView,
  writeInspectionAudit,
} from '../inspections/inspections.audit.js';
import {
  auditCreatedResult,
  createAutomaticNC,
} from './physchem.persistence.js';
import type {
  EvaluatedMeasurement,
  PhysChemEquipment,
  PhysChemInspectionContext,
} from './physchem.types.js';

const ensureNotRecorded = async (
  tx: Prisma.TransactionClient,
  inspectionId: string,
  parameterId: string,
): Promise<void> => {
  const existing = await tx.physChemResult.count({
    where: { inspectionId, parameterId, status: { not: 'ANULADO' } },
  });
  if (existing > 0)
    throw new ConflictError(
      'El parámetro ya tiene un resultado final vigente.',
      'PHYS_CHEM_RESULT_EXISTS',
    );
};

const resultData = (
  inspection: PhysChemInspectionContext,
  equipment: PhysChemEquipment,
  evaluation: EvaluatedMeasurement,
  actorId: string,
  recordedAt: Date,
) => ({
  inspectionId: inspection.id,
  parameterId: evaluation.parameterId,
  standardId: evaluation.standard.id,
  value: new Prisma.Decimal(evaluation.value),
  status: evaluation.status,
  observation: evaluation.observation ?? null,
  equipmentId: equipment.id,
  calibrationRef: equipment.lastCalibrationRef,
  recordedById: actorId,
  recordedAt,
  dataOrigin: inspection.batch.dataOrigin,
});

const createResult = async (
  tx: Prisma.TransactionClient,
  inspection: PhysChemInspectionContext,
  evaluation: EvaluatedMeasurement,
  actorId: string,
  recordedAt: Date,
  ipAddress?: string,
): Promise<string> => {
  const equipment = inspection.equipment;
  if (!equipment) throw new ConflictError('La inspección no tiene equipo.');
  await ensureNotRecorded(tx, inspection.id, evaluation.parameterId);
  const record = await tx.physChemResult.create({
    data: resultData(inspection, equipment, evaluation, actorId, recordedAt),
    select: { id: true },
  });
  if (evaluation.status === 'NO_CONFORME')
    await createAutomaticNC(
      tx,
      record.id,
      inspection,
      evaluation,
      actorId,
      recordedAt,
    );
  await auditCreatedResult(tx, record.id, actorId, ipAddress);
  return record.id;
};

const completeInspection = async (
  tx: Prisma.TransactionClient,
  inspectionId: string,
  actorId: string,
  ipAddress?: string,
): Promise<void> => {
  const before = await tx.inspection.findUniqueOrThrow({
    where: { id: inspectionId },
    select: inspectionAuditSelection,
  });
  const changed = await tx.inspection.updateMany({
    where: { id: inspectionId, status: 'EN_PROCESO' },
    data: { status: 'COMPLETADA' },
  });
  if (changed.count !== 1)
    throw new ConflictError(
      'La inspección no pudo completarse.',
      'INSPECTION_COMPLETION_CONFLICT',
    );
  const after = await tx.inspection.findUniqueOrThrow({
    where: { id: inspectionId },
    select: inspectionAuditSelection,
  });
  await writeInspectionAudit(tx, {
    userId: actorId,
    action: AuditAction.STATE_CHANGE,
    entityId: inspectionId,
    before: inspectionAuditView(before),
    after: inspectionAuditView(after),
    ipAddress,
  });
};

const completeIfCovered = async (
  tx: Prisma.TransactionClient,
  inspectionId: string,
  actorId: string,
  ipAddress?: string,
): Promise<void> => {
  const [expected, groups] = await Promise.all([
    tx.inspectionParameter.count({ where: { inspectionId } }),
    tx.physChemResult.groupBy({
      by: ['parameterId'],
      where: { inspectionId, status: { not: 'ANULADO' } },
      _count: { _all: true },
    }),
  ]);
  const complete =
    expected > 0 &&
    groups.length === expected &&
    groups.every((group) => group._count._all === 1);
  if (complete) await completeInspection(tx, inspectionId, actorId, ipAddress);
};

const ensureInspectionInProgress = async (
  tx: Prisma.TransactionClient,
  inspectionId: string,
): Promise<void> => {
  const count = await tx.inspection.count({
    where: { id: inspectionId, status: 'EN_PROCESO' },
  });
  if (count !== 1)
    throw new ConflictError(
      'La inspección ya no se encuentra en proceso.',
      'INSPECTION_STATE_CONFLICT',
    );
};

export const createPhysChemResults = (
  client: PrismaClient,
  inspection: PhysChemInspectionContext,
  values: readonly EvaluatedMeasurement[],
  actorId: string,
  ipAddress?: string,
): Promise<readonly string[]> =>
  client.$transaction(
    async (tx) => {
      const ids: string[] = [];
      const recordedAt = new Date();
      await ensureInspectionInProgress(tx, inspection.id);
      for (const evaluation of values)
        ids.push(
          await createResult(
            tx,
            inspection,
            evaluation,
            actorId,
            recordedAt,
            ipAddress,
          ),
        );
      await completeIfCovered(tx, inspection.id, actorId, ipAddress);
      return ids;
    },
    { isolationLevel: 'Serializable' },
  );
