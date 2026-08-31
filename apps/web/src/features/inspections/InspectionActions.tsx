import { useState, type SyntheticEvent } from 'react';
import { Ban, CalendarClock, Play, RotateCcw } from 'lucide-react';
import type { InspectionItem } from '@sigecal/shared';
import { toast } from 'sonner';

import { useConfirm } from '../../components/ui/use-confirm.js';
import { Input } from '../../components/ui/input.js';
import { Textarea } from '../../components/ui/textarea.js';
import { errorMessage } from '../admin/admin-ui.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import {
  cancelInspection,
  rescheduleInspection,
  startInspection,
} from './inspections-api.js';

interface Props {
  readonly request: AuthorizedRequest;
  readonly inspection: InspectionItem;
  readonly canManage: boolean;
  readonly changed: (inspection: InspectionItem) => void;
}

interface TransitionProps {
  readonly kind: 'cancel' | 'reschedule';
  readonly submit: (form: FormData) => Promise<void>;
}

type ActionContext = Props & {
  readonly confirm: ReturnType<typeof useConfirm>;
};

const TransitionSubmit = ({
  kind,
  saving,
}: {
  readonly kind: TransitionProps['kind'];
  readonly saving: boolean;
}): React.JSX.Element => (
  <button
    className={kind === 'cancel' ? 'danger-button' : 'secondary-button'}
    type="submit"
    disabled={saving}
  >
    {saving
      ? 'Procesando…'
      : kind === 'cancel'
        ? 'Confirmar cancelación'
        : 'Confirmar reprogramación'}
  </button>
);

const TransitionFields = ({
  kind,
}: Pick<TransitionProps, 'kind'>): React.JSX.Element => (
  <>
    {kind === 'reschedule' ? (
      <label>
        Nueva fecha
        <Input name="newDate" type="datetime-local" required />
      </label>
    ) : null}
    <label>
      Motivo
      <Textarea name="reason" rows={2} minLength={3} maxLength={500} required />
    </label>
  </>
);

const TransitionForm = ({
  kind,
  submit,
}: TransitionProps): React.JSX.Element => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const send = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      await submit(new FormData(event.currentTarget));
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error('No se pudo actualizar la inspección', {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <form
      className="transition-form"
      onSubmit={(event) => {
        void send(event);
      }}
    >
      <TransitionFields kind={kind} />
      {error ? <p className="form-error">{error}</p> : null}
      <TransitionSubmit kind={kind} saving={saving} />
    </form>
  );
};

const formValue = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
};

const start = async ({
  request,
  inspection,
  changed,
  confirm,
}: ActionContext): Promise<void> => {
  const accepted = await confirm({
    title: 'Iniciar inspección',
    description:
      'La inspección pasará a En proceso y el momento de inicio quedará auditado.',
    confirmLabel: 'Iniciar inspección',
  });
  if (!accepted) return;
  changed(await startInspection(request, inspection.id));
  toast.success('Inspección iniciada');
};

const cancel = async (props: ActionContext, form: FormData): Promise<void> => {
  const accepted = await props.confirm({
    title: 'Cancelar inspección',
    description:
      'La cancelación y su motivo quedarán auditados. Esta acción no elimina el registro.',
    confirmLabel: 'Cancelar inspección',
    destructive: true,
  });
  if (!accepted) return;
  props.changed(
    await cancelInspection(props.request, props.inspection.id, {
      reason: formValue(form, 'reason'),
    }),
  );
  toast.success('Inspección cancelada');
};

const reschedule = async (
  props: ActionContext,
  form: FormData,
): Promise<void> => {
  const accepted = await props.confirm({
    title: 'Reprogramar inspección',
    description:
      'Se conservará la inspección original y se creará la nueva programación vinculada.',
    confirmLabel: 'Reprogramar',
  });
  if (!accepted) return;
  props.changed(
    await rescheduleInspection(props.request, props.inspection.id, {
      reason: formValue(form, 'reason'),
      newDate: new Date(formValue(form, 'newDate')).toISOString(),
    }),
  );
  toast.success('Inspección reprogramada');
};

const TransitionOptions = ({
  props,
}: {
  readonly props: ActionContext;
}): React.JSX.Element => (
  <>
    <details>
      <summary>
        <RotateCcw /> Reprogramar
      </summary>
      <TransitionForm
        kind="reschedule"
        submit={(form) => reschedule(props, form)}
      />
    </details>
    <details>
      <summary>
        <Ban /> Cancelar
      </summary>
      <TransitionForm kind="cancel" submit={(form) => cancel(props, form)} />
    </details>
  </>
);

const ActionsHeading = (): React.JSX.Element => (
  <div className="quality-panel-heading">
    <div>
      <span className="quality-kicker">Transiciones controladas</span>
      <h2>Acciones de inspección</h2>
    </div>
    <CalendarClock />
  </div>
);

export const InspectionActions = ({
  request,
  inspection,
  canManage,
  changed,
}: Props): React.JSX.Element => {
  const [error, setError] = useState<string>();
  const confirm = useConfirm();
  const canStart = ['PROGRAMADA', 'VENCIDA'].includes(inspection.status);
  const canTransition = canManage && canStart;
  const props = { request, inspection, canManage, changed, confirm };
  const begin = async (): Promise<void> => {
    try {
      await start(props);
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error('No se pudo iniciar la inspección', { description: message });
    }
  };
  if (!canStart) return <></>;
  return (
    <section className="quality-panel transition-panel">
      <ActionsHeading />
      {error ? <p className="form-error">{error}</p> : null}
      <div className="transition-actions">
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            void begin();
          }}
        >
          <Play /> Iniciar inspección
        </button>
        {canTransition ? <TransitionOptions props={props} /> : null}
      </div>
    </section>
  );
};
