import { useState, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';

import { AuthLayout } from '../components/AuthLayout.js';
import { requestPasswordReset } from '../features/auth/auth-api.js';
import { ApiClientError } from '../lib/api-client.js';

const useRecovery = () => {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const submit = async (email: string): Promise<void> => {
    setBusy(true);
    setError(undefined);
    try {
      setMessage(await requestPasswordReset({ email }));
    } catch (cause) {
      setError(
        cause instanceof ApiClientError
          ? cause.message
          : 'No fue posible procesar la solicitud.',
      );
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, message, submit };
};

const EmailField = (): React.JSX.Element => (
  <>
    <label htmlFor="email">Correo institucional</label>
    <input
      id="email"
      name="email"
      type="email"
      autoComplete="email"
      required
      autoFocus
    />
  </>
);

const RecoveryForm = ({
  state,
}: {
  readonly state: ReturnType<typeof useRecovery>;
}): React.JSX.Element => {
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const field = event.currentTarget.elements.namedItem('email');
    void state.submit(field instanceof HTMLInputElement ? field.value : '');
  };
  return (
    <form className="auth-form" onSubmit={submit}>
      {state.message ? (
        <p className="form-notice" role="status">
          {state.message}
        </p>
      ) : null}
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <EmailField />
      <button
        className="primary-button auth-submit"
        type="submit"
        disabled={state.busy}
      >
        {state.busy ? 'Enviando…' : 'Enviar instrucciones'}
      </button>
      <Link className="auth-text-link" to="/login">
        Volver al ingreso
      </Link>
    </form>
  );
};

export const ForgotPasswordPage = (): React.JSX.Element => {
  const state = useRecovery();
  return (
    <AuthLayout
      title="Recuperar acceso"
      titleId="forgot-title"
      intro="Le enviaremos un enlace temporal si la cuenta está disponible."
      footnote="La respuesta no revela si una cuenta existe"
    >
      <RecoveryForm state={state} />
    </AuthLayout>
  );
};
