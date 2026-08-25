import { useState, type SyntheticEvent } from 'react';

import type { PiscoTypeItem, SensoryThresholdItem } from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import { useAuth } from '../auth/useAuth.js';
import { createSensoryThreshold } from './standards-api.js';
import { thresholdInputFrom } from './standard-form-input.js';

const today = new Date().toISOString().slice(0, 10);

const SeverityAndNormFields = (): React.JSX.Element => (
  <>
    <label>
      Severidad predeterminada
      <select name="defaultSeverity" defaultValue="MODERADA">
        <option value="LEVE">Leve</option>
        <option value="MODERADA">Moderada</option>
        <option value="CRITICA">Crítica</option>
      </select>
    </label>
    <label>
      Norma o fuente
      <input name="referenceNorm" maxLength={160} />
    </label>
  </>
);

const ThresholdFields = ({
  piscoTypes,
}: {
  readonly piscoTypes: readonly PiscoTypeItem[];
}): React.JSX.Element => (
  <>
    <label>
      Tipo de pisco
      <select name="piscoTypeId" defaultValue="">
        <option value="">Todos los tipos</option>
        {piscoTypes.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
    <label>
      Promedio mínimo (1 a 5)
      <input
        name="minAverage"
        type="number"
        min="1"
        max="5"
        step="0.01"
        required
      />
    </label>
    <SeverityAndNormFields />
  </>
);

const ThresholdValidityFields = (): React.JSX.Element => (
  <>
    <label>
      Vigente desde
      <input name="validFrom" type="date" required defaultValue={today} />
    </label>
    <label>
      Vigente hasta
      <input name="validTo" type="date" />
    </label>
    <label className="checkbox-field form-span">
      <input name="isProvisional" type="checkbox" defaultChecked />
      Marcar como provisional hasta confirmar el umbral con la empresa
    </label>
  </>
);

const useThresholdForm = (added: (item: SensoryThresholdItem) => void) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError(undefined);
    try {
      added(await createSensoryThreshold(request, thresholdInputFrom(form)));
      form.reset();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
};

export const ThresholdForm = ({
  piscoTypes,
  added,
}: {
  readonly piscoTypes: readonly PiscoTypeItem[];
  readonly added: (item: SensoryThresholdItem) => void;
}): React.JSX.Element => {
  const form = useThresholdForm(added);
  return (
    <form className="admin-form" onSubmit={(event) => void form.submit(event)}>
      {form.error ? <p className="form-error form-span">{form.error}</p> : null}
      <ThresholdFields piscoTypes={piscoTypes} />
      <ThresholdValidityFields />
      <button className="primary-button form-span" disabled={form.busy}>
        {form.busy ? 'Guardando…' : 'Crear umbral sensorial'}
      </button>
    </form>
  );
};
