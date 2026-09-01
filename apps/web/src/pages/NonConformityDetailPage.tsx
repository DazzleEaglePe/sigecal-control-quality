import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Permission } from '@sigecal/shared';

import { useAuth } from '../features/auth/useAuth.js';
import { NonConformityActionsPanel } from '../features/nonconformities/NonConformityActionsPanel.js';
import { NonConformityLifecycleActions } from '../features/nonconformities/NonConformityLifecycleActions.js';
import { NonConformityOverview } from '../features/nonconformities/NonConformityOverview.js';
import {
  useNonConformityDetail,
  useNonConformityMasters,
} from '../features/nonconformities/useNonConformities.js';

const DetailHeader = ({
  code,
}: {
  readonly code: string;
}): React.JSX.Element => (
  <header className="page-heading quality-heading">
    <div>
      <p className="eyebrow">No conformidad</p>
      <h1>{code}</h1>
      <p>
        Consulte los tiempos calculados y gestione las acciones correctivas.
      </p>
    </div>
    <Link className="secondary-button" to="/no-conformidades">
      <ArrowLeft /> Volver
    </Link>
  </header>
);

const DetailUnavailable = ({
  error,
}: {
  readonly error: string | undefined;
}): React.JSX.Element => (
  <section className="quality-panel">
    <p className="form-error">
      {error ?? 'La no conformidad no está disponible.'}
    </p>
    <Link to="/no-conformidades">Volver al listado</Link>
  </section>
);

export const NonConformityDetailPage = (): React.JSX.Element => {
  const { id = '' } = useParams();
  const { request, user } = useAuth();
  const detail = useNonConformityDetail(request, id);
  const masters = useNonConformityMasters(request);
  const canEdit = Boolean(
    user?.permissions.includes(Permission.ACTIONS_OPERATE),
  );

  if (detail.loading)
    return (
      <section className="quality-panel">
        <p>Cargando no conformidad…</p>
      </section>
    );
  if (detail.error || !detail.nonConformity)
    return <DetailUnavailable error={detail.error} />;

  const nc = detail.nonConformity;
  return (
    <div className="page-stack quality-page">
      <DetailHeader code={nc.code} />
      <NonConformityOverview
        nc={nc}
        masters={masters.data}
        canEdit={canEdit}
        changed={detail.reload}
      />
      <NonConformityLifecycleActions nc={nc} completed={detail.reload} />
      <NonConformityActionsPanel
        nc={nc}
        masters={masters.data}
        completed={detail.reload}
      />
    </div>
  );
};
