import type { SyntheticEvent } from 'react';
import { BarChart3 } from 'lucide-react';

import type {
  AnalysisSelection,
  useAnalysisMasters,
} from './usePhysChemAnalysis.js';

type Masters = ReturnType<typeof useAnalysisMasters>['data'];
interface FilterProps {
  readonly selection: AnalysisSelection;
  readonly update: (
    key: keyof AnalysisSelection,
    value: string | boolean,
  ) => void;
}

const ParameterFilter = ({
  selection,
  update,
  items,
}: FilterProps & {
  readonly items: Masters['parameters'];
}): React.JSX.Element => (
  <label>
    Parámetro
    <select
      required
      value={selection.parameterId}
      onChange={(event) => {
        update('parameterId', event.target.value);
      }}
    >
      <option value="">Seleccione</option>
      {items
        .filter((item) => item.type === 'FISICOQUIMICO')
        .map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
    </select>
  </label>
);

const EntityFilter = ({
  label,
  field,
  value,
  items,
  update,
}: {
  readonly label: string;
  readonly field: 'piscoTypeId' | 'stageId';
  readonly value: string;
  readonly items: readonly { readonly id: string; readonly name: string }[];
  readonly update: FilterProps['update'];
}): React.JSX.Element => (
  <label>
    {label}
    <select
      required
      value={value}
      onChange={(event) => {
        update(field, event.target.value);
      }}
    >
      <option value="">Seleccione</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  </label>
);

export interface AnalysisFiltersProps {
  readonly selection: AnalysisSelection;
  readonly setSelection: (value: AnalysisSelection) => void;
  readonly masters: Masters;
  readonly canIncludeDemo: boolean;
  readonly submit: () => void;
}

const FilterFields = ({
  props,
  update,
}: {
  readonly props: AnalysisFiltersProps;
  readonly update: FilterProps['update'];
}): React.JSX.Element => (
  <>
    <ParameterFilter
      selection={props.selection}
      update={update}
      items={props.masters.parameters}
    />
    <EntityFilter
      label="Tipo de pisco"
      field="piscoTypeId"
      value={props.selection.piscoTypeId}
      items={props.masters.piscoTypes}
      update={update}
    />
    <EntityFilter
      label="Etapa"
      field="stageId"
      value={props.selection.stageId}
      items={props.masters.stages}
      update={update}
    />
  </>
);

const DemoFilter = ({
  selection,
  update,
}: Pick<AnalysisFiltersProps, 'selection'> & {
  readonly update: FilterProps['update'];
}): React.JSX.Element => (
  <label className="demo-check">
    <input
      type="checkbox"
      checked={selection.includeDemo}
      onChange={(event) => {
        update('includeDemo', event.target.checked);
      }}
    />{' '}
    Incluir demostración
  </label>
);

export const AnalysisFilters = (
  props: AnalysisFiltersProps,
): React.JSX.Element => {
  const send = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    props.submit();
  };
  const update = (
    key: keyof AnalysisSelection,
    value: string | boolean,
  ): void => {
    props.setSelection({ ...props.selection, [key]: value });
  };
  return (
    <form className="quality-filters analysis-filters" onSubmit={send}>
      <FilterFields props={props} update={update} />
      {props.canIncludeDemo ? (
        <DemoFilter selection={props.selection} update={update} />
      ) : null}
      <button className="primary-button" type="submit">
        <BarChart3 /> Analizar
      </button>
    </form>
  );
};
