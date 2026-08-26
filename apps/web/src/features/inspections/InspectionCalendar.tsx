import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { InspectionItem } from '@sigecal/shared';

import {
  inspectionStatusLabel,
  limaDateKey,
  statusClass,
} from './inspection-labels.js';

type CalendarMode = 'month' | 'week';
interface Props {
  readonly items: readonly InspectionItem[];
  readonly loading: boolean;
  readonly error: string | undefined;
  readonly month: number;
  readonly year: number;
  readonly move: (offset: number) => void;
}

const monthLabel = (year: number, month: number): string =>
  new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );

const dateKey = (year: number, month: number, day: number): string =>
  `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const monthCells = (
  year: number,
  month: number,
): readonly (number | null)[] => {
  const leading = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const days = new Date(year, month, 0).getDate();
  return [
    ...Array.from<null>({ length: leading }).fill(null),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ];
};

const CalendarCell = ({
  day,
  items,
}: {
  readonly day: number | null;
  readonly items: readonly InspectionItem[];
}): React.JSX.Element => (
  <div className={`calendar-cell${day === null ? ' is-empty' : ''}`}>
    {day === null ? null : <span className="calendar-day">{day}</span>}
    {items.slice(0, 3).map((item) => (
      <Link
        className={`calendar-event ${statusClass(item.status)}`}
        key={item.id}
        to={`/inspecciones/${item.id}`}
        title={`${item.code} · ${inspectionStatusLabel[item.status]}`}
      >
        <strong>{item.code}</strong>
        <small>{item.batch.code}</small>
      </Link>
    ))}
    {items.length > 3 ? <small>+{items.length - 3} más</small> : null}
  </div>
);

const MonthGrid = ({
  items,
  month,
  year,
}: Pick<Props, 'items' | 'month' | 'year'>): React.JSX.Element => (
  <div
    className="calendar-grid"
    aria-label={`Calendario de ${monthLabel(year, month)}`}
  >
    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
      <span className="calendar-weekday" key={day}>
        {day}
      </span>
    ))}
    {monthCells(year, month).map((day, index) => (
      <CalendarCell
        key={`${String(day)}-${String(index)}`}
        day={day}
        items={
          day === null
            ? []
            : items.filter(
                (item) =>
                  limaDateKey(item.scheduledDate) === dateKey(year, month, day),
              )
        }
      />
    ))}
  </div>
);

const weekStart = (value: string): string => {
  const date = new Date(`${limaDateKey(value)}T12:00:00Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
};

const weekLabel = (start: string): string => {
  const from = new Date(`${start}T12:00:00Z`);
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 6);
  const format = new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  return `${format.format(from)} — ${format.format(to)}`;
};

const weekGroups = (items: readonly InspectionItem[]) => {
  const groups = new Map<string, InspectionItem[]>();
  for (const item of [...items].sort((left, right) =>
    left.scheduledDate.localeCompare(right.scheduledDate),
  )) {
    const start = weekStart(item.scheduledDate);
    groups.set(start, [...(groups.get(start) ?? []), item]);
  }
  return [...groups.entries()];
};

const WeeklyGroup = ({
  start,
  items,
}: {
  readonly start: string;
  readonly items: readonly InspectionItem[];
}): React.JSX.Element => (
  <section className="week-group">
    <h3>Semana {weekLabel(start)}</h3>
    {items.map((item) => (
      <Link key={item.id} to={`/inspecciones/${item.id}`}>
        <time>{limaDateKey(item.scheduledDate)}</time>
        <span>
          <strong>{item.code}</strong>
          <small>
            {item.batch.code} · {item.stage.name}
          </small>
        </span>
        <span className={statusClass(item.status)}>
          {inspectionStatusLabel[item.status]}
        </span>
      </Link>
    ))}
  </section>
);

const WeekAgenda = ({
  items,
}: {
  readonly items: readonly InspectionItem[];
}): React.JSX.Element => {
  const groups = weekGroups(items);
  return (
    <div className="week-agenda">
      {groups.length === 0 ? (
        <p className="quality-empty">No hay inspecciones en este periodo.</p>
      ) : null}
      {groups.map(([start, groupItems]) => (
        <WeeklyGroup key={start} start={start} items={groupItems} />
      ))}
    </div>
  );
};

interface CalendarToolbarProps extends Pick<Props, 'month' | 'move' | 'year'> {
  readonly mode: CalendarMode;
  readonly changeMode: (mode: CalendarMode) => void;
}

const CalendarNavigation = ({
  move,
}: Pick<Props, 'move'>): React.JSX.Element => (
  <>
    <button
      type="button"
      onClick={() => {
        move(-1);
      }}
      aria-label="Mes anterior"
    >
      <ChevronLeft aria-hidden="true" />
    </button>
    <button
      type="button"
      onClick={() => {
        move(1);
      }}
      aria-label="Mes siguiente"
    >
      <ChevronRight aria-hidden="true" />
    </button>
  </>
);

const CalendarModeSwitch = ({
  mode,
  changeMode,
}: Pick<CalendarToolbarProps, 'mode' | 'changeMode'>): React.JSX.Element => (
  <span className="view-switch" aria-label="Vista del calendario">
    <button
      className={mode === 'month' ? 'is-active' : ''}
      type="button"
      onClick={() => {
        changeMode('month');
      }}
    >
      <CalendarDays aria-hidden="true" /> Mes
    </button>
    <button
      className={mode === 'week' ? 'is-active' : ''}
      type="button"
      onClick={() => {
        changeMode('week');
      }}
    >
      <List aria-hidden="true" /> Semana
    </button>
  </span>
);

const CalendarToolbar = (props: CalendarToolbarProps): React.JSX.Element => (
  <header className="calendar-header">
    <div>
      <span className="quality-kicker">Agenda de calidad</span>
      <h2>{monthLabel(props.year, props.month)}</h2>
    </div>
    <div className="calendar-actions">
      <CalendarNavigation move={props.move} />
      <CalendarModeSwitch mode={props.mode} changeMode={props.changeMode} />
    </div>
  </header>
);

export const InspectionCalendar = (props: Props): React.JSX.Element => {
  const [mode, setMode] = useState<CalendarMode>('month');
  return (
    <section className="quality-panel calendar-panel">
      <CalendarToolbar {...props} mode={mode} changeMode={setMode} />
      {props.error ? <p className="form-error">{props.error}</p> : null}
      {props.loading ? <p>Cargando calendario…</p> : null}
      {!props.loading && mode === 'month' ? (
        <MonthGrid items={props.items} month={props.month} year={props.year} />
      ) : null}
      {!props.loading && mode === 'week' ? (
        <WeekAgenda items={props.items} />
      ) : null}
    </section>
  );
};
