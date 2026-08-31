import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { EmptyState } from '../../components/ui/empty-state.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.js';
import type {
  DashboardData,
  StageDatum,
  StatusDatum,
} from './dashboard-data.js';

const statusColors: Readonly<Record<StatusDatum['status'], string>> = {
  PROGRAMADA: 'var(--foreground)',
  EN_PROCESO: 'var(--warning)',
  COMPLETADA: 'var(--success)',
  VENCIDA: 'var(--destructive)',
  CANCELADA: 'var(--muted-foreground)',
  REPROGRAMADA: 'var(--input)',
};

const tooltipStyle = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '0.65rem',
  color: 'var(--foreground)',
  fontSize: '0.75rem',
} as const;

const StageBars = ({ data }: { readonly data: readonly StageDatum[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      accessibilityLayer
      data={[...data]}
      layout="vertical"
      margin={{ top: 8, right: 38, bottom: 8, left: 10 }}
    >
      <CartesianGrid horizontal={false} stroke="var(--border)" />
      <XAxis
        type="number"
        allowDecimals={false}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        type="category"
        dataKey="name"
        width={105}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)' }} />
      <Bar
        dataKey="count"
        name="Lotes activos"
        fill="var(--foreground)"
        radius={[0, 5, 5, 0]}
        isAnimationActive={false}
      >
        <LabelList dataKey="count" position="right" fill="var(--foreground)" />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

const StagePanel = ({ data }: { readonly data: readonly StageDatum[] }) => (
  <Card className="dashboard-chart-card">
    <CardHeader>
      <CardTitle className="text-base">Lotes activos por etapa</CardTitle>
      <CardDescription>
        Distribución actual del proceso productivo accesible al usuario.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {data.length === 0 ? (
        <EmptyState
          title="Sin lotes activos"
          description="Los lotes cerrados o rechazados no forman parte de esta distribución."
        />
      ) : (
        <div
          className="dashboard-chart-body"
          aria-label="Lotes activos por etapa"
        >
          <StageBars data={data} />
        </div>
      )}
    </CardContent>
  </Card>
);

const StatusLegend = ({ data }: { readonly data: readonly StatusDatum[] }) => (
  <ul className="dashboard-chart-legend" aria-label="Detalle por estado">
    {data.map((item) => (
      <li key={item.status}>
        <span
          style={{ background: statusColors[item.status] }}
          aria-hidden="true"
        />
        <span>{item.label}</span>
        <strong>{item.count}</strong>
      </li>
    ))}
  </ul>
);

const StatusDonut = ({ data }: { readonly data: readonly StatusDatum[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart accessibilityLayer>
      <Tooltip contentStyle={tooltipStyle} />
      <Pie
        data={data.map((item) => ({
          ...item,
          fill: statusColors[item.status],
        }))}
        dataKey="count"
        nameKey="label"
        innerRadius="58%"
        outerRadius="86%"
        paddingAngle={3}
        stroke="var(--card)"
        strokeWidth={3}
        isAnimationActive={false}
      />
    </PieChart>
  </ResponsiveContainer>
);

const StatusPanel = ({ data }: { readonly data: readonly StatusDatum[] }) => (
  <Card className="dashboard-chart-card">
    <CardHeader>
      <CardTitle className="text-base">Estado de las inspecciones</CardTitle>
      <CardDescription>
        Composición de todas las inspecciones visibles para el usuario.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {data.length === 0 ? (
        <EmptyState
          title="Sin inspecciones"
          description="Programe una inspección para visualizar su distribución."
        />
      ) : (
        <div className="dashboard-status-chart">
          <div className="dashboard-donut" aria-label="Inspecciones por estado">
            <StatusDonut data={data} />
          </div>
          <StatusLegend data={data} />
        </div>
      )}
    </CardContent>
  </Card>
);

export const DashboardCharts = ({
  data,
}: {
  readonly data: DashboardData;
}): React.JSX.Element => (
  <section className="dashboard-chart-grid" aria-label="Indicadores visuales">
    <StagePanel data={data.activeBatchesByStage} />
    <StatusPanel data={data.inspectionStatuses} />
  </section>
);
