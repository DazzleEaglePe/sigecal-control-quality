import { useState, type SyntheticEvent } from 'react';

import { PasswordSchema, type ChangePasswordRequest } from '@sigecal/shared';

import { useAuth } from '../features/auth/useAuth.js';
import { ApiClientError } from '../lib/api-client.js';

type PasswordInput = ChangePasswordRequest & { readonly confirmation: string };

const passwordInputFrom = (form: HTMLFormElement): PasswordInput => {
  const value = (name: string): string => {
    const field = form.elements.namedItem(name);
    return field instanceof HTMLInputElement ? field.value : '';
  };
  return {
    currentPassword: value('currentPassword'),
    newPassword: value('newPassword'),
    confirmation: value('confirmation'),
  };
};

const validateInput = (input: PasswordInput): string | undefined => {
  if (input.newPassword !== input.confirmation) {
    return 'La confirmación no coincide con la nueva contraseña.';
  }
  if (!PasswordSchema.safeParse(input.newPassword).success) {
    return 'Use de 8 a 128 caracteres e incluya al menos una letra y un número.';
  }
  if (input.currentPassword === input.newPassword) {
    return 'La nueva contraseña debe ser diferente a la actual.';
  }
  return undefined;
};

const PasswordFields = (): React.JSX.Element => (
  <>
    <label htmlFor="currentPassword">Contraseña actual</label>
    <input
      id="currentPassword"
      name="currentPassword"
      type="password"
      autoComplete="current-password"
      required
    />
    <label htmlFor="newPassword">Nueva contraseña</label>
    <input
      id="newPassword"
      name="newPassword"
      type="password"
      autoComplete="new-password"
      minLength={8}
      required
      aria-describedby="password-help"
    />
    <small id="password-help" className="field-help">
      Entre 8 y 128 caracteres, con al menos una letra y un número.
    </small>
    <label htmlFor="confirmation">Confirmar nueva contraseña</label>
    <input
      id="confirmation"
      name="confirmation"
      type="password"
      autoComplete="new-password"
      minLength={8}
      required
    />
  </>
);

const messageFrom = (cause: unknown): string =>
  cause instanceof ApiClientError
    ? cause.message
    : 'No fue posible actualizar la contraseña.';

const usePasswordSubmission = () => {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const input = passwordInputFrom(event.currentTarget);
    const validation = validateInput(input);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await auth.updatePassword(input);
    } catch (cause) {
      setError(messageFrom(cause));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
};

const ChangePasswordForm = (): React.JSX.Element => {
  const { busy, error, submit } = usePasswordSubmission();
  return (
    <form className="auth-form" onSubmit={(event) => void submit(event)}>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <PasswordFields />
      <button
        className="primary-button auth-submit"
        type="submit"
        disabled={busy}
      >
        {busy ? 'Actualizando…' : 'Guardar nueva contraseña'}
      </button>
    </form>
  );
};

export const ChangePasswordPage = (): React.JSX.Element => (
  <main className="auth-screen">
    <section className="auth-card" aria-labelledby="password-title">
      <p className="eyebrow">Protección de la cuenta</p>
      <h1 id="password-title">Cambie su contraseña provisional</h1>
      <p className="auth-intro">
        Antes de continuar, defina una contraseña personal. Se cerrarán las
        demás sesiones.
      </p>
      <ChangePasswordForm />
    </section>
  </main>
);
