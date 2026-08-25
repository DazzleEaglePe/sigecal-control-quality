import { createContext } from 'react';

import type {
  ChangePasswordRequest,
  LoginRequest,
  UserSession,
} from '@sigecal/shared';
import type { RequestOptions } from '../../lib/api-client.js';

export type AuthStatus = 'booting' | 'anonymous' | 'authenticated';
export type AuthorizedRequest = <Result>(
  path: string,
  options?: Omit<RequestOptions, 'accessToken'>,
) => Promise<Result>;
export type AuthorizedTextRequest = (path: string) => Promise<string>;

export interface AuthContextValue {
  readonly status: AuthStatus;
  readonly user?: UserSession;
  readonly notice?: string;
  readonly signIn: (credentials: LoginRequest) => Promise<void>;
  readonly signOut: () => Promise<void>;
  readonly updatePassword: (input: ChangePasswordRequest) => Promise<void>;
  readonly clearNotice: () => void;
  readonly request: AuthorizedRequest;
  readonly requestText: AuthorizedTextRequest;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
