import type {
  CorrectSensorySessionRequest,
  CreateSensorySessionRequest,
} from '@sigecal/shared';
import { ConflictError } from '../../errors/app-error.js';
import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import { nextNonConformityCode } from '../physchem/physchem.persistence.js';
import type {
  PreparedSensorySession,
  SensoryMutationRepositoryPort,
  SensorySessionRecord,
} from './sensory.types.js';

const scoreData = (
  sessionId: string,
  panelistId: string,
  scores: CreateSensorySessionRequest['panelists'][number]['scores'],
) =>
  scores.map((score) => ({
    sessionId,
    panelistId,
    attributeId: score.attributeId,
    score: score.score,
    descriptor: score.descriptor ?? null,
  }));

const createPanel = async (
  tx: Prisma.TransactionClient,
  sessionId: string,
  panelists: CreateSensorySessionRequest['panelists'],
): Promise<void> => {
  for (const panelist of panelists) {
    const created = await tx.sensoryPanelist.create({
      data: {
        sessionId,
        userId: panelist.userId ?? null,
        externalName: panelist.externalName ?? null,
      },
      select: { id: true },
    });
    await tx.sensoryScore.createMany({
      data: scoreData(sessionId, created.id, panelist.scores),
    });
  }
};

const createAutomaticNC = async (
  tx: Prisma.TransactionClient,
  sessionId: string,
  context: PreparedSensorySession,
  actorId: string,
  detectedAt: Date,
): Promise<void> => {
  await tx.nonConformity.create({
    data: {
      code: await nextNonConformityCode(tx, detectedAt),
      batchId: context.inspection.batch.id,
      stageId: context.inspection.stageId,
      inspectionId: context.inspection.id,
      sensorySessionId: sessionId,
      origin: 'AUTOMATICA_SENSORIAL',
      severity: context.threshold.defaultSeverity,
      description: `Sesión organoléptica no conforme: promedio general ${context.overallAverage.toFixed(2)}, umbral ${context.threshold.minAverage.toString()}.`,
      detectedAt,
      detectedById: actorId,
      dataOrigin: context.inspection.batch.dataOrigin,
    },
  });
};

const sessionCreateData = (
  context: PreparedSensorySession,
  input: CreateSensorySessionRequest,
  actorId: string,
  recordedAt: Date,
  replacesId?: string,
) => ({
  inspectionId: context.inspection.id,
  sessionDate: new Date(`${input.sessionDate}T00:00:00.000Z`),
  overallAverage: new Prisma.Decimal(context.overallAverage),
  sensoryThresholdId: context.threshold.id,
  appliedThreshold: context.threshold.minAverage,
  status: context.status,
  defectsFound: input.defectsFound ?? null,
  notes: input.notes ?? null,
  recordedById: actorId,
  recordedAt,
  dataOrigin: context.inspection.batch.dataOrigin,
  replacesId: replacesId ?? null,
});

const auditCreatedSession = (
  tx: Prisma.TransactionClient,
  id: string,
  context: PreparedSensorySession,
  actorId: string,
) =>
  tx.auditLog.create({
    data: {
      userId: actorId,
      action: AuditAction.CREATE,
      entity: 'SensorySession',
      entityId: id,
      after: {
        status: context.status,
        overallAverage: context.overallAverage,
        thresholdId: context.threshold.id,
      },
    },
  });

const persistSession = async (
  tx: Prisma.TransactionClient,
  context: PreparedSensorySession,
  input: CreateSensorySessionRequest,
  actorId: string,
  recordedAt: Date,
  replacesId?: string,
): Promise<string> => {
  const session = await tx.sensorySession.create({
    data: sessionCreateData(context, input, actorId, recordedAt, replacesId),
    select: { id: true },
  });
  await createPanel(tx, session.id, input.panelists);
  if (context.status === 'NO_CONFORME')
    await createAutomaticNC(tx, session.id, context, actorId, recordedAt);
  await auditCreatedSession(tx, session.id, context, actorId);
  return session.id;
};

const createSessionTransaction = async (
  tx: Prisma.TransactionClient,
  context: PreparedSensorySession,
  input: CreateSensorySessionRequest,
  actorId: string,
): Promise<string> => {
  await ensureNoCurrentSession(tx, context.inspection.id);
  const id = await persistSession(tx, context, input, actorId, new Date());
  await tx.inspection.updateMany({
    where: { id: context.inspection.id, status: 'EN_PROCESO' },
    data: { status: 'COMPLETADA' },
  });
  return id;
};

const annulPreviousSession = async (
  tx: Prisma.TransactionClient,
  previous: SensorySessionRecord,
  input: CorrectSensorySessionRequest,
  actorId: string,
  at: Date,
): Promise<void> => {
  const changed = await tx.sensorySession.updateMany({
    where: { id: previous.id, status: { not: 'ANULADO' } },
    data: {
      status: 'ANULADO',
      annulledById: actorId,
      annulledAt: at,
      annulReason: input.reason,
    },
  });
  if (changed.count !== 1)
    throw new ConflictError(
      'La sesión ya fue corregida.',
      'SENSORY_SESSION_ALREADY_CORRECTED',
    );
  if (previous.nonConformity)
    await tx.nonConformity.update({
      where: { id: previous.nonConformity.id },
      data: {
        status: 'ANULADA',
        annulledAt: at,
        annulledById: actorId,
        annulReason: input.reason,
      },
    });
};

interface CorrectionWrite {
  readonly previous: SensorySessionRecord;
  readonly context: PreparedSensorySession;
  readonly input: CorrectSensorySessionRequest;
  readonly actorId: string;
  readonly ipAddress: string | undefined;
}
const correctSessionTransaction = async (
  tx: Prisma.TransactionClient,
  write: CorrectionWrite,
) => {
  const at = new Date();
  await annulPreviousSession(
    tx,
    write.previous,
    write.input,
    write.actorId,
    at,
  );
  const replacementId = await persistSession(
    tx,
    write.context,
    { ...write.input, inspectionId: write.previous.inspectionId },
    write.actorId,
    at,
    write.previous.id,
  );
  await tx.auditLog.create({
    data: {
      userId: write.actorId,
      action: AuditAction.UPDATE,
      entity: 'SensorySession',
      entityId: write.previous.id,
      before: { status: write.previous.status },
      after: { status: 'ANULADO', replacementId },
      ipAddress: write.ipAddress ?? null,
    },
  });
  return { annulledId: write.previous.id, replacementId };
};

const ensureNoCurrentSession = async (
  tx: Prisma.TransactionClient,
  inspectionId: string,
): Promise<void> => {
  if (
    await tx.sensorySession.count({
      where: { inspectionId, status: { not: 'ANULADO' } },
    })
  )
    throw new ConflictError(
      'La inspección ya tiene una sesión final vigente.',
      'SENSORY_SESSION_EXISTS',
    );
};

export class SensoryMutationRepository implements SensoryMutationRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public create(
    context: PreparedSensorySession,
    input: CreateSensorySessionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<string> {
    void ipAddress;
    return this.client.$transaction(
      (tx) => createSessionTransaction(tx, context, input, actorId),
      { isolationLevel: 'Serializable' },
    );
  }

  public correct(
    previous: SensorySessionRecord,
    context: PreparedSensorySession,
    input: CorrectSensorySessionRequest,
    actorId: string,
    ipAddress?: string,
  ) {
    return this.client.$transaction(
      (tx) =>
        correctSessionTransaction(tx, {
          previous,
          context,
          input,
          actorId,
          ipAddress,
        }),
      { isolationLevel: 'Serializable' },
    );
  }
}
