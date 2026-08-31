import { useState, type SyntheticEvent } from 'react';
import { Permission, type BatchItem } from '@sigecal/shared';
import { toast } from 'sonner';

import { useConfirm } from '../../components/ui/use-confirm.js';
import { Input } from '../../components/ui/input.js';
import { errorMessage } from '../admin/admin-ui.js';
import { useAuth } from '../auth/useAuth.js';
import { advanceBatch, closeBatch, rejectBatch } from './batches-api.js';

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
  const run = async (
    operation: () => Promise<unknown>,
    successMessage: string,
  ): Promise<void> => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
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
  const advance = (observations?: string): Promise<void> =>
    run(async () => {
      if (!user) return;
      const result = await advanceBatch(request, batch.id, {
        responsibleId: user.id,
        ...(observations ? { observations } : {}),
      });
      const warning = warningNotice(result.warnings);
      setNotice(warning);
      if (warning)
        toast.warning('El lote avanzó con observaciones', {
          description: warning,
        });
    }, 'Lote avanzado a la etapa siguiente');
  return { busy, error, notice, advance, run, request };
};

type Lifecycle = ReturnType<typeof useLifecycle>;
const AdvanceAction = ({ lifecycle }: { readonly lifecycle: Lifecycle }) => {
  const confirm = useConfirm();
  const submit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('observations');
    const accepted = await confirm({
      title: 'Avanzar el lote',
      description:
        'La etapa actual quedará cerrada y el cambio se registrará en la bitácora.',
      confirmLabel: 'Avanzar etapa',
    });
    if (accepted)
      await lifecycle.advance(
        typeof value === 'string' ? value.trim() : undefined,
      );
  };
  return (
    <form
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <label>
        Observación del cambio
        <Input name="observations" maxLength={500} placeholder="Opcional" />
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
}) => {
  const confirm = useConfirm();
  return (
    <div className="decision-action">
      <p>Cierre definitivo, permitido solo sin no conformidades abiertas.</p>
      <button
        className="secondary-button"
        type="button"
        disabled={lifecycle.busy}
        onClick={() => {
          void confirm({
            title: `Cerrar el lote ${batch.code}`,
            description:
              'El cierre es definitivo y solo continuará si no existen no conformidades abiertas.',
            confirmLabel: 'Cerrar lote',
            destructive: true,
          }).then((accepted) => {
            if (accepted)
              void lifecycle.run(
                () => closeBatch(lifecycle.request, batch.id),
                'Lote cerrado correctamente',
              );
          });
        }}
      >
        Cerrar lote
      </button>
    </div>
  );
};

const RejectForm = ({
  busy,
  submit,
}: {
  readonly busy: boolean;
  readonly submit: (event: SyntheticEvent<HTMLFormElement>) => Promise<void>;
}): React.JSX.Element => (
  <form
    onSubmit={(event) => {
      void submit(event);
    }}
  >
    <label>
      Motivo del rechazo
      <Input name="reason" required maxLength={500} />
    </label>
    <button className="danger-button" type="submit" disabled={busy}>
      Rechazar lote
    </button>
  </form>
);

const RejectAction = ({
  batch,
  lifecycle,
}: {
  readonly batch: BatchItem;
  readonly lifecycle: Lifecycle;
}) => {
  const confirm = useConfirm();
  const submit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('reason');
    if (typeof value !== 'string' || !value.trim()) return;
    const accepted = await confirm({
      title: `Rechazar el lote ${batch.code}`,
      description:
        'El rechazo es definitivo, conservará el motivo y quedará registrado en la bitácora.',
      confirmLabel: 'Rechazar lote',
      destructive: true,
    });
    if (accepted)
      await lifecycle.run(
        () =>
          rejectBatch(lifecycle.request, batch.id, { reason: value.trim() }),
        'Lote rechazado correctamente',
      );
  };
  return <RejectForm busy={lifecycle.busy} submit={submit} />;
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
