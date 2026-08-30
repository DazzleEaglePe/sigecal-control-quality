import { BookOpenCheck, History, ShieldAlert } from 'lucide-react';
import type { InspectionDetail } from '@sigecal/shared';

import { formatStandardRange } from '../physchem/physchem-labels.js';

const resultLabel = {
  CONFORME: 'Conforme',
  NO_CONFORME: 'No conforme',
  ANULADO: 'Anulado',
} as const;

type ParameterDetail = InspectionDetail['parameterDetails'][number];

const TraceFacts = ({
  detail,
}: {
  readonly detail: ParameterDetail;
}): React.JSX.Element => {
  const standard = detail.applicableStandard;
  const current = detail.currentResult;
  return (
    <dl>
      <div>
        <dt>Estándar aplicable</dt>
        <dd>
          {standard
            ? `${formatStandardRange(standard)} ${detail.parameter.unit ?? ''}`
            : 'Sin estándar definitivo vigente'}
        </dd>
      </div>
      <div>
        <dt>Resultado vigente</dt>
        <dd>
          {current
            ? `${current.value} ${detail.parameter.unit ?? ''}`
            : 'Pendiente de registro'}
        </dd>
      </div>
    </dl>
  );
};

const ParameterTrace = ({
  detail,
}: {
  readonly detail: ParameterDetail;
}): React.JSX.Element => {
  const current = detail.currentResult;
  return (
    <article className="parameter-trace-card">
      <header>
        <div>
          <strong>{detail.parameter.name}</strong>
          <small>
            {detail.parameter.code} · {detail.parameter.unit ?? 'Sin unidad'}
          </small>
        </div>
        <span
          className={current ? `result-${current.status.toLowerCase()}` : ''}
        >
          {current ? resultLabel[current.status] : 'Sin resultado'}
        </span>
      </header>
      <TraceFacts detail={detail} />
      <footer>
        <span>
          <History /> {detail.history.length} versión(es) conservadas
        </span>
        {detail.applicableStandard?.referenceNorm ? (
          <small>{detail.applicableStandard.referenceNorm}</small>
        ) : null}
      </footer>
    </article>
  );
};

export const InspectionParameterTraceability = ({
  inspection,
}: {
  readonly inspection: InspectionDetail;
}): React.JSX.Element | null => {
  if (inspection.type !== 'FISICOQUIMICO') return null;
  const missing = inspection.parameterDetails.filter(
    (detail) => detail.applicableStandard === null,
  ).length;
  return (
    <section className="quality-panel parameter-traceability">
      <div className="quality-panel-heading">
        <div>
          <span className="quality-kicker">Detalle consolidado</span>
          <h2>Estándares, resultados e historial</h2>
        </div>
        <BookOpenCheck />
      </div>
      {missing > 0 ? (
        <div className="quality-callout is-warning">
          <ShieldAlert />
          <p>
            {missing} parámetro(s) no tienen estándar definitivo aplicable; no
            podrán guardarse hasta completar la configuración.
          </p>
        </div>
      ) : null}
      <div className="parameter-trace-grid">
        {inspection.parameterDetails.map((detail) => (
          <ParameterTrace detail={detail} key={detail.parameter.id} />
        ))}
      </div>
    </section>
  );
};
