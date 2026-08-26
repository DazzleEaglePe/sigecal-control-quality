import { useState } from 'react';
import {
  CalendarCheck2,
  CalendarDays,
  ClipboardCheck,
  ListFilter,
  Plus,
  TimerReset,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Permission,
  type InspectionItem,
  type InspectionListQuery,
} from '@sigecal/shared';

import { useAuth } from '../features/auth/useAuth.js';
import { InspectionCalendar } from '../features/inspections/InspectionCalendar.js';
import { InspectionFilters } from '../features/inspections/InspectionFilters.js';
import { InspectionTable } from '../features/inspections/InspectionTable.js';
import { PendingInspections } from '../features/inspections/PendingInspections.js';
import {
  useInspectionCalendar,
  useInspectionFilterMasters,
  useInspectionList,
  usePendingInspections,
} from '../features/inspections/useInspections.js';

type View = 'list' | 'calendar';
const initialQuery: InspectionListQuery = { page: 1, pageSize: 20 };

const QualityStats = ({
  total,
  pending,
  month,
  completed,
}: {
  readonly total: number;
  readonly pending: number;
  readonly month: number;
  readonly completed: number;
}): React.JSX.Element => {
  const cards = [
    { label: 'Inspecciones', value: total, icon: ClipboardCheck },
    { label: 'Mis pendientes', value: pending, icon: TimerReset },
    { label: 'Programadas este mes', value: month, icon: CalendarDays },
    { label: 'Completadas visibles', value: completed, icon: CalendarCheck2 },
  ];
  return (
    <section className="quality-stats" aria-label="Resumen de inspecciones">
      {cards.map(({ label, value, icon: Icon }) => (
        <article key={label}>
          <span>
            <Icon aria-hidden="true" />
          </span>
          <div>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        </article>
      ))}
    </section>
  );
};

const Pagination = ({
  page,
  pages,
  change,
}: {
  readonly page: number;
  readonly pages: number;
  readonly change: (page: number) => void;
}): React.JSX.Element => (
  <div className="pagination">
    <button
      type="button"
      className="secondary-button"
      disabled={page <= 1}
      onClick={() => {
        change(page - 1);
      }}
    >
      Anterior
    </button>
    <span>
      Página {page} de {pages}
    </span>
    <button
      type="button"
      className="secondary-button"
      disabled={page >= pages}
      onClick={() => {
        change(page + 1);
      }}
    >
      Siguiente
    </button>
  </div>
);

interface ListPanelProps {
  readonly query: InspectionListQuery;
  readonly items: readonly InspectionItem[];
  readonly total: number;
  readonly loading: boolean;
  readonly error: string | undefined;
  readonly masters: Parameters<typeof InspectionFilters>[0]['masters'];
  readonly apply: (query: InspectionListQuery) => void;
}
const InspectionListPanel = (props: ListPanelProps): React.JSX.Element => {
  const pages = Math.max(1, Math.ceil(props.total / props.query.pageSize));
  const change = (page: number): void => {
    props.apply({ ...props.query, page });
  };
  return (
    <section className="quality-panel inspection-list-panel">
      <div className="quality-panel-heading">
        <div>
          <span className="quality-kicker">Consulta operativa</span>
          <h2>Inspecciones registradas</h2>
        </div>
        <span className="soft-badge">{props.total} resultado(s)</span>
      </div>
      <InspectionFilters
        query={props.query}
        masters={props.masters}
        apply={props.apply}
      />
      {props.error ? <p className="form-error">{props.error}</p> : null}
      {props.loading ? (
        <p>Cargando inspecciones…</p>
      ) : (
        <InspectionTable items={props.items} />
      )}
      <Pagination page={props.query.page} pages={pages} change={change} />
    </section>
  );
};

interface PageHeaderProps {
  readonly view: View;
  readonly changeView: (view: View) => void;
  readonly canSchedule: boolean;
}

const ViewActions = ({
  view,
  changeView,
  canSchedule,
}: PageHeaderProps): React.JSX.Element => (
  <div className="quality-heading-actions">
    <span className="view-switch">
      <button
        className={view === 'list' ? 'is-active' : ''}
        type="button"
        onClick={() => {
          changeView('list');
        }}
      >
        <ListFilter /> Listado
      </button>
      <button
        className={view === 'calendar' ? 'is-active' : ''}
        type="button"
        onClick={() => {
          changeView('calendar');
        }}
      >
        <CalendarDays /> Calendario
      </button>
    </span>
    {canSchedule ? (
      <Link className="primary-button" to="/inspecciones/nueva">
        <Plus /> Programar
      </Link>
    ) : null}
  </div>
);

const PageHeader = ({
  view,
  changeView,
  canSchedule,
}: PageHeaderProps): React.JSX.Element => (
  <header className="page-heading quality-heading">
    <div>
      <p className="eyebrow">Control de calidad</p>
      <h1>Inspecciones</h1>
      <p>Programe, ejecute y supervise cada control del proceso productivo.</p>
    </div>
    <ViewActions
      view={view}
      changeView={changeView}
      canSchedule={canSchedule}
    />
  </header>
);

const useInspectionsPage = () => {
  const { request, user } = useAuth();
  const [view, changeView] = useState<View>('list');
  const [query, apply] = useState<InspectionListQuery>(initialQuery);
  const today = new Date();
  const [period, setPeriod] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });
  const canSchedule = Boolean(
    user?.permissions.includes(Permission.INSPECTIONS_SCHEDULE),
  );
  const list = useInspectionList(request, query);
  const pending = usePendingInspections(request);
  const calendar = useInspectionCalendar(request, period.month, period.year);
  const masters = useInspectionFilterMasters(request, canSchedule);
  const move = (offset: number): void => {
    const next = new Date(period.year, period.month - 1 + offset, 1);
    setPeriod({ month: next.getMonth() + 1, year: next.getFullYear() });
  };
  return {
    view,
    changeView,
    query,
    apply,
    period,
    canSchedule,
    list,
    pending,
    calendar,
    masters,
    move,
  };
};

type PageModel = ReturnType<typeof useInspectionsPage>;
const PageSummary = ({
  page,
}: {
  readonly page: PageModel;
}): React.JSX.Element => (
  <>
    <QualityStats
      total={page.list.total}
      pending={page.pending.total}
      month={page.calendar.total}
      completed={
        page.list.items.filter((item) => item.status === 'COMPLETADA').length
      }
    />
    <PendingInspections
      items={page.pending.items}
      loading={page.pending.loading}
      error={page.pending.error}
    />
    {page.masters.error ? (
      <p className="form-error">{page.masters.error}</p>
    ) : null}
  </>
);

const PageView = ({
  page,
}: {
  readonly page: PageModel;
}): React.JSX.Element => (
  <>
    {page.view === 'list' ? (
      <InspectionListPanel
        {...page.list}
        query={page.query}
        masters={page.masters.data}
        apply={page.apply}
      />
    ) : null}
    {page.view === 'calendar' ? (
      <InspectionCalendar
        {...page.calendar}
        month={page.period.month}
        year={page.period.year}
        move={page.move}
      />
    ) : null}
  </>
);

export const InspectionsPage = (): React.JSX.Element => {
  const page = useInspectionsPage();
  return (
    <div className="page-stack quality-page">
      <PageHeader
        view={page.view}
        changeView={page.changeView}
        canSchedule={page.canSchedule}
      />
      <PageSummary page={page} />
      <PageView page={page} />
    </div>
  );
};
