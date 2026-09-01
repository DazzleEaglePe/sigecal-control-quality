import type {
  CloseNonConformityRequest,
  CreateActionRequest,
  CreateNonConformityRequest,
  NonConformityListQuery,
  UpdateActionRequest,
  UpdateNonConformityRequest,
  VerifyActionRequest,
} from '@sigecal/shared';

import { NotFoundError } from '../../errors/app-error.js';
import {
  toCorrectiveActionItem,
  toNonConformityDetail,
  toNonConformityItem,
} from './nonconformities.mapper.js';
import {
  ensureActionExecuted,
  ensureActionReferences,
  ensureActionVerifier,
  ensureCloseable,
  ensureNCCloser,
  ensureNCEditable,
  ensureNCManager,
  ensureNCReferences,
  ensureVerifierDifferentFromResponsible,
} from './nonconformities.rules.js';
import type {
  CorrectiveActionRecord,
  NonConformityActor,
  NonConformityMutationRepositoryPort,
  NonConformityReadRepositoryPort,
  NonConformityRecord,
  NonConformitiesUseCases,
} from './nonconformities.types.js';

export class NonConformitiesService implements NonConformitiesUseCases {
  public constructor(
    private readonly nonConformities: NonConformityReadRepositoryPort,
    private readonly mutations: NonConformityMutationRepositoryPort,
  ) {}

  public async list(query: NonConformityListQuery, actor: NonConformityActor) {
    const result = await this.nonConformities.list(query, actor);
    return {
      data: result.items.map(toNonConformityItem),
      total: result.total,
    };
  }

  public async detail(id: string, actor: NonConformityActor) {
    const detail = await this.nonConformities.findDetailById(id, actor);
    if (!detail)
      throw new NotFoundError(
        'La no conformidad no existe o no está a su alcance.',
      );
    return toNonConformityDetail(detail);
  }

  public async create(
    input: CreateNonConformityRequest,
    actor: NonConformityActor,
    ipAddress?: string,
  ) {
    const references = await this.nonConformities.findReferences(input);
    ensureNCReferences(
      references,
      input.stageId,
      input.assignedToId,
      input.assignedAreaId,
    );
    if (!references.batch) throw new NotFoundError('El lote no existe.');
    const id = await this.mutations.create(
      input,
      references.batch.dataOrigin,
      actor.userId,
      ipAddress,
    );
    return this.detail(id, actor);
  }

  public async update(
    id: string,
    input: UpdateNonConformityRequest,
    actor: NonConformityActor,
    ipAddress?: string,
  ) {
    ensureNCManager(actor);
    const current = await this.existing(id, actor);
    ensureNCEditable(current.status);
    const references = await this.nonConformities.findReferences(input);
    ensureNCReferences(
      references,
      undefined,
      input.assignedToId,
      input.assignedAreaId,
    );
    await this.mutations.update(id, input, actor.userId, ipAddress);
    return this.detail(id, actor);
  }

  public async startAttention(
    id: string,
    actor: NonConformityActor,
    ipAddress?: string,
  ) {
    ensureNCManager(actor);
    await this.existing(id, actor);
    await this.mutations.startAttention(id, actor.userId, ipAddress);
    return this.detail(id, actor);
  }

  public async close(
    id: string,
    input: CloseNonConformityRequest,
    actor: NonConformityActor,
    ipAddress?: string,
  ) {
    ensureNCCloser(actor);
    const current = await this.existing(id, actor);
    const actions = await this.nonConformities.findActions(id);
    ensureCloseable(current.status, actions);
    await this.mutations.close(id, input, actor.userId, ipAddress);
    return this.detail(id, actor);
  }

  public async listActions(nonConformityId: string, actor: NonConformityActor) {
    await this.existing(nonConformityId, actor);
    const actions = await this.nonConformities.findActions(nonConformityId);
    return actions.map(toCorrectiveActionItem);
  }

  public async createAction(
    nonConformityId: string,
    input: CreateActionRequest,
    actor: NonConformityActor,
    ipAddress?: string,
  ) {
    ensureNCManager(actor);
    const references = await this.nonConformities.findActionReferences(
      nonConformityId,
      input.responsibleId,
    );
    ensureActionReferences(references);
    const id = await this.mutations.createAction(
      nonConformityId,
      input,
      actor.userId,
      ipAddress,
    );
    return this.existingAction(id).then(toCorrectiveActionItem);
  }

  public async updateAction(
    actionId: string,
    input: UpdateActionRequest,
    actor: NonConformityActor,
    ipAddress?: string,
  ) {
    ensureNCManager(actor);
    await this.existingAction(actionId);
    if (input.responsibleId) {
      const action = await this.existingAction(actionId);
      const references = await this.nonConformities.findActionReferences(
        action.nonConformityId,
        input.responsibleId,
      );
      ensureActionReferences(references);
    }
    await this.mutations.updateAction(actionId, input, actor.userId, ipAddress);
    return this.existingAction(actionId).then(toCorrectiveActionItem);
  }

  public async executeAction(
    actionId: string,
    actor: NonConformityActor,
    ipAddress?: string,
  ) {
    ensureNCManager(actor);
    await this.existingAction(actionId);
    await this.mutations.executeAction(actionId, actor.userId, ipAddress);
    return this.existingAction(actionId).then(toCorrectiveActionItem);
  }

  public async verifyAction(
    actionId: string,
    input: VerifyActionRequest,
    actor: NonConformityActor,
    ipAddress?: string,
  ) {
    ensureActionVerifier(actor);
    const action = await this.existingAction(actionId);
    ensureActionExecuted(action);
    ensureVerifierDifferentFromResponsible(action, actor);
    await this.mutations.verifyAction(actionId, input, actor.userId, ipAddress);
    return this.existingAction(actionId).then(toCorrectiveActionItem);
  }

  private async existing(
    id: string,
    actor: NonConformityActor,
  ): Promise<NonConformityRecord> {
    const record = await this.nonConformities.findAccessibleById(id, actor);
    if (!record)
      throw new NotFoundError(
        'La no conformidad no existe o no está a su alcance.',
      );
    return record;
  }

  private async existingAction(
    actionId: string,
  ): Promise<CorrectiveActionRecord> {
    const action = await this.nonConformities.findActionById(actionId);
    if (!action) throw new NotFoundError('La acción no existe.');
    return action;
  }
}
