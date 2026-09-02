import {
  MessageResponseSchema,
  LoginResponseSchema,
  MeResponseSchema,
  RefreshResponseSchema,
  type AccountEmailRequest,
  type AccountTokenPasswordRequest,
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

export const requestPasswordReset = async (
  input: AccountEmailRequest,
): Promise<string> => {
  const response = await requestJson<unknown>('/auth/forgot-password', {
    method: 'POST',
    body: input,
  });
  return MessageResponseSchema.parse(response).data.message;
};

export const activateAccount = (
  input: AccountTokenPasswordRequest,
): Promise<void> =>
  requestJson('/auth/activate', { method: 'POST', body: input });

export const resetPassword = (
  input: AccountTokenPasswordRequest,
): Promise<void> =>
  requestJson('/auth/reset-password', { method: 'POST', body: input });
