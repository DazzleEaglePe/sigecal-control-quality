import type { BatchMasters } from './useBatches.js';
import {
  ProductionFields,
  TypeField,
  VarietyFields,
} from './BatchFormFields.js';
import { useBatchFormState } from './useBatchFormState.js';

const FormErrorNotice = ({
  error,
}: {
  readonly error?: string | undefined;
}): React.JSX.Element | null =>
  error ? (
    <p className="form-error form-span" role="alert">
      {error}
    </p>
  ) : null;

export const BatchForm = ({
  masters,
}: {
  readonly masters: BatchMasters;
}): React.JSX.Element => {
  const form = useBatchFormState(masters);
  return (
    <form
      className="admin-form batch-form"
      noValidate
      onChange={form.change}
      onSubmit={form.submit}
    >
      <FormErrorNotice error={form.error} />
      <TypeField
        types={form.types}
        typeId={form.typeId}
        selectType={form.setChosenType}
        issue={form.issues.piscoTypeId}
      />
      <ProductionFields issues={form.issues} />
      <VarietyFields
        items={form.varieties}
        selected={form.selected}
        toggle={form.toggle}
        issue={form.issues.varieties}
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
