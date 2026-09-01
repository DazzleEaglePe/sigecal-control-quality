import {
  SensoryCompareResponseSchema,
  SensoryCorrectionResponseSchema,
  SensoryPanelistOptionsResponseSchema,
  SensoryPreparationResponseSchema,
  SensoryProfileResponseSchema,
  SensorySessionListResponseSchema,
  SensorySessionResponseSchema,
  type CorrectSensorySessionRequest,
  type CreateSensorySessionRequest,
  type SensorySessionItem,
} from '@sigecal/shared';
import type { AuthorizedRequest } from '../auth/auth-context.js';

export const listSensorySessions = async (request: AuthorizedRequest) => {
  const response = SensorySessionListResponseSchema.parse(
    await request<unknown>('/sensory/sessions?page=1&pageSize=50'),
  );
  return response.data;
};
export const getSensorySession = async (
  request: AuthorizedRequest,
  id: string,
) =>
  SensorySessionResponseSchema.parse(
    await request<unknown>(`/sensory/sessions/${id}`),
  ).data;
export const getSensoryPreparation = async (
  request: AuthorizedRequest,
  inspectionId: string,
) =>
  SensoryPreparationResponseSchema.parse(
    await request<unknown>(`/sensory/preparation?inspectionId=${inspectionId}`),
  ).data;
export const listPanelistOptions = async (request: AuthorizedRequest) =>
  SensoryPanelistOptionsResponseSchema.parse(
    await request<unknown>('/sensory/panelist-options'),
  ).data;
export const createSensorySession = async (
  request: AuthorizedRequest,
  input: CreateSensorySessionRequest,
): Promise<SensorySessionItem> =>
  SensorySessionResponseSchema.parse(
    await request<unknown>('/sensory/sessions', {
      method: 'POST',
      body: input,
    }),
  ).data;
export const correctSensorySession = async (
  request: AuthorizedRequest,
  id: string,
  input: CorrectSensorySessionRequest,
) =>
  SensoryCorrectionResponseSchema.parse(
    await request<unknown>(`/sensory/sessions/${id}/correct`, {
      method: 'POST',
      body: input,
    }),
  ).data;
export const getSensoryProfile = async (
  request: AuthorizedRequest,
  id: string,
) =>
  SensoryProfileResponseSchema.parse(
    await request<unknown>(`/sensory/sessions/${id}/profile`),
  ).data;
export const compareSensoryProfiles = async (
  request: AuthorizedRequest,
  ids: readonly string[],
) =>
  SensoryCompareResponseSchema.parse(
    await request<unknown>(`/sensory/compare?sessionIds=${ids.join(',')}`),
  ).data;
