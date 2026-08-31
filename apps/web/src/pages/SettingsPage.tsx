import { KeyRound, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import { Separator } from '../components/ui/separator.js';
import { useAuth } from '../features/auth/useAuth.js';
import { roleLabels } from '../features/auth/role-labels.js';
import { useTheme } from '../features/shell/useTheme.js';

const SettingsHeader = (): React.JSX.Element => (
  <header className="space-y-1">
    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
      Ajustes
    </h1>
    <p className="text-sm text-muted-foreground">
      Preferencias de esta sesión y datos de la cuenta.
    </p>
  </header>
);

const AppearanceCard = (): React.JSX.Element => {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Apariencia</CardTitle>
        <CardDescription>
          El tema se guarda en este navegador; no afecta a otras personas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Separator className="mb-4" />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm">
            {isLight ? (
              <Sun
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <Moon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <span>Tema {isLight ? 'claro' : 'oscuro'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={toggle}>
            Cambiar a {isLight ? 'oscuro' : 'claro'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AccountCard = (): React.JSX.Element => {
  const { user } = useAuth();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cuenta</CardTitle>
        <CardDescription>Datos de la sesión activa.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Nombre</dt>
            <dd className="font-medium">
              {user?.firstName} {user?.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Correo</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Rol</dt>
            <dd>
              <Badge variant="outline">
                {user ? roleLabels[user.role] : ''}
              </Badge>
            </dd>
          </div>
        </dl>
        <Button asChild variant="outline" size="sm">
          <Link to="/password">
            <KeyRound aria-hidden="true" /> Cambiar contraseña
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export const SettingsPage = (): React.JSX.Element => (
  <div className="max-w-2xl space-y-5">
    <SettingsHeader />
    <AppearanceCard />
    <AccountCard />
  </div>
);
