import { ArrowUpRight, FlaskConical, Wine } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { InspectionItem } from '@sigecal/shared';

import {
  inspectionStatusLabel,
  inspectionTypeLabel,
  limaDateTime,
  statusClass,
} from './inspection-labels.js';

const TableHead = (): React.JSX.Element => (
  <thead>
    <tr>
      <th>Inspección</th>
      <th>Lote / etapa</th>
      <th>Tipo</th>
      <th>Programación</th>
      <th>Responsable</th>
      <th>Estado</th>
      <th aria-label="Acciones" />
    </tr>
  </thead>
);

const InspectionIdentity = ({
  item,
}: {
  readonly item: InspectionItem;
}): React.JSX.Element => (
  <>
    <td>
      <strong>{item.code}</strong>
      <small>{item.dataOrigin === 'DEMO' ? 'Demostración' : 'Real'}</small>
    </td>
    <td>
      <strong>{item.batch.code}</strong>
      <small>{item.stage.name}</small>
    </td>
  </>
);

const InspectionTypeCell = ({
  item,
}: {
  readonly item: InspectionItem;
}): React.JSX.Element => {
  const TypeIcon = item.type === 'FISICOQUIMICO' ? FlaskConical : Wine;
  return (
    <td>
      <span className="quality-type">
        <TypeIcon aria-hidden="true" />
        {inspectionTypeLabel[item.type]}
      </span>
    </td>
  );
};

const InspectionRow = ({
  item,
}: {
  readonly item: InspectionItem;
}): React.JSX.Element => (
  <tr>
    <InspectionIdentity item={item} />
    <InspectionTypeCell item={item} />
    <td>{limaDateTime(item.scheduledDate)}</td>
    <td>
      {item.responsible.firstName} {item.responsible.lastName}
    </td>
    <td>
      <span className={statusClass(item.status)}>
        {inspectionStatusLabel[item.status]}
      </span>
    </td>
    <td>
      <Link
        className="quality-row-action"
        to={`/inspecciones/${item.id}`}
        aria-label={`Abrir ${item.code}`}
      >
        <ArrowUpRight aria-hidden="true" />
      </Link>
    </td>
  </tr>
);

export const InspectionTable = ({
  items,
}: {
  readonly items: readonly InspectionItem[];
}): React.JSX.Element => {
  if (items.length === 0)
    return <p className="quality-empty">No hay inspecciones para mostrar.</p>;
  return (
    <div className="table-scroll quality-table-wrap">
      <table className="quality-table">
        <TableHead />
        <tbody>
          {items.map((item) => (
            <InspectionRow item={item} key={item.id} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
