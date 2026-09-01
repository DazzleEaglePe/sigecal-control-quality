import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SensoryProfile } from '@sigecal/shared';
const colors = ['#0f8a5f', '#6d5dfc', '#e08b2c', '#2683ff'];
const radarData = (profiles: readonly SensoryProfile[]) =>
  (profiles[0]?.points ?? []).map((point) => ({
    attribute: point.attribute.name,
    ...Object.fromEntries(
      profiles.map((profile) => [
        profile.sessionId,
        profile.points.find(
          ({ attribute }) => attribute.id === point.attribute.id,
        )?.average ?? 0,
      ]),
    ),
  }));
const RadarSeries = ({
  profiles,
}: {
  readonly profiles: readonly SensoryProfile[];
}) => (
  <>
    {profiles.map((profile, index) => (
      <Radar
        key={profile.sessionId}
        name={profile.batchCode}
        dataKey={profile.sessionId}
        stroke={colors[index % colors.length]}
        fill={colors[index % colors.length]}
        fillOpacity={profiles.length === 1 ? 0.28 : 0.1}
      />
    ))}
  </>
);

export const SensoryRadar = ({
  profiles,
}: {
  readonly profiles: readonly SensoryProfile[];
}): React.JSX.Element => {
  return (
    <div
      className="sensory-radar"
      role="img"
      aria-label="Perfil sensorial promedio por atributo"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData(profiles)} outerRadius="72%">
          <PolarGrid />
          <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 5]} tickCount={6} />
          <Tooltip formatter={(value) => Number(value).toFixed(2)} />
          <RadarSeries profiles={profiles} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
