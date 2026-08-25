import { useState } from 'react';

import type { UserItem } from '@sigecal/shared';

import { useAuth } from '../auth/useAuth.js';
import { setUserStatus } from './admin-api.js';

const roleLabels = {
  ADMIN: 'Administrador',
  JEFE_CALIDAD: 'Jefe de calidad',
  ANALISTA: 'Analista',
  OPERARIO: 'Operario',
} as const;

const useStatusToggle = (user: UserItem, changed: (user: UserItem) => void) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const toggle = async (): Promise<void> => {
    setBusy(true);
    setFailed(false);
    try {
      changed(await setUserStatus(request, user));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return { busy, failed, toggle };
};

const UserIdentity = ({
  user,
}: {
  readonly user: UserItem;
}): React.JSX.Element => (
  <td>
    <strong>
      {user.firstName} {user.lastName}
    </strong>
    <small>{user.email}</small>
  </td>
);

const UserRow = ({
  user,
  currentId,
  changed,
}: {
  readonly user: UserItem;
  readonly currentId: string | undefined;
  readonly changed: (user: UserItem) => void;
}): React.JSX.Element => {
  const status = useStatusToggle(user, changed);
  return (
    <tr>
      <UserIdentity user={user} />
      <td>{roleLabels[user.role]}</td>
      <td>{user.area?.name ?? 'Sin área'}</td>
      <td>
        <span className={`state-pill ${user.isActive ? 'is-active' : ''}`}>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>
        <button
          className="table-action"
          type="button"
          disabled={status.busy || user.id === currentId}
          onClick={() => void status.toggle()}
        >
          {user.isActive ? 'Desactivar' : 'Activar'}
        </button>
        {status.failed ? (
          <small className="inline-error">No se pudo actualizar</small>
        ) : null}
      </td>
    </tr>
  );
};

export const UsersTable = ({
  users,
  currentId,
  changed,
}: {
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
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            currentId={currentId}
            changed={changed}
          />
        ))}
      </tbody>
    </table>
  </div>
);
