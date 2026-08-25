import { useState } from 'react';
import {
  Bell,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  FlaskConical,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Menu,
  PackageSearch,
  Search,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
  Wine,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Outlet, type NavLinkRenderProps } from 'react-router-dom';

import { Permission, type Permission as PermissionName } from '@sigecal/shared';

import { useAuth } from '../features/auth/useAuth.js';

interface NavigationItem {
  readonly name: string;
  readonly icon: LucideIcon;
  readonly permission: PermissionName;
}
interface LinkProps {
  readonly action: () => void;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly to: string;
}
interface MenuProps {
  readonly open: boolean;
  readonly action: () => void;
}

const pendingModules: readonly NavigationItem[] = [
  {
    name: 'Inspecciones',
    icon: ClipboardCheck,
    permission: Permission.INSPECTIONS_SCHEDULE,
  },
  {
    name: 'Análisis',
    icon: FlaskConical,
    permission: Permission.RESULTS_RECORD,
  },
  { name: 'Organoléptico', icon: Wine, permission: Permission.SENSORY_RECORD },
  {
    name: 'No conformidades',
    icon: TriangleAlert,
    permission: Permission.NONCONFORMITIES_RECORD,
  },
  {
    name: 'Reportes',
    icon: ChartNoAxesCombined,
    permission: Permission.REPORTS_EXPORT,
  },
];
const roleLabels = {
  ADMIN: 'Administrador',
  JEFE_CALIDAD: 'Jefe de calidad',
  ANALISTA: 'Analista',
  OPERARIO: 'Operario',
} as const;
const navClass = ({ isActive }: NavLinkRenderProps): string =>
  `nav-item${isActive ? ' active' : ''}`;

const NavigationLink = ({ action, icon: Icon, label, to }: LinkProps) => (
  <NavLink className={navClass} to={to} onClick={action}>
    <Icon className="nav-symbol" aria-hidden="true" />
    <span>{label}</span>
  </NavLink>
);

const PendingNavigation = (): React.JSX.Element => {
  const { user } = useAuth();
  return (
    <>
      {pendingModules
        .filter((module) => user?.permissions.includes(module.permission))
        .map(({ icon: Icon, name }) => (
          <span
            className="nav-item is-disabled"
            key={name}
            aria-disabled="true"
          >
            <Icon className="nav-symbol" aria-hidden="true" />
            <span>{name}</span>
            <small>Pronto</small>
          </span>
        ))}
    </>
  );
};

const PrimaryNavigation = ({ action }: { readonly action: () => void }) => {
  const { user } = useAuth();
  return (
    <>
      <NavigationLink
        action={action}
        icon={LayoutDashboard}
        label="Tablero"
        to="/"
      />
      <NavigationLink
        action={action}
        icon={PackageSearch}
        label="Lotes"
        to="/lotes"
      />
      {user?.permissions.includes(Permission.USERS_MANAGE) ? (
        <NavigationLink
          action={action}
          icon={UsersRound}
          label="Usuarios"
          to="/usuarios"
        />
      ) : null}
    </>
  );
};

const ConfigurationNavigation = ({
  action,
}: {
  readonly action: () => void;
}) => {
  const { user } = useAuth();
  if (!user?.permissions.includes(Permission.MASTERS_MANAGE)) return null;
  return (
    <>
      <p className="nav-label nav-label-spaced">Configuración</p>
      <NavigationLink
        action={action}
        icon={Building2}
        label="Áreas"
        to="/configuracion/areas"
      />
      <NavigationLink
        action={action}
        icon={LibraryBig}
        label="Catálogos"
        to="/configuracion/maestros"
      />
      <NavigationLink
        action={action}
        icon={Settings2}
        label="Estándares"
        to="/configuracion/estandares"
      />
    </>
  );
};

const Sidebar = ({ open, action }: MenuProps): React.JSX.Element => (
  <aside className={`sidebar ${open ? 'is-open' : ''}`}>
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <ShieldCheck />
      </span>
      <span>
        <strong>SIGECAL</strong>
        <small>Control de calidad</small>
      </span>
    </div>
    <nav aria-label="Navegación principal">
      <p className="nav-label">Principal</p>
      <PrimaryNavigation action={action} />
      <p className="nav-label nav-label-spaced">Control de calidad</p>
      <PendingNavigation />
      <ConfigurationNavigation action={action} />
    </nav>
    <div className="sidebar-footer">
      <span className="environment-dot" aria-hidden="true" />
      <span>
        <small>Entorno</small>
        <strong>Desarrollo</strong>
      </span>
    </div>
  </aside>
);

const Session = (): React.JSX.Element => {
  const { user, signOut } = useAuth();
  const initials = `${user?.firstName[0] ?? ''}${user?.lastName[0] ?? ''}`;
  return (
    <div className="session-placeholder">
      <span className="avatar" aria-hidden="true">
        {initials}
      </span>
      <span className="session-copy">
        <strong>
          {user?.firstName} {user?.lastName}
        </strong>
        <small>{user ? roleLabels[user.role] : ''}</small>
      </span>
      <ChevronDown className="session-chevron" aria-hidden="true" />
      <button
        className="logout-button"
        type="button"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        onClick={() => void signOut()}
      >
        <LogOut aria-hidden="true" />
        <span>Salir</span>
      </button>
    </div>
  );
};

const Topbar = ({ open, action }: MenuProps): React.JSX.Element => (
  <header className="topbar">
    <button
      className="icon-button menu-button"
      type="button"
      aria-label="Abrir navegación"
      aria-expanded={open}
      onClick={action}
    >
      <Menu aria-hidden="true" />
    </button>
    <div className="search-placeholder" aria-disabled="true">
      <Search aria-hidden="true" />
      <span>Búsqueda global</span>
      <kbd>⌘ K</kbd>
    </div>
    <div className="topbar-actions">
      <button
        className="icon-button"
        type="button"
        disabled
        title="Ayuda disponible próximamente"
        aria-label="Ayuda disponible próximamente"
      >
        <CircleHelp />
      </button>
      <button
        className="icon-button"
        type="button"
        disabled
        title="Notificaciones disponibles próximamente"
        aria-label="Notificaciones disponibles próximamente"
      >
        <Bell />
      </button>
    </div>
    <Session />
  </header>
);

export const AppShell = (): React.JSX.Element => {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = (): void => {
    setMenuOpen(false);
  };
  const toggleMenu = (): void => {
    setMenuOpen((open) => !open);
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido
      </a>
      <div
        className={`sidebar-backdrop ${menuOpen ? 'is-visible' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />
      <Sidebar open={menuOpen} action={closeMenu} />
      <div className="workspace">
        <Topbar open={menuOpen} action={toggleMenu} />
        <main id="contenido-principal" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
