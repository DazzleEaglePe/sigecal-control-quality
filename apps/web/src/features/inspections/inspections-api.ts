import {
  InspectionCoverageResponseSchema,
  InspectionListResponseSchema,
  InspectionPlanResponseSchema,
  InspectionResponseSchema,
  InspectionTemplateListResponseSchema,
  type CancelInspectionRequest,
  type CreateInspectionPlanRequest,
  type CreateInspectionRequest,
  type InspectionCalendarQuery,
  type InspectionItem,
  type InspectionListQuery,
  type InspectionTemplateListQuery,
  type MyPendingInspectionQuery,
  type RescheduleInspectionRequest,
} from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';

const queryString = (query: Readonly<Record<string, unknown>>): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    )
      params.set(key, String(value));
  }
  return params.toString();
};

const paginated = (
  response: ReturnType<typeof InspectionListResponseSchema.parse>,
) => ({
  data: response.data,
  total: response.meta?.total ?? response.data.length,
});

export const listInspections = async (
  request: AuthorizedRequest,
  query: InspectionListQuery,
) =>
  paginated(
    InspectionListResponseSchema.parse(
      await request<unknown>(`/inspections?${queryString(query)}`),
    ),
  );

export const listPendingInspections = async (
  request: AuthorizedRequest,
  query: MyPendingInspectionQuery,
) =>
  paginated(
    InspectionListResponseSchema.parse(
      await request<unknown>(`/inspections/my-pending?${queryString(query)}`),
    ),
  );

export const listInspectionCalendar = async (
  request: AuthorizedRequest,
  query: InspectionCalendarQuery,
) =>
  paginated(
    InspectionListResponseSchema.parse(
      await request<unknown>(`/inspections/calendar?${queryString(query)}`),
    ),
  );

export const getInspection = async (
  request: AuthorizedRequest,
  id: string,
): Promise<InspectionItem> =>
  InspectionResponseSchema.parse(await request<unknown>(`/inspections/${id}`))
    .data;

export const createInspection = async (
  request: AuthorizedRequest,
  input: CreateInspectionRequest,
): Promise<InspectionItem> =>
  InspectionResponseSchema.parse(
    await request<unknown>('/inspections', { method: 'POST', body: input }),
  ).data;

const transition = async (
  request: AuthorizedRequest,
  id: string,
  action: 'start' | 'cancel' | 'reschedule',
  body?: CancelInspectionRequest | RescheduleInspectionRequest,
): Promise<InspectionItem> =>
  InspectionResponseSchema.parse(
    await request<unknown>(`/inspections/${id}/${action}`, {
      method: 'POST',
      ...(body ? { body } : {}),
    }),
  ).data;

export const startInspection = (request: AuthorizedRequest, id: string) =>
  transition(request, id, 'start');
export const cancelInspection = (
  request: AuthorizedRequest,
  id: string,
  body: CancelInspectionRequest,
) => transition(request, id, 'cancel', body);
export const rescheduleInspection = (
  request: AuthorizedRequest,
  id: string,
  body: RescheduleInspectionRequest,
) => transition(request, id, 'reschedule', body);

export const getInspectionCoverage = async (
  request: AuthorizedRequest,
  batchId: string,
) =>
  InspectionCoverageResponseSchema.parse(
    await request<unknown>(`/inspections/coverage?batchId=${batchId}`),
  ).data;

export const listInspectionTemplates = async (
  request: AuthorizedRequest,
  query: InspectionTemplateListQuery,
) => {
  const response = InspectionTemplateListResponseSchema.parse(
    await request<unknown>(
      `/masters/inspection-templates?${queryString(query)}`,
    ),
  );
  return {
    data: response.data,
    total: response.meta?.total ?? response.data.length,
  };
};

export const createInspectionPlan = async (
  request: AuthorizedRequest,
  input: CreateInspectionPlanRequest,
) =>
  InspectionPlanResponseSchema.parse(
    await request<unknown>('/inspections/plans/from-template', {
      method: 'POST',
      body: input,
    }),
  ).data;
