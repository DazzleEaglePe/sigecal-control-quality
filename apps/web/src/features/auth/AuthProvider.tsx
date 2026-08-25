import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import type { ChangePasswordRequest, LoginRequest } from '@sigecal/shared';

import {
  ApiClientError,
  requestJson,
  requestText,
} from '../../lib/api-client.js';
import * as authApi from './auth-api.js';
import {
  AuthContext,
  type AuthContextValue,
  type AuthorizedRequest,
  type AuthorizedTextRequest,
} from './auth-context.js';

type Session = authApi.AuthenticatedSession | undefined;
let initialRestore: Promise<Session> | undefined;

const restoreOnce = (): Promise<Session> => {
  initialRestore ??= authApi.restoreSession().catch((error: unknown) => {
    if (error instanceof ApiClientError && error.status === 401)
      return undefined;
    throw error;
  });
  return initialRestore;
};

const useSessionBootstrap = (): {
  readonly booting: boolean;
  readonly session: Session;
  readonly setSession: Dispatch<SetStateAction<Session>>;
  readonly notice?: string;
  readonly setNotice: Dispatch<SetStateAction<string | undefined>>;
} => {
  const [session, setSession] = useState<Session>();
  const [booting, setBooting] = useState(true);
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    let active = true;
    void restoreOnce()
      .then((restored) => {
        if (active) setSession(restored);
      })
      .catch(() => {
        if (active) setNotice('No fue posible recuperar la sesión.');
      })
      .finally(() => {
        if (active) setBooting(false);
      });
    return () => {
      active = false;
    };
  }, [setNotice, setSession]);
  return {
    booting,
    session,
    setSession,
    ...(notice ? { notice } : {}),
    setNotice,
  };
};

const withRefresh = async <Result,>(
  session: Session,
  setSession: Dispatch<SetStateAction<Session>>,
  execute: (accessToken: string) => Promise<Result>,
): Promise<Result> => {
  if (!session) throw new ApiClientError('Debe iniciar sesión.', 401);
  try {
    return await execute(session.accessToken);
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 401) throw error;
    const restored = await authApi.restoreSession();
    setSession(restored);
    return execute(restored.accessToken);
  }
};

const useAuthorizedRequest = (
  session: Session,
  setSession: Dispatch<SetStateAction<Session>>,
): AuthorizedRequest =>
  useCallback<AuthorizedRequest>(
    (path, options = {}) =>
      withRefresh(session, setSession, (accessToken) =>
        requestJson(path, {
          ...options,
          accessToken,
        }),
      ),
    [session, setSession],
  );

const useAuthorizedText = (
  session: Session,
  setSession: Dispatch<SetStateAction<Session>>,
): AuthorizedTextRequest =>
  useCallback<AuthorizedTextRequest>(
    (path) =>
      withRefresh(session, setSession, (accessToken) =>
        requestText(path, { accessToken, accept: 'image/svg+xml' }),
      ),
    [session, setSession],
  );

const useAuthActions = (
  session: Session,
  setSession: Dispatch<SetStateAction<Session>>,
  setNotice: Dispatch<SetStateAction<string | undefined>>,
) => {
  const signIn = useCallback(
    async (credentials: LoginRequest) => {
      const authenticated = await authApi.login(credentials);
      setSession(authenticated);
      setNotice(undefined);
    },
    [setNotice, setSession],
  );
  const signOut = useCallback(async () => {
    try {
      if (session) await authApi.logout(session.accessToken);
      setNotice(undefined);
    } catch {
      setNotice('No fue posible confirmar el cierre de sesión en el servidor.');
    }
    setSession(undefined);
  }, [session, setNotice, setSession]);
  const updatePassword = useCallback(
    async (input: ChangePasswordRequest) => {
      if (!session) return;
      await authApi.changePassword(session.accessToken, input);
      setSession(undefined);
      setNotice('Contraseña actualizada. Ingrese nuevamente.');
    },
    [session, setNotice, setSession],
  );
  const clearNotice = useCallback(() => {
    setNotice(undefined);
  }, [setNotice]);
  const request = useAuthorizedRequest(session, setSession);
  const requestText = useAuthorizedText(session, setSession);
  return { signIn, signOut, updatePassword, clearNotice, request, requestText };
};

const useAuthValue = (): AuthContextValue => {
  const { booting, session, setSession, notice, setNotice } =
    useSessionBootstrap();
  const actions = useAuthActions(session, setSession, setNotice);
  return useMemo<AuthContextValue>(
    () => ({
      status: booting ? 'booting' : session ? 'authenticated' : 'anonymous',
      ...(session ? { user: session.user } : {}),
      ...(notice ? { notice } : {}),
      ...actions,
    }),
    [actions, booting, notice, session],
  );
};

export const AuthProvider = ({
  children,
}: React.PropsWithChildren): React.JSX.Element => {
  const value = useAuthValue();
  return <AuthContext value={value}>{children}</AuthContext>;
};
