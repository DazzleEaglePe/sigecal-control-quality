import {
  ReportsDashboardResponseSchema,
  type ReportsDashboard,
  type ReportsDashboardQuery,
} from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';

const dashboardQuery = (query: ReportsDashboardQuery): string => {
  const params = new URLSearchParams({
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    includeDemo: String(query.includeDemo),
  });
  return params.toString();
};

export const getDashboard = async (
  request: AuthorizedRequest,
  query: ReportsDashboardQuery,
): Promise<ReportsDashboard> =>
  ReportsDashboardResponseSchema.parse(
    await request<unknown>(`/reports/dashboard?${dashboardQuery(query)}`),
  ).data;
