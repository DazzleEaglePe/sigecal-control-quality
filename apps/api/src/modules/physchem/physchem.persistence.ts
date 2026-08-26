import { ConflictError } from '../../errors/app-error.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import { inspectionYear } from '../inspections/inspections.time.js';
import {
  resultAuditSelection,
  resultAuditView,
  writeResultAudit,
} from './physchem.audit.js';
import type {
  EvaluatedMeasurement,
  PhysChemInspectionContext,
} from './physchem.types.js';

export const retryableResultWrite = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  ['P2002', 'P2034'].includes(error.code);

export const nextNonConformityCode = async (
  tx: Prisma.TransactionClient,
  detectedAt: Date,
): Promise<string> => {
  const year = inspectionYear(detectedAt);
  const prefix = `NC-${year}-`;
  const latest = await tx.nonConformity.findFirst({
    where: { code: { startsWith: prefix } },
    select: { code: true },
    orderBy: { code: 'desc' },
  });
  const sequence = latest ? Number(latest.code.slice(-4)) + 1 : 1;
  if (sequence > 9_999)
    throw new ConflictError(
      `Se agotó la numeración de no conformidades para ${year}.`,
      'NONCONFORMITY_CODE_EXHAUSTED',
    );
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

const nonConformityDescription = (
  inspection: PhysChemInspectionContext,
  evaluation: EvaluatedMeasurement,
): string => {
  const parameter = inspection.parameters.find(
    (item) => item.parameter.id === evaluation.parameterId,
  )?.parameter;
  if (!parameter)
    throw new ConflictError('El parámetro no pertenece a la inspección.');
  const unit = parameter.unit ? ` ${parameter.unit}` : '';
  return `Resultado no conforme en ${parameter.name}: ${String(evaluation.value)}${unit}.`;
};

export const createAutomaticNC = async (
  tx: Prisma.TransactionClient,
  resultId: string,
  inspection: PhysChemInspectionContext,
  evaluation: EvaluatedMeasurement,
  actorId: string,
  detectedAt: Date,
): Promise<string> => {
  const nc = await tx.nonConformity.create({
    data: {
      code: await nextNonConformityCode(tx, detectedAt),
      batchId: inspection.batch.id,
      stageId: inspection.stageId,
      inspectionId: inspection.id,
      physChemResultId: resultId,
      origin: 'AUTOMATICA_FISICOQUIMICA',
      severity: evaluation.standard.defaultSeverity,
      description: nonConformityDescription(inspection, evaluation),
      detectedAt,
      detectedById: actorId,
      dataOrigin: inspection.batch.dataOrigin,
    },
    select: { id: true, code: true, status: true, severity: true },
  });
  await tx.auditLog.create({
    data: {
      userId: actorId,
      action: AuditAction.CREATE,
      entity: 'NonConformity',
      entityId: nc.id,
      after: nc,
    },
  });
  return nc.id;
};

export const auditCreatedResult = async (
  tx: Prisma.TransactionClient,
  id: string,
  actorId: string,
  ipAddress?: string,
): Promise<void> => {
  const record = await tx.physChemResult.findUniqueOrThrow({
    where: { id },
    select: resultAuditSelection,
  });
  await writeResultAudit(tx, {
    userId: actorId,
    action: AuditAction.CREATE,
    entityId: id,
    after: resultAuditView(record),
    ipAddress,
  });
};
