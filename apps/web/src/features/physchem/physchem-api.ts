import {
  PhysChemControlChartResponseSchema,
  PhysChemCorrectionResponseSchema,
  PhysChemResultListResponseSchema,
  PhysChemValidationResponseSchema,
  type CorrectPhysChemResultRequest,
  type CreatePhysChemResultsRequest,
  type PhysChemControlChartQuery,
  type PhysChemHistoryQuery,
  type PhysChemResultListQuery,
  type ValidatePhysChemResultsRequest,
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

const parseList = (value: unknown) => {
  const response = PhysChemResultListResponseSchema.parse(value);
  return {
    data: response.data,
    total: response.meta?.total ?? response.data.length,
  };
};

export const listPhysChemResults = (
  request: AuthorizedRequest,
  query: PhysChemResultListQuery,
) =>
  request<unknown>(`/physchem/results?${queryString(query)}`).then(parseList);

export const validatePhysChemResults = async (
  request: AuthorizedRequest,
  input: ValidatePhysChemResultsRequest,
) =>
  PhysChemValidationResponseSchema.parse(
    await request<unknown>('/physchem/results/validate', {
      method: 'POST',
      body: input,
    }),
  ).data;

export const createPhysChemResults = async (
  request: AuthorizedRequest,
  input: CreatePhysChemResultsRequest,
) =>
  PhysChemResultListResponseSchema.parse(
    await request<unknown>('/physchem/results', {
      method: 'POST',
      body: input,
    }),
  ).data;

export const correctPhysChemResult = async (
  request: AuthorizedRequest,
  id: string,
  input: CorrectPhysChemResultRequest,
) =>
  PhysChemCorrectionResponseSchema.parse(
    await request<unknown>(`/physchem/results/${id}/correct`, {
      method: 'POST',
      body: input,
    }),
  ).data;

export const getPhysChemHistory = (
  request: AuthorizedRequest,
  query: PhysChemHistoryQuery,
) =>
  request<unknown>(`/physchem/history?${queryString(query)}`).then(parseList);

export const getPhysChemControlChart = async (
  request: AuthorizedRequest,
  query: PhysChemControlChartQuery,
) =>
  PhysChemControlChartResponseSchema.parse(
    await request<unknown>(`/physchem/control-chart?${queryString(query)}`),
  ).data;
