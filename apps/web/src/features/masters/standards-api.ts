import {
  SensoryThresholdListResponseSchema,
  SensoryThresholdResponseSchema,
  StandardListResponseSchema,
  StandardResponseSchema,
  type CreateSensoryThresholdRequest,
  type CreateStandardRequest,
  type SensoryThresholdItem,
  type StandardItem,
} from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';

export const listStandards = async (
  request: AuthorizedRequest,
  parameterId: string,
): Promise<readonly StandardItem[]> => {
  const query = new URLSearchParams({ parameterId });
  const response = await request<unknown>(`/masters/standards?${query}`);
  return StandardListResponseSchema.parse(response).data;
};

export const createStandard = async (
  request: AuthorizedRequest,
  input: CreateStandardRequest,
): Promise<StandardItem> => {
  const response = await request<unknown>('/masters/standards', {
    method: 'POST',
    body: input,
  });
  return StandardResponseSchema.parse(response).data;
};

export const listSensoryThresholds = async (
  request: AuthorizedRequest,
): Promise<readonly SensoryThresholdItem[]> => {
  const response = await request<unknown>('/masters/sensory-thresholds');
  return SensoryThresholdListResponseSchema.parse(response).data;
};

export const createSensoryThreshold = async (
  request: AuthorizedRequest,
  input: CreateSensoryThresholdRequest,
): Promise<SensoryThresholdItem> => {
  const response = await request<unknown>('/masters/sensory-thresholds', {
    method: 'POST',
    body: input,
  });
  return SensoryThresholdResponseSchema.parse(response).data;
};
