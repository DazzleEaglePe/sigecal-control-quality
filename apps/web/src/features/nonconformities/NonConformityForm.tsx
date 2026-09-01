import { useState, type SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreateNonConformityRequestSchema,
  type BatchItem,
} from '@sigecal/shared';

import { NativeSelect } from '../../components/ui/native-select.js';
import { Textarea } from '../../components/ui/textarea.js';
import { errorMessage } from '../admin/admin-ui.js';
import { useAuth } from '../auth/useAuth.js';
import { createNonConformity } from './nonconformities-api.js';
import type { NonConformityMasters } from './useNonConformities.js';

const inputValue = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};
const requestFrom = (form: FormData): unknown => ({
  batchId: inputValue(form, 'batchId'),
  stageId: inputValue(form, 'stageId') || undefined,
  description: inputValue(form, 'description'),
  severity: inputValue(form, 'severity'),
  rootCause: inputValue(form, 'rootCause') || undefined,
  assignedToId: inputValue(form, 'assignedToId') || undefined,
  assignedAreaId: inputValue(form, 'assignedAreaId') || undefined,
});

interface Props {
  readonly batches: readonly BatchItem[];
  readonly masters: NonConformityMasters;
}

const useNonConformityFormState = () => {
  const { request } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const parsed = CreateNonConformityRequestSchema.safeParse(
      requestFrom(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revise el formulario.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const created = await createNonConformity(request, parsed.data);
      void navigate(`/no-conformidades/${created.id}`, { replace: true });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
};

const BatchAndStageFields = ({
  batches,
  masters,
}: Props): React.JSX.Element => (
  <>
    <label>
      Lote
      <NativeSelect name="batchId" required>
        <option value="">Seleccione un lote</option>
        {batches.map((batch) => (
          <option key={batch.id} value={batch.id}>
            {batch.code}
          </option>
        ))}
      </NativeSelect>
    </label>
    <label>
      Etapa
      <NativeSelect name="stageId">
        <option value="">Sin especificar</option>
        {masters.stages.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.name}
          </option>
        ))}
      </NativeSelect>
    </label>
  </>
);

const AssignmentFields = ({
  masters,
}: Pick<Props, 'masters'>): React.JSX.Element => (
  <>
    <label>
      Severidad
      <NativeSelect name="severity" required defaultValue="MODERADA">
        <option value="LEVE">Leve</option>
        <option value="MODERADA">Moderada</option>
        <option value="CRITICA">Crítica</option>
      </NativeSelect>
    </label>
    <label>
      Área responsable
      <NativeSelect name="assignedAreaId">
        <option value="">Sin especificar</option>
        {masters.areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </NativeSelect>
    </label>
    <label>
      Persona responsable
      <NativeSelect name="assignedToId">
        <option value="">Sin especificar</option>
        {masters.users
          .filter((person) => person.isActive)
          .map((person) => (
            <option key={person.id} value={person.id}>
              {person.firstName} {person.lastName}
            </option>
          ))}
      </NativeSelect>
    </label>
  </>
);

const DescriptionFields = (): React.JSX.Element => (
  <>
    <label className="form-span">
      Descripción
      <Textarea name="description" rows={3} required maxLength={1000} />
    </label>
    <label className="form-span">
      Causa raíz (opcional)
      <Textarea name="rootCause" rows={2} maxLength={1000} />
    </label>
  </>
);

export const NonConformityForm = (props: Props): React.JSX.Element => {
  const form = useNonConformityFormState();
  return (
    <form
      className="admin-form"
      onSubmit={(event) => {
        void form.submit(event);
      }}
    >
      {form.error ? (
        <p className="form-error form-span" role="alert">
          {form.error}
        </p>
      ) : null}
      <BatchAndStageFields {...props} />
      <AssignmentFields masters={props.masters} />
      <DescriptionFields />
      <div className="form-actions form-span">
        <button className="primary-button" type="submit" disabled={form.busy}>
          {form.busy ? 'Registrando…' : 'Registrar no conformidad'}
        </button>
      </div>
    </form>
  );
};
