import { ConflictError } from '../../errors/app-error.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import {
  inspectionAuditSelection,
  inspectionAuditView,
  writeInspectionAudit,
} from './inspections.audit.js';
import { inspectionYear } from './inspections.time.js';

export const retryableInspectionWrite = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  ['P2002', 'P2034'].includes(error.code);

export const nextInspectionCode = async (
  tx: Prisma.TransactionClient,
  scheduledDate: Date,
): Promise<string> => {
  const year = inspectionYear(scheduledDate);
  const prefix = `INS-${year}-`;
  const latest = await tx.inspection.findFirst({
    where: { code: { startsWith: prefix } },
    select: { code: true },
    orderBy: { code: 'desc' },
  });
  const sequence = latest ? Number(latest.code.slice(-4)) + 1 : 1;
  if (sequence > 9_999)
    throw new ConflictError(
      `Se agotó la numeración de inspecciones para ${year}.`,
      'INSPECTION_CODE_EXHAUSTED',
    );
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

export const auditCreatedInspection = async (
  tx: Prisma.TransactionClient,
  id: string,
  actorId: string,
  ipAddress?: string,
): Promise<void> => {
  const after = await tx.inspection.findUniqueOrThrow({
    where: { id },
    select: inspectionAuditSelection,
  });
  await writeInspectionAudit(tx, {
    userId: actorId,
    action: AuditAction.CREATE,
    entityId: id,
    after: inspectionAuditView(after),
    ipAddress,
  });
};

export const invalidInspectionTransition = (): never => {
  throw new ConflictError(
    'La transición de la inspección no está permitida.',
    'INVALID_INSPECTION_TRANSITION',
  );
};
