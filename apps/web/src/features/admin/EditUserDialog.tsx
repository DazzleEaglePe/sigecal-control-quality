import { useState, type SyntheticEvent } from 'react';

import {
  UpdateUserRequestSchema,
  type AreaItem,
  type UserItem,
} from '@sigecal/shared';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../components/ui/dialog.js';
import { useAuth } from '../auth/useAuth.js';
import { updateUser } from './admin-api.js';
import { errorMessage, fieldValue } from './admin-ui.js';

interface EditProps {
  readonly areas: readonly AreaItem[];
  readonly user: UserItem;
  readonly changed: (user: UserItem) => void;
}

const parsedInput = (form: HTMLFormElement) =>
  UpdateUserRequestSchema.safeParse({
    firstName: fieldValue(form, 'firstName'),
    lastName: fieldValue(form, 'lastName'),
    email: fieldValue(form, 'email'),
    role: fieldValue(form, 'role'),
    areaId: fieldValue(form, 'areaId'),
    position: fieldValue(form, 'position') || undefined,
  });

const IdentityFields = ({
  user,
}: {
  readonly user: UserItem;
}): React.JSX.Element => (
  <>
    <label>
      Nombre
      <input name="firstName" defaultValue={user.firstName} required />
    </label>
    <label>
      Apellidos
      <input name="lastName" defaultValue={user.lastName} required />
    </label>
    <label className="form-span">
      Correo institucional
      <input name="email" type="email" defaultValue={user.email} required />
    </label>
  </>
);

const AccessFields = ({
  areas,
  user,
}: Pick<EditProps, 'areas' | 'user'>): React.JSX.Element => (
  <>
    <label>
      Rol
      <select name="role" defaultValue={user.role}>
        <option value="ADMIN">Administrador</option>
        <option value="JEFE_CALIDAD">Jefe de calidad</option>
        <option value="ANALISTA">Analista</option>
        <option value="OPERARIO">Operario</option>
      </select>
    </label>
    <label>
      Área
      <select name="areaId" defaultValue={user.area?.id ?? ''} required>
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </select>
    </label>
    <label className="form-span">
      Cargo
      <input name="position" defaultValue={user.position ?? ''} />
    </label>
  </>
);

const EditForm = ({
  props,
  edit,
  close,
}: {
  readonly props: EditProps;
  readonly edit: ReturnType<typeof useEdit>;
  readonly close: () => void;
}): React.JSX.Element => {
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void edit.submit(event.currentTarget).then((saved) => {
      if (saved) close();
    });
  };
  return (
    <form className="admin-form" onSubmit={submit}>
      {edit.error ? <p className="form-error form-span">{edit.error}</p> : null}
      <IdentityFields user={props.user} />
      <AccessFields areas={props.areas} user={props.user} />
      <div className="dialog-actions form-span">
        <button type="button" className="secondary-button" onClick={close}>
          Cancelar
        </button>
        <button type="submit" className="primary-button" disabled={edit.busy}>
          {edit.busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
};

const useEdit = ({ user, changed }: Pick<EditProps, 'user' | 'changed'>) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (form: HTMLFormElement): Promise<boolean> => {
    const parsed = parsedInput(form);
    if (!parsed.success) {
      setError('Revise los datos del usuario.');
      return false;
    }
    setBusy(true);
    setError(undefined);
    try {
      changed(await updateUser(request, user.id, parsed.data));
      return true;
    } catch (cause) {
      setError(errorMessage(cause));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
};

export const EditUserDialog = (props: EditProps): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  const edit = useEdit(props);
  const close = (): void => {
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        className="table-action"
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Editar
      </button>
      <DialogContent className="account-dialog">
        <div className="dialog-header">
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>
            Cambiar el correo exige verificar nuevamente la cuenta.
          </DialogDescription>
        </div>
        <EditForm props={props} edit={edit} close={close} />
      </DialogContent>
    </Dialog>
  );
};
