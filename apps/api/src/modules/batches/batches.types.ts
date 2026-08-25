import type {
  AdvanceBatchStageRequest,
  BatchAdvanceWarning,
  BatchItem,
  BatchListQuery,
  BatchTimelineEntry,
  CreateBatchRequest,
  RejectBatchRequest,
  Role,
  UpdateBatchRequest,
} from '@sigecal/shared';
import type { Prisma } from '../../generated/prisma/client.js';

export interface BatchActor {
  readonly userId: string;
  readonly role: Role;
}

export interface ReferenceRecord {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}

export interface StageRecord extends ReferenceRecord {
  readonly sequence: number;
}

export interface PersonRecord {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
}

export interface BatchRecord {
  readonly id: string;
  readonly code: string;
  readonly piscoType: ReferenceRecord;
  readonly currentStage: StageRecord;
  readonly status: BatchItem['status'];
  readonly startDate: Date;
  readonly closeDate: Date | null;
  readonly rejectedAt: Date | null;
  readonly rejectedBy: PersonRecord | null;
  readonly rejectionReason: string | null;
  readonly volumeLiters: Prisma.Decimal;
  readonly harvestOrigin: string | null;
  readonly notes: string | null;
  readonly createdBy: PersonRecord;
  readonly dataOrigin: BatchItem['dataOrigin'];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly varieties: readonly {
    readonly variety: ReferenceRecord;
    readonly percentage: Prisma.Decimal | null;
  }[];
  readonly openNonConformities: number;
  readonly hasInspections: boolean;
}

export interface BatchListResult {
  readonly items: readonly BatchRecord[];
  readonly total: number;
}

export type BatchSortField =
  'code' | 'status' | 'startDate' | 'volumeLiters' | 'createdAt' | 'updatedAt';

export interface CatalogRecord extends ReferenceRecord {
  readonly isActive: boolean;
}

export interface TimelineInspectionRecord {
  readonly id: string;
  readonly code: string;
  readonly stageId: string;
  readonly type: BatchTimelineEntry['inspections'][number]['type'];
  readonly status: BatchTimelineEntry['inspections'][number]['status'];
  readonly scheduledDate: Date;
}

export interface TimelineNCRecord {
  readonly id: string;
  readonly code: string;
  readonly stageId: string | null;
  readonly inspectionStageId: string | null;
  readonly status: BatchTimelineEntry['nonConformities'][number]['status'];
  readonly severity: BatchTimelineEntry['nonConformities'][number]['severity'];
  readonly description: string;
}

export interface StageVisitRecord {
  readonly stageId: string;
  readonly startedAt: Date;
  readonly finishedAt: Date | null;
  readonly responsible: PersonRecord;
  readonly observations: string | null;
}

export interface TimelineRecords {
  readonly stages: readonly StageRecord[];
  readonly visits: readonly StageVisitRecord[];
  readonly inspections: readonly TimelineInspectionRecord[];
  readonly nonConformities: readonly TimelineNCRecord[];
}

export interface BatchReadRepositoryPort {
  list(
    query: BatchListQuery,
    actor: BatchActor,
    sortBy: BatchSortField,
  ): Promise<BatchListResult>;
  findAccessibleById(
    id: string,
    actor: BatchActor,
  ): Promise<BatchRecord | null>;
  findPiscoType(id: string): Promise<CatalogRecord | null>;
  findVarieties(ids: readonly string[]): Promise<readonly CatalogRecord[]>;
  findFirstStage(): Promise<StageRecord | null>;
  findNextStage(sequence: number): Promise<StageRecord | null>;
  activeUserExists(id: string): Promise<boolean>;
  timeline(id: string): Promise<TimelineRecords>;
  advanceWarnings(
    batchId: string,
    stageId: string,
  ): Promise<readonly BatchAdvanceWarning[]>;
}

export interface BatchMutationRepositoryPort {
  create(
    input: CreateBatchRequest,
    firstStageId: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<string>;
  update(
    id: string,
    input: UpdateBatchRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
  advance(
    id: string,
    currentStageId: string,
    nextStageId: string,
    input: AdvanceBatchStageRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
  close(id: string, actorId: string, ipAddress?: string): Promise<void>;
  reject(
    id: string,
    input: RejectBatchRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void>;
}

export interface BatchesUseCases {
  list(
    query: BatchListQuery,
    actor: BatchActor,
  ): Promise<{ readonly data: readonly BatchItem[]; readonly total: number }>;
  get(id: string, actor: BatchActor): Promise<BatchItem>;
  create(
    input: CreateBatchRequest,
    actor: BatchActor,
    ipAddress?: string,
  ): Promise<BatchItem>;
  update(
    id: string,
    input: UpdateBatchRequest,
    actor: BatchActor,
    ipAddress?: string,
  ): Promise<BatchItem>;
  timeline(
    id: string,
    actor: BatchActor,
  ): Promise<readonly BatchTimelineEntry[]>;
  advance(
    id: string,
    input: AdvanceBatchStageRequest,
    actor: BatchActor,
    ipAddress?: string,
  ): Promise<{
    readonly batch: BatchItem;
    readonly warnings: readonly BatchAdvanceWarning[];
  }>;
  close(id: string, actor: BatchActor, ipAddress?: string): Promise<BatchItem>;
  reject(
    id: string,
    input: RejectBatchRequest,
    actor: BatchActor,
    ipAddress?: string,
  ): Promise<BatchItem>;
}

export const BATCH_SORT_FIELDS: readonly BatchSortField[] = [
  'code',
  'status',
  'startDate',
  'volumeLiters',
  'createdAt',
  'updatedAt',
];
