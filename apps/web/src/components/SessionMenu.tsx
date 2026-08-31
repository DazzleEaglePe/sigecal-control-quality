import { ChevronDown, LogOut, SlidersHorizontal } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import { roleLabels } from '../features/auth/role-labels.js';
import { useAuth } from '../features/auth/useAuth.js';

/** `asChild` de Radix clona este elemento y le fusiona sus propias props
 * (onPointerDown, aria-*, ref); si no se reenvían con {...props}, el disparador
 * queda sin conectar y el menú nunca abre. */
const SessionTrigger = (props: ComponentProps<'button'>): React.JSX.Element => {
  const { user } = useAuth();
  const initials = `${user?.firstName[0] ?? ''}${user?.lastName[0] ?? ''}`;
  return (
    <button className="session-placeholder" type="button" {...props}>
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
    </button>
  );
};

export const SessionMenu = (): React.JSX.Element => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SessionTrigger />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => {
            void navigate('/ajustes');
          }}
        >
          <SlidersHorizontal aria-hidden="true" /> Ajustes
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void signOut();
          }}
        >
          <LogOut aria-hidden="true" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
