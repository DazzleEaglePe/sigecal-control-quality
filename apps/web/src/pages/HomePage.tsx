import {
  ArrowUpRight,
  ClipboardCheck,
  FlaskConical,
  Lock,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Permission } from '@sigecal/shared';

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
import { HealthStatus } from '../features/health/HealthStatus.js';
import { useAuth } from '../features/auth/useAuth.js';

const TODAY_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

interface ModuleDefinition {
  readonly copy: string;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly to: string | undefined;
}

const ModuleTop = ({
  icon: Icon,
  to,
}: Pick<ModuleDefinition, 'icon' | 'to'>): React.JSX.Element => (
  <div className="flex items-start justify-between gap-3">
    <span
      className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground"
      aria-hidden="true"
    >
      <Icon className="size-[1.15rem]" />
    </span>
    {to ? (
      <Badge variant="success">Disponible</Badge>
    ) : (
      <Badge variant="outline">
        <Lock aria-hidden="true" /> Restringido
      </Badge>
    )}
  </div>
);

const ModuleCard = ({
  copy,
  icon,
  title,
  to,
}: ModuleDefinition): React.JSX.Element => (
  <Card className="gap-4 transition-colors hover:border-primary/35">
    <CardHeader>
      <ModuleTop icon={icon} to={to} />
      <CardTitle className="pt-1 text-base">{title}</CardTitle>
      <CardDescription>{copy}</CardDescription>
    </CardHeader>
    <CardContent>
      {to ? (
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to={to}>
            Abrir módulo <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Solicite acceso al administrador del sistema.
        </p>
      )}
    </CardContent>
  </Card>
);

const DashboardHeader = ({
  name,
  role,
}: {
  readonly name: string;
  readonly role: string;
}): React.JSX.Element => (
  <header className="flex flex-wrap items-start justify-between gap-4">
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        Panel operativo
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Hola, {name}
      </h1>
      <p className="max-w-xl text-sm text-muted-foreground">
        Supervise la trazabilidad y el estado técnico de SIGECAL desde un solo
        lugar.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="capitalize">
        {role.toLowerCase().replace('_', ' ')}
      </Badge>
      <Badge variant="secondary">
        {new Date().toLocaleDateString('es-PE', TODAY_FORMAT)}
      </Badge>
    </div>
  </header>
);

/** Los indicadores del periodo son RF-M8 (Sprint 6) y excluyen datos DEMO por
 * defecto, así que aquí solo se reserva su lugar sin exhibir cifras. */
const IndicatorPanel = (): React.JSX.Element => (
  <Card className="gap-5">
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-base">Indicadores del periodo</CardTitle>
          <CardDescription>
            Conformidad, cumplimiento de programación y no conformidades
            abiertas.
          </CardDescription>
        </div>
        <Badge variant="outline">
          <TrendingUp aria-hidden="true" /> Sprint 6
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <Separator />
      <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-4">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-md bg-card text-primary"
          aria-hidden="true"
        >
          <Sparkles className="size-4" />
        </span>
        <p className="text-sm text-muted-foreground">
          Se activarán cuando existan inspecciones y resultados reales. Los
          lotes de demostración quedan excluidos del cálculo.
        </p>
      </div>
    </CardContent>
  </Card>
);

const NEXT_FOCUS = [
  'Sesión sensorial con panelistas',
  'Umbral configurable resuelto en servidor',
  'Perfil sensorial y comparador de lotes',
] as const;

const SprintFocus = (): React.JSX.Element => (
  <Card className="gap-5">
    <CardHeader>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="grid size-10 place-items-center rounded-lg bg-foreground text-background"
            aria-hidden="true"
          >
            <ClipboardCheck className="size-[1.15rem]" />
          </span>
          <div className="space-y-0.5">
            <CardTitle className="text-base">
              Evaluación organoléptica
            </CardTitle>
            <CardDescription>Siguiente foco</CardDescription>
          </div>
        </div>
        <Badge variant="secondary">Sprint 5</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <Separator />
      <ul className="space-y-2.5">
        {NEXT_FOCUS.map((item) => (
          <li
            className="flex items-center gap-2.5 text-sm text-muted-foreground"
            key={item}
          >
            <span
              className="size-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const modulesFor = (canManageMasters: boolean): readonly ModuleDefinition[] => [
  {
    icon: ShieldCheck,
    title: 'Seguridad y maestros',
    copy: 'Roles, usuarios, catálogos y estándares versionados.',
    to: canManageMasters ? '/configuracion/maestros' : undefined,
  },
  {
    icon: PackageSearch,
    title: 'Trazabilidad de lotes',
    copy: 'Composición, seis etapas productivas y ficha QR.',
    to: '/lotes',
  },
  {
    icon: ClipboardCheck,
    title: 'Inspecciones',
    copy: 'Programación, calendario y ejecución en planta.',
    to: '/inspecciones',
  },
  {
    icon: FlaskConical,
    title: 'Control fisicoquímico',
    copy: 'Resultados inmutables y no conformidades automáticas.',
    to: '/analisis',
  },
];

export const HomePage = (): React.JSX.Element => {
  const { user } = useAuth();
  const modules = modulesFor(
    user?.permissions.includes(Permission.MASTERS_MANAGE) ?? false,
  );
  return (
    <div className="space-y-6">
      <DashboardHeader
        name={user?.firstName ?? 'equipo'}
        role={user?.role ?? ''}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => (
          <ModuleCard key={module.title} {...module} />
        ))}
      </div>
      <HealthStatus />
      <div className="grid gap-4 lg:grid-cols-2">
        <IndicatorPanel />
        <SprintFocus />
      </div>
    </div>
  );
};
