import type {
  AdvanceBatchStageRequest,
  BatchListQuery,
  CreateBatchRequest,
  RejectBatchRequest,
  UpdateBatchRequest,
} from '@sigecal/shared';

import { ConflictError, NotFoundError } from '../../errors/app-error.js';
import { toBatchItem, toTimeline } from './batches.mapper.js';
import {
  currentComposition,
  ensureActiveCatalogs,
  ensureCompositionForType,
  ensureDecisionRole,
  ensureIdentityNotFrozen,
  ensureMutable,
  ensureOperationRole,
  identityChanges,
  selectSort,
} from './batches.rules.js';
import type {
  BatchActor,
  BatchMutationRepositoryPort,
  BatchReadRepositoryPort,
  BatchRecord,
  BatchesUseCases,
} from './batches.types.js';

export class BatchesService implements BatchesUseCases {
  public constructor(
    private readonly batches: BatchReadRepositoryPort,
    private readonly mutations: BatchMutationRepositoryPort,
  ) {}

  public async list(query: BatchListQuery, actor: BatchActor) {
    const result = await this.batches.list(
      query,
      actor,
      selectSort(query.sortBy),
    );
    return { data: result.items.map(toBatchItem), total: result.total };
  }

  public async get(id: string, actor: BatchActor) {
    return toBatchItem(await this.existing(id, actor));
  }

  public async create(
    input: CreateBatchRequest,
    actor: BatchActor,
    ipAddress?: string,
  ) {
    ensureOperationRole(actor);
    await this.validateComposition(input.piscoTypeId, input.varieties);
    const firstStage = await this.batches.findFirstStage();
    if (!firstStage)
      throw new ConflictError(
        'No existe una primera etapa activa.',
        'NO_INITIAL_PROCESS_STAGE',
      );
    const id = await this.mutations.create(
      input,
      firstStage.id,
      actor.userId,
      ipAddress,
    );
    return this.get(id, actor);
  }

  public async update(
    id: string,
    input: UpdateBatchRequest,
    actor: BatchActor,
    ipAddress?: string,
  ) {
    ensureOperationRole(actor);
    const current = await this.existing(id, actor);
    ensureMutable(current);
    ensureIdentityNotFrozen(current, input);
    if (identityChanges(input))
      await this.validateUpdateComposition(current, input);
    await this.mutations.update(id, input, actor.userId, ipAddress);
    return this.get(id, actor);
  }

  public async timeline(id: string, actor: BatchActor) {
    const batch = await this.existing(id, actor);
    return toTimeline(await this.batches.timeline(id), batch.currentStage.id);
  }

  public async advance(
    id: string,
    input: AdvanceBatchStageRequest,
    actor: BatchActor,
    ipAddress?: string,
  ) {
    ensureOperationRole(actor);
    const current = await this.existing(id, actor);
    ensureMutable(current);
    if (!(await this.batches.activeUserExists(input.responsibleId)))
      throw new NotFoundError('La persona responsable no está activa.');
    const next = await this.batches.findNextStage(
      current.currentStage.sequence,
    );
    if (!next)
      throw new ConflictError(
        'El lote ya se encuentra en la última etapa.',
        'LAST_STAGE_REACHED',
      );
    const warnings = await this.batches.advanceWarnings(
      id,
      current.currentStage.id,
    );
    await this.mutations.advance(
      id,
      current.currentStage.id,
      next.id,
      input,
      actor.userId,
      ipAddress,
    );
    return { batch: await this.get(id, actor), warnings };
  }

  public async close(id: string, actor: BatchActor, ipAddress?: string) {
    ensureDecisionRole(actor);
    ensureMutable(await this.existing(id, actor));
    await this.mutations.close(id, actor.userId, ipAddress);
    return this.get(id, actor);
  }

  public async reject(
    id: string,
    input: RejectBatchRequest,
    actor: BatchActor,
    ipAddress?: string,
  ) {
    ensureDecisionRole(actor);
    ensureMutable(await this.existing(id, actor));
    await this.mutations.reject(id, input, actor.userId, ipAddress);
    return this.get(id, actor);
  }

  private async existing(id: string, actor: BatchActor): Promise<BatchRecord> {
    const batch = await this.batches.findAccessibleById(id, actor);
    if (!batch)
      throw new NotFoundError('El lote no existe o no está a su alcance.');
    return batch;
  }

  private async validateComposition(
    piscoTypeId: string,
    varieties: readonly {
      varietyId: string;
      percentage?: number | undefined;
    }[],
  ): Promise<void> {
    const ids = varieties.map((item) => item.varietyId);
    const type = ensureActiveCatalogs(
      await this.batches.findPiscoType(piscoTypeId),
      await this.batches.findVarieties(ids),
      ids,
    );
    ensureCompositionForType(type.code, varieties);
  }

  private async validateUpdateComposition(
    current: BatchRecord,
    input: UpdateBatchRequest,
  ): Promise<void> {
    const varieties = input.varieties ?? currentComposition(current);
    const typeId = input.piscoTypeId ?? current.piscoType.id;
    await this.validateComposition(typeId, varieties);
  }
}
