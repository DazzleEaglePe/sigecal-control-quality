import { Link } from 'react-router-dom';
import type { BatchItem } from '@sigecal/shared';

import { batchStatusLabel, localDate, originLabel } from './batches-labels.js';

const BatchRow = ({
  batch,
}: {
  readonly batch: BatchItem;
}): React.JSX.Element => (
  <tr>
    <td>
      <strong>{batch.code}</strong>
      <small>{batch.harvestOrigin ?? 'Sin origen'}</small>
    </td>
    <td>
      <strong>{batch.piscoType.name}</strong>
      <small>
        {batch.varieties.map((item) => item.variety.name).join(', ')}
      </small>
    </td>
    <td>{batch.currentStage.name}</td>
    <td>
      <span className={`state-pill batch-status-${batch.status.toLowerCase()}`}>
        {batchStatusLabel[batch.status]}
      </span>
    </td>
    <td>{localDate(batch.startDate)}</td>
    <td>{Number(batch.volumeLiters).toLocaleString('es-PE')} L</td>
    <td>
      <span className={`state-pill origin-${batch.dataOrigin.toLowerCase()}`}>
        {originLabel[batch.dataOrigin]}
      </span>
    </td>
    <td>
      <Link className="table-action" to={`/lotes/${batch.id}`}>
        Ver detalle
      </Link>
    </td>
  </tr>
);

export const BatchTable = ({
  items,
}: {
  readonly items: readonly BatchItem[];
}): React.JSX.Element => {
  if (items.length === 0)
    return (
      <p className="empty-copy">No hay lotes para los filtros aplicados.</p>
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Lote</th>
            <th>Producto</th>
            <th>Etapa</th>
            <th>Estado</th>
            <th>Inicio</th>
            <th>Volumen</th>
            <th>Origen</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((batch) => (
            <BatchRow key={batch.id} batch={batch} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
