import type { Request, RequestHandler } from 'express';
import type {
  InspectionExportQuery,
  NonConformityExportQuery,
  ReportsDashboardQuery,
  ResultExportQuery,
} from '@sigecal/shared';

import { UnauthorizedError } from '../../errors/app-error.js';
import type { ReportActor, ReportsUseCases } from './reports.types.js';

const actorFrom = (request: Request): ReportActor => {
  if (!request.auth) throw new UnauthorizedError();
  return { userId: request.auth.userId, role: request.auth.role };
};

export class ReportsController {
  public constructor(private readonly reports: ReportsUseCases) {}

  public readonly dashboard: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const query = request.query as unknown as ReportsDashboardQuery;
      const data = await this.reports.dashboard(query, actorFrom(request));
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly traceabilityPdf: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const batchId = String(request.params.batchId);
      const file = await this.reports.traceabilityPdf(
        batchId,
        actorFrom(request),
        request.ip,
      );
      response
        .set('Content-Type', file.mimeType)
        .set('Content-Disposition', `attachment; filename="${file.fileName}"`)
        .send(file.content);
    } catch (error) {
      next(error);
    }
  };

  public readonly inspectionsExcel: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const query = request.query as unknown as InspectionExportQuery;
      const file = await this.reports.inspectionsExcel(
        query,
        actorFrom(request),
        request.ip,
      );
      response
        .set('Content-Type', file.mimeType)
        .set('Content-Disposition', `attachment; filename="${file.fileName}"`)
        .send(file.content);
    } catch (error) {
      next(error);
    }
  };

  public readonly nonConformitiesExcel: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const query = request.query as unknown as NonConformityExportQuery;
      const file = await this.reports.nonConformitiesExcel(
        query,
        actorFrom(request),
        request.ip,
      );
      response
        .set('Content-Type', file.mimeType)
        .set('Content-Disposition', `attachment; filename="${file.fileName}"`)
        .send(file.content);
    } catch (error) {
      next(error);
    }
  };

  public readonly resultsExcel: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const query = request.query as unknown as ResultExportQuery;
      const file = await this.reports.resultsExcel(
        query,
        actorFrom(request),
        request.ip,
      );
      response
        .set('Content-Type', file.mimeType)
        .set('Content-Disposition', `attachment; filename="${file.fileName}"`)
        .send(file.content);
    } catch (error) {
      next(error);
    }
  };
}
