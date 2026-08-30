import type { InspectionItem, PhysChemValidation } from '@sigecal/shared';

import type { ExecutionState } from './usePhysChemExecution.js';

const ReviewRow = ({
  inspection,
  item,
}: {
  readonly inspection: InspectionItem;
  readonly item: PhysChemValidation;
}): React.JSX.Element => {
  const parameter = inspection.parameters.find(
    (candidate) => candidate.id === item.parameterId,
  );
  return (
    <div>
      <span>{parameter?.name ?? item.parameterId}</span>
      <strong>
        {String(item.value)} {parameter?.unit ?? ''}
      </strong>
      <span className={`result-${item.status.toLowerCase()}`}>
        {item.status === 'CONFORME' ? 'Conforme' : 'No conforme'}
      </span>
    </div>
  );
};

const ReviewHeader = ({
  nonConforming,
}: {
  readonly nonConforming: number;
}): React.JSX.Element => (
  <header>
    <div>
      <span className="quality-kicker">Confirmación final</span>
      <h3>Revise antes de guardar</h3>
    </div>
    <strong>{nonConforming} NC por generar</strong>
  </header>
);

const ReviewActions = ({
  state,
}: {
  readonly state: ExecutionState;
}): React.JSX.Element => (
  <div className="result-review-actions">
    <button
      type="button"
      className="secondary-button"
      onClick={state.cancelReview}
    >
      Volver a editar
    </button>
    <button
      type="button"
      className="primary-button"
      disabled={state.saving}
      onClick={() => {
        void state.save();
      }}
    >
      {state.saving ? 'Guardando…' : 'Confirmar guardado definitivo'}
    </button>
  </div>
);

export const PhysChemReviewSummary = ({
  inspection,
  state,
}: {
  readonly inspection: InspectionItem;
  readonly state: ExecutionState;
}): React.JSX.Element | null => {
  if (state.review.length === 0) return null;
  const nonConforming = state.review.filter(
    (item) => item.status === 'NO_CONFORME',
  ).length;
  return (
    <div
      className="result-review"
      role="region"
      aria-label="Resumen definitivo"
    >
      <ReviewHeader nonConforming={nonConforming} />
      <div className="result-review-list">
        {state.review.map((item) => (
          <ReviewRow
            inspection={inspection}
            item={item}
            key={item.parameterId}
          />
        ))}
      </div>
      <p>
        Al confirmar, los resultados serán inmutables. Toda corrección
        conservará esta versión en el historial.
      </p>
      <ReviewActions state={state} />
    </div>
  );
};
