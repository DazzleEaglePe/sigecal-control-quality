import { useState, type SyntheticEvent } from 'react';

import {
  CreateUserRequestSchema,
  type AreaItem,
  type UserItem,
} from '@sigecal/shared';

import { useAuth } from '../auth/useAuth.js';
import { createUser } from './admin-api.js';
import { errorMessage, fieldValue } from './admin-ui.js';

const IdentityFields = (): React.JSX.Element => (
  <>
    <label>
      Nombre
      <input name="firstName" required maxLength={80} />
    </label>
    <label>
      Apellidos
      <input name="lastName" required maxLength={80} />
    </label>
    <label className="form-span">
      Correo institucional
      <input name="email" type="email" autoComplete="off" required />
    </label>
  </>
);

const AssignmentFields = ({
  areas,
}: {
  readonly areas: readonly AreaItem[];
}): React.JSX.Element => (
  <>
    <label>
      Rol
      <select name="role" defaultValue="ANALISTA">
        <option value="ADMIN">Administrador</option>
        <option value="JEFE_CALIDAD">Jefe de calidad</option>
        <option value="ANALISTA">Analista</option>
        <option value="OPERARIO">Operario</option>
      </select>
    </label>
    <label>
      Área
      <select name="areaId" required defaultValue="">
        <option value="" disabled>
          Seleccione un área
        </option>
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </select>
    </label>
    <label className="form-span">
      Cargo
      <input name="position" maxLength={120} />
    </label>
  </>
);

const inputFrom = (form: HTMLFormElement) =>
  CreateUserRequestSchema.safeParse({
    firstName: fieldValue(form, 'firstName'),
    lastName: fieldValue(form, 'lastName'),
    email: fieldValue(form, 'email'),
    role: fieldValue(form, 'role'),
    areaId: fieldValue(form, 'areaId'),
    position: fieldValue(form, 'position') || undefined,
  });

const useNewUser = (added: (user: UserItem) => void) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = inputFrom(form);
    if (!parsed.success) {
      setError('Revise los nombres, el correo, el rol y el área seleccionada.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      added(await createUser(request, parsed.data));
      form.reset();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
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
    <form className="admin-form" onSubmit={(event) => void form.submit(event)}>
      {form.error ? (
        <p className="form-error form-span" role="alert">
          {form.error}
        </p>
      ) : null}
      <IdentityFields />
      <AssignmentFields areas={areas} />
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
