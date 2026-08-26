import { ArrowRight, CalendarClock, CircleCheckBig } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { InspectionItem } from '@sigecal/shared';

import {
  inspectionStatusLabel,
  limaDateTime,
  statusClass,
} from './inspection-labels.js';

interface Props {
  readonly items: readonly InspectionItem[];
  readonly loading: boolean;
  readonly error: string | undefined;
}

const PendingHeading = (): React.JSX.Element => (
  <div className="quality-panel-heading">
    <div>
      <span className="quality-kicker">Prioridad personal</span>
      <h2>Mis inspecciones pendientes</h2>
    </div>
    <CalendarClock aria-hidden="true" />
  </div>
);

const PendingItem = ({
  item,
}: {
  readonly item: InspectionItem;
}): React.JSX.Element => (
  <Link to={`/inspecciones/${item.id}`}>
    <span className="pending-date">
      <strong>{limaDateTime(item.scheduledDate)}</strong>
      <small>{item.stage.name}</small>
    </span>
    <span>
      <strong>{item.code}</strong>
      <small>{item.batch.code}</small>
    </span>
    <span className={statusClass(item.status)}>
      {inspectionStatusLabel[item.status]}
    </span>
    <ArrowRight aria-hidden="true" />
  </Link>
);

export const PendingInspections = ({
  items,
  loading,
  error,
}: Props): React.JSX.Element => (
  <section className="quality-panel pending-panel">
    <PendingHeading />
    {error ? <p className="form-error">{error}</p> : null}
    {loading ? <p>Cargando pendientes…</p> : null}
    {!loading && items.length === 0 ? (
      <div className="quality-empty-inline">
        <CircleCheckBig aria-hidden="true" />
        <span>No tiene inspecciones pendientes.</span>
      </div>
    ) : null}
    <div className="pending-list">
      {items.map((item) => (
        <PendingItem item={item} key={item.id} />
      ))}
    </div>
  </section>
);
