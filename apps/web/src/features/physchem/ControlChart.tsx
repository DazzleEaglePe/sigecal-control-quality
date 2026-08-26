import type { PhysChemControlChart } from '@sigecal/shared';

const WIDTH = 760;
const HEIGHT = 260;
const PADDING = 34;

const yRange = (chart: PhysChemControlChart): readonly [number, number] => {
  const values = [
    ...chart.points.map((point) => point.value),
    chart.lowerControlLimit,
    chart.upperControlLimit,
  ].filter((value): value is number => value !== null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const margin =
    max === min ? Math.max(1, Math.abs(max) * 0.1) : (max - min) * 0.12;
  return [min - margin, max + margin];
};

const pointCoordinates = (
  chart: PhysChemControlChart,
): readonly { readonly x: number; readonly y: number }[] => {
  const [min, max] = yRange(chart);
  return chart.points.map((point, index) => ({
    x:
      PADDING +
      (index / Math.max(1, chart.points.length - 1)) * (WIDTH - PADDING * 2),
    y: PADDING + ((max - point.value) / (max - min)) * (HEIGHT - PADDING * 2),
  }));
};

const limitY = (
  chart: PhysChemControlChart,
  value: number | null,
): number | undefined => {
  if (value === null) return undefined;
  const [min, max] = yRange(chart);
  return PADDING + ((max - value) / (max - min)) * (HEIGHT - PADDING * 2);
};

const LimitLine = ({
  y,
  label,
}: {
  readonly y: number | undefined;
  readonly label: string;
}): React.JSX.Element | null =>
  y === undefined ? null : (
    <g className="control-limit">
      <line x1={PADDING} x2={WIDTH - PADDING} y1={y} y2={y} />
      <text x={WIDTH - PADDING} y={y - 5}>
        {label}
      </text>
    </g>
  );

const ChartSvg = ({
  chart,
}: {
  readonly chart: PhysChemControlChart;
}): React.JSX.Element => {
  const coordinates = pointCoordinates(chart);
  const path = coordinates
    .map((point) => `${String(point.x)},${String(point.y)}`)
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      role="img"
      aria-label="Gráfico de control fisicoquímico"
    >
      <LimitLine y={limitY(chart, chart.upperControlLimit)} label="LSC" />
      <LimitLine y={limitY(chart, chart.centerLine)} label="Media" />
      <LimitLine y={limitY(chart, chart.lowerControlLimit)} label="LIC" />
      <polyline className="control-series" points={path} />
      {coordinates.map((point, index) => (
        <circle
          className={chart.points[index]?.outOfControl ? 'is-alert' : ''}
          key={`${String(point.x)}-${String(index)}`}
          cx={point.x}
          cy={point.y}
          r="5"
        >
          <title>
            {chart.points[index]?.batchCode}: {chart.points[index]?.value}
          </title>
        </circle>
      ))}
    </svg>
  );
};

export const ControlChart = ({
  chart,
}: {
  readonly chart: PhysChemControlChart;
}): React.JSX.Element => {
  if (chart.points.length === 0)
    return (
      <p className="quality-empty">
        No existen mediciones comparables para esta selección.
      </p>
    );
  return (
    <figure className="control-chart">
      <ChartSvg chart={chart} />
      <figcaption>
        {chart.sufficientData
          ? `Límites calculados con ${String(chart.sampleSize)} mediciones.`
          : `Muestra insuficiente: ${String(chart.sampleSize)} de 8 mediciones mínimas.`}
      </figcaption>
    </figure>
  );
};
