import { ArrowLeft, FlaskConical, History } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Permission, type InspectionItem } from '@sigecal/shared';

import { useAuth } from '../features/auth/useAuth.js';
import { InspectionActions } from '../features/inspections/InspectionActions.js';
import { InspectionOverview } from '../features/inspections/InspectionOverview.js';
import { useInspectionDetail } from '../features/inspections/useInspections.js';
import { PhysChemExecutionForm } from '../features/physchem/PhysChemExecutionForm.js';
import type { AuthorizedRequest } from '../features/auth/auth-context.js';

const DetailHeader = ({ id }: { readonly id: string }): React.JSX.Element => (
  <header className="page-heading quality-heading">
    <div>
      <p className="eyebrow">Ejecución y trazabilidad</p>
      <h1>Detalle de inspección</h1>
      <p>Consulte la programación y registre resultados definitivos.</p>
    </div>
    <div className="quality-heading-actions">
      <Link className="secondary-button" to="/inspecciones">
        <ArrowLeft /> Volver
      </Link>
      <Link className="secondary-button" to={`/analisis?inspectionId=${id}`}>
        <History /> Resultados
      </Link>
    </div>
  </header>
);

const LockedExecution = ({
  status,
}: Pick<InspectionItem, 'status'>): React.JSX.Element => (
  <section className="quality-panel quality-locked">
    <span className="quality-lock-icon">
      <FlaskConical />
    </span>
    <div>
      <h2>Ejecución fisicoquímica no disponible</h2>
      <p>
        {status === 'EN_PROCESO'
          ? 'Su rol no puede registrar resultados.'
          : 'Inicie la inspección para habilitar la captura de mediciones.'}
      </p>
    </div>
  </section>
);

interface DetailContentProps {
  readonly request: AuthorizedRequest;
  readonly inspection: InspectionItem;
  readonly canManage: boolean;
  readonly canRecord: boolean;
  readonly changed: (inspection: InspectionItem) => void;
  readonly reload: () => Promise<void>;
}

const ExecutionSection = (
  props: DetailContentProps,
): React.JSX.Element | null => {
  if (props.inspection.type !== 'FISICOQUIMICO') return null;
  const executable =
    props.canRecord && props.inspection.status === 'EN_PROCESO';
  return executable ? (
    <PhysChemExecutionForm
      request={props.request}
      inspection={props.inspection}
      completed={props.reload}
    />
  ) : (
    <LockedExecution status={props.inspection.status} />
  );
};

const DetailContent = (props: DetailContentProps): React.JSX.Element => (
  <div className="page-stack quality-page">
    <DetailHeader id={props.inspection.id} />
    <InspectionOverview inspection={props.inspection} />
    <InspectionActions
      request={props.request}
      inspection={props.inspection}
      canManage={props.canManage}
      changed={props.changed}
    />
    <ExecutionSection {...props} />
  </div>
);

const DetailUnavailable = ({
  error,
}: {
  readonly error: string | undefined;
}): React.JSX.Element => (
  <section className="quality-panel">
    <p className="form-error">{error ?? 'La inspección no está disponible.'}</p>
    <Link to="/inspecciones">Volver al listado</Link>
  </section>
);

export const InspectionDetailPage = (): React.JSX.Element => {
  const { id = '' } = useParams();
  const { request, user } = useAuth();
  const navigate = useNavigate();
  const detail = useInspectionDetail(request, id);
  const canManage = Boolean(
    user?.permissions.includes(Permission.INSPECTIONS_SCHEDULE),
  );
  const canRecord = Boolean(
    user?.permissions.includes(Permission.RESULTS_RECORD),
  );
  const changed = (inspection: InspectionItem): void => {
    if (inspection.id !== id) void navigate(`/inspecciones/${inspection.id}`);
    else detail.setInspection(inspection);
  };
  if (detail.loading)
    return (
      <section className="quality-panel">
        <p>Cargando inspección…</p>
      </section>
    );
  if (detail.error || !detail.inspection)
    return <DetailUnavailable error={detail.error} />;
  return (
    <DetailContent
      request={request}
      inspection={detail.inspection}
      canManage={canManage}
      canRecord={canRecord}
      changed={changed}
      reload={detail.reload}
    />
  );
};
