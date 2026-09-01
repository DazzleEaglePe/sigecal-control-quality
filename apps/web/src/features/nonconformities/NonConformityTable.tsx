import { Link } from 'react-router-dom';
import type { NonConformityItem } from '@sigecal/shared';

import { EmptyState } from '../../components/ui/empty-state.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import {
  localDateTime,
  ncStatusLabel,
  severityLabel,
} from '../batches/batches-labels.js';

const NonConformityRow = ({
  item,
}: {
  readonly item: NonConformityItem;
}): React.JSX.Element => (
  <TableRow>
    <TableCell>
      <strong>{item.code}</strong>
      <small>{item.batch.code}</small>
    </TableCell>
    <TableCell>{item.stage?.name ?? 'Sin etapa'}</TableCell>
    <TableCell>
      <span className={`state-pill nc-severity-${item.severity.toLowerCase()}`}>
        {severityLabel[item.severity]}
      </span>
    </TableCell>
    <TableCell>
      <span className={`state-pill nc-status-${item.status.toLowerCase()}`}>
        {ncStatusLabel[item.status]}
      </span>
    </TableCell>
    <TableCell>{localDateTime(item.detectedAt)}</TableCell>
    <TableCell>
      {item.assignedTo
        ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}`
        : 'Sin asignar'}
    </TableCell>
    <TableCell>
      <Link className="table-action" to={`/no-conformidades/${item.id}`}>
        Ver detalle
      </Link>
    </TableCell>
  </TableRow>
);

export const NonConformityTable = ({
  items,
}: {
  readonly items: readonly NonConformityItem[];
}): React.JSX.Element => {
  if (items.length === 0)
    return (
      <EmptyState
        title="No encontramos no conformidades"
        description="Ajuste o limpie los filtros para consultar otros registros."
      />
    );
  return (
    <div className="table-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No conformidad</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Severidad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Detección</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead aria-label="Acciones" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <NonConformityRow key={item.id} item={item} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
