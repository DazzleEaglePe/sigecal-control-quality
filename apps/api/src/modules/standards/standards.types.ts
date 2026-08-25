import type {
  CreateSensoryThresholdRequest,
  CreateStandardRequest,
  EffectiveSensoryThresholdQuery,
  EffectiveStandardQuery,
  SensoryThresholdHistoryQuery,
  SensoryThresholdItem,
  StandardHistoryQuery,
  StandardItem,
  UpdateStandardRequest,
} from '@sigecal/shared';
import type { Prisma } from '../../generated/prisma/client.js';

export interface StandardRecord {
  readonly id: string;
  readonly parameterId: string;
  readonly piscoTypeId: string | null;
  readonly stageId: string | null;
  readonly minValue: Prisma.Decimal | null;
  readonly maxValue: Prisma.Decimal | null;
  readonly targetValue: Prisma.Decimal | null;
  readonly referenceNorm: string | null;
  readonly defaultSeverity: 'LEVE' | 'MODERADA' | 'CRITICA';
  readonly isProvisional: boolean;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isActive: boolean;
}

export interface ThresholdRecord {
  readonly id: string;
  readonly piscoTypeId: string | null;
  readonly minAverage: Prisma.Decimal;
  readonly defaultSeverity: 'LEVE' | 'MODERADA' | 'CRITICA';
  readonly referenceNorm: string | null;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isActive: boolean;
  readonly isProvisional: boolean;
}

export interface StandardRepositoryPort {
  list(query: StandardHistoryQuery): Promise<readonly StandardRecord[]>;
  findById(id: string): Promise<StandardRecord | null>;
  findOverlaps(
    input: CreateStandardRequest,
  ): Promise<readonly StandardRecord[]>;
  findCandidates(
    query: EffectiveStandardQuery,
  ): Promise<readonly StandardRecord[]>;
  referencesExist(input: CreateStandardRequest): Promise<boolean>;
  resultCount(id: string): Promise<number>;
  create(
    input: CreateStandardRequest,
    actorId: string,
    previousId?: string,
    ipAddress?: string,
  ): Promise<StandardRecord>;
  update(
    id: string,
    input: UpdateStandardRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<StandardRecord>;
}

export interface ThresholdRepositoryPort {
  list(
    query: SensoryThresholdHistoryQuery,
  ): Promise<readonly ThresholdRecord[]>;
  findOverlaps(
    input: CreateSensoryThresholdRequest,
  ): Promise<readonly ThresholdRecord[]>;
  findCandidates(
    query: EffectiveSensoryThresholdQuery,
  ): Promise<readonly ThresholdRecord[]>;
  piscoTypeExists(id: string): Promise<boolean>;
  create(
    input: CreateSensoryThresholdRequest,
    actorId: string,
    previousId?: string,
    ipAddress?: string,
  ): Promise<ThresholdRecord>;
}

export interface StandardsUseCases {
  list(query: StandardHistoryQuery): Promise<readonly StandardItem[]>;
  create(
    input: CreateStandardRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<StandardItem>;
  update(
    id: string,
    input: UpdateStandardRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<StandardItem>;
  effective(query: EffectiveStandardQuery): Promise<StandardItem>;
  listThresholds(
    query: SensoryThresholdHistoryQuery,
  ): Promise<readonly SensoryThresholdItem[]>;
  createThreshold(
    input: CreateSensoryThresholdRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<SensoryThresholdItem>;
  effectiveThreshold(
    query: EffectiveSensoryThresholdQuery,
  ): Promise<SensoryThresholdItem>;
}
