import type {
  CancelInspectionRequest,
  CreateInspectionPlanRequest,
  CreateInspectionRequest,
  DataOrigin,
  EquipmentStatus,
  InspectionCalendarQuery,
  InspectionCoverage,
  InspectionDetail,
  InspectionItem,
  InspectionListQuery,
  InspectionStatus,
  InspectionType,
  MyPendingInspectionQuery,
  ParameterType,
  RescheduleInspectionRequest,
  Role,
  UpdateInspectionRequest,
} from '@sigecal/shared';

import type { PhysChemResultRecord } from '../physchem/physchem.types.js';
import type { StandardRecord } from '../standards/standards.types.js';

export interface InspectionActor {
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
export interface EquipmentRecord extends ReferenceRecord {
  readonly status: EquipmentStatus;
  readonly isActive: boolean;
}
export interface ParameterRecord extends ReferenceRecord {
  readonly type: ParameterType;
  readonly unit: string | null;
  readonly isActive: boolean;
}

export interface InspectionRecord {
  readonly id: string;
  readonly code: string;
  readonly batch: BatchReferenceRecord;
  readonly batchId: string;
  readonly stage: ReferenceRecord;
  readonly stageId: string;
  readonly type: InspectionType;
  readonly status: InspectionStatus;
  readonly scheduledDate: Date;
  readonly executedAt: Date | null;
  readonly responsible: PersonRecord;
  readonly responsibleId: string;
  readonly equipment: EquipmentRecord | null;
  readonly equipmentId: string | null;
  readonly rescheduledFromId: string | null;
  readonly rescheduledTo: { readonly id: string } | null;
  readonly changeReason: string | null;
  readonly notes: string | null;
  readonly createdBy: PersonRecord;
  readonly createdById: string;
  readonly dataOrigin: DataOrigin;
  readonly parameters: readonly {
    readonly parameter: ParameterRecord;
  }[];
  readonly results: readonly { readonly parameterId: string }[];
}

export interface InspectionDetailRecord {
  readonly inspection: InspectionRecord;
  readonly standards: readonly StandardRecord[];
  readonly results: readonly PhysChemResultRecord[];
}

export interface InspectionBatchContext extends BatchReferenceRecord {
  readonly piscoTypeId: string;
  readonly startDate: Date;
  readonly status: 'EN_PROCESO' | 'EN_OBSERVACION' | 'CERRADO' | 'RECHAZADO';
  readonly dataOrigin: DataOrigin;
}
export interface InspectionUserRecord extends PersonRecord {
  readonly role: Role;
  readonly isActive: boolean;
}
export interface InspectionReferences {
  readonly batch: InspectionBatchContext | null;
  readonly stage: (ReferenceRecord & { readonly isActive: boolean }) | null;
  readonly responsible: InspectionUserRecord | null;
  readonly equipment: EquipmentRecord | null;
  readonly parameters: readonly ParameterRecord[];
}

export interface PlanTemplateRecord {
  readonly id: string;
  readonly piscoTypeId: string;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isActive: boolean;
  readonly items: readonly {
    readonly stageId: string;
    readonly type: InspectionType;
    readonly offsetDaysFromBatchStart: number;
    readonly scheduledLocalTime: Date;
    readonly responsibleRole: Role;
    readonly equipmentId: string | null;
    readonly parameters: readonly { readonly parameterId: string }[];
  }[];
}
export interface InspectionPlanContext {
  readonly batch: InspectionBatchContext | null;
  readonly template: PlanTemplateRecord | null;
  readonly users: readonly InspectionUserRecord[];
}
export interface ReadyInspectionPlanContext extends InspectionPlanContext {
  readonly batch: InspectionBatchContext;
  readonly template: PlanTemplateRecord;
}

export interface InspectionReadRepositoryPort {
  list(
    query: InspectionListQuery,
    actor: InspectionActor,
  ): Promise<{
    readonly items: readonly InspectionRecord[];
    readonly total: number;
  }>;
  calendar(
    query: InspectionCalendarQuery,
    actor: InspectionActor,
  ): Promise<{
    readonly items: readonly InspectionRecord[];
    readonly total: number;
  }>;
  myPending(
    query: MyPendingInspectionQuery,
    actor: InspectionActor,
  ): Promise<{
    readonly items: readonly InspectionRecord[];
    readonly total: number;
  }>;
  findAccessibleById(
    id: string,
    actor: InspectionActor,
  ): Promise<InspectionRecord | null>;
  findDetailById(
    id: string,
    actor: InspectionActor,
  ): Promise<InspectionDetailRecord | null>;
  findReferences(input: CreateInspectionRequest): Promise<InspectionReferences>;
  findPlanContext(
    input: CreateInspectionPlanRequest,
  ): Promise<InspectionPlanContext>;
  coverage(batchId: string): Promise<{
    readonly batch: BatchReferenceRecord | null;
    readonly stages: readonly (ReferenceRecord & { readonly count: number })[];
  }>;
}

export interface InspectionMutationRepositoryPort {
  markOverdue(now: Date): Promise<number>;
  create(
    input: CreateInspectionRequest,
    dataOrigin: DataOrigin,
    actorId: string,
    ipAddress?: string,
  ): Promise<string>;
  update(
    id: string,
    input: UpdateInspectionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
  reschedule(
    current: InspectionRecord,
    input: RescheduleInspectionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<string>;
  cancel(
    id: string,
    input: CancelInspectionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
  start(id: string, actorId: string, ipAddress?: string): Promise<void>;
  createPlan(
    context: ReadyInspectionPlanContext,
    input: CreateInspectionPlanRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<readonly string[]>;
}

export interface InspectionsUseCases {
  list(query: InspectionListQuery, actor: InspectionActor): Promise<ListResult>;
  calendar(
    query: InspectionCalendarQuery,
    actor: InspectionActor,
  ): Promise<ListResult>;
  myPending(
    query: MyPendingInspectionQuery,
    actor: InspectionActor,
  ): Promise<ListResult>;
  get(id: string, actor: InspectionActor): Promise<InspectionItem>;
  detail(id: string, actor: InspectionActor): Promise<InspectionDetail>;
  create(
    input: CreateInspectionRequest,
    actor: InspectionActor,
    ipAddress?: string,
  ): Promise<InspectionItem>;
  update(
    id: string,
    input: UpdateInspectionRequest,
    actor: InspectionActor,
    ipAddress?: string,
  ): Promise<InspectionItem>;
  reschedule(
    id: string,
    input: RescheduleInspectionRequest,
    actor: InspectionActor,
    ipAddress?: string,
  ): Promise<InspectionItem>;
  cancel(
    id: string,
    input: CancelInspectionRequest,
    actor: InspectionActor,
    ipAddress?: string,
  ): Promise<InspectionItem>;
  start(
    id: string,
    actor: InspectionActor,
    ipAddress?: string,
  ): Promise<InspectionItem>;
  coverage(
    batchId: string,
    actor: InspectionActor,
  ): Promise<InspectionCoverage>;
  createPlan(
    input: CreateInspectionPlanRequest,
    actor: InspectionActor,
    ipAddress?: string,
  ): Promise<readonly InspectionItem[]>;
}

export interface ListResult {
  readonly data: readonly InspectionItem[];
  readonly total: number;
}
