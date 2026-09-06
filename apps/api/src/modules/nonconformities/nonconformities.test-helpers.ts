import { vi } from 'vitest';
import type {
  CloseNonConformityRequest,
  CreateActionRequest,
  CreateNonConformityRequest,
  DataOrigin,
  NonConformityListQuery,
  UpdateActionRequest,
  UpdateNonConformityRequest,
  VerifyActionRequest,
} from '@sigecal/shared';

import type {
  ActionReferences,
  CorrectiveActionRecord,
  NonConformityActor,
  NonConformityMutationRepositoryPort,
  NonConformityReadRepositoryPort,
  NonConformityReferences,
  NonConformityRecord,
} from './nonconformities.types.js';

export const IDS = {
  nc: '11111111-1111-4111-a111-111111111111',
  batch: '22222222-2222-4222-a222-222222222222',
  stage: '33333333-3333-4333-a333-333333333333',
  area: '44444444-4444-4444-a444-444444444444',
  user: '55555555-5555-4555-a555-555555555555',
  otherUser: '66666666-6666-4666-a666-666666666666',
  action: '77777777-7777-4777-a777-777777777777',
} as const;

export const manager: NonConformityActor = {
  userId: IDS.user,
  role: 'JEFE_CALIDAD',
};
export const operator: NonConformityActor = {
  userId: IDS.otherUser,
  role: 'OPERARIO',
};

const person = { id: IDS.user, firstName: 'Nicolle', lastName: 'Calidad' };
const otherPerson = { id: IDS.otherUser, firstName: 'Ana', lastName: 'Torres' };
const batch = { id: IDS.batch, code: 'LT-2026-0001' };
const stage = { id: IDS.stage, code: 'FERMENTACION', name: 'Fermentación' };
const area = { id: IDS.area, code: 'LABORATORIO', name: 'Laboratorio' };

export const nonConformityRecord = (
  overrides: Partial<NonConformityRecord> = {},
): NonConformityRecord => ({
  id: IDS.nc,
  code: 'NC-2026-0001',
  batch,
  batchId: IDS.batch,
  stage,
  stageId: IDS.stage,
  inspectionId: null,
  physChemResultId: null,
  sensorySessionId: null,
  origin: 'MANUAL',
  severity: 'MODERADA',
  status: 'ABIERTA',
  description: 'Fuga detectada en la línea de fermentación.',
  rootCause: null,
  detectedAt: new Date('2026-09-01T10:00:00.000Z'),
  detectedBy: person,
  assignedTo: null,
  assignedToId: null,
  assignedArea: area,
  assignedAreaId: IDS.area,
  attentionStartedAt: null,
  closedAt: null,
  closedBy: null,
  closeComment: null,
  annulledAt: null,
  annulledBy: null,
  annulReason: null,
  dataOrigin: 'REAL',
  ...overrides,
});

export const actionRecord = (
  overrides: Partial<CorrectiveActionRecord> = {},
): CorrectiveActionRecord => ({
  id: IDS.action,
  nonConformityId: IDS.nc,
  type: 'CORRECTIVA',
  description: 'Reemplazar el empaque de la válvula.',
  responsible: otherPerson,
  responsibleId: IDS.otherUser,
  committedDate: new Date('2026-09-05T00:00:00.000Z'),
  executedAt: null,
  status: 'PENDIENTE',
  isEffective: null,
  verifiedBy: null,
  verifiedAt: null,
  verificationComment: null,
  replacesActionId: null,
  ...overrides,
});

const references: NonConformityReferences = {
  batch: { id: IDS.batch, dataOrigin: 'REAL' },
  stage: { ...stage, isActive: true },
  assignedTo: { ...otherPerson, isActive: true },
  assignedArea: { ...area, isActive: true },
};

export class MemoryNonConformityReadRepository implements NonConformityReadRepositoryPort {
  public record: NonConformityRecord | null = nonConformityRecord();
  public actions: readonly CorrectiveActionRecord[] = [];
  public references = references;
  public actionReferences: ActionReferences = {
    nonConformity: this.record,
    responsible: { ...otherPerson, isActive: true },
    replacesAction: null,
  };

  public list(_query: NonConformityListQuery, _actor: NonConformityActor) {
    void _query;
    void _actor;
    return Promise.resolve({
      items: this.record ? [this.record] : [],
      total: this.record ? 1 : 0,
    });
  }
  public findAccessibleById() {
    return Promise.resolve(this.record);
  }
  public findDetailById() {
    return Promise.resolve(
      this.record
        ? { nonConformity: this.record, actions: this.actions }
        : null,
    );
  }
  public findActions() {
    return Promise.resolve(this.actions);
  }
  public findActionById() {
    return Promise.resolve(this.actions[0] ?? null);
  }
  public findReferences(
    _input: CreateNonConformityRequest | UpdateNonConformityRequest,
  ) {
    void _input;
    return Promise.resolve(this.references);
  }
  public findActionReferences() {
    return Promise.resolve(this.actionReferences);
  }
}

export class MemoryNonConformityMutationRepository implements NonConformityMutationRepositoryPort {
  public readonly createSpy = vi.fn();
  public readonly updateSpy = vi.fn();
  public readonly startAttentionSpy = vi.fn();
  public readonly closeSpy = vi.fn();
  public readonly createActionSpy = vi.fn();
  public readonly updateActionSpy = vi.fn();
  public readonly executeActionSpy = vi.fn();
  public readonly verifyActionSpy = vi.fn();

  public create(
    input: CreateNonConformityRequest,
    origin: DataOrigin,
    actorId: string,
  ) {
    this.createSpy(input, origin, actorId);
    return Promise.resolve(IDS.nc);
  }
  public update(
    id: string,
    input: UpdateNonConformityRequest,
    actorId: string,
  ) {
    this.updateSpy(id, input, actorId);
    return Promise.resolve();
  }
  public startAttention(id: string, actorId: string) {
    this.startAttentionSpy(id, actorId);
    return Promise.resolve();
  }
  public close(id: string, input: CloseNonConformityRequest, actorId: string) {
    this.closeSpy(id, input, actorId);
    return Promise.resolve();
  }
  public createAction(
    nonConformityId: string,
    input: CreateActionRequest,
    actorId: string,
  ) {
    this.createActionSpy(nonConformityId, input, actorId);
    return Promise.resolve(IDS.action);
  }
  public updateAction(
    actionId: string,
    input: UpdateActionRequest,
    actorId: string,
  ) {
    this.updateActionSpy(actionId, input, actorId);
    return Promise.resolve();
  }
  public executeAction(actionId: string, actorId: string) {
    this.executeActionSpy(actionId, actorId);
    return Promise.resolve();
  }
  public verifyAction(
    actionId: string,
    input: VerifyActionRequest,
    actorId: string,
  ) {
    this.verifyActionSpy(actionId, input, actorId);
    return Promise.resolve();
  }
}

export const createInput: CreateNonConformityRequest = {
  batchId: IDS.batch,
  stageId: IDS.stage,
  description: 'Fuga detectada en la línea de fermentación.',
  severity: 'MODERADA',
};
