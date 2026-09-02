import { useState, type SyntheticEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { PasswordSchema } from '@sigecal/shared';

import { ApiClientError } from '../../lib/api-client.js';
import { activateAccount, resetPassword } from './auth-api.js';

export type AccountPasswordMode = 'activate' | 'reset';
const valueFrom = (form: HTMLFormElement, name: string): string => {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement ? field.value : '';
};

const useAccountPassword = (mode: AccountPasswordMode, token: string) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [complete, setComplete] = useState(false);
  const submit = async (form: HTMLFormElement): Promise<void> => {
    const password = valueFrom(form, 'newPassword');
    if (!PasswordSchema.safeParse(password).success) {
      setError('Use entre 8 y 128 caracteres, con una letra y un número.');
      return;
    }
    if (password !== valueFrom(form, 'confirmation')) {
      setError('La confirmación no coincide con la contraseña.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const input = { token, newPassword: password };
      if (mode === 'activate') await activateAccount(input);
      else await resetPassword(input);
      setComplete(true);
    } catch (cause) {
      setError(
        cause instanceof ApiClientError
          ? cause.message
          : 'No fue posible procesar el enlace.',
      );
    } finally {
      setBusy(false);
    }
  };
  return { busy, complete, error, submit };
};

const Completion = ({
  mode,
}: {
  readonly mode: AccountPasswordMode;
}): React.JSX.Element => (
  <div className="auth-complete" role="status">
    <p>
      {mode === 'activate'
        ? 'La cuenta quedó activada.'
        : 'La contraseña fue restablecida.'}
    </p>
    <Link className="primary-button auth-submit" to="/login">
      Ingresar a SIGECAL
    </Link>
  </div>
);

const PasswordFields = (): React.JSX.Element => (
  <>
    <label htmlFor="newPassword">Nueva contraseña</label>
    <input
      id="newPassword"
      name="newPassword"
      type="password"
      autoComplete="new-password"
      required
    />
    <label htmlFor="confirmation">Confirmar contraseña</label>
    <input
      id="confirmation"
      name="confirmation"
      type="password"
      autoComplete="new-password"
      required
    />
    <small className="field-help">Use al menos una letra y un número.</small>
  </>
);

const SubmitAccess = ({
  mode,
  busy,
  token,
}: {
  readonly mode: AccountPasswordMode;
  readonly busy: boolean;
  readonly token: string;
}): React.JSX.Element => (
  <>
    <button
      className="primary-button auth-submit"
      type="submit"
      disabled={busy || !token}
    >
      {busy
        ? 'Procesando…'
        : mode === 'activate'
          ? 'Activar cuenta'
          : 'Guardar contraseña'}
    </button>
    {!token ? (
      <p className="form-error">El enlace no contiene un token válido.</p>
    ) : null}
  </>
);

export const AccountPasswordForm = ({
  mode,
}: {
  readonly mode: AccountPasswordMode;
}): React.JSX.Element => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const state = useAccountPassword(mode, token);
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void state.submit(event.currentTarget);
  };
  if (state.complete) return <Completion mode={mode} />;
  return (
    <form className="auth-form" onSubmit={submit}>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <PasswordFields />
      <SubmitAccess mode={mode} busy={state.busy} token={token} />
    </form>
  );
};
