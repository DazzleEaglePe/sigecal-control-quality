import { HealthStatus } from '../features/health/HealthStatus.js';

const EmptyDashboard = (): React.JSX.Element => (
  <section className="empty-panel">
    <div className="empty-illustration" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
    <div>
      <p className="eyebrow">Estado inicial honesto</p>
      <h2>Aún no hay indicadores para mostrar</h2>
      <p>
        Los lotes ya cuentan con trazabilidad. Los indicadores se activarán
        cuando existan inspecciones y resultados reales suficientes.
      </p>
    </div>
  </section>
);

const NextComponents = (): React.JSX.Element => (
  <section aria-labelledby="proximos-pasos">
    <div className="section-heading">
      <div>
        <p className="eyebrow">Ruta de trabajo</p>
        <h2 id="proximos-pasos">Próximos componentes</h2>
      </div>
    </div>
    <div className="foundation-grid">
      <article>
        <span>01</span>
        <h3>Seguridad y maestros</h3>
        <p>Acceso por roles y catálogos controlados.</p>
      </article>
      <article>
        <span>02</span>
        <h3>Trazabilidad de lotes</h3>
        <p>Registro y recorrido por las etapas productivas.</p>
      </article>
      <article>
        <span>03</span>
        <h3>Control de calidad</h3>
        <p>Inspecciones y resultados con historial inmutable.</p>
      </article>
    </div>
  </section>
);

export const HomePage = (): React.JSX.Element => (
  <div className="page-stack">
    <header className="page-heading">
      <div>
        <p className="eyebrow">Sistema de Gestión de Control de Calidad</p>
        <h1>Tablero</h1>
        <p>
          Los indicadores operativos aparecerán cuando los módulos estén
          habilitados y existan datos reales.
        </p>
      </div>
      <span className="phase-badge">Sprint 3 · Lotes</span>
    </header>
    <HealthStatus />
    <EmptyDashboard />
    <NextComponents />
  </div>
);
