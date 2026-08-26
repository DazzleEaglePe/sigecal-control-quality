import type {
  CancelInspectionRequest,
  CreateInspectionPlanRequest,
  CreateInspectionRequest,
  DataOrigin,
  RescheduleInspectionRequest,
  UpdateInspectionRequest,
} from '@sigecal/shared';

import { ConflictError } from '../../errors/app-error.js';
import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import {
  inspectionAuditSelection,
  inspectionAuditView,
  writeInspectionAudit,
} from './inspections.audit.js';
import { createInspectionPlan } from './inspections.plan.js';
import {
  auditCreatedInspection,
  invalidInspectionTransition,
  nextInspectionCode,
  retryableInspectionWrite,
} from './inspections.persistence.js';
import { rescheduleInspection } from './inspections.reschedule.js';
import type {
  InspectionMutationRepositoryPort,
  InspectionRecord,
  ReadyInspectionPlanContext,
} from './inspections.types.js';

const MAX_CODE_ATTEMPTS = 3;
const createData = (
  input: CreateInspectionRequest,
  code: string,
  dataOrigin: DataOrigin,
  actorId: string,
) => ({
  code,
  batchId: input.batchId,
  stageId: input.stageId,
  type: input.type,
  scheduledDate: new Date(input.scheduledDate),
  responsibleId: input.responsibleId,
  equipmentId: input.equipmentId ?? null,
  notes: input.notes ?? null,
  createdById: actorId,
  dataOrigin,
  parameters: {
    create: input.parameterIds.map((parameterId) => ({ parameterId })),
  },
});
const updateData = (input: UpdateInspectionRequest) => ({
  ...(input.scheduledDate === undefined
    ? {}
    : { scheduledDate: new Date(input.scheduledDate) }),
  ...(input.responsibleId === undefined
    ? {}
    : { responsibleId: input.responsibleId }),
  ...(input.equipmentId === undefined
    ? {}
    : { equipmentId: input.equipmentId }),
  ...(input.notes === undefined ? {} : { notes: input.notes }),
});

export class InspectionMutationRepository implements InspectionMutationRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public markOverdue(now: Date): Promise<number> {
    return this.client.inspection
      .updateMany({
        where: { status: 'PROGRAMADA', scheduledDate: { lt: now } },
        data: { status: 'VENCIDA' },
      })
      .then((result) => result.count);
  }

  public async create(
    input: CreateInspectionRequest,
    dataOrigin: DataOrigin,
    actorId: string,
    ipAddress?: string,
  ): Promise<string> {
    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt += 1) {
      try {
        return await this.createOnce(input, dataOrigin, actorId, ipAddress);
      } catch (error) {
        if (!retryableInspectionWrite(error) || attempt === MAX_CODE_ATTEMPTS)
          throw error;
      }
    }
    throw new ConflictError('No fue posible generar el código de inspección.');
  }

  private createOnce(
    input: CreateInspectionRequest,
    dataOrigin: DataOrigin,
    actorId: string,
    ipAddress?: string,
  ): Promise<string> {
    return this.client.$transaction(
      async (tx) => {
        const code = await nextInspectionCode(
          tx,
          new Date(input.scheduledDate),
        );
        const record = await tx.inspection.create({
          data: createData(input, code, dataOrigin, actorId),
          select: { id: true },
        });
        await auditCreatedInspection(tx, record.id, actorId, ipAddress);
        return record.id;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  public update(
    id: string,
    input: UpdateInspectionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.client.$transaction(async (tx) => {
      const before = await tx.inspection.findUniqueOrThrow({
        where: { id },
        select: inspectionAuditSelection,
      });
      const changed = await tx.inspection.updateMany({
        where: { id, status: 'PROGRAMADA' },
        data: updateData(input),
      });
      if (changed.count !== 1) invalidInspectionTransition();
      if (input.parameterIds)
        await this.replaceParameters(tx, id, input.parameterIds);
      const after = await tx.inspection.findUniqueOrThrow({
        where: { id },
        select: inspectionAuditSelection,
      });
      await writeInspectionAudit(tx, {
        userId: actorId,
        action: AuditAction.UPDATE,
        entityId: id,
        before: inspectionAuditView(before),
        after: inspectionAuditView(after),
        ipAddress,
      });
    });
  }

  private async replaceParameters(
    tx: Prisma.TransactionClient,
    inspectionId: string,
    parameterIds: readonly string[],
  ): Promise<void> {
    await tx.inspectionParameter.deleteMany({ where: { inspectionId } });
    if (parameterIds.length > 0)
      await tx.inspectionParameter.createMany({
        data: parameterIds.map((parameterId) => ({
          inspectionId,
          parameterId,
        })),
      });
  }

  public reschedule(
    current: InspectionRecord,
    input: RescheduleInspectionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<string> {
    return this.retryWrite(() =>
      rescheduleInspection(this.client, current, input, actorId, ipAddress),
    );
  }

  public cancel(
    id: string,
    input: CancelInspectionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.changeState(
      id,
      ['PROGRAMADA', 'VENCIDA'],
      { status: 'CANCELADA', changeReason: input.reason },
      actorId,
      ipAddress,
    );
  }

  public start(id: string, actorId: string, ipAddress?: string): Promise<void> {
    return this.changeState(
      id,
      ['PROGRAMADA', 'VENCIDA'],
      { status: 'EN_PROCESO', executedAt: new Date() },
      actorId,
      ipAddress,
    );
  }

  private changeState(
    id: string,
    allowed: readonly ('PROGRAMADA' | 'VENCIDA')[],
    data: Prisma.InspectionUpdateManyMutationInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.client.$transaction(async (tx) => {
      const before = await tx.inspection.findUniqueOrThrow({
        where: { id },
        select: inspectionAuditSelection,
      });
      const changed = await tx.inspection.updateMany({
        where: { id, status: { in: [...allowed] } },
        data,
      });
      if (changed.count !== 1) invalidInspectionTransition();
      const after = await tx.inspection.findUniqueOrThrow({
        where: { id },
        select: inspectionAuditSelection,
      });
      await writeInspectionAudit(tx, {
        userId: actorId,
        action: AuditAction.STATE_CHANGE,
        entityId: id,
        before: inspectionAuditView(before),
        after: inspectionAuditView(after),
        ipAddress,
      });
    });
  }

  public async createPlan(
    context: ReadyInspectionPlanContext,
    input: CreateInspectionPlanRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<readonly string[]> {
    return this.retryWrite(() =>
      createInspectionPlan(this.client, context, input, actorId, ipAddress),
    );
  }

  private async retryWrite<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (!retryableInspectionWrite(error) || attempt === MAX_CODE_ATTEMPTS)
          throw error;
      }
    }
    throw new ConflictError('No fue posible completar la operación.');
  }
}
