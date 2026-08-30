import type {
  CancelInspectionRequest,
  CreateInspectionPlanRequest,
  CreateInspectionRequest,
  InspectionCalendarQuery,
  InspectionListQuery,
  MyPendingInspectionQuery,
  RescheduleInspectionRequest,
  UpdateInspectionRequest,
} from '@sigecal/shared';

import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../errors/app-error.js';
import { toInspectionItem } from './inspections.mapper.js';
import { toInspectionDetail } from './inspections.detail.js';
import {
  ensureInspectionManager,
  ensureInspectionReferences,
  ensureInspectionStarter,
  ensureOperationalEquipment,
  ensureProgrammed,
  ensureReadyPlan,
} from './inspections.rules.js';
import type {
  InspectionActor,
  InspectionMutationRepositoryPort,
  InspectionReadRepositoryPort,
  InspectionRecord,
  InspectionsUseCases,
} from './inspections.types.js';

export class InspectionsService implements InspectionsUseCases {
  public constructor(
    private readonly inspections: InspectionReadRepositoryPort,
    private readonly mutations: InspectionMutationRepositoryPort,
  ) {}

  public async list(query: InspectionListQuery, actor: InspectionActor) {
    await this.mutations.markOverdue(new Date());
    return this.mapList(await this.inspections.list(query, actor));
  }

  public async calendar(
    query: InspectionCalendarQuery,
    actor: InspectionActor,
  ) {
    this.ensureCalendarWindow(query);
    await this.mutations.markOverdue(new Date());
    return this.mapList(await this.inspections.calendar(query, actor));
  }

  public async myPending(
    query: MyPendingInspectionQuery,
    actor: InspectionActor,
  ) {
    await this.mutations.markOverdue(new Date());
    return this.mapList(await this.inspections.myPending(query, actor));
  }

  public async get(id: string, actor: InspectionActor) {
    await this.mutations.markOverdue(new Date());
    return toInspectionItem(await this.existing(id, actor));
  }

  public async detail(id: string, actor: InspectionActor) {
    await this.mutations.markOverdue(new Date());
    const detail = await this.inspections.findDetailById(id, actor);
    if (!detail)
      throw new NotFoundError(
        'La inspección no existe o no está a su alcance.',
      );
    return toInspectionDetail(detail);
  }

  public async create(
    input: CreateInspectionRequest,
    actor: InspectionActor,
    ipAddress?: string,
  ) {
    ensureInspectionManager(actor);
    const references = await this.inspections.findReferences(input);
    ensureInspectionReferences(input, references);
    const batch = references.batch;
    if (!batch) throw new NotFoundError('El lote no existe.');
    const id = await this.mutations.create(
      input,
      batch.dataOrigin,
      actor.userId,
      ipAddress,
    );
    return this.get(id, actor);
  }

  public async update(
    id: string,
    input: UpdateInspectionRequest,
    actor: InspectionActor,
    ipAddress?: string,
  ) {
    ensureInspectionManager(actor);
    const current = await this.existing(id, actor);
    ensureProgrammed(current);
    const merged = this.mergeUpdate(current, input);
    ensureInspectionReferences(
      merged,
      await this.inspections.findReferences(merged),
    );
    await this.mutations.update(id, input, actor.userId, ipAddress);
    return this.get(id, actor);
  }

  public async reschedule(
    id: string,
    input: RescheduleInspectionRequest,
    actor: InspectionActor,
    ipAddress?: string,
  ) {
    ensureInspectionManager(actor);
    await this.mutations.markOverdue(new Date());
    const current = await this.existing(id, actor);
    this.ensureReschedulable(current);
    const replacementId = await this.mutations.reschedule(
      current,
      input,
      actor.userId,
      ipAddress,
    );
    return this.get(replacementId, actor);
  }

