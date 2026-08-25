import { useState, type SyntheticEvent } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

import type { LoginRequest } from '@sigecal/shared';

import { AuthLayout } from '../components/AuthLayout.js';
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

const PasswordVisibility = ({
  action,
  visible,
}: {
  readonly action: () => void;
  readonly visible: boolean;
}): React.JSX.Element => (
  <button
    className="password-visibility"
    type="button"
    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    onClick={action}
  >
    {visible ? <EyeOff /> : <Eye />}
  </button>
);

const LoginFields = (): React.JSX.Element => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const togglePassword = (): void => {
    setPasswordVisible((visible) => !visible);
  };
  return (
    <>
      <label htmlFor="email">Correo institucional</label>
      <div className="auth-input-shell">
        <Mail aria-hidden="true" />
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="nombre@empresa.com"
          required
        />
      </div>
      <label htmlFor="password">Contraseña</label>
      <div className="auth-input-shell">
        <LockKeyhole aria-hidden="true" />
        <input
          id="password"
          name="password"
          type={passwordVisible ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Ingrese su contraseña"
          required
        />
        <PasswordVisibility action={togglePassword} visible={passwordVisible} />
      </div>
    </>
  );
};

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
        {busy ? <LoaderCircle className="auth-button-spinner" /> : null}
        <span>{busy ? 'Verificando…' : 'Ingresar a SIGECAL'}</span>
        {busy ? null : <ArrowRight aria-hidden="true" />}
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
    <AuthLayout
      eyebrow="Acceso seguro"
      title="Bienvenido a SIGECAL"
      titleId="login-title"
      intro="Ingrese con las credenciales asignadas por el administrador del sistema."
      footnote="Acceso exclusivo para personal autorizado"
    >
      <LoginForm />
    </AuthLayout>
  );
};
