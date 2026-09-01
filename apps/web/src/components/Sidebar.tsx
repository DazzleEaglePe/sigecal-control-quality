import {
  Building2,
  ChartNoAxesCombined,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardCheck,
  FlaskConical,
  LayoutDashboard,
  LibraryBig,
  PackageSearch,
  Settings2,
  SlidersHorizontal,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
  Wine,
  type LucideIcon,
} from 'lucide-react';
import { createContext, use } from 'react';
import { NavLink, type NavLinkRenderProps } from 'react-router-dom';

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
interface SidebarProps {
  readonly action: () => void;
  readonly collapsed: boolean;
  readonly open: boolean;
  readonly startResize: (event: React.PointerEvent) => void;
  readonly toggleCollapsed: () => void;
}

const pendingModules: readonly NavigationItem[] = [
  {
    name: 'Reportes',
    icon: ChartNoAxesCombined,
    permission: Permission.REPORTS_EXPORT,
  },
];
/* El tooltip por CSS quedaría recortado por el `overflow` del contenedor de
   navegación, así que al colapsar se usa el título nativo del navegador. */
const CollapsedContext = createContext(false);

const useTooltip = (label: string): { readonly title?: string } =>
  use(CollapsedContext) ? { title: label } : {};

const navClass = ({ isActive }: NavLinkRenderProps): string =>
  `nav-item${isActive ? ' active' : ''}`;

const NavigationLink = ({ action, icon: Icon, label, to }: LinkProps) => (
  <NavLink
    className={navClass}
    to={to}
    onClick={action}
    aria-label={label}
    {...useTooltip(label)}
  >
    <Icon className="nav-symbol" aria-hidden="true" />
    <span>{label}</span>
  </NavLink>
);

const PendingItem = ({
  icon: Icon,
  name,
}: Pick<NavigationItem, 'icon' | 'name'>): React.JSX.Element => (
  <span
    className="nav-item is-disabled"
    aria-disabled="true"
    {...useTooltip(name)}
  >
    <Icon className="nav-symbol" aria-hidden="true" />
    <span>{name}</span>
    <small>Pronto</small>
  </span>
);

const PendingNavigation = (): React.JSX.Element => {
  const { user } = useAuth();
  return (
    <>
      {pendingModules
        .filter((module) => user?.permissions.includes(module.permission))
        .map((module) => (
          <PendingItem
            icon={module.icon}
            key={module.name}
            name={module.name}
          />
        ))}
    </>
  );
};

const QualityNavigation = ({ action }: { readonly action: () => void }) => (
  <>
    <NavigationLink
      action={action}
      icon={ClipboardCheck}
      label="Inspecciones"
      to="/inspecciones"
    />
    <NavigationLink
      action={action}
      icon={FlaskConical}
      label="Análisis"
      to="/analisis"
    />
    <NavigationLink
      action={action}
      icon={Wine}
      label="Organoléptico"
      to="/organoleptico"
    />
    <NavigationLink
      action={action}
      icon={TriangleAlert}
      label="No conformidades"
      to="/no-conformidades"
    />
    <PendingNavigation />
  </>
);

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

const SidebarBrand = (): React.JSX.Element => (
  <div className="brand">
    <span className="brand-mark" aria-hidden="true">
      <ShieldCheck />
    </span>
    <span>
      <strong>SIGECAL</strong>
      <small>Control de calidad</small>
    </span>
  </div>
);

const SidebarToggle = ({
  collapsed,
  toggleCollapsed,
}: Pick<SidebarProps, 'collapsed' | 'toggleCollapsed'>): React.JSX.Element => (
  <button
    className="sidebar-toggle"
    type="button"
    aria-expanded={!collapsed}
    aria-label={collapsed ? 'Expandir el menú' : 'Contraer el menú'}
    onClick={toggleCollapsed}
  >
    {collapsed ? (
      <PanelLeftOpen aria-hidden="true" />
    ) : (
      <PanelLeftClose aria-hidden="true" />
    )}
  </button>
);

const SidebarResizeHandle = ({
  startResize,
}: Pick<SidebarProps, 'startResize'>): React.JSX.Element => (
  <div
    className="sidebar-resize-handle"
    role="separator"
    aria-orientation="vertical"
    aria-label="Ajustar el ancho del menú"
    onPointerDown={startResize}
  />
);

export const Sidebar = ({
  open,
  action,
  collapsed,
  startResize,
  toggleCollapsed,
}: SidebarProps): React.JSX.Element => (
  <CollapsedContext value={collapsed}>
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <SidebarBrand />
      <SidebarToggle collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
      {collapsed ? null : <SidebarResizeHandle startResize={startResize} />}
      <nav aria-label="Navegación principal">
        <p className="nav-label">Principal</p>
        <PrimaryNavigation action={action} />
        <p className="nav-label nav-label-spaced">Control de calidad</p>
        <QualityNavigation action={action} />
        <ConfigurationNavigation action={action} />
      </nav>
      <div className="sidebar-footer">
        <NavigationLink
          action={action}
          icon={SlidersHorizontal}
          label="Ajustes"
          to="/ajustes"
        />
      </div>
    </aside>
  </CollapsedContext>
);
