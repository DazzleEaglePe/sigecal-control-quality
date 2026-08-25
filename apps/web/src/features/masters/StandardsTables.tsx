import type {
  PiscoTypeItem,
  ProcessStageItem,
  SensoryThresholdItem,
  StandardItem,
} from '@sigecal/shared';

const severityLabels = {
  LEVE: 'Leve',
  MODERADA: 'Moderada',
  CRITICA: 'Crítica',
} as const;

const findName = (
  items: readonly { readonly id: string; readonly name: string }[],
  id: string | null,
  fallback: string,
): string => items.find((item) => item.id === id)?.name ?? fallback;

const limits = (item: StandardItem): string => {
  const values = [
    item.minValue === null ? undefined : `mín. ${item.minValue}`,
    item.maxValue === null ? undefined : `máx. ${item.maxValue}`,
    item.targetValue === null ? undefined : `objetivo ${item.targetValue}`,
  ];
  return values.filter((value) => value !== undefined).join(' · ');
};

const StandardRow = ({
  item,
  piscoTypes,
  stages,
}: {
  readonly item: StandardItem;
  readonly piscoTypes: readonly PiscoTypeItem[];
  readonly stages: readonly ProcessStageItem[];
}): React.JSX.Element => (
  <tr>
    <td>
      <strong>{limits(item)}</strong>
      <small>{item.referenceNorm ?? 'Fuente pendiente'}</small>
    </td>
    <td>
      {findName(piscoTypes, item.piscoTypeId, 'Todos')}
      <small>{findName(stages, item.stageId, 'Todas las etapas')}</small>
    </td>
    <td>
      {item.validFrom}
      <small>
        {item.validTo ? `hasta ${item.validTo}` : 'sin fecha final'}
      </small>
    </td>
    <td>
      <span className={`state-pill ${item.isActive ? 'is-active' : ''}`}>
        {item.isActive ? 'Vigente' : 'Cerrado'}
      </span>
      {item.isProvisional ? (
        <span className="state-pill is-provisional">Provisional</span>
      ) : null}
      <small>{severityLabels[item.defaultSeverity]}</small>
    </td>
  </tr>
);

export const StandardsTable = ({
  items,
  piscoTypes,
  stages,
}: {
  readonly items: readonly StandardItem[];
  readonly piscoTypes: readonly PiscoTypeItem[];
  readonly stages: readonly ProcessStageItem[];
}): React.JSX.Element => (
  <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Límites</th>
          <th>Alcance</th>
          <th>Vigencia</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <StandardRow
            key={item.id}
            item={item}
            piscoTypes={piscoTypes}
            stages={stages}
          />
        ))}
      </tbody>
    </table>
    {items.length === 0 ? (
      <p className="empty-copy">No existen versiones para este parámetro.</p>
    ) : null}
  </div>
);

const ThresholdRow = ({
  item,
  piscoTypes,
}: {
  readonly item: SensoryThresholdItem;
  readonly piscoTypes: readonly PiscoTypeItem[];
}): React.JSX.Element => (
  <tr>
    <td>
      <strong>{findName(piscoTypes, item.piscoTypeId, 'Todos')}</strong>
      <small>{item.referenceNorm ?? 'Fuente pendiente'}</small>
    </td>
    <td>
      {item.minAverage}
      <small>{severityLabels[item.defaultSeverity]}</small>
    </td>
    <td>
      {item.validFrom}
      <small>
        {item.validTo ? `hasta ${item.validTo}` : 'sin fecha final'}
      </small>
    </td>
    <td>
      <span className={`state-pill ${item.isActive ? 'is-active' : ''}`}>
        {item.isActive ? 'Vigente' : 'Cerrado'}
      </span>
      {item.isProvisional ? (
        <span className="state-pill is-provisional">Provisional</span>
      ) : null}
    </td>
  </tr>
);

export const ThresholdsTable = ({
  items,
  piscoTypes,
}: {
  readonly items: readonly SensoryThresholdItem[];
  readonly piscoTypes: readonly PiscoTypeItem[];
}): React.JSX.Element => (
  <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Tipo de pisco</th>
          <th>Promedio mínimo</th>
          <th>Vigencia</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <ThresholdRow key={item.id} item={item} piscoTypes={piscoTypes} />
        ))}
      </tbody>
    </table>
    {items.length === 0 ? (
      <p className="empty-copy">No hay umbrales registrados.</p>
    ) : null}
  </div>
);
