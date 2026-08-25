import { useHealth } from './useHealth.js';

const LoadingStatus = (): React.JSX.Element => (
  <section className="status-card" aria-live="polite" aria-busy="true">
    <span className="status-indicator is-loading" aria-hidden="true" />
    <div>
      <strong>Comprobando el entorno</strong>
      <p>Conectando con la API y PostgreSQL…</p>
    </div>
  </section>
);

const ErrorStatus = ({ retry }: { retry: () => void }): React.JSX.Element => (
  <section className="status-card is-error" role="alert">
    <span className="status-indicator" aria-hidden="true">
      !
    </span>
    <div>
      <strong>No pudimos conectar con el servicio</strong>
      <p>Comprueba que el entorno esté iniciado y vuelve a intentarlo.</p>
    </div>
    <button className="secondary-button" type="button" onClick={retry}>
      Reintentar
    </button>
  </section>
);

const AvailableStatus = (): React.JSX.Element => (
  <section className="status-card is-success" aria-live="polite">
    <span className="status-indicator" aria-hidden="true">
      ✓
    </span>
    <div>
      <strong>Entorno disponible</strong>
      <p>La aplicación y PostgreSQL están conectados correctamente.</p>
    </div>
  </section>
);

export const HealthStatus = (): React.JSX.Element => {
  const health = useHealth();
  if (health.status === 'loading') return <LoadingStatus />;
  if (health.status === 'error') return <ErrorStatus retry={health.retry} />;
  return <AvailableStatus />;
};
