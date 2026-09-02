import {
  AreaListResponseSchema,
  AreaResponseSchema,
  UserListResponseSchema,
  UserResponseSchema,
  type AreaItem,
  type CreateAreaRequest,
  type CreateUserRequest,
  type UserItem,
  type UpdateUserRequest,
  type UserListQuery,
} from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';

const userQuery = (query: Partial<UserListQuery>): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
};

export const listUsers = async (
  request: AuthorizedRequest,
  query: Partial<UserListQuery> = {},
) =>
  UserListResponseSchema.parse(
    await request<unknown>(`/users${userQuery(query)}`),
  );

export const createUser = async (
  request: AuthorizedRequest,
  input: CreateUserRequest,
): Promise<UserItem> => {
  const response = await request<unknown>('/users', {
    method: 'POST',
    body: input,
  });
  return UserResponseSchema.parse(response).data;
};

export const setUserStatus = async (
  request: AuthorizedRequest,
  user: UserItem,
): Promise<UserItem> => {
  const response = await request<unknown>(`/users/${user.id}/status`, {
    method: 'PATCH',
    body: { isActive: !user.isActive },
  });
  return UserResponseSchema.parse(response).data;
};

export const updateUser = async (
  request: AuthorizedRequest,
  id: string,
  input: UpdateUserRequest,
): Promise<UserItem> => {
  const response = await request<unknown>(`/users/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return UserResponseSchema.parse(response).data;
};

export const requestUserPasswordReset = (
  request: AuthorizedRequest,
  id: string,
): Promise<void> => request(`/users/${id}/reset-password`, { method: 'POST' });

export const resendUserInvitation = (
  request: AuthorizedRequest,
  id: string,
): Promise<void> => request(`/users/${id}/resend-invite`, { method: 'POST' });

export const listAreas = async (
  request: AuthorizedRequest,
  onlyActive = false,
): Promise<readonly AreaItem[]> => {
  const path = onlyActive ? '/masters/areas?isActive=true' : '/masters/areas';
  return AreaListResponseSchema.parse(await request<unknown>(path)).data;
};

export const createArea = async (
  request: AuthorizedRequest,
  input: CreateAreaRequest,
): Promise<AreaItem> => {
  const response = await request<unknown>('/masters/areas', {
    method: 'POST',
    body: input,
  });
  return AreaResponseSchema.parse(response).data;
};

export const setAreaStatus = async (
  request: AuthorizedRequest,
  area: AreaItem,
): Promise<AreaItem> => {
  const response = await request<unknown>(`/masters/areas/${area.id}`, {
    method: 'PATCH',
    body: { isActive: !area.isActive },
  });
  return AreaResponseSchema.parse(response).data;
};
