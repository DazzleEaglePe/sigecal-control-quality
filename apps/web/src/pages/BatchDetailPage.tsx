import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Permission,
  type BatchItem,
  type BatchTimelineEntry,
} from '@sigecal/shared';

import { BatchLifecycleActions } from '../features/batches/BatchLifecycleActions.js';
import { BatchOverview } from '../features/batches/BatchOverview.js';
import {
  BatchInspections,
  BatchNonConformities,
  BatchTimeline,
} from '../features/batches/BatchTimeline.js';
import { batchStatusLabel } from '../features/batches/batches-labels.js';
import { useBatchDetail } from '../features/batches/useBatches.js';
import { useAuth } from '../features/auth/useAuth.js';
import { TraceabilityDownloadButton } from '../features/reports/TraceabilityDownloadButton.js';

type DetailTab = 'data' | 'timeline' | 'inspections' | 'nonconformities';
const tabs: readonly { readonly id: DetailTab; readonly label: string }[] = [
  { id: 'data', label: 'Datos' },
  { id: 'timeline', label: 'Línea de tiempo' },
  { id: 'inspections', label: 'Inspecciones' },
  { id: 'nonconformities', label: 'No conformidades' },
];
const isDetailTab = (value: string | null): value is DetailTab =>
  tabs.some((item) => item.id === value);
const DetailHeader = ({
  batch,
  canExport,
}: {
  readonly batch: BatchItem;
  readonly canExport: boolean;
}) => (
  <header className="page-heading batch-heading">
    <div>
      <p className="eyebrow">Trazabilidad de lote</p>
      <h1>{batch.code}</h1>
      <p>
        {batch.piscoType.name} · {batch.currentStage.name}
      </p>
    </div>
    <div className="heading-actions">
      {canExport ? <TraceabilityDownloadButton batch={batch} /> : null}
      <span className={`state-pill batch-status-${batch.status.toLowerCase()}`}>
        {batchStatusLabel[batch.status]}
      </span>
      <Link className="secondary-button" to="/lotes">
        Volver
      </Link>
    </div>
  </header>
);
const DetailTabs = ({
  selected,
  change,
}: {
  readonly selected: DetailTab;
  readonly change: (tab: DetailTab) => void;
}) => (
  <div
    className="catalog-tabs detail-tabs"
    role="tablist"
    aria-label="Detalle del lote"
  >
    {tabs.map((item) => (
      <button
        role="tab"
        aria-selected={selected === item.id}
        className={selected === item.id ? 'is-selected' : ''}
        key={item.id}
        type="button"
        onClick={() => {
          change(item.id);
        }}
      >
        {item.label}
      </button>
    ))}
  </div>
);
const TablePanel = ({
  title,
  children,
}: React.PropsWithChildren<{ readonly title: string }>) => (
  <section className="admin-panel">
    <h2>{title}</h2>
    {children}
  </section>
);

const TabContent = ({
  tab,
  batch,
  timeline,
  canEdit,
  changed,
  focusId,
}: {
  readonly tab: DetailTab;
  readonly batch: BatchItem;
  readonly timeline: readonly BatchTimelineEntry[];
  readonly canEdit: boolean;
  readonly changed: (item: BatchItem) => void;
  readonly focusId: string | null;
}) => {
  if (tab === 'data')
    return <BatchOverview batch={batch} canEdit={canEdit} changed={changed} />;
  if (tab === 'timeline')
    return (
      <TablePanel title="Línea de tiempo del proceso">
        <BatchTimeline entries={timeline} />
      </TablePanel>
    );
  if (tab === 'inspections')
    return (
      <TablePanel title="Inspecciones del lote">
        <BatchInspections entries={timeline} />
      </TablePanel>
    );
  return (
    <TablePanel title="No conformidades del lote">
      <BatchNonConformities entries={timeline} focusId={focusId} />
    </TablePanel>
  );
};

const DetailError = ({ message }: { readonly message: string }) => (
  <div className="admin-panel">
    <p className="form-error">{message}</p>
    <Link className="secondary-button" to="/lotes">
      Volver
    </Link>
  </div>
);

/** Mantiene la pestaña en la URL para que los enlaces a una no conformidad
 * generada abran la pestaña correcta y desplacen hasta el registro. */
const useDetailTab = (loading: boolean) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const focusId = searchParams.get('focus');
  const [tab, setTab] = useState<DetailTab>(
    isDetailTab(requestedTab) ? requestedTab : 'data',
  );
  const changeTab = (next: DetailTab): void => {
    setTab(next);
    setSearchParams(next === 'data' ? {} : { tab: next });
  };
  useEffect(() => {
    if (tab !== 'nonconformities' || !focusId || loading) return;
    document.getElementById(`nc-${focusId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [focusId, loading, tab]);
  return { changeTab, focusId, tab };
};

export const BatchDetailPage = (): React.JSX.Element => {
  const id = useParams().id ?? '';
  const { request, user } = useAuth();
  const detail = useBatchDetail(request, id);
  const { changeTab, focusId, tab } = useDetailTab(detail.loading);
  if (detail.loading && !detail.batch) return <p>Cargando lote…</p>;
  if (detail.error || !detail.batch)
    return (
      <DetailError
        message={detail.error ?? 'No fue posible obtener el lote.'}
      />
    );
  return (
    <div className="page-stack">
      <DetailHeader
        batch={detail.batch}
        canExport={Boolean(
          user?.permissions.includes(Permission.REPORTS_EXPORT),
        )}
      />
      <BatchLifecycleActions batch={detail.batch} completed={detail.reload} />
      <DetailTabs selected={tab} change={changeTab} />
      <TabContent
        tab={tab}
        batch={detail.batch}
        timeline={detail.timeline}
        canEdit={Boolean(
          user?.permissions.includes(Permission.BATCHES_OPERATE),
        )}
        changed={detail.setBatch}
        focusId={focusId}
      />
    </div>
  );
};
