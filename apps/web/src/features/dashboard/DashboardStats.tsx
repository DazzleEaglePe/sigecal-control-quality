import {
  AlertTriangle,
  CalendarClock,
  ChartNoAxesCombined,
  Clock3,
} from 'lucide-react';

import type { ReportsDashboard } from '@sigecal/shared';

import { StatCard } from './StatCard.js';
import type { DashboardState } from './useDashboard.js';

type CardDefinition = Omit<Parameters<typeof StatCard>[0], 'loading'>;

const metric = (value: number | null, unit = '%'): string =>
  value === null ? 'Sin datos' : `${String(value)}${unit}`;

const countHint = (
  first: number,
  middle: string,
  second: number,
  end: string,
) => `${String(first)} ${middle} · ${String(second)} ${end}`;

const conformityCard = (data?: ReportsDashboard): CardDefinition => ({
  icon: ChartNoAxesCombined,
  label: 'Conformidad',
  value: metric(data?.conformityRate.value ?? null),
  hint: countHint(
    data?.conformityRate.conforming ?? 0,
    'conformes de',
    data?.conformityRate.total ?? 0,
    'resultados',
  ),
});

const scheduleCard = (data?: ReportsDashboard): CardDefinition => ({
  icon: CalendarClock,
  label: 'Cumplimiento',
  value: metric(data?.scheduleCompliance.value ?? null),
  hint: countHint(
    data?.scheduleCompliance.onTime ?? 0,
    'puntuales',
    data?.scheduleCompliance.late ?? 0,
    'tardías',
  ),
});

const responseCard = (data?: ReportsDashboard): CardDefinition => ({
  icon: Clock3,
  label: 'Tiempo de respuesta',
  value: metric(data?.avgResponseTime.hours ?? null, ' h'),
  hint: countHint(
    data?.avgResponseTime.attended ?? 0,
    'atendidas',
    data?.avgResponseTime.unattended ?? 0,
    'pendientes',
  ),
});

const nonConformityCard = (data?: ReportsDashboard): CardDefinition => {
  const open = data?.openNonConformities;
  return {
    icon: AlertTriangle,
    label: 'NC abiertas',
    value: open
      ? Object.values(open).reduce((sum, count) => sum + count, 0)
      : 0,
    hint: countHint(
      open?.CRITICA ?? 0,
      'críticas',
      open?.MODERADA ?? 0,
      'moderadas',
    ),
  };
};

export const DashboardStats = ({
  state,
}: {
  readonly state: DashboardState;
}): React.JSX.Element => {
  const cards = [
    conformityCard(state.data),
    scheduleCard(state.data),
    responseCard(state.data),
    nonConformityCard(state.data),
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} loading={state.loading} {...card} />
      ))}
    </div>
  );
};
