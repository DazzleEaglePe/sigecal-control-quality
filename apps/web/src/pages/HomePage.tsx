import {
  ArrowUpRight,
  Check,
  ClipboardCheck,
  FlaskConical,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Permission } from '@sigecal/shared';

import { HealthStatus } from '../features/health/HealthStatus.js';
import { useAuth } from '../features/auth/useAuth.js';

interface ModuleCardProps {
  readonly copy: string;
  readonly featured?: boolean;
  readonly icon: LucideIcon;
  readonly status: 'Acceso restringido' | 'Disponible' | 'En preparación';
  readonly title: string;
  readonly to?: string | undefined;
}

const ModuleCard = ({
  copy,
  featured = false,
  icon: Icon,
  status,
  title,
  to,
}: ModuleCardProps) => (
  <article
    className={`module-card${to ? ' is-available' : ''}${featured ? ' is-featured' : ''}`}
  >
    <div className="module-card-top">
      <span className="module-icon" aria-hidden="true">
        <Icon />
      </span>
      <span className="module-status">
        <span />
        {status}
      </span>
    </div>
    <h2>{title}</h2>
    <p>{copy}</p>
    {to ? (
      <Link to={to}>
        Abrir módulo <ArrowUpRight aria-hidden="true" />
      </Link>
    ) : null}
  </article>
);

const IndicatorPanel = (): React.JSX.Element => (
  <section className="indicator-panel">
    <div className="panel-heading">
      <div>
        <p className="eyebrow">Indicadores operativos</p>
        <h2>Evidencia real, sin datos simulados</h2>
      </div>
      <span className="soft-badge">Pendiente de datos reales</span>
    </div>
    <div className="indicator-empty">
      <div className="indicator-visual" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div>
        <span className="empty-icon" aria-hidden="true">
          <Sparkles />
        </span>
        <h3>El tablero está preparado</h3>
        <p>
          Los KPI se activarán cuando existan inspecciones y resultados reales
          suficientes.
        </p>
      </div>
    </div>
  </section>
);

const SprintFocus = (): React.JSX.Element => (
  <section className="focus-panel">
    <div className="focus-panel-heading">
      <span className="module-icon is-dark">
        <ClipboardCheck />
      </span>
      <div>
        <p className="eyebrow">Siguiente foco</p>
        <h2>Inspecciones y análisis</h2>
      </div>
      <span className="phase-badge">Sprint 4</span>
    </div>
    <p>
      La siguiente entrega conectará la programación con resultados
      fisicoquímicos inmutables.
    </p>
    <ul>
      <li>
        <Check /> Programación y calendario de inspecciones
      </li>
      <li>
        <Check /> Validación contra estándares vigentes
      </li>
      <li>
        <Check /> No conformidades automáticas
      </li>
    </ul>
  </section>
);

const DashboardHeader = ({ name }: { readonly name: string }) => (
  <header className="page-heading dashboard-heading">
    <div>
      <p className="eyebrow">Panel operativo</p>
      <h1>Hola, {name}</h1>
      <p>
        Supervisa la trazabilidad y el estado técnico de SIGECAL desde un solo
        lugar.
      </p>
    </div>
    <span className="phase-badge">
      <Sparkles aria-hidden="true" /> Sprint 3 completado
    </span>
  </header>
);

export const HomePage = (): React.JSX.Element => {
  const { user } = useAuth();
  const canManageMasters =
    user?.permissions.includes(Permission.MASTERS_MANAGE) ?? false;
  return (
    <div className="page-stack dashboard-page">
      <DashboardHeader name={user?.firstName ?? 'equipo'} />
      <div className="module-grid">
        <ModuleCard
          featured={canManageMasters}
          icon={ShieldCheck}
          status={canManageMasters ? 'Disponible' : 'Acceso restringido'}
          title="Seguridad y maestros"
          copy="Roles, usuarios, catálogos y estándares versionados."
          to={canManageMasters ? '/configuracion/maestros' : undefined}
        />
        <ModuleCard
          icon={PackageSearch}
          status="Disponible"
          title="Trazabilidad de lotes"
          copy="Composición, seis etapas productivas y ficha QR."
          to="/lotes"
        />
        <ModuleCard
          icon={FlaskConical}
          status="En preparación"
          title="Control fisicoquímico"
          copy="Programación, resultados y no conformidades automáticas."
        />
      </div>
      <HealthStatus />
      <div className="dashboard-columns">
        <IndicatorPanel />
        <SprintFocus />
      </div>
    </div>
  );
};
