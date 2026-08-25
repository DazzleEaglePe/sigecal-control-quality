import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { Permission, type Permission as PermissionName } from '@sigecal/shared';

import { useAuth } from '../features/auth/useAuth.js';

const pendingModules: readonly {
  readonly name: string;
  readonly permission: PermissionName;
}[] = [
  { name: 'Inspecciones', permission: Permission.INSPECTIONS_SCHEDULE },
  { name: 'Análisis', permission: Permission.RESULTS_RECORD },
  { name: 'Organoléptico', permission: Permission.SENSORY_RECORD },
  { name: 'No conformidades', permission: Permission.NONCONFORMITIES_RECORD },
  { name: 'Reportes', permission: Permission.REPORTS_EXPORT },
];

const roleLabels = {
  ADMIN: 'Administrador',
  JEFE_CALIDAD: 'Jefe de calidad',
  ANALISTA: 'Analista',
  OPERARIO: 'Operario',
} as const;

const MenuIcon = (): React.JSX.Element => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const PendingNavigation = (): React.JSX.Element => {
  const { user } = useAuth();
  return (
    <>
      {pendingModules
        .filter((module) => user?.permissions.includes(module.permission))
        .map((module) => (
          <span
            className="nav-item is-disabled"
            key={module.name}
            aria-disabled="true"
          >
            <span className="nav-symbol" aria-hidden="true">
              ·
            </span>
            {module.name}
            <small>Próximamente</small>
          </span>
        ))}
    </>
  );
};

const MasterNavigation = ({
  action,
}: {
  readonly action: () => void;
}): React.JSX.Element => (
  <>
    <NavLink className="nav-item" to="/configuracion/areas" onClick={action}>
      <span className="nav-symbol" aria-hidden="true">
        □
      </span>
      Áreas
    </NavLink>
    <NavLink className="nav-item" to="/configuracion/maestros" onClick={action}>
      <span className="nav-symbol" aria-hidden="true">
        ≡
      </span>
      Catálogos maestros
    </NavLink>
    <NavLink
      className="nav-item"
      to="/configuracion/estandares"
      onClick={action}
    >
      <span className="nav-symbol" aria-hidden="true">
        ⌁
      </span>
      Estándares
    </NavLink>
  </>
);

const AvailableNavigation = ({ action }: { readonly action: () => void }) => {
  const { user } = useAuth();
  return (
    <>
      <NavLink className="nav-item" to="/lotes" onClick={action}>
        <span className="nav-symbol" aria-hidden="true">
          ◫
        </span>
        Lotes
      </NavLink>
      {user?.permissions.includes(Permission.USERS_MANAGE) ? (
        <NavLink className="nav-item" to="/usuarios" onClick={action}>
          <span className="nav-symbol" aria-hidden="true">
            ◇
          </span>
          Usuarios
        </NavLink>
      ) : null}
      {user?.permissions.includes(Permission.MASTERS_MANAGE) ? (
        <MasterNavigation action={action} />
      ) : null}
    </>
  );
};

interface MenuProps {
  readonly open: boolean;
  readonly action: () => void;
}

const Sidebar = ({ open, action }: MenuProps): React.JSX.Element => {
  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          S
        </span>
        <span>
          <strong>SIGECAL</strong>
          <small>Control de calidad</small>
        </span>
      </div>
      <nav aria-label="Navegación principal">
        <p className="nav-label">Operación</p>
        <NavLink className="nav-item" to="/" onClick={action}>
          <span className="nav-symbol" aria-hidden="true">
            ⌂
          </span>
          Tablero
        </NavLink>
        <AvailableNavigation action={action} />
        <PendingNavigation />
      </nav>
      <div className="sidebar-footer">
        <span className="environment-dot" aria-hidden="true" />
        Entorno de desarrollo
      </div>
    </aside>
  );
};

const Topbar = ({ open, action }: MenuProps): React.JSX.Element => {
  const { user, signOut } = useAuth();
  const initials = `${user?.firstName[0] ?? ''}${user?.lastName[0] ?? ''}`;
  return (
    <header className="topbar">
      <button
        className="icon-button menu-button"
        type="button"
        aria-label="Abrir navegación"
        aria-expanded={open}
        onClick={action}
      >
        <MenuIcon />
      </button>
      <div className="search-placeholder" aria-disabled="true">
        <span aria-hidden="true">⌕</span>
        <span>Búsqueda disponible próximamente</span>
      </div>
      <div className="session-placeholder">
        <span className="avatar" aria-hidden="true">
          {initials}
        </span>
        <span>
          <strong>
            {user?.firstName} {user?.lastName}
          </strong>
          <small>{user ? roleLabels[user.role] : ''}</small>
        </span>
        <button
          className="logout-button"
          type="button"
          onClick={() => void signOut()}
        >
          Salir
        </button>
      </div>
    </header>
  );
};

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
