import {
  LoginResponseSchema,
  MeResponseSchema,
  RefreshResponseSchema,
  type ChangePasswordRequest,
  type LoginRequest,
  type UserSession,
} from '@sigecal/shared';

import { requestJson } from '../../lib/api-client.js';

export interface AuthenticatedSession {
  readonly accessToken: string;
  readonly user: UserSession;
}

export const login = async (
  credentials: LoginRequest,
): Promise<AuthenticatedSession> => {
  const response = await requestJson<unknown>('/auth/login', {
    method: 'POST',
    body: credentials,
  });
  return LoginResponseSchema.parse(response).data;
};

export const restoreSession = async (): Promise<AuthenticatedSession> => {
  const refresh = RefreshResponseSchema.parse(
    await requestJson<unknown>('/auth/refresh', { method: 'POST' }),
  );
  const accessToken = refresh.data.accessToken;
  const me = MeResponseSchema.parse(
    await requestJson<unknown>('/auth/me', { accessToken }),
  );
  return { accessToken, user: me.data };
};

export const logout = (accessToken: string): Promise<void> =>
  requestJson('/auth/logout', { method: 'POST', accessToken });

export const changePassword = (
  accessToken: string,
  input: ChangePasswordRequest,
): Promise<void> =>
  requestJson('/auth/password', {
    method: 'PATCH',
    accessToken,
    body: input,
  });
