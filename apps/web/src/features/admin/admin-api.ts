import {
  AreaListResponseSchema,
  AreaResponseSchema,
  UserListResponseSchema,
  UserResponseSchema,
  type AreaItem,
  type CreateAreaRequest,
  type CreateUserRequest,
  type UserItem,
} from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';

export const listUsers = async (request: AuthorizedRequest) =>
  UserListResponseSchema.parse(await request<unknown>('/users'));

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
