import { useState, type SyntheticEvent } from 'react';
import { Ban, CalendarClock, Play, RotateCcw } from 'lucide-react';
import type { InspectionItem } from '@sigecal/shared';

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

const TransitionFields = ({
  kind,
}: Pick<TransitionProps, 'kind'>): React.JSX.Element => (
  <>
    {kind === 'reschedule' ? (
      <label>
        Nueva fecha
        <input name="newDate" type="datetime-local" required />
      </label>
    ) : null}
    <label>
      Motivo
      <textarea name="reason" rows={2} minLength={3} maxLength={500} required />
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
      setError(errorMessage(cause));
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
}: Props): Promise<void> => {
  if (!window.confirm('¿Confirma el inicio de esta inspección?')) return;
  changed(await startInspection(request, inspection.id));
};

const cancel = async (props: Props, form: FormData): Promise<void> => {
  if (!window.confirm('La cancelación quedará auditada. ¿Continuar?')) return;
  props.changed(
    await cancelInspection(props.request, props.inspection.id, {
      reason: formValue(form, 'reason'),
    }),
  );
};

const reschedule = async (props: Props, form: FormData): Promise<void> => {
  if (!window.confirm('Se conservará la inspección original. ¿Continuar?'))
    return;
  props.changed(
    await rescheduleInspection(props.request, props.inspection.id, {
      reason: formValue(form, 'reason'),
      newDate: new Date(formValue(form, 'newDate')).toISOString(),
    }),
  );
};

const TransitionOptions = ({
  props,
}: {
  readonly props: Props;
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
  const canStart = ['PROGRAMADA', 'VENCIDA'].includes(inspection.status);
  const canTransition = canManage && canStart;
  const props = { request, inspection, canManage, changed };
  const begin = async (): Promise<void> => {
    try {
      await start(props);
    } catch (cause) {
      setError(errorMessage(cause));
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
