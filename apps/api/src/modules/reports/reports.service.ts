import {
  Role,
  type InspectionExportQuery,
  type NonConformityExportQuery,
  type ReportsDashboardQuery,
  type ResultExportQuery,
} from '@sigecal/shared';

import { ForbiddenError } from '../../errors/app-error.js';
import { calculateDashboard } from './reports.metrics.js';
import {
  renderInspectionsExcel,
  renderNonConformitiesExcel,
  renderResultsExcel,
} from './reports.excel.js';
import { renderTraceabilityPdf } from './reports.pdf.js';
import { reportRange, REPORT_TIME_ZONE } from './reports.time.js';
import type {
  ReportActor,
  ReportExcelRenderers,
  ReportExportRepositoryPort,
  ReportTraceabilityPort,
  ReportsRepositoryPort,
  ReportsUseCases,
} from './reports.types.js';

const canIncludeDemo = (actor: ReportActor): boolean =>
  actor.role === Role.ADMIN || actor.role === Role.JEFE_CALIDAD;

const canExport = (actor: ReportActor): boolean => actor.role !== Role.OPERARIO;
const excelRenderers: ReportExcelRenderers = {
  inspections: renderInspectionsExcel,
  nonConformities: renderNonConformitiesExcel,
  results: renderResultsExcel,
};
const xlsxMime =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const timestamp = (date: Date): string =>
  date.toISOString().slice(0, 16).replaceAll(/[-:T]/g, '');

export class ReportsService implements ReportsUseCases {
  public constructor(
    private readonly repository: ReportsRepositoryPort,
    private readonly clock: () => Date = () => new Date(),
    private readonly traceability?: ReportTraceabilityPort,
    private readonly exports?: ReportExportRepositoryPort,
    private readonly pdfRenderer = renderTraceabilityPdf,
    private readonly excelRenderer: ReportExcelRenderers = excelRenderers,
  ) {}

  public async dashboard(query: ReportsDashboardQuery, actor: ReportActor) {
    if (query.includeDemo && !canIncludeDemo(actor)) {
      throw new ForbiddenError(
        'Su rol no puede incluir datos de demostración en los indicadores.',
      );
    }
    const range = {
      ...reportRange(query.dateFrom, query.dateTo, this.clock()),
      includeDemo: query.includeDemo,
      actor,
    };
    const dataset = await this.repository.loadDashboard(range);
    return {
      period: {
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        timeZone: REPORT_TIME_ZONE,
      },
      includesDemo: query.includeDemo,
      ...calculateDashboard(dataset, range),
    };
  }

  public async traceabilityPdf(
    batchId: string,
    actor: ReportActor,
    ipAddress?: string,
  ) {
    if (!canExport(actor))
      throw new ForbiddenError('Su rol no puede exportar reportes.');
    if (!this.traceability || !this.exports)
      throw new Error('Dependencias de exportación no configuradas.');
    const [batch, timeline, generatedBy] = await Promise.all([
      this.traceability.get(batchId, actor),
      this.traceability.timeline(batchId, actor),
      this.exports.generator(actor.userId),
    ]);
    const fileName = `trazabilidad-${batch.code}.pdf`;
    const content = await this.pdfRenderer({
      batch,
      timeline,
      generatedBy,
      emittedAt: this.clock(),
    });
    await this.exports.recordExport({
      actorId: actor.userId,
      entity: 'BatchTraceabilityReport',
      entityId: batchId,
      fileName,
      format: 'PDF',
      ...(ipAddress ? { ipAddress } : {}),
    });
    return { content, fileName, mimeType: 'application/pdf' };
  }

  public async inspectionsExcel(
    query: InspectionExportQuery,
    actor: ReportActor,
    ipAddress?: string,
  ) {
    const exports = this.exportRepository(query.includeDemo, actor);
    const [rows, generatedBy] = await Promise.all([
      exports.inspections(query),
      exports.generator(actor.userId),
    ]);
    const emittedAt = this.clock();
    const fileName = `inspecciones-${timestamp(emittedAt)}.xlsx`;
    const content = await this.excelRenderer.inspections({
      rows,
      generatedBy,
      emittedAt,
      filters: query,
    });
    await this.auditExcel(
      actor,
      'InspectionReport',
      fileName,
      query,
      ipAddress,
    );
    return { content, fileName, mimeType: xlsxMime };
  }

  public async nonConformitiesExcel(
    query: NonConformityExportQuery,
    actor: ReportActor,
    ipAddress?: string,
  ) {
    const exports = this.exportRepository(query.includeDemo, actor);
    const [rows, generatedBy] = await Promise.all([
      exports.nonConformities(query),
      exports.generator(actor.userId),
    ]);
    const emittedAt = this.clock();
    const fileName = `no-conformidades-${timestamp(emittedAt)}.xlsx`;
    const content = await this.excelRenderer.nonConformities({
      rows,
      generatedBy,
      emittedAt,
      filters: query,
    });
    await this.auditExcel(
      actor,
      'NonConformityReport',
      fileName,
      query,
      ipAddress,
    );
    return { content, fileName, mimeType: xlsxMime };
  }

  public async resultsExcel(
    query: ResultExportQuery,
    actor: ReportActor,
    ipAddress?: string,
  ) {
    const exports = this.exportRepository(query.includeDemo, actor);
    const [rows, generatedBy] = await Promise.all([
      exports.results(query),
      exports.generator(actor.userId),
    ]);
    const emittedAt = this.clock();
    const fileName = `resultados-${timestamp(emittedAt)}.xlsx`;
    const content = await this.excelRenderer.results({
      rows,
      generatedBy,
      emittedAt,
      filters: query,
    });
    await this.auditExcel(actor, 'ResultReport', fileName, query, ipAddress);
    return { content, fileName, mimeType: xlsxMime };
  }

  private exportRepository(
    includeDemo: boolean,
    actor: ReportActor,
  ): ReportExportRepositoryPort {
    if (!canExport(actor))
      throw new ForbiddenError('Su rol no puede exportar reportes.');
    if (includeDemo && !canIncludeDemo(actor))
      throw new ForbiddenError(
        'Su rol no puede incluir datos de demostración en reportes.',
      );
    if (!this.exports)
      throw new Error('Dependencias de exportación no configuradas.');
    return this.exports;
  }

  private auditExcel(
    actor: ReportActor,
    entity: string,
    fileName: string,
    filters: Record<string, unknown>,
    ipAddress?: string,
  ): Promise<void> {
    if (!this.exports)
      throw new Error('Dependencias de exportación no configuradas.');
    return this.exports.recordExport({
      actorId: actor.userId,
      entity,
      entityId: actor.userId,
      fileName,
      format: 'XLSX',
      filters,
      ...(ipAddress ? { ipAddress } : {}),
    });
  }
}
