import { Link } from 'react-router-dom';
import type { BatchItem } from '@sigecal/shared';

import { EmptyState } from '../../components/ui/empty-state.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { batchStatusLabel, localDate, originLabel } from './batches-labels.js';

const BatchRow = ({
  batch,
}: {
  readonly batch: BatchItem;
}): React.JSX.Element => (
  <TableRow>
    <TableCell>
      <strong>{batch.code}</strong>
      <small>{batch.harvestOrigin ?? 'Sin origen'}</small>
    </TableCell>
    <TableCell>
      <strong>{batch.piscoType.name}</strong>
      <small>
        {batch.varieties.map((item) => item.variety.name).join(', ')}
      </small>
    </TableCell>
    <TableCell>{batch.currentStage.name}</TableCell>
    <TableCell>
      <span className={`state-pill batch-status-${batch.status.toLowerCase()}`}>
        {batchStatusLabel[batch.status]}
      </span>
    </TableCell>
    <TableCell>{localDate(batch.startDate)}</TableCell>
    <TableCell>
      {Number(batch.volumeLiters).toLocaleString('es-PE')} L
    </TableCell>
    <TableCell>
      <span className={`state-pill origin-${batch.dataOrigin.toLowerCase()}`}>
        {originLabel[batch.dataOrigin]}
      </span>
    </TableCell>
    <TableCell>
      <Link className="table-action" to={`/lotes/${batch.id}`}>
        Ver detalle
      </Link>
    </TableCell>
  </TableRow>
);

export const BatchTable = ({
  items,
}: {
  readonly items: readonly BatchItem[];
}): React.JSX.Element => {
  if (items.length === 0)
    return (
      <EmptyState
        title="No encontramos lotes"
        description="Ajuste o limpie los filtros para consultar otros registros."
      />
    );
  return (
    <div className="table-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lote</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Inicio</TableHead>
            <TableHead>Volumen</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead aria-label="Acciones" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((batch) => (
            <BatchRow key={batch.id} batch={batch} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
