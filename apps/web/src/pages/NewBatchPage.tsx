import { Link } from 'react-router-dom';

import { BatchForm } from '../features/batches/BatchForm.js';
import { useBatchMasters } from '../features/batches/useBatches.js';
import { useAuth } from '../features/auth/useAuth.js';

export const NewBatchPage = (): React.JSX.Element => {
  const { request } = useAuth();
  const masters = useBatchMasters(request);
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Lotes</p>
          <h1>Nuevo lote</h1>
          <p>
            El código se genera en servidor y la primera etapa se abre
            automáticamente.
          </p>
        </div>
        <Link className="secondary-button" to="/lotes">
          Volver al listado
        </Link>
      </header>
      <section className="admin-panel">
        <h2>Datos iniciales</h2>
        <p className="section-copy">
          Todo lote creado desde esta pantalla queda marcado como dato REAL.
        </p>
        {masters.error ? <p className="form-error">{masters.error}</p> : null}
        <BatchForm masters={masters.data} />
      </section>
    </div>
  );
};
