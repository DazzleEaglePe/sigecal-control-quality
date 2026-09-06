import type {
  BatchStatus,
  DataOrigin,
  InspectionStatus,
  NCSeverity,
  NCStatus,
  ReportsDashboard,
  ReportsDashboardQuery,
  ResultStatus,
  Role,
} from '@sigecal/shared';

export interface ReportActor {
  readonly userId: string;
  readonly role: Role;
}

export interface ReportRange {
  readonly from: Date;
  readonly toExclusive: Date;
  readonly now: Date;
  readonly includeDemo: boolean;
  readonly actor: ReportActor;
}

export interface ResultMetricRecord {
  readonly kind: 'physchem' | 'sensory';
  readonly status: Exclude<ResultStatus, 'ANULADO'>;
  readonly recordedAt: Date;
  readonly dataOrigin: DataOrigin;
  readonly covered: boolean;
}

export interface InspectionMetricRecord {
  readonly status: InspectionStatus;
  readonly scheduledDate: Date;
  readonly executedAt: Date | null;
  readonly dataOrigin: DataOrigin;
}

export interface NonConformityMetricRecord {
  readonly status: NCStatus;
  readonly severity: NCSeverity;
  readonly detectedAt: Date;
  readonly attentionStartedAt: Date | null;
  readonly closedAt: Date | null;
  readonly annulledAt: Date | null;
  readonly dataOrigin: DataOrigin;
  readonly stageId: string | null;
  readonly stageName: string | null;
  readonly stageSequence: number | null;
}

export interface BatchStageMetricRecord {
  readonly batchId: string;
  readonly batchStatus: BatchStatus;
  readonly dataOrigin: DataOrigin;
  readonly stageId: string;
  readonly stageName: string;
  readonly stageSequence: number;
  readonly startedAt: Date;
  readonly finishedAt: Date | null;
}

export interface ReportsDataset {
  readonly results: readonly ResultMetricRecord[];
  readonly inspections: readonly InspectionMetricRecord[];
  readonly nonConformities: readonly NonConformityMetricRecord[];
  readonly batchStages: readonly BatchStageMetricRecord[];
}

export interface ReportsRepositoryPort {
  loadDashboard(range: ReportRange): Promise<ReportsDataset>;
}

export interface ReportsUseCases {
  dashboard(
    query: ReportsDashboardQuery,
    actor: ReportActor,
  ): Promise<ReportsDashboard>;
}
