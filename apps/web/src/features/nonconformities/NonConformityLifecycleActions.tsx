import { useState } from 'react';
import { Permission, type NonConformityDetail } from '@sigecal/shared';
import { toast } from 'sonner';

import { useConfirm } from '../../components/ui/use-confirm.js';
import { Textarea } from '../../components/ui/textarea.js';
import { errorMessage } from '../admin/admin-ui.js';
import { useAuth } from '../auth/useAuth.js';
import { closeNonConformity, startAttention } from './nonconformities-api.js';

const useLifecycle = (id: string, completed: () => Promise<void>) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const run = async (
    operation: () => Promise<unknown>,
    successMessage: string,
  ): Promise<void> => {
    setBusy(true);
    setError(undefined);
    try {
      await operation();
      await completed();
      toast.success(successMessage);
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error('No se pudo completar la acción', { description: message });
    } finally {
      setBusy(false);
    }
  };
  return {
    busy,
    error,
    startAttention: () =>
      run(() => startAttention(request, id), 'Atención iniciada'),
    close: (closeComment: string) =>
      run(
        () => closeNonConformity(request, id, { closeComment }),
        'No conformidad cerrada',
      ),
  };
};

const StartAttentionAction = ({
  lifecycle,
}: {
  readonly lifecycle: ReturnType<typeof useLifecycle>;
}) => {
  const confirm = useConfirm();
  return (
    <button
      className="primary-button"
      type="button"
      disabled={lifecycle.busy}
      onClick={() => {
        void confirm({
          title: 'Iniciar atención',
          description:
            'Se registrará el momento de inicio y comenzará a contar el tiempo de respuesta.',
          confirmLabel: 'Iniciar atención',
        }).then((accepted) => {
          if (accepted) void lifecycle.startAttention();
        });
      }}
    >
      Iniciar atención
    </button>
  );
};

const closeComment = (event: React.SyntheticEvent<HTMLFormElement>): string => {
  const value = new FormData(event.currentTarget).get('closeComment');
  return typeof value === 'string' ? value.trim() : '';
};

const UnverifiedNotice = ({
  show,
}: {
  readonly show: boolean;
}): React.JSX.Element | null =>
  show ? (
    <p className="form-notice" role="status">
      Existen acciones sin verificar; el cierre será rechazado hasta que todas
      queden verificadas.
    </p>
  ) : null;

const CloseAction = ({
  lifecycle,
  hasUnverifiedActions,
}: {
  readonly lifecycle: ReturnType<typeof useLifecycle>;
  readonly hasUnverifiedActions: boolean;
}) => {
  const confirm = useConfirm();
  const submit = (event: React.SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const comment = closeComment(event);
    if (!comment) return;
    void confirm({
      title: 'Cerrar la no conformidad',
      description: 'El cierre es definitivo y quedará auditado.',
      confirmLabel: 'Cerrar',
      destructive: true,
    }).then((accepted) => {
      if (accepted) void lifecycle.close(comment);
    });
  };
  return (
    <form className="decision-action" onSubmit={submit}>
      <UnverifiedNotice show={hasUnverifiedActions} />
      <label>
        Comentario de cierre
        <Textarea name="closeComment" rows={2} required maxLength={1000} />
      </label>
      <button
        className="secondary-button"
        type="submit"
        disabled={lifecycle.busy}
      >
        Cerrar no conformidad
      </button>
    </form>
  );
};

export const NonConformityLifecycleActions = ({
  nc,
  completed,
}: {
  readonly nc: NonConformityDetail;
  readonly completed: () => Promise<void>;
}): React.JSX.Element | null => {
  const { user } = useAuth();
  const lifecycle = useLifecycle(nc.id, completed);
  const terminal = nc.status === 'CERRADA' || nc.status === 'ANULADA';
  const canOperate = user?.permissions.includes(Permission.ACTIONS_OPERATE);
  const canClose = user?.permissions.includes(Permission.NONCONFORMITIES_CLOSE);
  const canStart =
    canOperate && (nc.status === 'ABIERTA' || nc.status === 'EN_ANALISIS');
  if (terminal || (!canStart && !canClose)) return null;
  const hasUnverifiedActions = nc.actions.some(
    (action) => action.status !== 'VERIFICADA',
  );
  return (
    <section className="admin-panel lifecycle-panel">
      <h2>Acciones de la no conformidad</h2>
      {lifecycle.error ? (
        <p className="form-error" role="alert">
          {lifecycle.error}
        </p>
      ) : null}
      <div className="lifecycle-actions">
        {canStart ? <StartAttentionAction lifecycle={lifecycle} /> : null}
        {canClose ? (
          <CloseAction
            lifecycle={lifecycle}
            hasUnverifiedActions={hasUnverifiedActions}
          />
        ) : null}
      </div>
    </section>
  );
};
