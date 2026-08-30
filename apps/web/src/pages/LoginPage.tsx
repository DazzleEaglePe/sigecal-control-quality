import { useState, type KeyboardEvent, type SyntheticEvent } from 'react';
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

import { AuthField } from '../components/AuthField.js';
import { AuthLayout } from '../components/AuthLayout.js';
import { useAuth } from '../features/auth/useAuth.js';
import { ApiClientError } from '../lib/api-client.js';
import { fieldAria } from '../lib/field-aria.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const CAPS_LOCK_NOTE = 'Bloq Mayús está activado.';

const emailIssue = (value: string): string | undefined => {
  const email = value.trim();
  if (!email) return 'Ingrese el correo institucional asignado.';
  if (!EMAIL_PATTERN.test(email))
    return 'Escriba el correo con el formato nombre@empresa.com.';
  return undefined;
};

const passwordIssue = (value: string): string | undefined =>
  value ? undefined : 'Ingrese la contraseña asignada.';

interface FieldState {
  readonly issue: string | undefined;
  readonly reveal: () => void;
  readonly setValue: (value: string) => void;
  readonly value: string;
  readonly visibleIssue: string | undefined;
}

/** El error solo se muestra al salir del campo o al intentar enviar, para no
 * marcar en rojo un correo que el usuario todavía está escribiendo. */
const useField = (
  validate: (value: string) => string | undefined,
): FieldState => {
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);
  const issue = validate(value);
  return {
    issue,
    reveal: () => {
      setRevealed(true);
    },
    setValue,
    value,
    visibleIssue: revealed ? issue : undefined,
  };
};

interface FieldProps {
  readonly busy: boolean;
  readonly field: FieldState;
}

const EmailField = ({ busy, field }: FieldProps): React.JSX.Element => {
  const issue = field.visibleIssue;
  return (
    <AuthField
      icon={<Mail aria-hidden="true" />}
      id="email"
      issue={issue}
      label="Correo institucional"
    >
      <input
        {...fieldAria('email', issue)}
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        autoFocus
        spellCheck={false}
        placeholder="nombre@empresa.com"
        required
        disabled={busy}
        value={field.value}
        onBlur={field.reveal}
        onChange={(event) => {
          field.setValue(event.target.value);
        }}
      />
    </AuthField>
  );
};

const PasswordVisibility = ({
  action,
  busy,
  visible,
}: {
  readonly action: () => void;
  readonly busy: boolean;
  readonly visible: boolean;
}): React.JSX.Element => (
  <button
    className="password-visibility"
    type="button"
    disabled={busy}
    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    aria-pressed={visible}
    onClick={action}
  >
    {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
  </button>
);

const usePasswordExtras = (field: FieldState) => {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  return {
    leaveField: () => {
      field.reveal();
      setCapsLock(false);
    },
    note: capsLock ? CAPS_LOCK_NOTE : undefined,
    toggle: () => {
      setVisible((current) => !current);
    },
    trackCapsLock: (event: KeyboardEvent<HTMLInputElement>) => {
      setCapsLock(event.getModifierState('CapsLock'));
    },
    visible,
  };
};

const PasswordField = ({ busy, field }: FieldProps): React.JSX.Element => {
  const extras = usePasswordExtras(field);
  const issue = field.visibleIssue;
  return (
    <AuthField
      icon={<LockKeyhole aria-hidden="true" />}
      id="password"
      issue={issue}
      label="Contraseña"
      note={extras.note}
    >
      <input
        {...fieldAria('password', issue, extras.note)}
        id="password"
        name="password"
        type={extras.visible ? 'text' : 'password'}
        autoComplete="current-password"
        placeholder="Ingrese su contraseña"
        required
        disabled={busy}
        value={field.value}
        onBlur={extras.leaveField}
        onChange={(event) => {
          field.setValue(event.target.value);
        }}
        onKeyDown={extras.trackCapsLock}
        onKeyUp={extras.trackCapsLock}
      />
      <PasswordVisibility
        action={extras.toggle}
        busy={busy}
        visible={extras.visible}
      />
    </AuthField>
  );
};

const SubmitButton = ({
  busy,
}: {
  readonly busy: boolean;
}): React.JSX.Element => (
  <button className="primary-button auth-submit" type="submit" disabled={busy}>
    {busy ? (
      <LoaderCircle className="auth-button-spinner" aria-hidden="true" />
    ) : null}
    <span>{busy ? 'Verificando…' : 'Ingresar a SIGECAL'}</span>
    {busy ? null : <ArrowRight aria-hidden="true" />}
  </button>
);

const useSignIn = () => {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const run = async (credentials: LoginRequest): Promise<void> => {
    setBusy(true);
    setError(undefined);
    try {
      await auth.signIn(credentials);
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
  return { auth, busy, error, run };
};

const LoginForm = (): React.JSX.Element => {
  const email = useField(emailIssue);
  const password = useField(passwordIssue);
  const { auth, busy, error, run } = useSignIn();
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    email.reveal();
    password.reveal();
    const invalid = email.issue ? 'email' : password.issue ? 'password' : '';
    if (invalid) {
      document.querySelector<HTMLInputElement>(`#${invalid}`)?.focus();
      return;
    }
    // El servicio compara el correo en minúsculas, pero rechaza los espacios
    // que arrastra un pegado desde el correo institucional.
    void run({ email: email.value.trim(), password: password.value });
  };
  return (
    <form className="auth-form" noValidate aria-busy={busy} onSubmit={submit}>
      {auth.notice ? (
        <p className="form-notice" role="status">
          {auth.notice}
        </p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <EmailField busy={busy} field={email} />
      <PasswordField busy={busy} field={password} />
      <SubmitButton busy={busy} />
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
