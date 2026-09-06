import { Role, type ReportsDashboardQuery } from '@sigecal/shared';

import { ForbiddenError } from '../../errors/app-error.js';
import { calculateDashboard } from './reports.metrics.js';
import { reportRange, REPORT_TIME_ZONE } from './reports.time.js';
import type {
  ReportActor,
  ReportsRepositoryPort,
  ReportsUseCases,
} from './reports.types.js';

const canIncludeDemo = (actor: ReportActor): boolean =>
  actor.role === Role.ADMIN || actor.role === Role.JEFE_CALIDAD;

export class ReportsService implements ReportsUseCases {
  public constructor(
    private readonly repository: ReportsRepositoryPort,
    private readonly clock: () => Date = () => new Date(),
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
}
