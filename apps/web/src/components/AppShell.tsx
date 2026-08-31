import { useState } from 'react';
import {
  Bell,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  Search,
} from 'lucide-react';
import { Outlet } from 'react-router-dom';

import { useAuth } from '../features/auth/useAuth.js';
import { Sidebar } from './Sidebar.js';

interface MenuProps {
  readonly open: boolean;
  readonly action: () => void;
}

const roleLabels = {
  ADMIN: 'Administrador',
  JEFE_CALIDAD: 'Jefe de calidad',
  ANALISTA: 'Analista',
  OPERARIO: 'Operario',
} as const;
import { useSidebarCollapsed } from '../features/shell/useSidebarCollapsed.js';

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
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapsed();
  const closeMenu = (): void => {
    setMenuOpen(false);
  };
  const toggleMenu = (): void => {
    setMenuOpen((open) => !open);
  };
  return (
    <div className={`app-shell${collapsed ? ' is-collapsed' : ''}`}>
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido
      </a>
      <div
        className={`sidebar-backdrop ${menuOpen ? 'is-visible' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />
      <Sidebar
        open={menuOpen}
        action={closeMenu}
        collapsed={collapsed}
        toggleCollapsed={toggleCollapsed}
      />
      <div className="workspace">
        <Topbar open={menuOpen} action={toggleMenu} />
        <main id="contenido-principal" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
