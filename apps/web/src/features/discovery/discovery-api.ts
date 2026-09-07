import type {
  ApiSuccess,
  AuditItem,
  AuditQuery,
  SearchResponseData,
  SearchType,
} from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';

const set = (
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void => {
  if (value !== undefined && value !== '') params.set(key, String(value));
};

export const searchRecords = async (
  request: AuthorizedRequest,
  q: string,
  types?: readonly SearchType[],
  limitPerType = 8,
  signal?: AbortSignal,
): Promise<SearchResponseData> => {
  const params = new URLSearchParams({ q, limitPerType: String(limitPerType) });
  if (types?.length) params.set('types', types.join(','));
  const response = await request<ApiSuccess<SearchResponseData>>(
    `/search?${params.toString()}`,
    signal ? { signal } : undefined,
  );
  return response.data;
};

export const listAudit = async (
  request: AuthorizedRequest,
  query: AuditQuery,
  signal?: AbortSignal,
): Promise<ApiSuccess<readonly AuditItem[]>> => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    set(params, key, value);
  });
  return request(
    `/audit?${params.toString()}`,
    signal ? { signal } : undefined,
  );
};
