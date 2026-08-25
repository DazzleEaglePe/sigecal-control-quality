import { useEffect, useState, type SyntheticEvent } from 'react';
import { UpdateBatchRequestSchema, type BatchItem } from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import { useAuth } from '../auth/useAuth.js';
import { getBatchQr, updateBatch } from './batches-api.js';
import { batchStatusLabel, localDate, originLabel } from './batches-labels.js';

const field = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};
const useOperationalEdit = (
  batch: BatchItem,
  changed: (item: BatchItem) => void,
) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = UpdateBatchRequestSchema.safeParse({
      volumeLiters: Number(field(form, 'volumeLiters')),
      harvestOrigin: field(form, 'harvestOrigin') || null,
      notes: field(form, 'notes') || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revise los datos.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      changed(await updateBatch(request, batch.id, parsed.data));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
};

const BatchQr = ({
  id,
  code,
}: {
  readonly id: string;
  readonly code: string;
}) => {
  const { requestText } = useAuth();
  const [source, setSource] = useState<string>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void getBatchQr(requestText, id)
      .then((svg) => {
        if (active)
          setSource(
            `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
          );
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [id, requestText]);
  if (error) return <p className="inline-error">{error}</p>;
  return source ? (
    <img className="batch-qr" src={source} alt={`QR de trazabilidad ${code}`} />
  ) : (
    <p>Cargando QR…</p>
  );
};

const FactGrid = ({ batch }: { readonly batch: BatchItem }) => (
  <dl>
    <div>
      <dt>Tipo</dt>
      <dd>{batch.piscoType.name}</dd>
    </div>
    <div>
      <dt>Inicio</dt>
      <dd>{localDate(batch.startDate)}</dd>
    </div>
    <div>
      <dt>Etapa actual</dt>
      <dd>{batch.currentStage.name}</dd>
    </div>
    <div>
      <dt>Estado</dt>
      <dd>{batchStatusLabel[batch.status]}</dd>
    </div>
    <div>
      <dt>Origen de datos</dt>
      <dd>{originLabel[batch.dataOrigin]}</dd>
    </div>
    <div>
      <dt>Registrado por</dt>
      <dd>
        {batch.createdBy.firstName} {batch.createdBy.lastName}
      </dd>
    </div>
  </dl>
);
const Composition = ({ batch }: { readonly batch: BatchItem }) => (
  <>
    <h3>Variedades</h3>
    <ul className="composition-list">
      {batch.varieties.map((item) => (
        <li key={item.variety.id}>
          <span>{item.variety.name}</span>
          <strong>
            {item.percentage
              ? `${Number(item.percentage).toLocaleString('es-PE')}%`
              : 'Sin porcentaje'}
          </strong>
        </li>
      ))}
    </ul>
  </>
);
const FactsPanel = ({ batch }: { readonly batch: BatchItem }) => (
  <section className="admin-panel batch-facts">
    <h2>Identificación y composición</h2>
    <FactGrid batch={batch} />
    <Composition batch={batch} />
  </section>
);

const OperationalFields = ({
  batch,
  disabled,
}: {
  readonly batch: BatchItem;
  readonly disabled: boolean;
}) => (
  <>
    <label>
      Volumen (L)
      <input
        name="volumeLiters"
        type="number"
        min="0.001"
        step="0.001"
        defaultValue={batch.volumeLiters}
        disabled={disabled}
      />
    </label>
    <label>
      Origen de cosecha
      <input
        name="harvestOrigin"
        defaultValue={batch.harvestOrigin ?? ''}
        disabled={disabled}
      />
    </label>
    <label className="form-span">
      Notas
      <textarea
        name="notes"
        rows={3}
        defaultValue={batch.notes ?? ''}
        disabled={disabled}
      />
    </label>
  </>
);

const OperationalPanel = ({
  batch,
  canEdit,
  changed,
}: {
  readonly batch: BatchItem;
  readonly canEdit: boolean;
  readonly changed: (item: BatchItem) => void;
}) => {
  const edit = useOperationalEdit(batch, changed);
  const terminal = batch.status === 'CERRADO' || batch.status === 'RECHAZADO';
  return (
    <section className="admin-panel">
      <h2>Datos operativos</h2>
      <form
        className="admin-form"
        onSubmit={(event) => {
          void edit.submit(event);
        }}
      >
        {edit.error ? (
          <p className="form-error form-span">{edit.error}</p>
        ) : null}
        <OperationalFields batch={batch} disabled={!canEdit || terminal} />
        {canEdit && !terminal ? (
          <button
            className="secondary-button form-span"
            type="submit"
            disabled={edit.busy}
          >
            {edit.busy ? 'Guardando…' : 'Guardar datos operativos'}
          </button>
        ) : null}
      </form>
    </section>
  );
};

const QrPanel = ({ batch }: { readonly batch: BatchItem }) => (
  <section className="admin-panel qr-panel">
    <div>
      <h2>QR de trazabilidad</h2>
      <p className="section-copy">
        Abre el detalle consolidado del lote dentro de SIGECAL.
      </p>
    </div>
    <BatchQr id={batch.id} code={batch.code} />
  </section>
);

export const BatchOverview = ({
  batch,
  canEdit,
  changed,
}: {
  readonly batch: BatchItem;
  readonly canEdit: boolean;
  readonly changed: (item: BatchItem) => void;
}): React.JSX.Element => (
  <div className="batch-detail-grid">
    <FactsPanel batch={batch} />
    <OperationalPanel batch={batch} canEdit={canEdit} changed={changed} />
    <QrPanel batch={batch} />
  </div>
);
