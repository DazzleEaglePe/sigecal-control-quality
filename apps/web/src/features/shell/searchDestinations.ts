import {
  Building2,
  ClipboardCheck,
  FlaskConical,
  LayoutDashboard,
  LibraryBig,
  PackageSearch,
  Settings2,
  SlidersHorizontal,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

import { Permission, type Permission as PermissionName } from '@sigecal/shared';

export interface SearchDestination {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly permission?: PermissionName;
  readonly to: string;
}

/** Espejo liviano de los destinos reales de navegación, para el buscador
 * global. Se mantiene aparte del árbol de Sidebar.tsx porque cada sección de
 * esa barra resuelve su visibilidad con una lógica propia. */
export const SEARCH_DESTINATIONS: readonly SearchDestination[] = [
  { icon: LayoutDashboard, label: 'Tablero', to: '/' },
  { icon: PackageSearch, label: 'Lotes', to: '/lotes' },
  { icon: ClipboardCheck, label: 'Inspecciones', to: '/inspecciones' },
  { icon: FlaskConical, label: 'Análisis', to: '/analisis' },
  {
    icon: UsersRound,
    label: 'Usuarios',
    to: '/usuarios',
    permission: Permission.USERS_MANAGE,
  },
  {
    icon: Building2,
    label: 'Áreas',
    to: '/configuracion/areas',
    permission: Permission.MASTERS_MANAGE,
  },
  {
    icon: LibraryBig,
    label: 'Catálogos',
    to: '/configuracion/maestros',
    permission: Permission.MASTERS_MANAGE,
  },
  {
    icon: Settings2,
    label: 'Estándares',
    to: '/configuracion/estandares',
    permission: Permission.MASTERS_MANAGE,
  },
  { icon: SlidersHorizontal, label: 'Ajustes', to: '/ajustes' },
];
