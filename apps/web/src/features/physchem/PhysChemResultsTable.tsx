import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { PhysChemResultItem } from '@sigecal/shared';

const resultLabel = {
  CONFORME: 'Conforme',
  NO_CONFORME: 'No conforme',
  ANULADO: 'Anulado',
} as const;
const resultDate = (value: string): string =>
  new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeZone: 'America/Lima',
  }).format(new Date(value));

const ResultIdentity = ({
  item,
}: {
  readonly item: PhysChemResultItem;
}): React.JSX.Element => (
  <>
    <td>{resultDate(item.recordedAt)}</td>
    <td>
      <strong>{item.batch.code}</strong>
      <small>{item.inspection.code}</small>
    </td>
    <td>
      <strong>{item.parameter.name}</strong>
      <small>{item.parameter.unit ?? 'Sin unidad'}</small>
    </td>
  </>
);

const StandardCell = ({
  item,
}: {
  readonly item: PhysChemResultItem;
}): React.JSX.Element => (
  <td>
    <small>
      {item.standard.minValue ?? '—'} a {item.standard.maxValue ?? '—'}
    </small>
    <strong>{item.standard.referenceNorm ?? 'Referencia interna'}</strong>
  </td>
);

const StatusCell = ({
  item,
}: {
  readonly item: PhysChemResultItem;
}): React.JSX.Element => (
  <td>
    <span className={`result-pill result-${item.status.toLowerCase()}`}>
      {item.status === 'CONFORME' ? <CheckCircle2 /> : <AlertTriangle />}
      {resultLabel[item.status]}
    </span>
  </td>
);

const ResultRow = ({
  item,
}: {
  readonly item: PhysChemResultItem;
}): React.JSX.Element => (
  <tr>
    <ResultIdentity item={item} />
    <td>
      <strong>{item.value}</strong>
    </td>
    <StandardCell item={item} />
    <StatusCell item={item} />
    <td>
      {item.nonConformity ? (
        <span className="nc-reference">{item.nonConformity.code}</span>
      ) : (
        '—'
      )}
    </td>
  </tr>
);

const ResultsHead = (): React.JSX.Element => (
  <thead>
    <tr>
      <th>Fecha</th>
      <th>Lote / inspección</th>
      <th>Parámetro</th>
      <th>Valor</th>
      <th>Estándar aplicado</th>
      <th>Estado</th>
      <th>No conformidad</th>
    </tr>
  </thead>
);

export const PhysChemResultsTable = ({
  items,
}: {
  readonly items: readonly PhysChemResultItem[];
}): React.JSX.Element => {
  if (items.length === 0)
    return <p className="quality-empty">No hay resultados para mostrar.</p>;
  return (
    <div className="table-scroll quality-table-wrap">
      <table className="quality-table physchem-results-table">
        <ResultsHead />
        <tbody>
          {items.map((item) => (
            <ResultRow item={item} key={item.id} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
