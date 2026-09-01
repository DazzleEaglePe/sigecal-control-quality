import type { SyntheticEvent } from 'react';
import type {
  SensoryPanelistOption,
  SensoryPreparation,
  SensorySessionItem,
} from '@sigecal/shared';
import type { PanelistDraft } from './sensory-form-state.js';
import {
  SensoryMetaSection,
  SensoryNotesSection,
  SensorySummary,
} from './SensoryFormSections.js';
import { SensoryMatrixSection } from './SensoryMatrixSection.js';
import { SensoryPanelSection } from './SensoryPanelSection.js';
import { useSensoryForm } from './useSensoryForm.js';

export interface SensoryFormValue {
  readonly sessionDate: string;
  readonly panelists: readonly PanelistDraft[];
  readonly defectsFound: string;
  readonly notes: string;
  readonly reason?: string;
}
interface Props {
  readonly preparation: SensoryPreparation;
  readonly options: readonly SensoryPanelistOption[];
  readonly initial?: SensorySessionItem;
  readonly saving: boolean;
  readonly submit: (value: SensoryFormValue) => void;
}

export const SensoryForm = ({
  preparation,
  options,
  initial,
  saving,
  submit,
}: Props): React.JSX.Element => {
  const form = useSensoryForm(preparation, initial);
  const submitForm = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(form.value());
  };
  return (
    <form className="sensory-form" onSubmit={submitForm}>
      <SensoryMetaSection form={form} preparation={preparation} />
      <SensoryPanelSection form={form} options={options} />
      <SensoryMatrixSection form={form} preparation={preparation} />
      <SensorySummary
        average={form.average}
        threshold={preparation.threshold.minAverage}
      />
      <SensoryNotesSection form={form} correcting={Boolean(initial)} />
      <button className="primary-button" disabled={!form.ready || saving}>
        {saving
          ? 'Guardando…'
          : initial
            ? 'Crear versión corregida'
            : 'Finalizar sesión'}
      </button>
    </form>
  );
};
