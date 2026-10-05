import {
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  type SyntheticEvent,
} from 'react';

import { type AreaItem, type UserItem } from '@sigecal/shared';

import { fieldAria, ISSUE_ID_SUFFIX } from '../../lib/field-aria.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { useAuth } from '../auth/useAuth.js';
import { createUser } from './admin-api.js';
import { errorMessage } from './admin-ui.js';
import {
  fieldNames,
  inputFrom,
  issuesFrom,
  type FieldIssues,
  type FieldName,
} from './new-user-validation.js';

const UserTextField = ({
  id,
  label,
  name,
  issue,
  type = 'text',
  required = false,
  maxLength,
  autoComplete,
}: {
  readonly id: string;
  readonly label: string;
  readonly name: FieldName;
  readonly issue?: string | undefined;
  readonly type?: 'text' | 'email';
  readonly required?: boolean;
  readonly maxLength?: number;
  readonly autoComplete?: string;
}): React.JSX.Element => (
  <div className="admin-form-field">
    <label htmlFor={id}>{label}</label>
    <input
      id={id}
      name={name}
      type={type}
      required={required}
      maxLength={maxLength}
      autoComplete={autoComplete}
      {...fieldAria(id, issue)}
    />
    {issue ? <FieldIssue id={id} issue={issue} /> : null}
  </div>
);

const IdentityFields = ({
  issues,
}: {
  readonly issues: FieldIssues;
}): React.JSX.Element => (
  <>
    <UserTextField
      id="new-user-first-name"
      name="firstName"
      label="Nombre"
      required
      maxLength={80}
      issue={issues.firstName}
    />
    <UserTextField
      id="new-user-last-name"
      name="lastName"
      label="Apellidos"
      required
      maxLength={80}
      issue={issues.lastName}
    />
    <div className="form-span">
      <UserTextField
        id="new-user-email"
        name="email"
        label="Correo institucional"
        type="email"
        autoComplete="off"
        required
        issue={issues.email}
      />
    </div>
  </>
);

const RoleField = (): React.JSX.Element => (
  <div className="admin-form-field">
    <label htmlFor="new-user-role">Rol</label>
    <select id="new-user-role" name="role" defaultValue="ANALISTA">
      <option value="ADMIN">Administrador</option>
      <option value="JEFE_CALIDAD">Jefe de calidad</option>
      <option value="ANALISTA">Analista</option>
      <option value="OPERARIO">Operario</option>
    </select>
  </div>
);

const AreaField = ({
  areas,
  issue,
}: {
  readonly areas: readonly AreaItem[];
  readonly issue?: string | undefined;
}): React.JSX.Element => (
  <div className="admin-form-field">
    <label htmlFor="new-user-area">Área</label>
    <select
      id="new-user-area"
      name="areaId"
      required
      defaultValue=""
      {...fieldAria('new-user-area', issue)}
    >
      <option value="" disabled>
        Seleccione un área
      </option>
      {areas.map((area) => (
        <option key={area.id} value={area.id}>
          {area.name}
        </option>
      ))}
    </select>
    {issue ? <FieldIssue id="new-user-area" issue={issue} /> : null}
  </div>
);

const AssignmentFields = ({
  areas,
  issues,
}: {
  readonly areas: readonly AreaItem[];
  readonly issues: FieldIssues;
}): React.JSX.Element => (
  <>
    <RoleField />
    <AreaField areas={areas} issue={issues.areaId} />
    <div className="form-span">
      <UserTextField
        id="new-user-position"
        name="position"
        label="Cargo"
        maxLength={120}
        issue={issues.position}
      />
    </div>
  </>
);

const FieldIssue = ({
  id,
  issue,
}: {
  readonly id: string;
  readonly issue: string;
}) => (
  <span className="field-issue" id={`${id}${ISSUE_ID_SUFFIX}`}>
    {issue}
  </span>
);

interface NewUserSetters {
  readonly setBusy: Dispatch<SetStateAction<boolean>>;
  readonly setError: Dispatch<SetStateAction<string | undefined>>;
  readonly setIssues: Dispatch<SetStateAction<FieldIssues>>;
  readonly setTouched: Dispatch<SetStateAction<ReadonlySet<FieldName>>>;
}

const updateFieldValidation = (
  event: ChangeEvent<HTMLFormElement>,
  touched: ReadonlySet<FieldName>,
  setters: NewUserSetters,
): void => {
  const element = event.target;
  if (!(
    element instanceof HTMLInputElement || element instanceof HTMLSelectElement
  ))
    return;
  if (!fieldNames.includes(element.name as FieldName)) return;
  const nextTouched = new Set(touched).add(element.name as FieldName);
  const nextIssues = issuesFrom(event.currentTarget);
  setters.setTouched(nextTouched);
  setters.setIssues(
    Object.fromEntries(
      Object.entries(nextIssues).filter(([name]) =>
        nextTouched.has(name as FieldName),
      ),
    ),
  );
  setters.setError(undefined);
};

const submitNewUser = async (
  event: SyntheticEvent<HTMLFormElement>,
  request: AuthorizedRequest,
  added: (user: UserItem) => void,
  setters: NewUserSetters,
): Promise<void> => {
  event.preventDefault();
  const form = event.currentTarget;
  const parsed = inputFrom(form);
  setters.setTouched(new Set(fieldNames));
  setters.setIssues(issuesFrom(form));
  if (!parsed.success) {
    setters.setError(
      'Revise los nombres, el correo, el rol y el área seleccionada.',
    );
    return;
  }
  setters.setBusy(true);
  setters.setError(undefined);
  try {
    added(await createUser(request, parsed.data));
    form.reset();
    setters.setIssues({});
    setters.setTouched(new Set());
  } catch (cause) {
    setters.setError(errorMessage(cause));
  } finally {
    setters.setBusy(false);
  }
};

const useNewUser = (added: (user: UserItem) => void) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [issues, setIssues] = useState<FieldIssues>({});
  const [touched, setTouched] = useState<ReadonlySet<FieldName>>(new Set());
  const setters = { setBusy, setError, setIssues, setTouched };
  const change = (event: ChangeEvent<HTMLFormElement>) => {
    updateFieldValidation(event, touched, setters);
  };
  const submit = (event: SyntheticEvent<HTMLFormElement>) =>
    submitNewUser(event, request, added, setters);
  return { busy, error, issues, change, submit };
};

export const NewUserForm = ({
  areas,
  added,
}: {
  readonly areas: readonly AreaItem[];
  readonly added: (user: UserItem) => void;
}): React.JSX.Element => {
  const form = useNewUser(added);
  return (
    <form
      className="admin-form"
      noValidate
      onChange={form.change}
      onSubmit={(event) => void form.submit(event)}
    >
      {form.error ? (
        <p className="form-error form-span" role="alert">
          {form.error}
        </p>
      ) : null}
      <IdentityFields issues={form.issues} />
      <AssignmentFields areas={areas} issues={form.issues} />
      <p className="field-help form-span">
        SIGECAL enviará una invitación para que la persona defina su propia
        contraseña.
      </p>
      <button
        className="primary-button form-span"
        type="submit"
        disabled={form.busy}
      >
        {form.busy ? 'Creando…' : 'Crear usuario'}
      </button>
    </form>
  );
};
