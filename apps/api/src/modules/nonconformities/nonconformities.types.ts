import type {
  ActionStatus,
  ActionType,
  CloseNonConformityRequest,
  CreateActionRequest,
  CreateNonConformityRequest,
  CorrectiveActionItem,
  DataOrigin,
  NCOrigin,
  NCSeverity,
  NCStatus,
  NonConformityDetail,
  NonConformityItem,
  NonConformityListQuery,
  Role,
  UpdateActionRequest,
  UpdateNonConformityRequest,
  VerifyActionRequest,
} from '@sigecal/shared';

export interface NonConformityActor {
  readonly userId: string;
  readonly role: Role;
}
export interface ReferenceRecord {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}
export interface BatchReferenceRecord {
  readonly id: string;
  readonly code: string;
}
export interface PersonRecord {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
}

export interface CorrectiveActionRecord {
  readonly id: string;
  readonly nonConformityId: string;
  readonly type: ActionType;
  readonly description: string;
  readonly responsible: PersonRecord;
  readonly responsibleId: string;
  readonly committedDate: Date;
  readonly executedAt: Date | null;
  readonly status: ActionStatus;
  readonly isEffective: boolean | null;
  readonly verifiedBy: PersonRecord | null;
  readonly verifiedAt: Date | null;
  readonly verificationComment: string | null;
  readonly replacesActionId: string | null;
}

export interface NonConformityRecord {
  readonly id: string;
  readonly code: string;
  readonly batch: BatchReferenceRecord;
  readonly batchId: string;
  readonly stage: ReferenceRecord | null;
  readonly stageId: string | null;
  readonly inspectionId: string | null;
  readonly physChemResultId: string | null;
  readonly sensorySessionId: string | null;
  readonly origin: NCOrigin;
  readonly severity: NCSeverity;
  readonly status: NCStatus;
  readonly description: string;
  readonly rootCause: string | null;
  readonly detectedAt: Date;
  readonly detectedBy: PersonRecord;
  readonly assignedTo: PersonRecord | null;
  readonly assignedToId: string | null;
  readonly assignedArea: ReferenceRecord | null;
  readonly assignedAreaId: string | null;
  readonly attentionStartedAt: Date | null;
  readonly closedAt: Date | null;
  readonly closedBy: PersonRecord | null;
  readonly closeComment: string | null;
  readonly annulledAt: Date | null;
  readonly annulledBy: PersonRecord | null;
  readonly annulReason: string | null;
  readonly dataOrigin: DataOrigin;
}

export interface NonConformityDetailRecord {
  readonly nonConformity: NonConformityRecord;
  readonly actions: readonly CorrectiveActionRecord[];
}

export interface NonConformityReferences {
  readonly batch: {
    readonly id: string;
    readonly dataOrigin: DataOrigin;
  } | null;
  readonly stage: (ReferenceRecord & { readonly isActive: boolean }) | null;
  readonly assignedTo: (PersonRecord & { readonly isActive: boolean }) | null;
  readonly assignedArea:
    | (ReferenceRecord & {
        readonly isActive: boolean;
      })
    | null;
}

export interface ActionReferences {
  readonly nonConformity: NonConformityRecord | null;
  readonly responsible: (PersonRecord & { readonly isActive: boolean }) | null;
  readonly replacesAction:
    | (Pick<CorrectiveActionRecord, 'id' | 'nonConformityId' | 'status'> & {
        readonly replacementAction: { readonly id: string } | null;
      })
    | null;
}

export interface NonConformityReadRepositoryPort {
  list(
    query: NonConformityListQuery,
    actor: NonConformityActor,
  ): Promise<{
    readonly items: readonly NonConformityRecord[];
    readonly total: number;
  }>;
  findAccessibleById(
    id: string,
    actor: NonConformityActor,
  ): Promise<NonConformityRecord | null>;
  findDetailById(
    id: string,
    actor: NonConformityActor,
  ): Promise<NonConformityDetailRecord | null>;
  findActions(
    nonConformityId: string,
  ): Promise<readonly CorrectiveActionRecord[]>;
  findActionById(actionId: string): Promise<CorrectiveActionRecord | null>;
  findReferences(
    input: CreateNonConformityRequest | UpdateNonConformityRequest,
  ): Promise<NonConformityReferences>;
  findActionReferences(
    nonConformityId: string,
    responsibleId: string,
    replacesActionId?: string,
  ): Promise<ActionReferences>;
}

export interface NonConformityMutationRepositoryPort {
  create(
    input: CreateNonConformityRequest,
    dataOrigin: DataOrigin,
    actorId: string,
    ipAddress?: string,
  ): Promise<string>;
  update(
    id: string,
    input: UpdateNonConformityRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
  startAttention(
    id: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
  close(
    id: string,
    input: CloseNonConformityRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
  createAction(
    nonConformityId: string,
    input: CreateActionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<string>;
  updateAction(
    actionId: string,
    input: UpdateActionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
  executeAction(
    actionId: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
  verifyAction(
    actionId: string,
    input: VerifyActionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
}

export interface NonConformitiesUseCases {
  list(
    query: NonConformityListQuery,
    actor: NonConformityActor,
  ): Promise<{
    readonly data: readonly NonConformityItem[];
    readonly total: number;
  }>;
  detail(id: string, actor: NonConformityActor): Promise<NonConformityDetail>;
  create(
    input: CreateNonConformityRequest,
    actor: NonConformityActor,
    ipAddress?: string,
  ): Promise<NonConformityDetail>;
  update(
    id: string,
    input: UpdateNonConformityRequest,
    actor: NonConformityActor,
    ipAddress?: string,
  ): Promise<NonConformityItem>;
  startAttention(
    id: string,
    actor: NonConformityActor,
    ipAddress?: string,
  ): Promise<NonConformityItem>;
  close(
    id: string,
    input: CloseNonConformityRequest,
    actor: NonConformityActor,
    ipAddress?: string,
  ): Promise<NonConformityItem>;
  listActions(
    nonConformityId: string,
    actor: NonConformityActor,
  ): Promise<readonly CorrectiveActionItem[]>;
  createAction(
    nonConformityId: string,
    input: CreateActionRequest,
    actor: NonConformityActor,
    ipAddress?: string,
  ): Promise<CorrectiveActionItem>;
  updateAction(
    actionId: string,
    input: UpdateActionRequest,
    actor: NonConformityActor,
    ipAddress?: string,
  ): Promise<CorrectiveActionItem>;
  executeAction(
    actionId: string,
    actor: NonConformityActor,
    ipAddress?: string,
  ): Promise<CorrectiveActionItem>;
  verifyAction(
    actionId: string,
    input: VerifyActionRequest,
    actor: NonConformityActor,
    ipAddress?: string,
  ): Promise<CorrectiveActionItem>;
}
