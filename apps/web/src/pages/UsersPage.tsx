import { useEffect, useState } from 'react';

import type { AreaItem, UserItem } from '@sigecal/shared';

import { listAreas, listUsers } from '../features/admin/admin-api.js';
import { errorMessage } from '../features/admin/admin-ui.js';
import { NewUserForm } from '../features/admin/NewUserForm.js';
import { UsersTable } from '../features/admin/UsersTable.js';
import { useAuth } from '../features/auth/useAuth.js';

const useUsersPage = () => {
  const auth = useAuth();
  const [users, setUsers] = useState<readonly UserItem[]>([]);
  const [areas, setAreas] = useState<readonly AreaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void Promise.all([listUsers(auth.request), listAreas(auth.request, true)])
      .then(([userResponse, areaResponse]) => {
        if (!active) return;
        setUsers(userResponse.data);
        setAreas(areaResponse);
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth.request]);
  const replace = (user: UserItem): void => {
    setUsers((current) =>
      current.map((item) => (item.id === user.id ? user : item)),
    );
  };
  const add = (user: UserItem): void => {
    setUsers((current) => [user, ...current]);
  };
  return { auth, users, areas, loading, error, replace, add };
};

export const UsersPage = (): React.JSX.Element => {
  const page = useUsersPage();
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Usuarios</h1>
          <p>Gestione cuentas, roles y acceso sin eliminar el historial.</p>
        </div>
      </header>
      <section className="admin-panel">
        <h2>Nuevo usuario</h2>
        <NewUserForm areas={page.areas} added={page.add} />
      </section>
      <section className="admin-panel">
        <div className="section-heading">
          <h2>Usuarios registrados</h2>
          <span className="phase-badge">{page.users.length} visibles</span>
        </div>
        {page.error ? (
          <p className="form-error" role="alert">
            {page.error}
          </p>
        ) : null}
        {page.loading ? (
          <p>Cargando usuarios…</p>
        ) : (
          <UsersTable
            users={page.users}
            currentId={page.auth.user?.id}
            changed={page.replace}
          />
        )}
      </section>
    </div>
  );
};
