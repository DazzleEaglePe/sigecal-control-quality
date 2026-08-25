import { useState, type SyntheticEvent } from 'react';
import { Permission, type BatchItem } from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import { useAuth } from '../auth/useAuth.js';
import { advanceBatch, closeBatch, rejectBatch } from './batches-api.js';

const confirmAction = (message: string): boolean => globalThis.confirm(message);

const warningNotice = (warnings: readonly string[]): string | undefined => {
  const labels = warnings.map((warning) =>
    warning === 'PENDING_INSPECTIONS'
      ? 'Hay inspecciones pendientes en la etapa cerrada.'
      : 'El lote mantiene no conformidades abiertas.',
  );
  return labels.length > 0 ? labels.join(' ') : undefined;
};

const useLifecycle = (batch: BatchItem, completed: () => Promise<void>) => {
  const { request, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const run = async (operation: () => Promise<unknown>): Promise<void> => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await operation();
      await completed();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  const advance = (observations?: string): Promise<void> =>
    run(async () => {
      if (!user) return;
      const result = await advanceBatch(request, batch.id, {
        responsibleId: user.id,
        ...(observations ? { observations } : {}),
      });
      setNotice(warningNotice(result.warnings));
    });
  return { busy, error, notice, advance, run, request };
};

type Lifecycle = ReturnType<typeof useLifecycle>;
const AdvanceAction = ({ lifecycle }: { readonly lifecycle: Lifecycle }) => {
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('observations');
    if (confirmAction('¿Confirmas el avance? La etapa actual quedará cerrada.'))
      void lifecycle.advance(
        typeof value === 'string' ? value.trim() : undefined,
      );
  };
  return (
    <form onSubmit={submit}>
      <label>
        Observación del cambio
        <input name="observations" maxLength={500} placeholder="Opcional" />
      </label>
      <button
        className="primary-button"
        type="submit"
        disabled={lifecycle.busy}
      >
        Avanzar a la etapa siguiente
      </button>
    </form>
  );
};
const CloseAction = ({
  batch,
  lifecycle,
}: {
  readonly batch: BatchItem;
  readonly lifecycle: Lifecycle;
}) => (
  <div className="decision-action">
    <p>Cierre definitivo, permitido solo sin no conformidades abiertas.</p>
    <button
      className="secondary-button"
      type="button"
      disabled={lifecycle.busy}
      onClick={() => {
        if (
          confirmAction(
            `¿Confirmas el cierre definitivo del lote ${batch.code}?`,
          )
        )
          void lifecycle.run(() => closeBatch(lifecycle.request, batch.id));
      }}
    >
      Cerrar lote
    </button>
  </div>
);
const RejectAction = ({
  batch,
  lifecycle,
}: {
  readonly batch: BatchItem;
  readonly lifecycle: Lifecycle;
}) => {
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('reason');
    if (
      typeof value === 'string' &&
      value.trim() &&
      confirmAction(`¿Confirmas el rechazo definitivo del lote ${batch.code}?`)
    )
      void lifecycle.run(() =>
        rejectBatch(lifecycle.request, batch.id, { reason: value.trim() }),
      );
  };
  return (
    <form onSubmit={submit}>
      <label>
        Motivo del rechazo
        <input name="reason" required maxLength={500} />
      </label>
      <button className="danger-button" type="submit" disabled={lifecycle.busy}>
        Rechazar lote
      </button>
    </form>
  );
};

export const BatchLifecycleActions = ({
  batch,
  completed,
}: {
  readonly batch: BatchItem;
  readonly completed: () => Promise<void>;
}): React.JSX.Element | null => {
  const { user } = useAuth();
  const lifecycle = useLifecycle(batch, completed);
  const terminal = batch.status === 'CERRADO' || batch.status === 'RECHAZADO';
  const canOperate = user?.permissions.includes(Permission.BATCHES_OPERATE);
  const canClose = user?.permissions.includes(Permission.BATCHES_CLOSE);
  const canReject = user?.permissions.includes(Permission.BATCHES_REJECT);
  if (terminal || (!canOperate && !canClose && !canReject)) return null;
  return (
    <section className="admin-panel lifecycle-panel">
      <h2>Acciones del lote</h2>
      {lifecycle.error ? (
        <p className="form-error" role="alert">
          {lifecycle.error}
        </p>
      ) : null}
      {lifecycle.notice ? (
        <p className="form-notice" role="status">
          {lifecycle.notice}
        </p>
      ) : null}
      <div className="lifecycle-actions">
        {canOperate ? <AdvanceAction lifecycle={lifecycle} /> : null}
        {canClose ? <CloseAction batch={batch} lifecycle={lifecycle} /> : null}
        {canReject ? (
          <RejectAction batch={batch} lifecycle={lifecycle} />
        ) : null}
      </div>
    </section>
  );
};
