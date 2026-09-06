import {
  ChevronDown,
  ChevronRight,
  KeyRound,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import type { ComponentProps } from 'react';
import { useNavigate } from 'react-router-dom';

import type { UserSession } from '@sigecal/shared';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import { roleLabels } from '../features/auth/role-labels.js';
import { useAuth } from '../features/auth/useAuth.js';

/** `asChild` de Radix clona este elemento y le fusiona sus propias props
 * (onPointerDown, aria-*, ref); si no se reenvían con {...props}, el disparador
 * queda sin conectar y el menú nunca abre. */
const userName = (user?: UserSession): string =>
  user ? `${user.firstName} ${user.lastName}` : 'Usuario SIGECAL';

const userInitials = (user?: UserSession): string =>
  user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}` : '';

const SessionTrigger = ({
  user,
  ...props
}: ComponentProps<'button'> & {
  readonly user: UserSession | undefined;
}): React.JSX.Element => {
  return (
    <button
      className="session-placeholder"
      type="button"
      aria-label={`Abrir menú de cuenta de ${userName(user)}`}
      {...props}
    >
      <span className="avatar" aria-hidden="true">
        {userInitials(user)}
      </span>
      <span className="session-copy">
        <strong>
          {user?.firstName} {user?.lastName}
        </strong>
        <small>{user ? roleLabels[user.role] : ''}</small>
      </span>
      <ChevronDown className="session-chevron" aria-hidden="true" />
    </button>
  );
};

const SessionIdentity = ({
  user,
}: {
  readonly user: UserSession | undefined;
}): React.JSX.Element => (
  <div className="session-menu-identity">
    <span className="avatar session-menu-avatar" aria-hidden="true">
      {userInitials(user)}
    </span>
    <div className="session-menu-user">
      <strong>{userName(user)}</strong>
      <small className="session-menu-email">{user?.email}</small>
      <span className="session-role-badge">
        {user ? roleLabels[user.role] : ''}
      </span>
    </div>
  </div>
);

const ActionChevron = (): React.JSX.Element => (
  <ChevronRight className="session-menu-action-chevron" aria-hidden="true" />
);

const AccountActions = ({
  changeRoute,
}: {
  readonly changeRoute: (path: string) => void;
}): React.JSX.Element => (
  <>
    <DropdownMenuLabel className="session-menu-label">Cuenta</DropdownMenuLabel>
    <DropdownMenuItem
      className="session-menu-action"
      onSelect={() => {
        changeRoute('/ajustes');
      }}
    >
      <SlidersHorizontal aria-hidden="true" />
      <span className="session-menu-action-copy">
        <span>Ajustes de cuenta</span>
        <small>Preferencias personales</small>
      </span>
      <ActionChevron />
    </DropdownMenuItem>
    <DropdownMenuItem
      className="session-menu-action"
      onSelect={() => {
        changeRoute('/password');
      }}
    >
      <KeyRound aria-hidden="true" />
      <span className="session-menu-action-copy">
        <span>Cambiar mi contraseña</span>
        <small>Seguridad y acceso</small>
      </span>
      <ActionChevron />
    </DropdownMenuItem>
  </>
);

const SignOutAction = ({
  signOut,
}: {
  readonly signOut: () => Promise<void>;
}): React.JSX.Element => (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuItem
      className="session-menu-logout"
      variant="destructive"
      onSelect={() => void signOut()}
    >
      <LogOut aria-hidden="true" /> Cerrar sesión
    </DropdownMenuItem>
  </>
);

export const SessionMenu = (): React.JSX.Element => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const changeRoute = (path: string) => void navigate(path);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SessionTrigger user={user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="session-menu-panel">
        <SessionIdentity user={user} />
        <AccountActions changeRoute={changeRoute} />
        <SignOutAction signOut={signOut} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
