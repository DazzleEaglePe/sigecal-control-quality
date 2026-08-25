import { useState, type SyntheticEvent } from 'react';
import { Navigate } from 'react-router-dom';

import type { LoginRequest } from '@sigecal/shared';

import { useAuth } from '../features/auth/useAuth.js';
import { ApiClientError } from '../lib/api-client.js';

const credentialsFrom = (form: HTMLFormElement): LoginRequest => {
  const email = form.elements.namedItem('email');
  const password = form.elements.namedItem('password');
  return {
    email: email instanceof HTMLInputElement ? email.value : '',
    password: password instanceof HTMLInputElement ? password.value : '',
  };
};

const LoginFields = (): React.JSX.Element => (
  <>
    <label htmlFor="email">Correo institucional</label>
    <input
      id="email"
      name="email"
      type="email"
      autoComplete="username"
      required
    />
    <label htmlFor="password">Contraseña</label>
    <input
      id="password"
      name="password"
      type="password"
      autoComplete="current-password"
      required
    />
  </>
);

const useLoginSubmission = () => {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await auth.signIn(credentialsFrom(event.currentTarget));
    } catch (cause) {
      setError(
        cause instanceof ApiClientError
          ? cause.message
          : 'No fue posible iniciar sesión.',
      );
    } finally {
      setBusy(false);
    }
  };
  return { auth, busy, error, submit };
};

const LoginForm = (): React.JSX.Element => {
  const { auth, busy, error, submit } = useLoginSubmission();
  return (
    <form className="auth-form" onSubmit={(event) => void submit(event)}>
      {auth.notice ? <p className="form-notice">{auth.notice}</p> : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <LoginFields />
      <button
        className="primary-button auth-submit"
        type="submit"
        disabled={busy}
      >
        {busy ? 'Verificando…' : 'Ingresar a SIGECAL'}
      </button>
    </form>
  );
};

export const LoginPage = (): React.JSX.Element => {
  const auth = useAuth();
  if (auth.status === 'authenticated') {
    return (
      <Navigate
        to={auth.user?.mustChangePassword ? '/password' : '/'}
        replace
      />
    );
  }
  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-brand">
          <span className="brand-mark">S</span>
          <strong>SIGECAL</strong>
        </div>
        <p className="eyebrow">Acceso controlado</p>
        <h1 id="login-title">Iniciar sesión</h1>
        <p className="auth-intro">
          Use las credenciales asignadas por el administrador del sistema.
        </p>
        <LoginForm />
        <small className="auth-footnote">
          Sistema de Gestión de Control de Calidad
        </small>
      </section>
    </main>
  );
};
