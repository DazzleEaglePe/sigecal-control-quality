import { useState, type SyntheticEvent } from 'react';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
import {
  CreateBatchRequestSchema,
  type CreateBatchRequest,
  type GrapeVarietyItem,
  type PiscoTypeItem,
} from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { useAuth } from '../auth/useAuth.js';
import { createBatch } from './batches-api.js';
import type { BatchMasters } from './useBatches.js';

const inputValue = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};
const compositionFrom = (
  form: FormData,
  selected: readonly string[],
): CreateBatchRequest['varieties'] => {
  const percentages = selected.map((id) =>
    inputValue(form, `percentage-${id}`),
  );
  const reported = percentages.some(Boolean);
  return selected.map((varietyId, index) => ({
    varietyId,
    ...(reported ? { percentage: Number(percentages[index]) } : {}),
  }));
};
const requestFrom = (form: FormData, selected: readonly string[]): unknown => ({
  piscoTypeId: inputValue(form, 'piscoTypeId'),
  varieties: compositionFrom(form, selected),
  startDate: inputValue(form, 'startDate'),
  volumeLiters: Number(inputValue(form, 'volumeLiters')),
  harvestOrigin: inputValue(form, 'harvestOrigin') || undefined,
  notes: inputValue(form, 'notes') || undefined,
});
const ruleMessage = (code: string | undefined, count: number) => {
  if (code === 'PURO' && count !== 1)
    return 'Un pisco puro requiere exactamente una variedad.';
  if (code === 'ACHOLADO' && count < 2)
    return 'Un pisco acholado requiere al menos dos variedades.';
  return undefined;
};

interface SubmitContext {
  readonly request: AuthorizedRequest;
  readonly navigate: NavigateFunction;
  readonly type: PiscoTypeItem | undefined;
  readonly selected: readonly string[];
  readonly setBusy: (value: boolean) => void;
  readonly setError: (value: string | undefined) => void;
}
const submitBatch = async (
  event: SyntheticEvent<HTMLFormElement>,
  context: SubmitContext,
): Promise<void> => {
  event.preventDefault();
  const businessError = ruleMessage(
    context.type?.code,
    context.selected.length,
  );
  const parsed = CreateBatchRequestSchema.safeParse(
    requestFrom(new FormData(event.currentTarget), context.selected),
  );
  if (businessError || !parsed.success) {
    context.setError(
      businessError ??
        parsed.error?.issues[0]?.message ??
        'Revise el formulario.',
    );
    return;
  }
  context.setBusy(true);
  context.setError(undefined);
  try {
    const batch = await createBatch(context.request, parsed.data);
    void context.navigate(`/lotes/${batch.id}`, { replace: true });
  } catch (cause) {
    context.setError(errorMessage(cause));
  } finally {
    context.setBusy(false);
  }
};

const TypeField = ({
  types,
  typeId,
  selectType,
}: {
  readonly types: readonly PiscoTypeItem[];
  readonly typeId: string;
  readonly selectType: (id: string) => void;
}) => (
  <label>
    Tipo de pisco
    <select
      name="piscoTypeId"
      required
      value={typeId}
      onChange={(event) => {
        selectType(event.target.value);
      }}
    >
      {types.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  </label>
);

const ProductionFields = () => (
  <>
    <label>
      Fecha de inicio
      <input name="startDate" type="date" required />
    </label>
    <label>
      Volumen inicial (L)
      <input
        name="volumeLiters"
        type="number"
        min="0.001"
        step="0.001"
        required
      />
    </label>
    <label>
      Origen de cosecha
      <input
        name="harvestOrigin"
        maxLength={200}
        placeholder="Fundo, valle o proveedor"
      />
    </label>
  </>
);

const VarietyOption = ({
  item,
  checked,
  toggle,
}: {
  readonly item: GrapeVarietyItem;
  readonly checked: boolean;
  readonly toggle: (id: string) => void;
}) => (
  <label className={`variety-option ${checked ? 'is-selected' : ''}`}>
    <span>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {
          toggle(item.id);
        }}
      />{' '}
      {item.name}
    </span>
    <input
      aria-label={`Porcentaje de ${item.name}`}
      name={`percentage-${item.id}`}
      type="number"
      min="0.01"
      max="100"
      step="0.01"
      placeholder="%"
      disabled={!checked}
    />
  </label>
);

const VarietyFields = ({
  items,
  selected,
  toggle,
}: {
  readonly items: readonly GrapeVarietyItem[];
  readonly selected: readonly string[];
  readonly toggle: (id: string) => void;
}) => (
  <fieldset className="variety-selector form-span">
    <legend>Composición de uvas</legend>
    <p className="field-help">
      Los porcentajes son opcionales; si informa uno, todos deben sumar 100%.
    </p>
    <div className="variety-grid">
      {items.map((item) => {
        const checked = selected.includes(item.id);
        return (
          <VarietyOption
            key={item.id}
            item={item}
            checked={checked}
            toggle={toggle}
          />
        );
      })}
    </div>
  </fieldset>
);

const useBatchFormState = (masters: BatchMasters) => {
  const { request } = useAuth();
  const navigate = useNavigate();
  const types = masters.piscoTypes.filter((item) => item.isActive);
  const varieties = masters.varieties.filter((item) => item.isActive);
  const [chosenType, setChosenType] = useState('');
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const typeId = chosenType !== '' ? chosenType : (types[0]?.id ?? '');
  const toggle = (id: string): void => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    void submitBatch(event, {
      request,
      navigate,
      selected,
      setBusy,
      setError,
      type: types.find((item) => item.id === typeId),
    });
  };
  return {
    types,
    varieties,
    typeId,
    selected,
    busy,
    error,
    setChosenType,
    toggle,
    submit,
  };
};

export const BatchForm = ({ masters }: { readonly masters: BatchMasters }) => {
  const form = useBatchFormState(masters);
  return (
    <form className="admin-form batch-form" onSubmit={form.submit}>
      {form.error ? (
        <p className="form-error form-span" role="alert">
          {form.error}
        </p>
      ) : null}
      <TypeField
        types={form.types}
        typeId={form.typeId}
        selectType={form.setChosenType}
      />
      <ProductionFields />
      <VarietyFields
        items={form.varieties}
        selected={form.selected}
        toggle={form.toggle}
      />
      <label className="form-span">
        Notas
        <textarea name="notes" maxLength={500} rows={3} />
      </label>
      <div className="form-actions form-span">
        <button className="primary-button" type="submit" disabled={form.busy}>
          {form.busy ? 'Creando lote…' : 'Crear lote y abrir primera etapa'}
        </button>
      </div>
    </form>
  );
};
