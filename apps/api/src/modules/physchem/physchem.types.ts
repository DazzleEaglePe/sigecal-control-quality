import type {
  CorrectPhysChemResultRequest,
  CreatePhysChemResultsRequest,
  DataOrigin,
  PhysChemControlChart,
  PhysChemControlChartQuery,
  PhysChemCorrection,
  PhysChemHistoryQuery,
  PhysChemResultItem,
  PhysChemResultListQuery,
  PhysChemValidation,
  Role,
  ValidatePhysChemResultsRequest,
} from '@sigecal/shared';

import type { Prisma } from '../../generated/prisma/client.js';
import type { StandardRecord } from '../standards/standards.types.js';

export interface PhysChemActor {
  readonly userId: string;
  readonly role: Role;
}
export interface PhysChemReference {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}
export interface PhysChemPerson {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
}
export interface PhysChemEquipment extends PhysChemReference {
  readonly status: 'OPERATIVO' | 'EN_MANTENIMIENTO' | 'FUERA_DE_SERVICIO';
  readonly lastCalibrationRef: string | null;
  readonly isActive: boolean;
}
export interface PhysChemParameter extends PhysChemReference {
  readonly unit: string | null;
  readonly type: 'FISICOQUIMICO' | 'SENSORIAL';
}
export interface PhysChemInspectionContext {
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
  readonly equipment: PhysChemEquipment | null;
  readonly batch: {
    readonly id: string;
    readonly code: string;
    readonly piscoTypeId: string;
    readonly dataOrigin: DataOrigin;
  };
  readonly stageId: string;
  readonly parameters: readonly {
    readonly parameter: PhysChemParameter;
  }[];
  readonly results: readonly {
    readonly id: string;
    readonly parameterId: string;
    readonly status: 'CONFORME' | 'NO_CONFORME' | 'ANULADO';
  }[];
}

export interface NonConformityRecord {
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
export interface PhysChemResultRecord {
  readonly id: string;
  readonly inspection: { readonly id: string; readonly code: string };
  readonly inspectionId: string;
  readonly batch: { readonly id: string; readonly code: string };
  readonly parameter: PhysChemParameter;
  readonly parameterId: string;
  readonly standard: StandardRecord;
  readonly standardId: string;
  readonly value: Prisma.Decimal;
  readonly status: 'CONFORME' | 'NO_CONFORME' | 'ANULADO';
  readonly observation: string | null;
  readonly equipment: PhysChemReference;
  readonly equipmentId: string;
  readonly calibrationRef: string | null;
  readonly recordedBy: PhysChemPerson;
  readonly recordedById: string;
  readonly recordedAt: Date;
  readonly dataOrigin: DataOrigin;
  readonly annulledBy: PhysChemPerson | null;
  readonly annulledById: string | null;
  readonly annulledAt: Date | null;
  readonly annulReason: string | null;
  readonly replacesId: string | null;
  readonly replacement: { readonly id: string } | null;
  readonly nonConformity: NonConformityRecord | null;
}

export interface EvaluatedMeasurement {
  readonly parameterId: string;
  readonly value: number;
  readonly observation?: string | null | undefined;
  readonly status: 'CONFORME' | 'NO_CONFORME';
  readonly standard: StandardRecord;
}
export interface CorrectionContext {
  readonly result: PhysChemResultRecord | null;
  readonly inspection: PhysChemInspectionContext | null;
  readonly equipment: PhysChemEquipment | null;
}

export interface PhysChemReadRepositoryPort {
  list(
    query: PhysChemResultListQuery,
    actor: PhysChemActor,
  ): Promise<{
    readonly items: readonly PhysChemResultRecord[];
    readonly total: number;
  }>;
  findInspection(
    id: string,
    actor: PhysChemActor,
  ): Promise<PhysChemInspectionContext | null>;
  findStandards(
    parameterIds: readonly string[],
    inspection: PhysChemInspectionContext,
  ): Promise<readonly StandardRecord[]>;
  findCorrectionContext(
    id: string,
    equipmentId: string,
    actor: PhysChemActor,
  ): Promise<CorrectionContext>;
  findByIds(ids: readonly string[]): Promise<readonly PhysChemResultRecord[]>;
  history(
    query: PhysChemHistoryQuery,
    actor: PhysChemActor,
  ): Promise<{
    readonly items: readonly PhysChemResultRecord[];
    readonly total: number;
  }>;
  controlChart(
    query: PhysChemControlChartQuery,
    actor: PhysChemActor,
  ): Promise<
    readonly {
      readonly recordedAt: Date;
      readonly value: Prisma.Decimal;
      readonly batchCode: string;
    }[]
  >;
}

export interface PhysChemMutationRepositoryPort {
  create(
    inspection: PhysChemInspectionContext,
    values: readonly EvaluatedMeasurement[],
    actorId: string,
    ipAddress?: string,
  ): Promise<readonly string[]>;
  correct(
    context: CorrectionContext & {
      readonly result: PhysChemResultRecord;
      readonly inspection: PhysChemInspectionContext;
      readonly equipment: PhysChemEquipment;
    },
    input: CorrectPhysChemResultRequest,
    evaluation: EvaluatedMeasurement,
    actorId: string,
    ipAddress?: string,
  ): Promise<{ readonly annulledId: string; readonly replacementId: string }>;
}

export interface PhysChemUseCases {
  list(
    query: PhysChemResultListQuery,
    actor: PhysChemActor,
  ): Promise<ListResult>;
  validate(
    input: ValidatePhysChemResultsRequest,
    actor: PhysChemActor,
  ): Promise<readonly PhysChemValidation[]>;
  create(
    input: CreatePhysChemResultsRequest,
    actor: PhysChemActor,
    ipAddress?: string,
  ): Promise<readonly PhysChemResultItem[]>;
  correct(
    id: string,
    input: CorrectPhysChemResultRequest,
    actor: PhysChemActor,
    ipAddress?: string,
  ): Promise<PhysChemCorrection>;
  history(
    query: PhysChemHistoryQuery,
    actor: PhysChemActor,
  ): Promise<ListResult>;
  controlChart(
    query: PhysChemControlChartQuery,
    actor: PhysChemActor,
  ): Promise<PhysChemControlChart>;
}
export interface ListResult {
  readonly data: readonly PhysChemResultItem[];
  readonly total: number;
}
