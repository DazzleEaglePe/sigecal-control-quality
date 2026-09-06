import { useState } from 'react';
import { CircleHelp, Menu, Search } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import { CommandPalette } from '../features/shell/CommandPalette.js';
import { useCommandPalette } from '../features/shell/useCommandPalette.js';
import { useSidebarCollapsed } from '../features/shell/useSidebarCollapsed.js';
import { useSidebarWidth } from '../features/shell/useSidebarWidth.js';
import { SessionMenu } from './SessionMenu.js';
import { NotificationsMenu } from './NotificationsMenu.js';
import { Sidebar } from './Sidebar.js';

interface MenuProps {
  readonly open: boolean;
  readonly action: () => void;
}

const TopbarActions = (): React.JSX.Element => (
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
    <NotificationsMenu />
  </div>
);

const Topbar = ({
  open,
  action,
  openSearch,
}: MenuProps & { readonly openSearch: () => void }): React.JSX.Element => (
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
    <button className="search-placeholder" type="button" onClick={openSearch}>
      <Search aria-hidden="true" />
      <span>Búsqueda global</span>
      <kbd>⌘ K</kbd>
    </button>
    <TopbarActions />
    <SessionMenu />
  </header>
);

const shellClassName = (collapsed: boolean, dragging: boolean): string =>
  `app-shell${collapsed ? ' is-collapsed' : ''}${dragging ? ' is-resizing' : ''}`;

const shellStyle = (
  collapsed: boolean,
  widthRem: number,
): React.CSSProperties | undefined =>
  collapsed
    ? undefined
    : ({ '--sidebar-w': `${widthRem.toString()}rem` } as React.CSSProperties);

const useShellState = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapsed();
  const { dragging, startDrag, widthRem } = useSidebarWidth();
  const palette = useCommandPalette();
  return {
    closeMenu: () => {
      setMenuOpen(false);
    },
    collapsed,
    dragging,
    menuOpen,
    openSearch: () => {
      palette.setOpen(true);
    },
    palette,
    startDrag,
    toggleCollapsed,
    toggleMenu: () => {
      setMenuOpen((open) => !open);
    },
    widthRem,
  };
};

export const AppShell = (): React.JSX.Element => {
  const shell = useShellState();
  return (
    <div
      className={shellClassName(shell.collapsed, shell.dragging)}
      style={shellStyle(shell.collapsed, shell.widthRem)}
    >
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido
      </a>
      <div
        className={`sidebar-backdrop ${shell.menuOpen ? 'is-visible' : ''}`}
        onClick={shell.closeMenu}
        aria-hidden="true"
      />
      <Sidebar
        open={shell.menuOpen}
        action={shell.closeMenu}
        collapsed={shell.collapsed}
        toggleCollapsed={shell.toggleCollapsed}
        startResize={shell.startDrag}
      />
      <div className="workspace">
        <Topbar
          open={shell.menuOpen}
          action={shell.toggleMenu}
          openSearch={shell.openSearch}
        />
        <main id="contenido-principal" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <CommandPalette
        open={shell.palette.open}
        setOpen={shell.palette.setOpen}
      />
    </div>
  );
};
