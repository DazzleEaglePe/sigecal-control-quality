import type {
  CorrectSensorySessionRequest,
  CreateSensorySessionRequest,
  Role,
  SensoryCompareQuery,
  SensoryProfile,
  SensoryPanelistOption,
  SensoryPreparation,
  SensorySessionItem,
  SensorySessionListQuery,
} from '@sigecal/shared';
import type { Prisma } from '../../generated/prisma/client.js';

export interface SensoryActor {
  readonly userId: string;
  readonly role: Role;
}
export interface SensoryInspection {
  readonly id: string;
  readonly code: string;
  readonly type: 'FISICOQUIMICO' | 'ORGANOLEPTICO';
  readonly status:
    | 'PROGRAMADA'
    | 'EN_PROCESO'
    | 'COMPLETADA'
    | 'VENCIDA'
    | 'CANCELADA'
    | 'REPROGRAMADA';
  readonly scheduledDate: Date;
  readonly responsibleId: string;
  readonly stageId: string;
  readonly batch: {
    readonly id: string;
    readonly code: string;
    readonly piscoTypeId: string;
    readonly dataOrigin: 'REAL' | 'DEMO';
  };
}
export interface SensoryThresholdRecord {
  readonly id: string;
  readonly minAverage: Prisma.Decimal;
  readonly defaultSeverity: 'LEVE' | 'MODERADA' | 'CRITICA';
  readonly referenceNorm: string | null;
  readonly validFrom: Date;
  readonly isProvisional: boolean;
  readonly piscoTypeId: string | null;
}
export interface SensoryAttributeRecord {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly sequence: number;
}
export interface SensorySessionRecord {
  readonly id: string;
  readonly inspectionId: string;
  readonly sessionDate: Date;
  readonly overallAverage: Prisma.Decimal;
  readonly appliedThreshold: Prisma.Decimal;
  readonly status: 'CONFORME' | 'NO_CONFORME' | 'ANULADO';
  readonly defectsFound: string | null;
  readonly notes: string | null;
  readonly recordedAt: Date;
  readonly dataOrigin: 'REAL' | 'DEMO';
  readonly annulledAt: Date | null;
  readonly annulReason: string | null;
  readonly replacesId: string | null;
  readonly inspection: {
    readonly id: string;
    readonly code: string;
    readonly batch: { readonly id: string; readonly code: string };
  };
  readonly sensoryThreshold: SensoryThresholdRecord;
  readonly recordedBy: Person;
  readonly annulledBy: Person | null;
  readonly replacement: { readonly id: string } | null;
  readonly panelists: readonly Panelist[];
  readonly nonConformity: NC | null;
}
interface Person {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
}
interface NC {
  readonly id: string;
  readonly code: string;
  readonly status:
    | 'ABIERTA'
    | 'EN_ANALISIS'
    | 'EN_TRATAMIENTO'
    | 'EN_VERIFICACION'
    | 'CERRADA'
    | 'ANULADA';
  readonly severity: 'LEVE' | 'MODERADA' | 'CRITICA';
}
interface Panelist {
  readonly id: string;
  readonly externalName: string | null;
  readonly user: Person | null;
  readonly scores: readonly {
    readonly score: number;
    readonly descriptor: string | null;
    readonly attribute: {
      readonly id: string;
      readonly code: string;
      readonly name: string;
      readonly sequence: number;
    };
  }[];
}

export interface SensoryReadRepositoryPort {
  findInspection(
    id: string,
    actor: SensoryActor,
  ): Promise<SensoryInspection | null>;
  findThreshold(
    inspection: SensoryInspection,
  ): Promise<SensoryThresholdRecord | null>;
  activeAttributes(): Promise<readonly SensoryAttributeRecord[]>;
  usersExist(ids: readonly string[]): Promise<boolean>;
  panelistOptions(): Promise<readonly SensoryPanelistOption[]>;
  findById(
    id: string,
    actor: SensoryActor,
  ): Promise<SensorySessionRecord | null>;
  findByIds(
    ids: readonly string[],
    actor?: SensoryActor,
  ): Promise<readonly SensorySessionRecord[]>;
  list(
    query: SensorySessionListQuery,
    actor: SensoryActor,
  ): Promise<{
    readonly items: readonly SensorySessionRecord[];
    readonly total: number;
  }>;
}
export interface PreparedSensorySession {
  readonly inspection: SensoryInspection;
  readonly threshold: SensoryThresholdRecord;
  readonly overallAverage: number;
  readonly status: 'CONFORME' | 'NO_CONFORME';
}
export interface SensoryMutationRepositoryPort {
  create(
    context: PreparedSensorySession,
    input: CreateSensorySessionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<string>;
  correct(
    previous: SensorySessionRecord,
    context: PreparedSensorySession,
    input: CorrectSensorySessionRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<{ readonly annulledId: string; readonly replacementId: string }>;
}
export interface SensoryUseCases {
  list(
    query: SensorySessionListQuery,
    actor: SensoryActor,
  ): Promise<{
    readonly data: readonly SensorySessionItem[];
    readonly total: number;
  }>;
  detail(id: string, actor: SensoryActor): Promise<SensorySessionItem>;
  create(
    input: CreateSensorySessionRequest,
    actor: SensoryActor,
    ipAddress?: string,
  ): Promise<SensorySessionItem>;
  correct(
    id: string,
    input: CorrectSensorySessionRequest,
    actor: SensoryActor,
    ipAddress?: string,
  ): Promise<{
    readonly annulled: SensorySessionItem;
    readonly replacement: SensorySessionItem;
  }>;
  profile(id: string, actor: SensoryActor): Promise<SensoryProfile>;
  compare(
    query: SensoryCompareQuery,
    actor: SensoryActor,
  ): Promise<readonly SensoryProfile[]>;
  panelistOptions(): Promise<readonly SensoryPanelistOption[]>;
  preparation(
    inspectionId: string,
    actor: SensoryActor,
  ): Promise<SensoryPreparation>;
}
