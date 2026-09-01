import { GitCompareArrows, Plus, Radar } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SensoryProfile, SensorySessionItem } from '@sigecal/shared';
import { SensoryRadar } from './SensoryRadar.js';

const statusLabel = (value: SensorySessionItem['status']) =>
  value === 'NO_CONFORME'
    ? 'No conforme'
    : value === 'ANULADO'
      ? 'Anulada'
      : 'Conforme';
const SessionRow = ({
  item,
  selected,
  toggle,
}: {
  readonly item: SensorySessionItem;
  readonly selected: boolean;
  readonly toggle: (checked: boolean) => void;
}) => (
  <tr>
    <td>
      <input
        type="checkbox"
        aria-label={`Comparar ${item.inspection.code}`}
        disabled={item.status === 'ANULADO'}
        checked={selected}
        onChange={(event) => {
          toggle(event.target.checked);
        }}
      />
    </td>
    <td>{item.inspection.code}</td>
    <td>{item.batch.code}</td>
    <td>{item.sessionDate}</td>
    <td>{item.overallAverage}</td>
    <td>{item.appliedThreshold}</td>
    <td>
      <span className={`status-badge is-${item.status.toLowerCase()}`}>
        {statusLabel(item.status)}
      </span>
    </td>
    <td>
      <Link to={`/organoleptico/${item.id}`}>Ver detalle</Link>
    </td>
  </tr>
);
const SessionsTable = ({
  items,
  selected,
  toggle,
}: {
  readonly items: readonly SensorySessionItem[];
  readonly selected: readonly string[];
  readonly toggle: (id: string, checked: boolean) => void;
}) => (
  <div className="table-shell">
    <table>
      <thead>
        <tr>
          <th>Comparar</th>
          <th>Sesión</th>
          <th>Lote</th>
          <th>Fecha</th>
          <th>Promedio</th>
          <th>Umbral</th>
          <th>Estado</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <SessionRow
            key={item.id}
            item={item}
            selected={selected.includes(item.id)}
            toggle={(checked) => {
              toggle(item.id, checked);
            }}
          />
        ))}
      </tbody>
    </table>
  </div>
);
const SessionsPanel = ({
  items,
  selected,
  toggle,
  compare,
}: {
  readonly items: readonly SensorySessionItem[];
  readonly selected: readonly string[];
  readonly toggle: (id: string, checked: boolean) => void;
  readonly compare: () => void;
}) => (
  <section className="quality-panel">
    <div className="quality-panel-heading">
      <div>
        <span className="quality-kicker">Trazabilidad sensorial</span>
        <h2>Sesiones registradas</h2>
      </div>
      <Radar />
    </div>
    <SessionsTable items={items} selected={selected} toggle={toggle} />
    {items.length === 0 ? (
      <p className="empty-copy">Aún no existen sesiones sensoriales.</p>
    ) : null}
    <button
      className="secondary-button"
      disabled={selected.length < 2 || selected.length > 10}
      onClick={compare}
    >
      <GitCompareArrows /> Comparar perfiles ({selected.length})
    </button>
  </section>
);
const ProfilePanel = ({
  profiles,
}: {
  readonly profiles: readonly SensoryProfile[];
}) =>
  profiles.length > 0 ? (
    <section className="quality-panel">
      <div className="quality-panel-heading">
        <div>
          <span className="quality-kicker">Comparación por atributo</span>
          <h2>Perfiles de producto</h2>
        </div>
      </div>
      <SensoryRadar profiles={profiles} />
    </section>
  ) : null;

export const SensorySessionsView = (props: {
  readonly items: readonly SensorySessionItem[];
  readonly selected: readonly string[];
  readonly profiles: readonly SensoryProfile[];
  readonly error?: string;
  readonly toggle: (id: string, checked: boolean) => void;
  readonly compare: () => void;
}): React.JSX.Element => (
  <div className="page-stack quality-page">
    <header className="page-heading quality-heading">
      <div>
        <p className="eyebrow">Perfil del producto</p>
        <h1>Evaluaciones organolépticas</h1>
        <p>Consulte sesiones finales y compare perfiles entre lotes.</p>
      </div>
      <Link className="primary-button" to="/organoleptico/nueva">
        <Plus /> Nueva sesión
      </Link>
    </header>
    {props.error ? <p className="form-error">{props.error}</p> : null}
    <SessionsPanel {...props} />
    <ProfilePanel profiles={props.profiles} />
  </div>
);
