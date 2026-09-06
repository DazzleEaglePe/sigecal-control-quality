import type {
  BatchStatus,
  BatchItem,
  BatchTimelineEntry,
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

export interface ReportGenerator {
  readonly email: string;
  readonly fullName: string;
}

export interface ReportFile {
  readonly content: Buffer;
  readonly fileName: string;
  readonly mimeType: string;
}

export interface ReportExportRepositoryPort {
  generator(userId: string): Promise<ReportGenerator>;
  recordExport(input: {
    readonly actorId: string;
    readonly entity: string;
    readonly entityId: string;
    readonly fileName: string;
    readonly ipAddress?: string;
  }): Promise<void>;
}

export interface ReportTraceabilityPort {
  get(id: string, actor: ReportActor): Promise<BatchItem>;
  timeline(
    id: string,
    actor: ReportActor,
  ): Promise<readonly BatchTimelineEntry[]>;
}

export interface ReportsUseCases {
  dashboard(
    query: ReportsDashboardQuery,
    actor: ReportActor,
  ): Promise<ReportsDashboard>;
  traceabilityPdf(
    batchId: string,
    actor: ReportActor,
    ipAddress?: string,
  ): Promise<ReportFile>;
}