  public async cancel(
    id: string,
    input: CancelInspectionRequest,
    actor: InspectionActor,
    ipAddress?: string,
  ) {
    ensureInspectionManager(actor);
    await this.mutations.markOverdue(new Date());
    const current = await this.existing(id, actor);
    this.ensureReschedulable(current);
    await this.mutations.cancel(id, input, actor.userId, ipAddress);
    return this.get(id, actor);
  }

  public async start(id: string, actor: InspectionActor, ipAddress?: string) {
    await this.mutations.markOverdue(new Date());
    const current = await this.existing(id, actor);
    ensureInspectionStarter(actor, current);
    this.ensureReschedulable(current);
    ensureOperationalEquipment(current);
    await this.mutations.start(id, actor.userId, ipAddress);
    return this.get(id, actor);
  }

  public async coverage(batchId: string, actor: InspectionActor) {
    ensureInspectionManager(actor);
    const result = await this.inspections.coverage(batchId);
    if (!result.batch) throw new NotFoundError('El lote no existe.');
    const coveredStages = result.stages.filter(
      (stage) => stage.count > 0,
    ).length;
    const totalStages = result.stages.length;
    return {
      batch: result.batch,
      coveredStages,
      totalStages,
      percentage:
        totalStages === 0 ? null : (coveredStages / totalStages) * 100,
      stages: result.stages.map(({ count, ...stage }) => ({
        stage,
        hasScheduledInspection: count > 0,
        inspections: count,
      })),
    };
  }

  public async createPlan(
    input: CreateInspectionPlanRequest,
    actor: InspectionActor,
    ipAddress?: string,
  ) {
    ensureInspectionManager(actor);
    const context = await this.inspections.findPlanContext(input);
    ensureReadyPlan(context, input.responsibleByRole);
    const ids = await this.mutations.createPlan(
      context,
      input,
      actor.userId,
      ipAddress,
    );
    return Promise.all(ids.map((id) => this.get(id, actor)));
  }

  private async existing(
    id: string,
    actor: InspectionActor,
  ): Promise<InspectionRecord> {
    const inspection = await this.inspections.findAccessibleById(id, actor);
    if (!inspection)
      throw new NotFoundError(
        'La inspección no existe o no está a su alcance.',
      );
    return inspection;
  }

  private mapList(result: {
    readonly items: readonly InspectionRecord[];
    readonly total: number;
  }) {
    return { data: result.items.map(toInspectionItem), total: result.total };
  }

  private mergeUpdate(
    current: InspectionRecord,
    input: UpdateInspectionRequest,
  ): CreateInspectionRequest {
    const parameterIds =
      input.parameterIds ??
      current.parameters.map(({ parameter }) => parameter.id);
    if (current.type === 'FISICOQUIMICO' && parameterIds.length === 0)
      throw new ConflictError(
        'Una inspección fisicoquímica requiere parámetros.',
        'INSPECTION_PARAMETERS_REQUIRED',
      );
    return {
      batchId: current.batchId,
      stageId: current.stageId,
      type: current.type,
      scheduledDate: input.scheduledDate ?? current.scheduledDate.toISOString(),
      responsibleId: input.responsibleId ?? current.responsibleId,
      equipmentId:
        input.equipmentId === undefined
          ? current.equipmentId
          : input.equipmentId,
      parameterIds,
      notes: input.notes === undefined ? current.notes : input.notes,
    };
  }

  private ensureReschedulable(current: InspectionRecord): void {
    if (current.status !== 'PROGRAMADA' && current.status !== 'VENCIDA')
      throw new ConflictError(
        'La transición de la inspección no está permitida.',
        'INVALID_INSPECTION_TRANSITION',
      );
  }

  private ensureCalendarWindow(query: InspectionCalendarQuery): void {
    if (!query.dateFrom || !query.dateTo) return;
    const milliseconds =
      new Date(query.dateTo).getTime() - new Date(query.dateFrom).getTime();
    if (milliseconds > 93 * 86_400_000)
      throw new BadRequestError(
        'El rango del calendario no puede superar 93 días.',
        'CALENDAR_RANGE_TOO_LARGE',
      );
  }
}
