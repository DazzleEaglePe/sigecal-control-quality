import { ArrowUpRight, FlaskConical, Wine } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { InspectionItem } from '@sigecal/shared';

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
  inspectionStatusLabel,
  inspectionTypeLabel,
  limaDateTime,
  statusClass,
} from './inspection-labels.js';

const InspectionTableHead = (): React.JSX.Element => (
  <TableHeader>
    <TableRow>
      <TableHead>Inspección</TableHead>
      <TableHead>Lote / etapa</TableHead>
      <TableHead>Tipo</TableHead>
      <TableHead>Programación</TableHead>
      <TableHead>Responsable</TableHead>
      <TableHead>Estado</TableHead>
      <TableHead aria-label="Acciones" />
    </TableRow>
  </TableHeader>
);

const InspectionIdentity = ({
  item,
}: {
  readonly item: InspectionItem;
}): React.JSX.Element => (
  <>
    <TableCell>
      <strong>{item.code}</strong>
      <small>{item.dataOrigin === 'DEMO' ? 'Demostración' : 'Real'}</small>
    </TableCell>
    <TableCell>
      <strong>{item.batch.code}</strong>
      <small>{item.stage.name}</small>
    </TableCell>
  </>
);

const InspectionTypeCell = ({
  item,
}: {
  readonly item: InspectionItem;
}): React.JSX.Element => {
  const TypeIcon = item.type === 'FISICOQUIMICO' ? FlaskConical : Wine;
  return (
    <TableCell>
      <span className="quality-type">
        <TypeIcon aria-hidden="true" />
        {inspectionTypeLabel[item.type]}
      </span>
    </TableCell>
  );
};

const InspectionRow = ({
  item,
}: {
  readonly item: InspectionItem;
}): React.JSX.Element => (
  <TableRow>
    <InspectionIdentity item={item} />
    <InspectionTypeCell item={item} />
    <TableCell>{limaDateTime(item.scheduledDate)}</TableCell>
    <TableCell>
      {item.responsible.firstName} {item.responsible.lastName}
    </TableCell>
    <TableCell>
      <span className={statusClass(item.status)}>
        {inspectionStatusLabel[item.status]}
      </span>
    </TableCell>
    <TableCell>
      <Link
        className="quality-row-action"
        to={`/inspecciones/${item.id}`}
        aria-label={`Abrir ${item.code}`}
      >
        <ArrowUpRight aria-hidden="true" />
      </Link>
    </TableCell>
  </TableRow>
);

export const InspectionTable = ({
  items,
}: {
  readonly items: readonly InspectionItem[];
}): React.JSX.Element => {
  if (items.length === 0)
    return (
      <EmptyState
        title="No encontramos inspecciones"
        description="Ajuste los filtros o programe una nueva inspección."
      />
    );
  return (
    <div className="table-scroll quality-table-wrap">
      <Table className="quality-table">
        <InspectionTableHead />
        <TableBody>
          {items.map((item) => (
            <InspectionRow item={item} key={item.id} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
