import {
  BatchAdvanceResponseSchema,
  BatchListResponseSchema,
  BatchResponseSchema,
  BatchTimelineResponseSchema,
  type AdvanceBatchStageRequest,
  type BatchItem,
  type BatchListQuery,
  type BatchTimelineEntry,
  type CreateBatchRequest,
  type RejectBatchRequest,
  type UpdateBatchRequest,
} from '@sigecal/shared';

import type {
  AuthorizedRequest,
  AuthorizedTextRequest,
} from '../auth/auth-context.js';

const queryString = (query: BatchListQuery): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
};

export const listBatches = async (
  request: AuthorizedRequest,
  query: BatchListQuery,
) => {
  const response = BatchListResponseSchema.parse(
    await request<unknown>(`/batches?${queryString(query)}`),
  );
  return {
    data: response.data,
    total: response.meta?.total ?? response.data.length,
  };
};

export const getBatch = async (
  request: AuthorizedRequest,
  id: string,
): Promise<BatchItem> =>
  BatchResponseSchema.parse(await request<unknown>(`/batches/${id}`)).data;

export const createBatch = async (
  request: AuthorizedRequest,
  input: CreateBatchRequest,
): Promise<BatchItem> =>
  BatchResponseSchema.parse(
    await request<unknown>('/batches', { method: 'POST', body: input }),
  ).data;

export const updateBatch = async (
  request: AuthorizedRequest,
  id: string,
  input: UpdateBatchRequest,
): Promise<BatchItem> =>
  BatchResponseSchema.parse(
    await request<unknown>(`/batches/${id}`, { method: 'PATCH', body: input }),
  ).data;

export const getBatchTimeline = async (
  request: AuthorizedRequest,
  id: string,
): Promise<readonly BatchTimelineEntry[]> =>
  BatchTimelineResponseSchema.parse(
    await request<unknown>(`/batches/${id}/timeline`),
  ).data;

export const advanceBatch = async (
  request: AuthorizedRequest,
  id: string,
  input: AdvanceBatchStageRequest,
) =>
  BatchAdvanceResponseSchema.parse(
    await request<unknown>(`/batches/${id}/advance-stage`, {
      method: 'POST',
      body: input,
    }),
  ).data;

const decision = async (
  request: AuthorizedRequest,
  id: string,
  action: 'close' | 'reject',
  body?: RejectBatchRequest,
): Promise<BatchItem> =>
  BatchResponseSchema.parse(
    await request<unknown>(`/batches/${id}/${action}`, {
      method: 'POST',
      ...(body ? { body } : {}),
    }),
  ).data;

export const closeBatch = (request: AuthorizedRequest, id: string) =>
  decision(request, id, 'close');
export const rejectBatch = (
  request: AuthorizedRequest,
  id: string,
  input: RejectBatchRequest,
) => decision(request, id, 'reject', input);

export const getBatchQr = (
  request: AuthorizedTextRequest,
  id: string,
): Promise<string> => request(`/batches/${id}/qr`);
