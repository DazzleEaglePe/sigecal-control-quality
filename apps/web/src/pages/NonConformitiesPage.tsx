import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Permission,
  type NonConformityItem,
  type NonConformityListQuery,
} from '@sigecal/shared';

import { NonConformityFilters } from '../features/nonconformities/NonConformityFilters.js';
import { NonConformityTable } from '../features/nonconformities/NonConformityTable.js';
import {
  useNonConformityList,
  useNonConformityMasters,
} from '../features/nonconformities/useNonConformities.js';
import { useAuth } from '../features/auth/useAuth.js';

const initialQuery: NonConformityListQuery = { page: 1, pageSize: 20 };

const Header = ({ canCreate }: { readonly canCreate: boolean }) => (
  <header className="page-heading">
    <div>
      <p className="eyebrow">Control de calidad</p>
      <h1>No conformidades</h1>
      <p>
        Registre, atienda y verifique las acciones correctivas de cada
        incidencia.
      </p>
    </div>
    {canCreate ? (
      <Link
        className="primary-button heading-action"
        to="/no-conformidades/nueva"
      >
        Registrar no conformidad
      </Link>
    ) : null}
  </header>
);

interface ResultsProps {
  readonly items: readonly NonConformityItem[];
  readonly total: number;
  readonly loading: boolean;
  readonly error: string | undefined;
  readonly page: number;
  readonly pageSize: number;
  readonly changePage: (page: number) => void;
}
const Pagination = ({
  page,
  pages,
  change,
}: {
  readonly page: number;
  readonly pages: number;
  readonly change: (page: number) => void;
}) => (
  <div className="pagination">
    <button
      className="secondary-button"
      type="button"
      disabled={page <= 1}
      onClick={() => {
        change(page - 1);
      }}
    >
      Anterior
    </button>
    <button
      className="secondary-button"
      type="button"
      disabled={page >= pages}
      onClick={() => {
        change(page + 1);
      }}
    >
      Siguiente
    </button>
  </div>
);
const Results = (props: ResultsProps) => {
  const pages = Math.max(1, Math.ceil(props.total / props.pageSize));
  return (
    <section className="admin-panel">
      <div className="section-heading">
        <div>
          <h2>No conformidades registradas</h2>
          <p className="section-copy">{props.total} resultado(s)</p>
        </div>
        <span className="phase-badge">
          Página {props.page} de {pages}
        </span>
      </div>
      {props.error ? (
        <p className="form-error" role="alert">
          {props.error}
        </p>
      ) : null}
      {props.loading ? (
        <p>Cargando no conformidades…</p>
      ) : (
        <NonConformityTable items={props.items} />
      )}
      <Pagination page={props.page} pages={pages} change={props.changePage} />
    </section>
  );
};

export const NonConformitiesPage = (): React.JSX.Element => {
  const { request, user } = useAuth();
  const [query, setQuery] = useState<NonConformityListQuery>(initialQuery);
  const masters = useNonConformityMasters(request);
  const result = useNonConformityList(request, query);
  const changePage = (page: number): void => {
    setQuery((current) => ({ ...current, page }));
  };
  return (
    <div className="page-stack">
      <Header
        canCreate={Boolean(
          user?.permissions.includes(Permission.NONCONFORMITIES_RECORD),
        )}
      />
      <section className="admin-panel">
        <h2>Filtros</h2>
        {masters.error ? <p className="form-error">{masters.error}</p> : null}
        <NonConformityFilters
          masters={masters.data}
          query={query}
          apply={setQuery}
        />
      </section>
      <Results
        {...result}
        page={query.page}
        pageSize={query.pageSize}
        changePage={changePage}
      />
    </div>
  );
};
