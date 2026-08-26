import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import type {
  InspectionItem,
  PhysChemResultItem,
  PhysChemValidation,
} from '@sigecal/shared';

import {
  usePhysChemExecution,
  type ExecutionState,
  type PhysChemExecutionProps,
} from './usePhysChemExecution.js';

const rangeLabel = (validation: PhysChemValidation | undefined): string => {
  if (!validation) return 'Se validará con el estándar vigente';
  const { minValue, maxValue } = validation.standard;
  if (minValue !== null && maxValue !== null)
    return `${minValue} — ${maxValue}`;
  if (minValue !== null) return `Desde ${minValue}`;
  if (maxValue !== null) return `Hasta ${maxValue}`;
  return 'Sin límites configurados';
};

const ResultSummary = ({
  items,
}: {
  readonly items: readonly PhysChemResultItem[];
}): React.JSX.Element | null => {
  if (items.length === 0) return null;
  const nonConformities = items.filter((item) => item.nonConformity);
  return (
    <div className="result-save-summary" role="status">
      <CheckCircle2 aria-hidden="true" />
      <div>
        <strong>Resultados guardados definitivamente</strong>
        <p>
          {items.length} medición(es) registradas. {nonConformities.length} no
          conformidad(es) generadas.
        </p>
      </div>
      <div>
        {nonConformities.map((item) => (
          <span key={item.id}>{item.nonConformity?.code}</span>
        ))}
      </div>
    </div>
  );
};

interface RowProps {
  readonly parameter: InspectionItem['parameters'][number];
  readonly value: string;
  readonly validation: PhysChemValidation | undefined;
  readonly recorded: boolean;
  readonly change: (value: string) => void;
  readonly preview: () => void;
}

const MeasurementInput = (props: RowProps): React.JSX.Element => (
  <label>
    <span className="sr-only">Valor de {props.parameter.name}</span>
    <input
      type="number"
      step="any"
      inputMode="decimal"
      value={props.value}
      disabled={props.recorded}
      placeholder={props.recorded ? 'Registrado' : 'Ingrese valor'}
      onChange={(event) => {
        props.change(event.target.value);
      }}
      onBlur={props.preview}
    />
  </label>
);

const MeasurementStatus = ({
  recorded,
  validation,
}: Pick<RowProps, 'recorded' | 'validation'>): React.JSX.Element => (
  <span
    className={`measurement-status status-${validation?.status.toLowerCase() ?? 'pending'}`}
  >
    {recorded
      ? 'Registrado'
      : validation?.status === 'CONFORME'
        ? 'Conforme'
        : validation?.status === 'NO_CONFORME'
          ? 'No conforme'
          : 'Pendiente'}
  </span>
);

const MeasurementRow = (props: RowProps): React.JSX.Element => (
  <div className={`measurement-row${props.recorded ? ' is-recorded' : ''}`}>
    <div>
      <strong>{props.parameter.name}</strong>
      <small>
        {props.parameter.code} · {props.parameter.unit ?? 'Sin unidad'}
      </small>
    </div>
    <MeasurementInput {...props} />
    <div>
      <small>Rango aplicable</small>
      <strong>
        {rangeLabel(props.validation)} {props.parameter.unit ?? ''}
      </strong>
    </div>
    <MeasurementStatus
      recorded={props.recorded}
      validation={props.validation}
    />
  </div>
);

const ExecutionHeading = (): React.JSX.Element => (
  <>
    <div className="quality-panel-heading">
      <div>
        <span className="quality-kicker">Ejecución en tableta</span>
        <h2>Resultados fisicoquímicos</h2>
      </div>
      <FlaskConical />
    </div>
    <div className="quality-callout">
      <ShieldCheck />
      <p>
        El rango, la conformidad, el estándar, el origen y el autor se
        resolverán en el servidor.
      </p>
    </div>
  </>
);

const MeasurementRows = ({
  inspection,
  state,
}: {
  readonly inspection: InspectionItem;
  readonly state: ExecutionState;
}): React.JSX.Element => (
  <div className="measurement-table">
    {inspection.parameters.map((parameter) => (
      <MeasurementRow
        key={parameter.id}
        parameter={parameter}
        value={state.drafts[parameter.id] ?? ''}
        validation={state.validations[parameter.id]}
        recorded={inspection.recordedParameterIds.includes(parameter.id)}
        change={(value) => {
          state.change(parameter.id, value);
        }}
        preview={() => {
          void state.preview(parameter.id);
        }}
      />
    ))}
  </div>
);

const ExecutionFooter = ({
  inspection,
  state,
}: {
  readonly inspection: InspectionItem;
  readonly state: ExecutionState;
}): React.JSX.Element => (
  <>
    <p>
      {state.error ? (
        <span className="form-error" role="alert">
          <AlertTriangle /> {state.error}
        </span>
      ) : null}
    </p>
    <div className="execution-footer">
      <p>
        <strong>{inspection.recordedParameterIds.length}</strong> de{' '}
        <strong>{inspection.parameters.length}</strong> parámetros registrados
      </p>
      <button className="primary-button" type="submit" disabled={state.saving}>
        {state.saving ? 'Guardando…' : 'Revisar y guardar definitivo'}
      </button>
    </div>
  </>
);

export const PhysChemExecutionForm = (
  props: PhysChemExecutionProps,
): React.JSX.Element => {
  const state = usePhysChemExecution(props);
  return (
    <section className="quality-panel execution-panel">
      <ExecutionHeading />
      <form
        onSubmit={(event) => {
          void state.submit(event);
        }}
      >
        <MeasurementRows inspection={props.inspection} state={state} />
        <ExecutionFooter inspection={props.inspection} state={state} />
      </form>
      <ResultSummary items={state.saved} />
    </section>
  );
};
