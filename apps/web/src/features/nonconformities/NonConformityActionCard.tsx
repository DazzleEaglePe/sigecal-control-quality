import { useRef } from 'react';
import type { CorrectiveActionItem } from '@sigecal/shared';

import { Textarea } from '../../components/ui/textarea.js';
import { useConfirm } from '../../components/ui/use-confirm.js';
import { localDate, localDateTime } from '../batches/batches-labels.js';
import { actionStatusLabel, actionTypeLabel } from './action-labels.js';
import type { useActionOps } from './useActionOps.js';

type ActionOps = ReturnType<typeof useActionOps>;

const VerifyButtons = ({
  busy,
  submit,
}: {
  readonly busy: boolean;
  readonly submit: (isEffective: boolean) => void;
}): React.JSX.Element => (
  <div className="form-actions">
    <button
      className="secondary-button"
      type="button"
      disabled={busy}
      onClick={() => {
        submit(true);
      }}
    >
      Eficaz
    </button>
    <button
      className="danger-button"
      type="button"
      disabled={busy}
      onClick={() => {
        submit(false);
      }}
    >
      No eficaz
    </button>
  </div>
);

const VerifyForm = ({
  action,
  ops,
}: {
  readonly action: CorrectiveActionItem;
  readonly ops: ActionOps;
}): React.JSX.Element => {
  const confirm = useConfirm();
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const submit = (isEffective: boolean): void => {
    const comment = commentRef.current?.value.trim() ?? '';
    if (!comment) return;
    void confirm({
      title: isEffective ? 'Verificar como eficaz' : 'Verificar como no eficaz',
      description: isEffective
        ? 'La no conformidad podrá cerrarse si no quedan otras acciones sin verificar.'
        : 'La no conformidad regresará a En tratamiento.',
      confirmLabel: 'Confirmar verificación',
    }).then((accepted) => {
      if (accepted) void ops.verify(action.id, isEffective, comment);
    });
  };
  return (
    <div className="action-verify">
      <label>
        Comentario de verificación
        <Textarea
          ref={commentRef}
          name="comment"
          rows={2}
          required
          maxLength={500}
        />
      </label>
      <VerifyButtons busy={ops.busyId === action.id} submit={submit} />
    </div>
  );
};

const ActionFacts = ({
  action,
}: {
  readonly action: CorrectiveActionItem;
}): React.JSX.Element => (
  <dl>
    <div>
      <dt>Responsable</dt>
      <dd>
        {action.responsible.firstName} {action.responsible.lastName}
      </dd>
    </div>
    <div>
      <dt>Fecha comprometida</dt>
      <dd>{localDate(action.committedDate)}</dd>
    </div>
    {action.executedAt ? (
      <div>
        <dt>Ejecutada</dt>
        <dd>{localDateTime(action.executedAt)}</dd>
      </div>
    ) : null}
    {action.replacesActionId ? (
      <div>
        <dt>Trazabilidad</dt>
        <dd>Reemplaza una acción no eficaz anterior</dd>
      </div>
    ) : null}
    {action.verifiedBy ? (
      <div>
        <dt>Verificada por</dt>
        <dd>
          {action.verifiedBy.firstName} {action.verifiedBy.lastName}
          {action.verifiedAt ? ` · ${localDateTime(action.verifiedAt)}` : ''}
        </dd>
      </div>
    ) : null}
  </dl>
);

const ActionHeading = ({
  action,
}: {
  readonly action: CorrectiveActionItem;
}): React.JSX.Element => (
  <div className="action-card-heading">
    <strong>{actionTypeLabel[action.type]}</strong>
    <span className={`state-pill nc-action-${action.status.toLowerCase()}`}>
      {actionStatusLabel[action.status]}
    </span>
  </div>
);

const ExecuteButton = ({
  action,
  ops,
}: {
  readonly action: CorrectiveActionItem;
  readonly ops: ActionOps;
}): React.JSX.Element => (
  <button
    className="secondary-button"
    type="button"
    disabled={ops.busyId === action.id}
    onClick={() => {
      void ops.execute(action.id);
    }}
  >
    Registrar ejecución
  </button>
);

export const ActionCard = ({
  action,
  canOperate,
  canVerify,
  ops,
}: {
  readonly action: CorrectiveActionItem;
  readonly canOperate: boolean;
  readonly canVerify: boolean;
  readonly ops: ActionOps;
}): React.JSX.Element => {
  const canExecute =
    canOperate &&
    (action.status === 'PENDIENTE' || action.status === 'EN_EJECUCION');
  const canOpenVerify = canVerify && action.status === 'EJECUTADA';
  return (
    <li className="action-card">
      <ActionHeading action={action} />
      <p>{action.description}</p>
      <ActionFacts action={action} />
      {action.verificationComment ? (
        <p className="field-help">{action.verificationComment}</p>
      ) : null}
      {canExecute ? <ExecuteButton action={action} ops={ops} /> : null}
      {canOpenVerify ? <VerifyForm action={action} ops={ops} /> : null}
    </li>
  );
};
