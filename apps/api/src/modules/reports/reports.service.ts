import { Role, type ReportsDashboardQuery } from '@sigecal/shared';

import { ForbiddenError } from '../../errors/app-error.js';
import { calculateDashboard } from './reports.metrics.js';
import { renderTraceabilityPdf } from './reports.pdf.js';
import { reportRange, REPORT_TIME_ZONE } from './reports.time.js';
import type {
  ReportActor,
  ReportExportRepositoryPort,
  ReportTraceabilityPort,
  ReportsRepositoryPort,
  ReportsUseCases,
} from './reports.types.js';

const canIncludeDemo = (actor: ReportActor): boolean =>
  actor.role === Role.ADMIN || actor.role === Role.JEFE_CALIDAD;

const canExport = (actor: ReportActor): boolean => actor.role !== Role.OPERARIO;

export class ReportsService implements ReportsUseCases {
  public constructor(
    private readonly repository: ReportsRepositoryPort,
    private readonly clock: () => Date = () => new Date(),
    private readonly traceability?: ReportTraceabilityPort,
    private readonly exports?: ReportExportRepositoryPort,
    private readonly pdfRenderer = renderTraceabilityPdf,
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
      ...(ipAddress ? { ipAddress } : {}),
    });
    return { content, fileName, mimeType: 'application/pdf' };
  }
}
