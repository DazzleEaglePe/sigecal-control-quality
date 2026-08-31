import { lazy, Suspense } from 'react';
import {
  ArrowUpRight,
  CalendarClock,
  ClipboardCheck,
  FlaskConical,
  Info,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Permission, type InspectionItem } from '@sigecal/shared';

import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import { StatCard } from '../features/dashboard/StatCard.js';
import {
  useDashboard,
  type DashboardState,
} from '../features/dashboard/useDashboard.js';
import { useAuth } from '../features/auth/useAuth.js';

const DashboardCharts = lazy(async () => {
  const module = await import('../features/dashboard/DashboardCharts.js');
  return { default: module.DashboardCharts };
});

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

const statusLabel: Record<InspectionItem['status'], string> = {
  PROGRAMADA: 'Programada',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  VENCIDA: 'Vencida',
  REPROGRAMADA: 'Reprogramada',
};

const DashboardHeader = ({
  name,
  state,
}: {
  readonly name: string;
  readonly state: DashboardState;
}): React.JSX.Element => (
  <header className="flex flex-wrap items-start justify-between gap-4">
    <div className="space-y-1">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Hola de nuevo, {name}
      </h1>
      <p className="text-sm text-muted-foreground">
        Resumen operativo de la trazabilidad y el control de calidad.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant="outline">
        <CalendarClock aria-hidden="true" />
        {new Date().toLocaleDateString('es-PE', DATE_FORMAT)}
      </Badge>
      <Button variant="outline" size="sm" onClick={state.reload}>
        <RefreshCw aria-hidden="true" /> Actualizar
      </Button>
    </div>
  </header>
);

const StatRow = ({ state }: { readonly state: DashboardState }) => {
  const data = state.data;
  const cards: readonly Omit<Parameters<typeof StatCard>[0], 'loading'>[] = [
    {
      icon: PackageSearch,
      label: 'Lotes registrados',
      value: data?.batches ?? 0,
      hint: 'Con trazabilidad activa',
    },
    {
      icon: ClipboardCheck,
      label: 'Inspecciones',
      value: data?.inspections ?? 0,
      hint: 'Programadas en total',
    },
    {
      icon: FlaskConical,
      label: 'Completadas',
      value: data?.completed ?? 0,
      hint: 'Con cobertura total de parámetros',
    },
    {
      icon: CalendarClock,
      label: 'Mis pendientes',
      value: data?.pending ?? 0,
      hint: 'Asignadas y sin ejecutar',
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} loading={state.loading} {...card} />
      ))}
    </div>
  );
};

/** RF-M8-15 exige que los datos de demostración se declaren de forma visible
 * cuando se incluyen en un recuento. */
const DemoNotice = (): React.JSX.Element => (
  <div className="flex items-center gap-2.5 px-1">
    <Info
      className="size-3.5 shrink-0 text-muted-foreground"
      aria-hidden="true"
    />
    <p className="text-xs text-muted-foreground">
      Los recuentos incluyen lotes e inspecciones de demostración. Los
      indicadores del periodo los excluirán por defecto.
    </p>
  </div>
);

const ChartsLoading = (): React.JSX.Element => (
  <div
    className="dashboard-chart-grid"
    aria-label="Cargando indicadores visuales"
  >
    {[0, 1].map((item) => (
      <Card className="dashboard-chart-card" key={item}>
        <CardContent>
          <div className="dashboard-chart-skeleton" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const RecentRow = ({
  item,
}: {
  readonly item: InspectionItem;
}): React.JSX.Element => (
  <Link
    className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0 hover:text-foreground"
    to={`/inspecciones/${item.id}`}
  >
    <span className="min-w-0">
      <strong className="block truncate text-sm font-semibold">
        {item.code}
      </strong>
      <small className="block truncate text-xs text-muted-foreground">
        {item.batch.code} · {item.stage.name}
      </small>
    </span>
    <span className="flex shrink-0 items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {statusLabel[item.status]}
      </span>
      <ArrowUpRight
        className="size-3.5 text-muted-foreground"
        aria-hidden="true"
      />
    </span>
  </Link>
);

const RecentPanel = ({
  state,
}: {
  readonly state: DashboardState;
}): React.JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Actividad reciente</CardTitle>
      <CardDescription>Últimas inspecciones registradas.</CardDescription>
    </CardHeader>
    <CardContent className="pt-0">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.data?.recent.length === 0 && !state.loading ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay inspecciones registradas.
        </p>
      ) : null}
      {state.data?.recent.map((item) => (
        <RecentRow item={item} key={item.id} />
      ))}
    </CardContent>
  </Card>
);

interface ModuleDefinition {
  readonly copy: string;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly to: string | undefined;
}

const ModuleRow = ({
  copy,
  icon: Icon,
  title,
  to,
}: ModuleDefinition): React.JSX.Element => (
  <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
    <Icon
      className="size-4 shrink-0 text-muted-foreground"
      aria-hidden="true"
    />
    <span className="min-w-0 flex-1">
      <strong className="block text-sm font-semibold">{title}</strong>
      <small className="block text-xs text-muted-foreground">{copy}</small>
    </span>
    {to ? (
      <Button asChild variant="ghost" size="sm">
        <Link to={to}>Abrir</Link>
      </Button>
    ) : (
      <Badge variant="outline">Restringido</Badge>
    )}
  </div>
);

const modulesFor = (canManage: boolean): readonly ModuleDefinition[] => [
  {
    icon: ShieldCheck,
    title: 'Seguridad y maestros',
    copy: 'Roles, catálogos y estándares versionados.',
    to: canManage ? '/configuracion/maestros' : undefined,
  },
  {
    icon: PackageSearch,
    title: 'Trazabilidad de lotes',
    copy: 'Composición, etapas y ficha QR.',
    to: '/lotes',
  },
  {
    icon: ClipboardCheck,
    title: 'Inspecciones',
    copy: 'Programación, calendario y ejecución.',
    to: '/inspecciones',
  },
  {
    icon: FlaskConical,
    title: 'Control fisicoquímico',
    copy: 'Resultados inmutables y no conformidades.',
    to: '/analisis',
  },
];

const ModulePanel = ({
  canManage,
}: {
  readonly canManage: boolean;
}): React.JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Módulos</CardTitle>
      <CardDescription>Acceso según su rol.</CardDescription>
    </CardHeader>
    <CardContent>
      {modulesFor(canManage).map((module) => (
        <ModuleRow key={module.title} {...module} />
      ))}
    </CardContent>
  </Card>
);

export const HomePage = (): React.JSX.Element => {
  const { request, user } = useAuth();
  const state = useDashboard(request);
  return (
    <div className="space-y-5">
      <DashboardHeader name={user?.firstName ?? 'equipo'} state={state} />
      <StatRow state={state} />
      {state.data?.demo ? <DemoNotice /> : null}
      {state.data ? (
        <Suspense fallback={<ChartsLoading />}>
          <DashboardCharts data={state.data} />
        </Suspense>
      ) : state.loading ? (
        <ChartsLoading />
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentPanel state={state} />
        <ModulePanel
          canManage={
            user?.permissions.includes(Permission.MASTERS_MANAGE) ?? false
          }
        />
      </div>
    </div>
  );
};
