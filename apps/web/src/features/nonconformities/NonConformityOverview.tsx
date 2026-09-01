import { useState, type SyntheticEvent } from 'react';
import {
  UpdateNonConformityRequestSchema,
  type NonConformityDetail,
} from '@sigecal/shared';

import { NativeSelect } from '../../components/ui/native-select.js';
import { Textarea } from '../../components/ui/textarea.js';
import { errorMessage } from '../admin/admin-ui.js';
import { useAuth } from '../auth/useAuth.js';
import { DescriptionPanel, FactGrid } from './NonConformityFacts.js';
import { updateNonConformity } from './nonconformities-api.js';
import type { NonConformityMasters } from './useNonConformities.js';

const field = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

const useAssignmentEdit = (
  nc: NonConformityDetail,
  changed: () => Promise<void>,
) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = UpdateNonConformityRequestSchema.safeParse({
      severity: field(form, 'severity'),
      rootCause: field(form, 'rootCause') || null,
      assignedToId: field(form, 'assignedToId') || null,
      assignedAreaId: field(form, 'assignedAreaId') || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revise los datos.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await updateNonConformity(request, nc.id, parsed.data);
      await changed();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
};

const SeverityAndAreaFields = ({
  nc,
  masters,
  disabled,
}: {
  readonly nc: NonConformityDetail;
  readonly masters: NonConformityMasters;
  readonly disabled: boolean;
}): React.JSX.Element => (
  <>
    <label>
      Severidad
      <NativeSelect
        name="severity"
        defaultValue={nc.severity}
        disabled={disabled}
      >
        <option value="LEVE">Leve</option>
        <option value="MODERADA">Moderada</option>
        <option value="CRITICA">Crítica</option>
      </NativeSelect>
    </label>
    <label>
      Área responsable
      <NativeSelect
        name="assignedAreaId"
        defaultValue={nc.assignedArea?.id ?? ''}
        disabled={disabled}
      >
        <option value="">Sin especificar</option>
        {masters.areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </NativeSelect>
    </label>
  </>
);

const ResponsibleAndCauseFields = ({
  nc,
  masters,
  disabled,
}: {
  readonly nc: NonConformityDetail;
  readonly masters: NonConformityMasters;
  readonly disabled: boolean;
}): React.JSX.Element => (
  <>
    <label>
      Persona responsable
      <NativeSelect
        name="assignedToId"
        defaultValue={nc.assignedTo?.id ?? ''}
        disabled={disabled}
      >
        <option value="">Sin asignar</option>
        {masters.users
          .filter((person) => person.isActive)
          .map((person) => (
            <option key={person.id} value={person.id}>
              {person.firstName} {person.lastName}
            </option>
          ))}
      </NativeSelect>
    </label>
    <label className="form-span">
      Causa raíz
      <Textarea
        name="rootCause"
        rows={2}
        maxLength={1000}
        defaultValue={nc.rootCause ?? ''}
        disabled={disabled}
      />
    </label>
  </>
);

const AssignmentFields = (props: {
  readonly nc: NonConformityDetail;
  readonly masters: NonConformityMasters;
  readonly disabled: boolean;
}): React.JSX.Element => (
  <>
    <SeverityAndAreaFields {...props} />
    <ResponsibleAndCauseFields {...props} />
  </>
);

const AssignmentPanel = ({
  nc,
  masters,
  canEdit,
  changed,
}: {
  readonly nc: NonConformityDetail;
  readonly masters: NonConformityMasters;
  readonly canEdit: boolean;
  readonly changed: () => Promise<void>;
}) => {
  const edit = useAssignmentEdit(nc, changed);
  const terminal = nc.status === 'CERRADA' || nc.status === 'ANULADA';
  const disabled = !canEdit || terminal;
  return (
    <section className="admin-panel">
      <h2>Asignación y severidad</h2>
      <form
        className="admin-form"
        onSubmit={(event) => {
          void edit.submit(event);
        }}
      >
        {edit.error ? (
          <p className="form-error form-span">{edit.error}</p>
        ) : null}
        <AssignmentFields nc={nc} masters={masters} disabled={disabled} />
        {!disabled ? (
          <button
            className="secondary-button form-span"
            type="submit"
            disabled={edit.busy}
          >
            {edit.busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        ) : null}
      </form>
    </section>
  );
};

export const NonConformityOverview = ({
  nc,
  masters,
  canEdit,
  changed,
}: {
  readonly nc: NonConformityDetail;
  readonly masters: NonConformityMasters;
  readonly canEdit: boolean;
  readonly changed: () => Promise<void>;
}): React.JSX.Element => (
  <div className="batch-detail-grid">
    <section className="admin-panel batch-facts">
      <h2>Identificación</h2>
      <FactGrid nc={nc} />
    </section>
    <DescriptionPanel nc={nc} />
    <AssignmentPanel
      nc={nc}
      masters={masters}
      canEdit={canEdit}
      changed={changed}
    />
  </div>
);
