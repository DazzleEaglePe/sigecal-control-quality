import { FileClock } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import type { AuditAction, AuditItem, AuditQuery } from '@sigecal/shared';

import { EmptyState } from '../components/ui/empty-state.js';
import { Input } from '../components/ui/input.js';
import { NativeSelect } from '../components/ui/native-select.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import { useAuth } from '../features/auth/useAuth.js';
import { useAuditLog } from '../features/discovery/useAuditLog.js';

const initialQuery: AuditQuery = { page: 1, pageSize: 20 };
const actionLabels: Record<AuditAction, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  STATE_CHANGE: 'Cambio de estado',
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
  EXPORT: 'Exportación',
};
const dayBoundary = (value: string, end = false): string | undefined =>
  value
    ? new Date(`${value}T${end ? '23:59:59.999' : '00:00:00'}`).toISOString()
    : undefined;
const dateValue = (value?: string): string => value?.slice(0, 10) ?? '';
const formValue = (data: FormData, name: string): string => {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
};
const queryFrom = (data: FormData, pageSize: number): AuditQuery => ({
  page: 1,
  pageSize,
  action: (formValue(data, 'action') || undefined) as AuditAction | undefined,
  userId: formValue(data, 'userId') || undefined,
  entity: formValue(data, 'entity') || undefined,
  entityId: formValue(data, 'entityId') || undefined,
  dateFrom: dayBoundary(formValue(data, 'dateFrom')),
  dateTo: dayBoundary(formValue(data, 'dateTo'), true),
});

const ActionField = ({
  value,
}: {
  readonly value: AuditAction | undefined;
}) => (
  <label>
    Acción
    <NativeSelect name="action" defaultValue={value ?? ''}>
      <option value="">Todas</option>
      {Object.entries(actionLabels).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </NativeSelect>
  </label>
);
const TextField = ({
  label,
  name,
  value,
}: {
  readonly label: string;
  readonly name: string;
  readonly value: string | undefined;
}) => (
  <label>
    {label}
    <Input
      name={name}
      defaultValue={value ?? ''}
      {...(name === 'userId' ? { pattern: '[0-9a-fA-F-]{36}' } : {})}
    />
  </label>
);
const DateField = ({
  label,
  name,
  value,
}: {
  readonly label: string;
  readonly name: string;
  readonly value: string | undefined;
}) => (
  <label>
    {label}
    <Input name={name} type="date" defaultValue={dateValue(value)} />
  </label>
);

const AuditFilters = ({
  apply,
  query,
}: {
  readonly apply: (query: AuditQuery) => void;
  readonly query: AuditQuery;
}) => {
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    apply(queryFrom(new FormData(event.currentTarget), query.pageSize));
  };
  return (
    <form className="quality-filters" onSubmit={submit}>
      <ActionField value={query.action} />
      <TextField label="Usuario (UUID)" name="userId" value={query.userId} />
      <TextField label="Entidad" name="entity" value={query.entity} />
      <TextField label="ID de entidad" name="entityId" value={query.entityId} />
      <DateField label="Desde" name="dateFrom" value={query.dateFrom} />
      <DateField label="Hasta" name="dateTo" value={query.dateTo} />
      <button className="primary-button" type="submit">
        Aplicar filtros
      </button>
    </form>
  );
};

const JsonDetail = ({ item }: { readonly item: AuditItem }) => (
  <details>
    <summary className="cursor-pointer text-primary">Ver cambios</summary>
    <pre className="mt-2 max-w-xl overflow-auto rounded-md bg-secondary p-3 text-xs">
      {JSON.stringify({ before: item.before, after: item.after }, null, 2)}
    </pre>
  </details>
);
const AuditRow = ({ item }: { readonly item: AuditItem }) => (
  <TableRow>
    <TableCell>{new Date(item.createdAt).toLocaleString('es-PE')}</TableCell>
    <TableCell>
      {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Sistema'}
    </TableCell>
    <TableCell>{actionLabels[item.action]}</TableCell>
    <TableCell>{item.entity}</TableCell>
    <TableCell>{item.entityId}</TableCell>
    <TableCell>
      <JsonDetail item={item} />
    </TableCell>
  </TableRow>
);
const AuditTable = ({ items }: { readonly items: readonly AuditItem[] }) => {
  if (items.length === 0)
    return (
      <EmptyState
        title="Sin eventos"
        description="No hay eventos para los filtros seleccionados."
      />
    );
  return (
    <div className="table-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Entidad</TableHead>
            <TableHead>Identificador</TableHead>
            <TableHead>Cambios</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <AuditRow key={item.id} item={item} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const AuditHeader = () => (
  <header className="page-heading">
    <div>
      <p className="eyebrow">Seguridad</p>
      <h1>Bitácora de auditoría</h1>
      <p>Consulta inmutable de acciones relevantes del sistema.</p>
    </div>
    <FileClock className="size-10 text-primary" aria-hidden="true" />
  </header>
);
const AuditPagination = ({
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

export const AuditPage = (): React.JSX.Element => {
  const { request } = useAuth();
  const [query, setQuery] = useState<AuditQuery>(initialQuery);
  const result = useAuditLog(request, query);
  const pages = Math.max(1, Math.ceil(result.total / query.pageSize));
  const changePage = (page: number): void => {
    setQuery((value) => ({ ...value, page }));
  };
  return (
    <div className="page-stack">
      <AuditHeader />
      <section className="admin-panel">
        <h2>Filtros</h2>
        <AuditFilters query={query} apply={setQuery} />
      </section>
      <section className="admin-panel">
        <div className="section-heading">
          <div>
            <h2>Eventos registrados</h2>
            <p className="section-copy">{result.total} evento(s)</p>
          </div>
          <span className="phase-badge">
            Página {query.page} de {pages}
          </span>
        </div>
        {result.error ? <p className="form-error">{result.error}</p> : null}
        {result.loading ? (
          <p>Cargando bitácora…</p>
        ) : (
          <AuditTable items={result.items} />
        )}
        <AuditPagination page={query.page} pages={pages} change={changePage} />
      </section>
    </div>
  );
};
