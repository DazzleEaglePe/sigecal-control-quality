import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { NonConformityForm } from '../features/nonconformities/NonConformityForm.js';
import { useNonConformityMasters } from '../features/nonconformities/useNonConformities.js';
import { useAuth } from '../features/auth/useAuth.js';
import { useBatchList } from '../features/batches/useBatches.js';

const Header = (): React.JSX.Element => (
  <header className="page-heading quality-heading">
    <div>
      <p className="eyebrow">Control de calidad</p>
      <h1>Registrar no conformidad</h1>
      <p>Documente la incidencia detectada manualmente sobre un lote.</p>
    </div>
    <Link className="secondary-button" to="/no-conformidades">
      <ArrowLeft /> Volver
    </Link>
  </header>
);

export const NewNonConformityPage = (): React.JSX.Element => {
  const { request } = useAuth();
  const masters = useNonConformityMasters(request);
  const batches = useBatchList(request, { page: 1, pageSize: 100 });
  return (
    <div className="page-stack quality-page">
      <Header />
      <section className="admin-panel">
        {masters.error ? <p className="form-error">{masters.error}</p> : null}
        {batches.error ? <p className="form-error">{batches.error}</p> : null}
        {batches.loading ? (
          <p>Cargando datos…</p>
        ) : (
          <NonConformityForm batches={batches.items} masters={masters.data} />
        )}
      </section>
    </div>
  );
};
