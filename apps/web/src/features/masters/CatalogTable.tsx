import { useState } from 'react';

import { errorMessage } from '../admin/admin-ui.js';
import { useAuth } from '../auth/useAuth.js';
import {
  setCatalogStatus,
  type CatalogItem,
  type CatalogKind,
} from './catalog-api.js';

const itemDetail = (item: CatalogItem): string => {
  if ('unit' in item) return `${item.unit} · ${item.type}`;
  if ('status' in item) return item.status.replaceAll('_', ' ');
  if ('sequence' in item) return `Secuencia ${String(item.sequence)}`;
  if ('description' in item && item.description) return item.description;
  return 'Sin detalle adicional';
};

const useCatalogToggle = (
  kind: CatalogKind,
  item: CatalogItem,
  changed: (item: CatalogItem) => void,
) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const toggle = async (): Promise<void> => {
    setBusy(true);
    setError(undefined);
    try {
      changed(await setCatalogStatus(request, kind, item));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, toggle };
};

const CatalogRow = ({
  kind,
  item,
  changed,
}: {
  readonly kind: CatalogKind;
  readonly item: CatalogItem;
  readonly changed: (item: CatalogItem) => void;
}): React.JSX.Element => {
  const status = useCatalogToggle(kind, item, changed);
  return (
    <tr>
      <td>
        <strong>{item.name}</strong>
        <small>{item.code}</small>
      </td>
      <td>{itemDetail(item)}</td>
      <td>
        <span className={`state-pill ${item.isActive ? 'is-active' : ''}`}>
          {item.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>
        <button
          className="table-action"
          disabled={status.busy}
          type="button"
          onClick={() => void status.toggle()}
        >
          {item.isActive ? 'Desactivar' : 'Activar'}
        </button>
        {status.error ? (
          <small className="inline-error">{status.error}</small>
        ) : null}
      </td>
    </tr>
  );
};

export const CatalogTable = ({
  kind,
  items,
  changed,
}: {
  readonly kind: CatalogKind;
  readonly items: readonly CatalogItem[];
  readonly changed: (item: CatalogItem) => void;
}): React.JSX.Element => (
  <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Elemento</th>
          <th>Detalle</th>
          <th>Estado</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <CatalogRow key={item.id} kind={kind} item={item} changed={changed} />
        ))}
      </tbody>
    </table>
    {items.length === 0 ? (
      <p className="empty-copy">No hay registros todavía.</p>
    ) : null}
  </div>
);
