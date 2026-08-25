import { useState } from 'react';

import type {
  ParameterItem,
  PiscoTypeItem,
  ProcessStageItem,
  SensoryThresholdItem,
  StandardItem,
} from '@sigecal/shared';

import { useAuth } from '../features/auth/useAuth.js';
import { StandardForm } from '../features/masters/StandardForm.js';
import {
  StandardsTable,
  ThresholdsTable,
} from '../features/masters/StandardsTables.js';
import { ThresholdForm } from '../features/masters/ThresholdForm.js';
import {
  useMasterReferences,
  useStandardHistory,
  useThresholdHistory,
} from '../features/masters/useStandardsData.js';

const activeOnly = <Item extends { readonly isActive: boolean }>(
  items: readonly Item[],
): readonly Item[] => items.filter((item) => item.isActive);

const StandardsHeader = (): React.JSX.Element => (
  <header className="page-heading">
    <div>
      <p className="eyebrow">Configuración de calidad</p>
      <h1>Estándares y umbrales</h1>
      <p>
        Versione límites técnicos y preserve qué regla estuvo vigente en cada
        fecha.
      </p>
    </div>
  </header>
);

interface StandardPanelsProps {
  readonly parameters: readonly ParameterItem[];
  readonly piscoTypes: readonly PiscoTypeItem[];
  readonly stages: readonly ProcessStageItem[];
  readonly parameterId: string;
  readonly items: readonly StandardItem[];
  readonly error: string | undefined;
  readonly selected: (id: string) => void;
  readonly added: (item: StandardItem) => void;
}

const StandardPanels = (props: StandardPanelsProps): React.JSX.Element => (
  <>
    <section className="admin-panel">
      <h2>Nueva versión de estándar</h2>
      <p className="section-copy">
        Una versión nueva cierra automáticamente la anterior que se superponga.
      </p>
      <StandardForm
        parameters={props.parameters}
        piscoTypes={activeOnly(props.piscoTypes)}
        stages={activeOnly(props.stages)}
        added={props.added}
      />
    </section>
    <section className="admin-panel">
      <div className="section-heading">
        <h2>Historial por parámetro</h2>
        <select
          className="filter-select"
          value={props.parameterId}
          onChange={(event) => {
            props.selected(event.target.value);
          }}
        >
          {props.parameters.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      {props.error ? <p className="form-error">{props.error}</p> : null}
      <StandardsTable
        items={props.items}
        piscoTypes={props.piscoTypes}
        stages={props.stages}
      />
    </section>
  </>
);

const ThresholdPanels = ({
  items,
  piscoTypes,
  error,
  added,
}: {
  readonly items: readonly SensoryThresholdItem[];
  readonly piscoTypes: readonly PiscoTypeItem[];
  readonly error: string | undefined;
  readonly added: (item: SensoryThresholdItem) => void;
}): React.JSX.Element => (
  <>
    <section className="admin-panel">
      <h2>Nuevo umbral organoléptico</h2>
      <p className="section-copy">
        El umbral califica el producto; no puntúa ni compara panelistas.
      </p>
      <ThresholdForm piscoTypes={activeOnly(piscoTypes)} added={added} />
    </section>
    <section className="admin-panel">
      <h2>Historial de umbrales</h2>
      {error ? <p className="form-error">{error}</p> : null}
      <ThresholdsTable items={items} piscoTypes={piscoTypes} />
    </section>
  </>
);

export const StandardsPage = (): React.JSX.Element => {
  const { request } = useAuth();
  const [selectedParameter, setSelectedParameter] = useState('');
  const masterData = useMasterReferences(request);
  const activeParameters = activeOnly(masterData.references.parameters);
  const parameterId =
    selectedParameter === ''
      ? (activeParameters[0]?.id ?? '')
      : selectedParameter;
  const standards = useStandardHistory(request, parameterId);
  const thresholds = useThresholdHistory(request);
  const addedStandard = (item: StandardItem): void => {
    setSelectedParameter(item.parameterId);
    standards.add(item);
  };
  return (
    <div className="page-stack">
      <StandardsHeader />
      {masterData.error ? (
        <p className="form-error">{masterData.error}</p>
      ) : null}
      <StandardPanels
        parameters={activeParameters}
        piscoTypes={masterData.references.piscoTypes}
        stages={masterData.references.stages}
        parameterId={parameterId}
        items={standards.items}
        error={standards.error}
        selected={setSelectedParameter}
        added={addedStandard}
      />
      <ThresholdPanels
        items={thresholds.items}
        piscoTypes={masterData.references.piscoTypes}
        error={thresholds.error}
        added={thresholds.add}
      />
    </div>
  );
};
