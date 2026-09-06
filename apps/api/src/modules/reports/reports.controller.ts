import type { Request, RequestHandler } from 'express';
import type { ReportsDashboardQuery } from '@sigecal/shared';

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
}
