import { useEffect, useState } from 'react';

import type { AreaItem, UserItem } from '@sigecal/shared';

import { listAreas, listUsers } from '../features/admin/admin-api.js';
import { errorMessage } from '../features/admin/admin-ui.js';
import { NewUserForm } from '../features/admin/NewUserForm.js';
import {
  UserFilters,
  type UserFilterValue,
} from '../features/admin/UserFilters.js';
import { UsersTable } from '../features/admin/UsersTable.js';
import { useAuth } from '../features/auth/useAuth.js';

const INITIAL_FILTERS: UserFilterValue = { search: '', role: '', isActive: '' };
const PAGE_SIZE = 10;

const useDirectoryData = (
  request: ReturnType<typeof useAuth>['request'],
  filters: UserFilterValue,
  page: number,
) => {
  const [users, setUsers] = useState<readonly UserItem[]>([]);
  const [areas, setAreas] = useState<readonly AreaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    const query = {
      page,
      pageSize: PAGE_SIZE,
      search: filters.search || undefined,
      role: filters.role || undefined,
      isActive: filters.isActive ? filters.isActive === 'true' : undefined,
    };
    void Promise.all([listUsers(request, query), listAreas(request, true)])
      .then(([result, areaItems]) => {
        if (!active) return;
        setUsers(result.data);
        setTotal(result.meta?.total ?? result.data.length);
        setAreas(areaItems);
        setError(undefined);
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
  }, [request, filters, page]);
  return { users, setUsers, areas, total, setTotal, loading, error };
};

const useUserDirectory = () => {
  const auth = useAuth();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const data = useDirectoryData(auth.request, filters, page);
  const changeFilters = (value: UserFilterValue): void => {
    setFilters(value);
    setPage(1);
  };
  const replace = (user: UserItem): void => {
    data.setUsers((items) =>
      items.map((item) => (item.id === user.id ? user : item)),
    );
  };
  const add = (user: UserItem): void => {
    data.setUsers((items) => [user, ...items].slice(0, PAGE_SIZE));
    data.setTotal((value) => value + 1);
  };
  return {
    auth,
    users: data.users,
    areas: data.areas,
    filters,
    page,
    total: data.total,
    loading: data.loading,
    error: data.error,
    changeFilters,
    setPage,
    replace,
    add,
  };
};

const PageHeader = (): React.JSX.Element => (
  <header className="page-heading">
    <div>
      <p className="eyebrow">Administración</p>
      <h1>Usuarios</h1>
      <p>Gestione cuentas, roles y acceso sin eliminar el historial.</p>
    </div>
  </header>
);

const Pagination = ({
  page,
  total,
  change,
}: {
  readonly page: number;
  readonly total: number;
  readonly change: (page: number) => void;
}): React.JSX.Element => {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <nav className="pagination" aria-label="Paginación de usuarios">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => {
          change(page - 1);
        }}
      >
        Anterior
      </button>
      <span>
        Página {page} de {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => {
          change(page + 1);
        }}
      >
        Siguiente
      </button>
    </nav>
  );
};

const Directory = ({
  state,
}: {
  readonly state: ReturnType<typeof useUserDirectory>;
}): React.JSX.Element => (
  <section className="admin-panel">
    <div className="section-heading">
      <div>
        <h2>Usuarios registrados</h2>
        <p>{state.total} cuentas encontradas</p>
      </div>
    </div>
    <UserFilters value={state.filters} change={state.changeFilters} />
    {state.error ? (
      <p className="form-error" role="alert">
        {state.error}
      </p>
    ) : null}
    {state.loading ? (
      <p>Cargando usuarios…</p>
    ) : (
      <UsersTable
        areas={state.areas}
        users={state.users}
        currentId={state.auth.user?.id}
        changed={state.replace}
      />
    )}
    <Pagination page={state.page} total={state.total} change={state.setPage} />
  </section>
);

export const UsersPage = (): React.JSX.Element => {
  const state = useUserDirectory();
  return (
    <div className="page-stack">
      <PageHeader />
      <section className="admin-panel">
        <h2>Nuevo usuario</h2>
        <NewUserForm areas={state.areas} added={state.add} />
      </section>
      <Directory state={state} />
    </div>
  );
};
