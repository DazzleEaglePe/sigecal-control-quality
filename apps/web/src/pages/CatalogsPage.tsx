import { useEffect, useState } from 'react';

import { errorMessage } from '../features/admin/admin-ui.js';
import { useAuth } from '../features/auth/useAuth.js';
import {
  listCatalog,
  type CatalogItem,
  type CatalogKind,
} from '../features/masters/catalog-api.js';
import { catalogLabels } from '../features/masters/catalog-config.js';
import { CatalogForm } from '../features/masters/CatalogForm.js';
import { CatalogTable } from '../features/masters/CatalogTable.js';

const catalogKinds = Object.keys(catalogLabels) as CatalogKind[];

const CatalogHeader = (): React.JSX.Element => (
  <header className="page-heading">
    <div>
      <p className="eyebrow">Configuración</p>
      <h1>Catálogos maestros</h1>
      <p>Administre las referencias operativas sin eliminar su historial.</p>
    </div>
  </header>
);

const CatalogTabs = ({
  kind,
  selected,
}: {
  readonly kind: CatalogKind;
  readonly selected: (kind: CatalogKind) => void;
}): React.JSX.Element => (
  <div className="catalog-tabs" role="tablist" aria-label="Catálogos">
    {catalogKinds.map((entry) => (
      <button
        key={entry}
        className={entry === kind ? 'is-selected' : ''}
        type="button"
        role="tab"
        aria-selected={entry === kind}
        onClick={() => {
          selected(entry);
        }}
      >
        {catalogLabels[entry]}
      </button>
    ))}
  </div>
);

interface CatalogPanelProps {
  readonly kind: CatalogKind;
  readonly items: readonly CatalogItem[];
  readonly loading: boolean;
  readonly error: string | undefined;
  readonly changed: (item: CatalogItem) => void;
}

const CatalogPanel = (props: CatalogPanelProps): React.JSX.Element => (
  <section className="admin-panel">
    <div className="section-heading">
      <h2>{catalogLabels[props.kind]}</h2>
      <span className="phase-badge">{props.items.length} visibles</span>
    </div>
    {props.error ? <p className="form-error">{props.error}</p> : null}
    {props.loading ? (
      <p>Cargando catálogo…</p>
    ) : (
      <CatalogTable
        kind={props.kind}
        items={props.items}
        changed={props.changed}
      />
    )}
  </section>
);

const useCatalogPage = (kind: CatalogKind) => {
  const { request } = useAuth();
  const [items, setItems] = useState<readonly CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void listCatalog(request, kind)
      .then((data) => {
        if (active) setItems(data);
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
  }, [kind, request]);
  const add = (item: CatalogItem): void => {
    setItems((current) => [item, ...current]);
  };
  const replace = (item: CatalogItem): void => {
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? item : entry)),
    );
  };
  return { items, loading, error, setLoading, setError, add, replace };
};

export const CatalogsPage = (): React.JSX.Element => {
  const [kind, setKind] = useState<CatalogKind>('varieties');
  const page = useCatalogPage(kind);
  const selectKind = (next: CatalogKind): void => {
    page.setLoading(true);
    page.setError(undefined);
    setKind(next);
  };
  return (
    <div className="page-stack">
      <CatalogHeader />
      <CatalogTabs kind={kind} selected={selectKind} />
      <section className="admin-panel">
        <h2>Nuevo registro</h2>
        <CatalogForm key={kind} kind={kind} added={page.add} />
      </section>
      <CatalogPanel
        kind={kind}
        items={page.items}
        loading={page.loading}
        error={page.error}
        changed={page.replace}
      />
    </div>
  );
};
