import {
  CalendarDays,
  CircleUserRound,
  FlaskConical,
  Gauge,
  Wrench,
} from 'lucide-react';
import type { InspectionItem } from '@sigecal/shared';

import {
  inspectionStatusLabel,
  inspectionTypeLabel,
  limaDateTime,
  statusClass,
} from './inspection-labels.js';

interface Props {
  readonly inspection: InspectionItem;
}

const Detail = ({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: typeof CalendarDays;
  readonly label: string;
  readonly value: string;
}): React.JSX.Element => (
  <div className="inspection-detail-item">
    <span>
      <Icon />
    </span>
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  </div>
);

const OverviewHeader = ({ inspection }: Props): React.JSX.Element => (
  <div className="inspection-overview-top">
    <div>
      <span className="quality-kicker">
        {inspection.dataOrigin === 'DEMO'
          ? 'Datos de demostración'
          : 'Datos reales'}
      </span>
      <h2>{inspection.code}</h2>
      <p>
        {inspection.batch.code} · {inspection.stage.name}
      </p>
    </div>
    <span className={statusClass(inspection.status)}>
      {inspectionStatusLabel[inspection.status]}
    </span>
  </div>
);

const DetailGrid = ({ inspection }: Props): React.JSX.Element => (
  <div className="inspection-detail-grid">
    <Detail
      icon={CalendarDays}
      label="Programación"
      value={limaDateTime(inspection.scheduledDate)}
    />
    <Detail
      icon={CircleUserRound}
      label="Responsable"
      value={`${inspection.responsible.firstName} ${inspection.responsible.lastName}`}
    />
    <Detail
      icon={FlaskConical}
      label="Tipo"
      value={inspectionTypeLabel[inspection.type]}
    />
    <Detail
      icon={Wrench}
      label="Equipo"
      value={
        inspection.equipment
          ? `${inspection.equipment.name} · ${inspection.equipment.status}`
          : 'Sin equipo asignado'
      }
    />
  </div>
);

const progressOf = (inspection: InspectionItem): number =>
  inspection.parameters.length === 0
    ? 0
    : Math.round(
        (inspection.recordedParameterIds.length /
          inspection.parameters.length) *
          100,
      );

const Coverage = ({ inspection }: Props): React.JSX.Element => {
  const progress = progressOf(inspection);
  return (
    <div className="inspection-progress">
      <div>
        <span>
          <Gauge /> Cobertura de resultados
        </span>
        <strong>{progress}%</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${String(progress)}%` }} />
      </div>
      <small>
        {inspection.recordedParameterIds.length} de{' '}
        {inspection.parameters.length} parámetros con resultado vigente
      </small>
    </div>
  );
};

const ExpectedParameters = ({ inspection }: Props): React.JSX.Element => (
  <div className="expected-parameters">
    <h3>Parámetros esperados</h3>
    <div>
      {inspection.parameters.map((parameter) => (
        <span
          className={
            inspection.recordedParameterIds.includes(parameter.id)
              ? 'is-recorded'
              : ''
          }
          key={parameter.id}
        >
          {parameter.name}
          <small>{parameter.unit ?? 'Sin unidad'}</small>
        </span>
      ))}
    </div>
  </div>
);

export const InspectionOverview = ({
  inspection,
}: Props): React.JSX.Element => (
  <section className="quality-panel inspection-overview">
    <OverviewHeader inspection={inspection} />
    <DetailGrid inspection={inspection} />
    <Coverage inspection={inspection} />
    <ExpectedParameters inspection={inspection} />
    {inspection.notes ? (
      <div className="quality-note">
        <strong>Nota operativa</strong>
        <p>{inspection.notes}</p>
      </div>
    ) : null}
  </section>
);
