import { useState, type SyntheticEvent } from 'react';

import type {
  ParameterItem,
  PiscoTypeItem,
  ProcessStageItem,
  StandardItem,
} from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import { useAuth } from '../auth/useAuth.js';
import { createStandard } from './standards-api.js';
import { standardInputFrom } from './standard-form-input.js';

const today = new Date().toISOString().slice(0, 10);

const ContextFields = ({
  piscoTypes,
  stages,
}: {
  readonly piscoTypes: readonly PiscoTypeItem[];
  readonly stages: readonly ProcessStageItem[];
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
      Etapa del proceso
      <select name="stageId" defaultValue="">
        <option value="">Todas las etapas</option>
        {stages.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  </>
);

const ParameterField = ({
  parameters,
}: {
  readonly parameters: readonly ParameterItem[];
}): React.JSX.Element => (
  <label>
    Parámetro
    <select name="parameterId" required defaultValue="">
      <option value="" disabled>
        Seleccione un parámetro
      </option>
      {parameters.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  </label>
);

const LimitFields = (): React.JSX.Element => (
  <>
    <label>
      Mínimo
      <input name="minValue" type="number" step="any" />
    </label>
    <label>
      Máximo
      <input name="maxValue" type="number" step="any" />
    </label>
    <label>
      Valor objetivo
      <input name="targetValue" type="number" step="any" />
    </label>
    <p className="field-help form-span">
      Defina al menos un límite o valor objetivo.
    </p>
  </>
);

const ValidityFields = (): React.JSX.Element => (
  <>
    <label>
      Vigente desde
      <input name="validFrom" type="date" required defaultValue={today} />
    </label>
    <label>
      Vigente hasta
      <input name="validTo" type="date" />
    </label>
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
    <label className="checkbox-field form-span">
      <input name="isProvisional" type="checkbox" defaultChecked />
      Marcar como provisional hasta confirmar los rangos con la empresa
    </label>
  </>
);

const useStandardForm = (added: (item: StandardItem) => void) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError(undefined);
    try {
      added(await createStandard(request, standardInputFrom(form)));
      form.reset();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
};

export const StandardForm = ({
  parameters,
  piscoTypes,
  stages,
  added,
}: {
  readonly parameters: readonly ParameterItem[];
  readonly piscoTypes: readonly PiscoTypeItem[];
  readonly stages: readonly ProcessStageItem[];
  readonly added: (item: StandardItem) => void;
}): React.JSX.Element => {
  const form = useStandardForm(added);
  return (
    <form className="admin-form" onSubmit={(event) => void form.submit(event)}>
      {form.error ? <p className="form-error form-span">{form.error}</p> : null}
      <ParameterField parameters={parameters} />
      <ContextFields piscoTypes={piscoTypes} stages={stages} />
      <LimitFields />
      <ValidityFields />
      <button className="primary-button form-span" disabled={form.busy}>
        {form.busy ? 'Guardando…' : 'Crear nueva versión del estándar'}
      </button>
    </form>
  );
};
