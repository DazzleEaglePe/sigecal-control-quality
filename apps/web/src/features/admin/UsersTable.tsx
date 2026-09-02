import { useState } from 'react';
import { toast } from 'sonner';

import type { AreaItem, UserItem } from '@sigecal/shared';

import { useConfirm } from '../../components/ui/use-confirm.js';
import { useAuth } from '../auth/useAuth.js';
import {
  requestUserPasswordReset,
  resendUserInvitation,
  setUserStatus,
} from './admin-api.js';
import { errorMessage } from './admin-ui.js';
import { EditUserDialog } from './EditUserDialog.js';

const roleLabels = {
  ADMIN: 'Administrador',
  JEFE_CALIDAD: 'Jefe de calidad',
  ANALISTA: 'Analista',
  OPERARIO: 'Operario',
} as const;

interface ActionProps {
  readonly areas: readonly AreaItem[];
  readonly user: UserItem;
  readonly currentId: string | undefined;
  readonly changed: (user: UserItem) => void;
}

const useActionRunner = () => {
  const [busy, setBusy] = useState(false);
  const run = async (
    action: () => Promise<unknown>,
    message: string,
  ): Promise<void> => {
    setBusy(true);
    try {
      await action();
      toast.success(message);
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
};

const useUserActions = ({
  user,
  changed,
}: Pick<ActionProps, 'user' | 'changed'>) => {
  const { request } = useAuth();
  const confirm = useConfirm();
  const { busy, run } = useActionRunner();
  const toggle = async (): Promise<void> => {
    const accepted = await confirm({
      title: user.isActive ? 'Desactivar usuario' : 'Activar usuario',
      description: user.isActive
        ? 'Se cerrarán sus sesiones, pero se conservará todo el historial.'
        : 'La cuenta volverá a estar disponible.',
      confirmLabel: user.isActive ? 'Desactivar' : 'Activar',
      destructive: user.isActive,
    });
    if (accepted)
      await run(async () => {
        changed(await setUserStatus(request, user));
      }, 'Estado actualizado.');
  };
  const sendAccess = (): Promise<void> =>
    run(
      () =>
        user.emailVerifiedAt
          ? requestUserPasswordReset(request, user.id)
          : resendUserInvitation(request, user.id),
      user.emailVerifiedAt
        ? 'Correo de recuperación enviado.'
        : 'Invitación reenviada.',
    );
  return { busy, sendAccess, toggle };
};

const UserActions = (props: ActionProps): React.JSX.Element => {
  const actions = useUserActions(props);
  return (
    <div className="account-actions">
      <EditUserDialog
        areas={props.areas}
        user={props.user}
        changed={props.changed}
      />
      <button
        className="table-action"
        type="button"
        disabled={actions.busy}
        onClick={() => {
          void actions.sendAccess();
        }}
      >
        {props.user.emailVerifiedAt
          ? 'Restablecer acceso'
          : 'Reenviar invitación'}
      </button>
      <button
        className="table-action"
        type="button"
        disabled={actions.busy || props.user.id === props.currentId}
        onClick={() => {
          void actions.toggle();
        }}
      >
        {props.user.isActive ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  );
};

const UserRow = (props: ActionProps): React.JSX.Element => (
  <tr>
    <td>
      <strong>{`${props.user.firstName} ${props.user.lastName}`}</strong>
      <small>{props.user.email}</small>
    </td>
    <td>{roleLabels[props.user.role]}</td>
    <td>{props.user.area?.name ?? 'Sin área'}</td>
    <td>
      <span className={`state-pill ${props.user.isActive ? 'is-active' : ''}`}>
        {props.user.isActive ? 'Activo' : 'Inactivo'}
      </span>
      <small>
        {props.user.emailVerifiedAt
          ? 'Correo verificado'
          : 'Invitación pendiente'}
      </small>
    </td>
    <td>
      <UserActions {...props} />
    </td>
  </tr>
);

export const UsersTable = ({
  areas,
  users,
  currentId,
  changed,
}: {
  readonly areas: readonly AreaItem[];
  readonly users: readonly UserItem[];
  readonly currentId: string | undefined;
  readonly changed: (user: UserItem) => void;
}): React.JSX.Element => (
  <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Rol</th>
          <th>Área</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <UserRow
            key={user.id}
            areas={areas}
            user={user}
            currentId={currentId}
            changed={changed}
          />
        ))}
      </tbody>
    </table>
  </div>
);
