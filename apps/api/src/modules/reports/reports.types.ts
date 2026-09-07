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
  InspectionExportQuery,
  NonConformityExportQuery,
  ResultExportQuery,
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

export interface ReportWorkbookInput<T> {
  readonly generatedBy: ReportGenerator;
  readonly emittedAt: Date;
  readonly filters: Record<string, unknown>;
  readonly rows: readonly T[];
}

export interface ReportFile {
  readonly content: Buffer;
  readonly fileName: string;
  readonly mimeType: string;
}

export interface ReportExportRepositoryPort {
  generator(userId: string): Promise<ReportGenerator>;
  inspections(
    query: InspectionExportQuery,
  ): Promise<readonly InspectionExportRow[]>;
  nonConformities(
    query: NonConformityExportQuery,
  ): Promise<readonly NonConformityExportRow[]>;
  results(query: ResultExportQuery): Promise<readonly ResultExportRow[]>;
  recordExport(input: {
    readonly actorId: string;
    readonly entity: string;
    readonly entityId: string;
    readonly fileName: string;
    readonly format: 'PDF' | 'XLSX';
    readonly filters?: Record<string, unknown>;
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
  inspectionsExcel(
    query: InspectionExportQuery,
    actor: ReportActor,
    ipAddress?: string,
  ): Promise<ReportFile>;
  nonConformitiesExcel(
    query: NonConformityExportQuery,
    actor: ReportActor,
    ipAddress?: string,
  ): Promise<ReportFile>;
  resultsExcel(
    query: ResultExportQuery,
    actor: ReportActor,
    ipAddress?: string,
  ): Promise<ReportFile>;
}

export interface InspectionExportRow {
  readonly code: string;
  readonly batchCode: string;
  readonly stageName: string;
  readonly type: string;
  readonly status: string;
  readonly scheduledDate: Date;
  readonly executedAt: Date | null;
  readonly responsible: string;
  readonly equipment: string | null;
  readonly dataOrigin: DataOrigin;
}

export interface CorrectiveActionExportRow {
  readonly type: string;
  readonly description: string;
  readonly responsible: string;
  readonly committedDate: Date;
  readonly executedAt: Date | null;
  readonly status: string;
  readonly isEffective: boolean | null;
  readonly verifiedBy: string | null;
  readonly verifiedAt: Date | null;
}

export interface NonConformityExportRow {
  readonly code: string;
  readonly batchCode: string;
  readonly stageName: string | null;
  readonly origin: string;
  readonly severity: NCSeverity;
  readonly status: NCStatus;
  readonly description: string;
  readonly rootCause: string | null;
  readonly detectedAt: Date;
  readonly assignedTo: string | null;
  readonly assignedArea: string | null;
  readonly attentionStartedAt: Date | null;
  readonly closedAt: Date | null;
  readonly dataOrigin: DataOrigin;
  readonly actions: readonly CorrectiveActionExportRow[];
}

export interface ResultExportRow {
  readonly inspectionCode: string;
  readonly batchCode: string;
  readonly stageName: string;
  readonly parameterCode: string;
  readonly parameterName: string;
  readonly unit: string | null;
  readonly value: number;
  readonly status: ResultStatus;
  readonly standardReference: string | null;
  readonly recordedAt: Date;
  readonly recordedBy: string;
  readonly equipmentCode: string;
  readonly observation: string | null;
  readonly dataOrigin: DataOrigin;
}

export interface ReportExcelRenderers {
  inspections(input: ReportWorkbookInput<InspectionExportRow>): Promise<Buffer>;
  nonConformities(
    input: ReportWorkbookInput<NonConformityExportRow>,
  ): Promise<Buffer>;
  results(input: ReportWorkbookInput<ResultExportRow>): Promise<Buffer>;
}
