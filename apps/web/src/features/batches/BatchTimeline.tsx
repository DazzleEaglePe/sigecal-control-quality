import type { BatchTimelineEntry } from '@sigecal/shared';

import {
  inspectionStatusLabel,
  inspectionTypeLabel,
  localDateTime,
  ncStatusLabel,
  severityLabel,
} from './batches-labels.js';

const stageState = {
  COMPLETED: 'Completada',
  CURRENT: 'Actual',
  PENDING: 'Pendiente',
} as const;

const TimelineStage = ({ entry }: { readonly entry: BatchTimelineEntry }) => (
  <li className={`timeline-${entry.state.toLowerCase()}`}>
    <span className="timeline-sequence">{entry.stage.sequence}</span>
    <div className="timeline-content">
      <div className="timeline-heading">
        <h3>{entry.stage.name}</h3>
        <span className="state-pill">{stageState[entry.state]}</span>
      </div>
      {entry.startedAt ? (
        <p>
          {localDateTime(entry.startedAt)}
          {entry.responsible
            ? ` · ${entry.responsible.firstName} ${entry.responsible.lastName}`
            : ''}
        </p>
      ) : (
        <p>Aún no iniciada</p>
      )}
      {entry.observations ? (
        <p className="timeline-note">{entry.observations}</p>
      ) : null}
      {entry.inspections.length > 0 ? (
        <small>{entry.inspections.length} inspección(es)</small>
      ) : null}
      {entry.nonConformities.length > 0 ? (
        <small>{entry.nonConformities.length} no conformidad(es)</small>
      ) : null}
    </div>
  </li>
);

export const BatchTimeline = ({
  entries,
}: {
  readonly entries: readonly BatchTimelineEntry[];
}): React.JSX.Element => (
  <ol className="process-timeline">
    {entries.map((entry) => (
      <TimelineStage entry={entry} key={entry.stage.id} />
    ))}
  </ol>
);

export const BatchInspections = ({
  entries,
}: {
  readonly entries: readonly BatchTimelineEntry[];
}): React.JSX.Element => {
  const inspections = entries.flatMap((entry) =>
    entry.inspections.map((item) => ({ ...item, stage: entry.stage.name })),
  );
  if (inspections.length === 0)
    return <p className="empty-copy">El lote aún no tiene inspecciones.</p>;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Etapa</th>
            <th>Tipo</th>
            <th>Programada</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {inspections.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.code}</strong>
              </td>
              <td>{item.stage}</td>
              <td>{inspectionTypeLabel[item.type]}</td>
              <td>{localDateTime(item.scheduledDate)}</td>
              <td>{inspectionStatusLabel[item.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const BatchNonConformities = ({
  entries,
}: {
  readonly entries: readonly BatchTimelineEntry[];
}): React.JSX.Element => {
  const items = entries.flatMap((entry) =>
    entry.nonConformities.map((item) => ({ ...item, stage: entry.stage.name })),
  );
  if (items.length === 0)
    return <p className="empty-copy">El lote no registra no conformidades.</p>;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Etapa</th>
            <th>Severidad</th>
            <th>Estado</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.code}</strong>
              </td>
              <td>{item.stage}</td>
              <td>{severityLabel[item.severity]}</td>
              <td>{ncStatusLabel[item.status]}</td>
              <td>{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
