import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ReportsDashboard } from '@sigecal/shared';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.js';
import { EmptyState } from '../../components/ui/empty-state.js';

const tooltipStyle = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '0.65rem',
  color: 'var(--foreground)',
  fontSize: '0.75rem',
} as const;

const stageData = (data: ReportsDashboard['activeBatchesByStage']) =>
  data.map((item) => ({
    ...item,
    name: item.stageName,
    observation: item.inObservation,
  }));

const ncData = (data: ReportsDashboard['ncByStage']) =>
  data.map((item) => ({ ...item, name: item.stageName }));

const trendData = (data: ReportsDashboard['conformityTrend']) =>
  data.map((item) => ({
    ...item,
    label: new Intl.DateTimeFormat('es-PE', {
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(`${item.month}-01T00:00:00.000Z`)),
  }));

const Grid = (): React.JSX.Element => (
  <CartesianGrid
    vertical={false}
    stroke="var(--border)"
    strokeDasharray="3 3"
  />
);

const StageChart = ({
  data,
}: {
  readonly data: ReportsDashboard['activeBatchesByStage'];
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      accessibilityLayer
      data={stageData(data)}
      layout="vertical"
      margin={{ top: 8, right: 40, bottom: 8, left: 12 }}
    >
      <Grid />
      <XAxis
        type="number"
        allowDecimals={false}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        type="category"
        dataKey="name"
        width={108}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)' }} />
      <Bar
        dataKey="count"
        name="Lotes activos"
        fill="var(--success)"
        radius={[0, 5, 5, 0]}
      >
        <LabelList dataKey="count" position="right" fill="var(--foreground)" />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

const NonConformityChart = ({
  data,
}: {
  readonly data: ReportsDashboard['ncByStage'];
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      accessibilityLayer
      data={ncData(data)}
      margin={{ top: 12, right: 12, left: -20 }}
    >
      <Grid />
      <XAxis dataKey="name" axisLine={false} tickLine={false} />
      <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)' }} />
      <Bar
        dataKey="count"
        name="No conformidades"
        fill="var(--destructive)"
        radius={[5, 5, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
);

const ConformityTrendChart = ({
  data,
}: {
  readonly data: ReportsDashboard['conformityTrend'];
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart
      accessibilityLayer
      data={trendData(data)}
      margin={{ top: 16, right: 18, left: -14 }}
    >
      <Grid />
      <XAxis dataKey="label" axisLine={false} tickLine={false} />
      <YAxis domain={[0, 100]} unit="%" axisLine={false} tickLine={false} />
      <Tooltip
        contentStyle={tooltipStyle}
        formatter={(value) => [`${String(value)}%`, 'Conformidad']}
      />
      <Line
        type="monotone"
        dataKey="rate"
        name="Conformidad"
        stroke="var(--success)"
        strokeWidth={2.5}
        connectNulls={false}
        dot={{ r: 3, fill: 'var(--background)', strokeWidth: 2 }}
      />
    </LineChart>
  </ResponsiveContainer>
);

interface ChartPanelProps {
  readonly children: React.ReactNode;
  readonly description: string;
  readonly empty: boolean;
  readonly emptyDescription: string;
  readonly title: string;
}

const ChartPanel = ({
  children,
  description,
  empty,
  emptyDescription,
  title,
}: ChartPanelProps): React.JSX.Element => (
  <Card className="dashboard-chart-card">
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {empty ? (
        <EmptyState
          title="Sin datos para el periodo"
          description={emptyDescription}
        />
      ) : (
        <div className="dashboard-chart-body" aria-label={title}>
          {children}
        </div>
      )}
    </CardContent>
  </Card>
);

export const DashboardCharts = ({
  data,
}: {
  readonly data: ReportsDashboard;
}): React.JSX.Element => (
  <section className="dashboard-chart-grid" aria-label="Indicadores visuales">
    <ChartPanel
      title="Lotes activos por etapa"
      description="Estado del proceso al cierre del periodo; observaciones incluidas en el detalle."
      empty={data.activeBatchesByStage.length === 0}
      emptyDescription="No existen lotes activos visibles al cierre seleccionado."
    >
      <StageChart data={data.activeBatchesByStage} />
    </ChartPanel>
    <ChartPanel
      title="No conformidades por etapa"
      description="Hallazgos detectados durante el periodo seleccionado."
      empty={data.ncByStage.length === 0}
      emptyDescription="No se detectaron no conformidades en este periodo."
    >
      <NonConformityChart data={data.ncByStage} />
    </ChartPanel>
    <ChartPanel
      title="Tendencia mensual de conformidad"
      description="Porcentaje mensual de resultados finales conformes."
      empty={data.conformityTrend.length === 0}
      emptyDescription="No existen resultados finales para construir la tendencia."
    >
      <ConformityTrendChart data={data.conformityTrend} />
    </ChartPanel>
  </section>
);
