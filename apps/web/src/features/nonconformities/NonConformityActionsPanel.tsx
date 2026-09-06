import { useState, type SyntheticEvent } from 'react';
import {
  CreateActionRequestSchema,
  Permission,
  type NonConformityDetail,
} from '@sigecal/shared';
import { toast } from 'sonner';

import { NativeSelect } from '../../components/ui/native-select.js';
import { Textarea } from '../../components/ui/textarea.js';
import { errorMessage } from '../admin/admin-ui.js';
import { useAuth } from '../auth/useAuth.js';
import { ActionCard } from './NonConformityActionCard.js';
import { createAction } from './nonconformities-api.js';
import { useActionOps } from './useActionOps.js';
import type { NonConformityMasters } from './useNonConformities.js';

const inputValue = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

const useCreateActionForm = (
  nonConformityId: string,
  completed: () => Promise<void>,
) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = CreateActionRequestSchema.safeParse({
      type: inputValue(form, 'type'),
      description: inputValue(form, 'description'),
      responsibleId: inputValue(form, 'responsibleId'),
      committedDate: inputValue(form, 'committedDate'),
      replacesActionId: inputValue(form, 'replacesActionId') || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revise el formulario.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await createAction(request, nonConformityId, parsed.data);
      await completed();
      toast.success('Acción registrada');
      formElement.reset();
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error('No se pudo registrar la acción', { description: message });
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
};

const ReplacementField = ({
  nc,
}: {
  readonly nc: NonConformityDetail;
}): React.JSX.Element | null => {
  const failed = nc.actions.filter(
    (action) =>
      action.status === 'NO_EFICAZ' &&
      !nc.actions.some((candidate) => candidate.replacesActionId === action.id),
  );
  if (failed.length === 0) return null;
  return (
    <label className="form-span">
      Reemplaza la acción no eficaz
      <NativeSelect name="replacesActionId" defaultValue="">
        <option value="">No corresponde</option>
        {failed.map((action) => (
          <option key={action.id} value={action.id}>
            {action.description}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
};

const ResponsibleOptions = ({
  masters,
}: {
  readonly masters: NonConformityMasters;
}) =>
  masters.users
    .filter((person) => person.isActive)
    .map((person) => (
      <option key={person.id} value={person.id}>
        {person.firstName} {person.lastName}
      </option>
    ));

const ActionFormFields = ({
  masters,
  nc,
}: {
  readonly masters: NonConformityMasters;
  readonly nc: NonConformityDetail;
}): React.JSX.Element => (
  <>
    <label>
      Tipo
      <NativeSelect name="type" required defaultValue="CORRECTIVA">
        <option value="CORRECCION">Corrección</option>
        <option value="CORRECTIVA">Correctiva</option>
        <option value="PREVENTIVA">Preventiva</option>
      </NativeSelect>
    </label>
    <label>
      Responsable
      <NativeSelect name="responsibleId" required defaultValue="">
        <option value="" disabled>
          Seleccione una persona
        </option>
        <ResponsibleOptions masters={masters} />
      </NativeSelect>
    </label>
    <label>
      Fecha comprometida
      <input name="committedDate" type="date" required />
    </label>
    <label className="form-span">
      Descripción
      <Textarea name="description" rows={2} required maxLength={1000} />
    </label>
    <ReplacementField nc={nc} />
  </>
);

const CreateActionForm = ({
  nonConformityId,
  masters,
  nc,
  completed,
}: {
  readonly nonConformityId: string;
  readonly masters: NonConformityMasters;
  readonly nc: NonConformityDetail;
  readonly completed: () => Promise<void>;
}): React.JSX.Element => {
  const form = useCreateActionForm(nonConformityId, completed);
  return (
    <details className="action-create">
      <summary>Registrar acción</summary>
      <form
        className="admin-form"
        onSubmit={(event) => {
          void form.submit(event);
        }}
      >
        {form.error ? (
          <p className="form-error form-span">{form.error}</p>
        ) : null}
        <ActionFormFields masters={masters} nc={nc} />
        <div className="form-actions form-span">
          <button className="primary-button" type="submit" disabled={form.busy}>
            {form.busy ? 'Registrando…' : 'Registrar acción'}
          </button>
        </div>
      </form>
    </details>
  );
};

const ActionsList = ({
  nc,
  canOperate,
  canVerify,
  ops,
}: {
  readonly nc: NonConformityDetail;
  readonly canOperate: boolean;
  readonly canVerify: boolean;
  readonly ops: ReturnType<typeof useActionOps>;
}): React.JSX.Element =>
  nc.actions.length === 0 ? (
    <p className="empty-copy">Aún no se registran acciones.</p>
  ) : (
    <ul className="action-list">
      {nc.actions.map((action) => (
        <ActionCard
          key={action.id}
          action={action}
          canOperate={canOperate}
          canVerify={canVerify}
          ops={ops}
        />
      ))}
    </ul>
  );

export const NonConformityActionsPanel = ({
  nc,
  masters,
  completed,
}: {
  readonly nc: NonConformityDetail;
  readonly masters: NonConformityMasters;
  readonly completed: () => Promise<void>;
}): React.JSX.Element => {
  const { user } = useAuth();
  const ops = useActionOps(completed);
  const canOperate = Boolean(
    user?.permissions.includes(Permission.ACTIONS_OPERATE),
  );
  const canVerify = Boolean(
    user?.permissions.includes(Permission.NONCONFORMITIES_CLOSE),
  );
  const terminal = nc.status === 'CERRADA' || nc.status === 'ANULADA';
  return (
    <section className="admin-panel">
      <h2>Acciones correctivas</h2>
      <ActionsList
        nc={nc}
        canOperate={canOperate}
        canVerify={canVerify}
        ops={ops}
      />
      {canOperate && !terminal ? (
        <CreateActionForm
          nonConformityId={nc.id}
          masters={masters}
          nc={nc}
          completed={completed}
        />
      ) : null}
    </section>
  );
};
