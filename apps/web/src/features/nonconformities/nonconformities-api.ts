import {
  CorrectiveActionListResponseSchema,
  CorrectiveActionResponseSchema,
  NonConformityDetailResponseSchema,
  NonConformityListResponseSchema,
  NonConformityResponseSchema,
  type CloseNonConformityRequest,
  type CorrectiveActionItem,
  type CreateActionRequest,
  type CreateNonConformityRequest,
  type NonConformityDetail,
  type NonConformityItem,
  type NonConformityListQuery,
  type UpdateActionRequest,
  type UpdateNonConformityRequest,
  type VerifyActionRequest,
} from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';

const queryString = (query: NonConformityListQuery): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
};

export const listNonConformities = async (
  request: AuthorizedRequest,
  query: NonConformityListQuery,
) => {
  const response = NonConformityListResponseSchema.parse(
    await request<unknown>(`/nonconformities?${queryString(query)}`),
  );
  return {
    data: response.data,
    total: response.meta?.total ?? response.data.length,
  };
};

export const getNonConformity = async (
  request: AuthorizedRequest,
  id: string,
): Promise<NonConformityDetail> =>
  NonConformityDetailResponseSchema.parse(
    await request<unknown>(`/nonconformities/${id}`),
  ).data;

export const createNonConformity = async (
  request: AuthorizedRequest,
  input: CreateNonConformityRequest,
): Promise<NonConformityDetail> =>
  NonConformityDetailResponseSchema.parse(
    await request<unknown>('/nonconformities', { method: 'POST', body: input }),
  ).data;

export const updateNonConformity = async (
  request: AuthorizedRequest,
  id: string,
  input: UpdateNonConformityRequest,
): Promise<NonConformityItem> =>
  NonConformityResponseSchema.parse(
    await request<unknown>(`/nonconformities/${id}`, {
      method: 'PATCH',
      body: input,
    }),
  ).data;

export const startAttention = async (
  request: AuthorizedRequest,
  id: string,
): Promise<NonConformityItem> =>
  NonConformityResponseSchema.parse(
    await request<unknown>(`/nonconformities/${id}/start-attention`, {
      method: 'POST',
    }),
  ).data;

export const closeNonConformity = async (
  request: AuthorizedRequest,
  id: string,
  input: CloseNonConformityRequest,
): Promise<NonConformityItem> =>
  NonConformityResponseSchema.parse(
    await request<unknown>(`/nonconformities/${id}/close`, {
      method: 'POST',
      body: input,
    }),
  ).data;

export const listActions = async (
  request: AuthorizedRequest,
  nonConformityId: string,
): Promise<readonly CorrectiveActionItem[]> =>
  CorrectiveActionListResponseSchema.parse(
    await request<unknown>(`/nonconformities/${nonConformityId}/actions`),
  ).data;

export const createAction = async (
  request: AuthorizedRequest,
  nonConformityId: string,
  input: CreateActionRequest,
): Promise<CorrectiveActionItem> =>
  CorrectiveActionResponseSchema.parse(
    await request<unknown>(`/nonconformities/${nonConformityId}/actions`, {
      method: 'POST',
      body: input,
    }),
  ).data;

export const updateAction = async (
  request: AuthorizedRequest,
  actionId: string,
  input: UpdateActionRequest,
): Promise<CorrectiveActionItem> =>
  CorrectiveActionResponseSchema.parse(
    await request<unknown>(`/nonconformities/actions/${actionId}`, {
      method: 'PATCH',
      body: input,
    }),
  ).data;

export const executeAction = async (
  request: AuthorizedRequest,
  actionId: string,
): Promise<CorrectiveActionItem> =>
  CorrectiveActionResponseSchema.parse(
    await request<unknown>(`/nonconformities/actions/${actionId}/execute`, {
      method: 'POST',
    }),
  ).data;

export const verifyAction = async (
  request: AuthorizedRequest,
  actionId: string,
  input: VerifyActionRequest,
): Promise<CorrectiveActionItem> =>
  CorrectiveActionResponseSchema.parse(
    await request<unknown>(`/nonconformities/actions/${actionId}/verify`, {
      method: 'POST',
      body: input,
    }),
  ).data;
