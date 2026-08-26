import { useState } from 'react';
import { ArrowLeft, CalendarPlus, Layers3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../features/auth/useAuth.js';
import { InspectionForm } from '../features/inspections/InspectionForm.js';
import { InspectionPlanForm } from '../features/inspections/InspectionPlanForm.js';
import { useInspectionMasters } from '../features/inspections/useInspections.js';
import type { AuthorizedRequest } from '../features/auth/auth-context.js';

type Mode = 'single' | 'plan';

const NewInspectionHeader = (): React.JSX.Element => (
  <header className="page-heading quality-heading">
    <div>
      <p className="eyebrow">Control de calidad</p>
      <h1>Programar inspección</h1>
      <p>Defina el control individual o genere el plan completo de un lote.</p>
    </div>
    <Link className="secondary-button" to="/inspecciones">
      <ArrowLeft /> Volver
    </Link>
  </header>
);

const ModeTabs = ({
  mode,
  change,
}: {
  readonly mode: Mode;
  readonly change: (mode: Mode) => void;
}): React.JSX.Element => (
  <div
    className="quality-mode-tabs"
    role="tablist"
    aria-label="Tipo de programación"
  >
    <button
      className={mode === 'single' ? 'is-active' : ''}
      type="button"
      onClick={() => {
        change('single');
      }}
    >
      <CalendarPlus /> Inspección individual
    </button>
    <button
      className={mode === 'plan' ? 'is-active' : ''}
      type="button"
      onClick={() => {
        change('plan');
      }}
    >
      <Layers3 /> Plan desde plantilla
    </button>
  </div>
);

const NewInspectionForms = ({
  request,
  mode,
  masters,
  goToDetail,
  goToList,
}: {
  readonly request: AuthorizedRequest;
  readonly mode: Mode;
  readonly masters: ReturnType<typeof useInspectionMasters>;
  readonly goToDetail: (id: string) => void;
  readonly goToList: () => void;
}): React.JSX.Element => (
  <>
    {masters.error ? (
      <p className="form-error" role="alert">
        {masters.error}
      </p>
    ) : null}
    {masters.loading ? (
      <section className="quality-panel">
        <p>Cargando datos de programación…</p>
      </section>
    ) : null}
    {!masters.loading && mode === 'single' ? (
      <InspectionForm
        request={request}
        masters={masters.data}
        completed={goToDetail}
      />
    ) : null}
    {!masters.loading && mode === 'plan' ? (
      <InspectionPlanForm
        request={request}
        masters={masters.data}
        completed={goToList}
      />
    ) : null}
  </>
);

export const NewInspectionPage = (): React.JSX.Element => {
  const { request } = useAuth();
  const navigate = useNavigate();
  const [mode, changeMode] = useState<Mode>('single');
  const masters = useInspectionMasters(request);
  const goToDetail = (id: string): void => {
    void navigate(`/inspecciones/${id}`);
  };
  const goToList = (): void => {
    void navigate('/inspecciones');
  };
  return (
    <div className="page-stack quality-page">
      <NewInspectionHeader />
      <ModeTabs mode={mode} change={changeMode} />
      <NewInspectionForms
        request={request}
        mode={mode}
        masters={masters}
        goToDetail={goToDetail}
        goToList={goToList}
      />
    </div>
  );
};
