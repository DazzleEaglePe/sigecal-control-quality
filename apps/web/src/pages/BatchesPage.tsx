import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Permission,
  type BatchItem,
  type BatchListQuery,
} from '@sigecal/shared';

import { BatchFilters } from '../features/batches/BatchFilters.js';
import { BatchTable } from '../features/batches/BatchTable.js';
import {
  useBatchList,
  useBatchMasters,
} from '../features/batches/useBatches.js';
import { useAuth } from '../features/auth/useAuth.js';

const initialQuery: BatchListQuery = { page: 1, pageSize: 20 };
const BatchesHeader = ({ canCreate }: { readonly canCreate: boolean }) => (
  <header className="page-heading">
    <div>
      <p className="eyebrow">Operación productiva</p>
      <h1>Lotes</h1>
      <p>
        Consulte el avance, la composición y la trazabilidad completa de cada
        lote.
      </p>
    </div>
    {canCreate ? (
      <Link className="primary-button heading-action" to="/lotes/nuevo">
        Nuevo lote
      </Link>
    ) : null}
  </header>
);

interface ResultsProps {
  readonly items: readonly BatchItem[];
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
const BatchResults = (props: ResultsProps) => {
  const pages = Math.max(1, Math.ceil(props.total / props.pageSize));
  return (
    <section className="admin-panel">
      <div className="section-heading">
        <div>
          <h2>Lotes registrados</h2>
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
        <p>Cargando lotes…</p>
      ) : (
        <BatchTable items={props.items} />
      )}
      <Pagination page={props.page} pages={pages} change={props.changePage} />
    </section>
  );
};

export const BatchesPage = (): React.JSX.Element => {
  const { request, user } = useAuth();
  const [query, setQuery] = useState<BatchListQuery>(initialQuery);
  const masters = useBatchMasters(request);
  const result = useBatchList(request, query);
  const changePage = (page: number): void => {
    setQuery((current) => ({ ...current, page }));
  };
  return (
    <div className="page-stack">
      <BatchesHeader
        canCreate={Boolean(
          user?.permissions.includes(Permission.BATCHES_OPERATE),
        )}
      />
      <section className="admin-panel">
        <h2>Filtros</h2>
        {masters.error ? <p className="form-error">{masters.error}</p> : null}
        <BatchFilters masters={masters.data} query={query} apply={setQuery} />
      </section>
      <BatchResults
        {...result}
        page={query.page}
        pageSize={query.pageSize}
        changePage={changePage}
      />
    </div>
  );
};
