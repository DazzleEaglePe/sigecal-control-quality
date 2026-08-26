import { useState } from 'react';
import { BarChart3, Database, FlaskConical, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '../features/auth/useAuth.js';
import {
  AnalysisFilters,
  type AnalysisFiltersProps,
} from '../features/physchem/AnalysisFilters.js';
import { ControlChart } from '../features/physchem/ControlChart.js';
import { PhysChemResultsTable } from '../features/physchem/PhysChemResultsTable.js';
import {
  type AnalysisSelection,
  useAnalysisMasters,
  useInspectionResults,
  usePhysChemAnalysis,
} from '../features/physchem/usePhysChemAnalysis.js';

const initialSelection: AnalysisSelection = {
  parameterId: '',
  piscoTypeId: '',
  stageId: '',
  includeDemo: false,
};
const ChartMetrics = ({
  center,
  upper,
  lower,
  sample,
}: {
  readonly center: number | null;
  readonly upper: number | null;
  readonly lower: number | null;
  readonly sample: number;
}): React.JSX.Element => (
  <div className="chart-metrics">
    <span>
      <small>Media</small>
      <strong>{center?.toFixed(3) ?? '—'}</strong>
    </span>
    <span>
      <small>Límite superior</small>
      <strong>{upper?.toFixed(3) ?? '—'}</strong>
    </span>
    <span>
      <small>Límite inferior</small>
      <strong>{lower?.toFixed(3) ?? '—'}</strong>
    </span>
    <span>
      <small>Muestra</small>
      <strong>{sample}</strong>
    </span>
  </div>
);

const AnalysisHeader = (): React.JSX.Element => (
  <header className="page-heading quality-heading">
    <div>
      <p className="eyebrow">Evidencia y tendencias</p>
      <h1>Análisis fisicoquímico</h1>
      <p>Consulte resultados históricos y detecte señales fuera de control.</p>
    </div>
    <span className="phase-badge">
      <ShieldCheck /> Solo resultados finales vigentes
    </span>
  </header>
);

const InspectionResultsPanel = ({
  results,
}: {
  readonly results: ReturnType<typeof useInspectionResults>;
}): React.JSX.Element => (
  <section className="quality-panel">
    <div className="quality-panel-heading">
      <div>
        <span className="quality-kicker">Inspección seleccionada</span>
        <h2>Resultados registrados</h2>
      </div>
      <FlaskConical />
    </div>
    {results.error ? <p className="form-error">{results.error}</p> : null}
    <PhysChemResultsTable items={results.items} />
  </section>
);

const ConfigurationPanel = (
  props: AnalysisFiltersProps & { readonly error: string | undefined },
): React.JSX.Element => (
  <section className="quality-panel">
    <div className="quality-panel-heading">
      <div>
        <span className="quality-kicker">Comparabilidad controlada</span>
        <h2>Configurar análisis</h2>
      </div>
      <Database />
    </div>
    {props.error ? <p className="form-error">{props.error}</p> : null}
    <AnalysisFilters {...props} />
  </section>
);

const ChartPanel = ({
  chart,
}: {
  readonly chart: NonNullable<ReturnType<typeof usePhysChemAnalysis>['chart']>;
}): React.JSX.Element => (
  <section className="quality-panel">
    <div className="quality-panel-heading">
      <div>
        <span className="quality-kicker">Media y límites ±3σ</span>
        <h2>Gráfico de control</h2>
      </div>
      <BarChart3 />
    </div>
    <ChartMetrics
      center={chart.centerLine}
      upper={chart.upperControlLimit}
      lower={chart.lowerControlLimit}
      sample={chart.sampleSize}
    />
    <ControlChart chart={chart} />
  </section>
);

const HistoryPanel = ({
  items,
}: {
  readonly items: ReturnType<typeof usePhysChemAnalysis>['items'];
}): React.JSX.Element => (
  <section className="quality-panel">
    <div className="quality-panel-heading">
      <div>
        <span className="quality-kicker">Histórico real</span>
        <h2>Mediciones comparables</h2>
      </div>
    </div>
    <PhysChemResultsTable items={items} />
  </section>
);

export const PhysChemAnalysisPage = (): React.JSX.Element => {
  const { request, user } = useAuth();
  const [search] = useSearchParams();
  const inspectionId = search.get('inspectionId');
  const inspectionResults = useInspectionResults(request, inspectionId);
  const masters = useAnalysisMasters(request);
  const analysis = usePhysChemAnalysis(request);
  const [selection, setSelection] = useState(initialSelection);
  const canIncludeDemo =
    user?.role === 'ADMIN' || user?.role === 'JEFE_CALIDAD';
  const submit = (): void => {
    void analysis.load(selection);
  };
  return (
    <div className="page-stack quality-page">
      <AnalysisHeader />
      {inspectionId ? (
        <InspectionResultsPanel results={inspectionResults} />
      ) : null}
      <ConfigurationPanel
        selection={selection}
        setSelection={setSelection}
        masters={masters.data}
        canIncludeDemo={canIncludeDemo}
        submit={submit}
        error={masters.error}
      />
      {analysis.error ? <p className="form-error">{analysis.error}</p> : null}
      {analysis.loading ? (
        <section className="quality-panel">
          <p>Calculando gráfico de control…</p>
        </section>
      ) : null}
      {analysis.chart ? <ChartPanel chart={analysis.chart} /> : null}
      {analysis.items.length > 0 ? (
        <HistoryPanel items={analysis.items} />
      ) : null}
    </div>
  );
};
