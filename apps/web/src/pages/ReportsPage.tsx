import { useState, type SyntheticEvent } from 'react';
import {
  ClipboardCheck,
  Database,
  Download,
  FileSpreadsheet,
  FlaskConical,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@sigecal/shared';

import { Button } from '../components/ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import { errorMessage } from '../features/admin/admin-ui.js';
import { useAuth } from '../features/auth/useAuth.js';
import {
  downloadExcelReport,
  type ExcelReport,
} from '../features/reports/reports-api.js';
import { ReportFilterFields } from '../features/reports/ReportFilterFields.js';
import { reportQueryFrom } from '../features/reports/report-query.js';
import {
  useReportMasters,
  type ReportMasters,
} from '../features/reports/useReportMasters.js';

interface ReportDefinition {
  readonly copy: string;
  readonly icon: LucideIcon;
  readonly report: ExcelReport;
  readonly title: string;
}

const definitions: readonly ReportDefinition[] = [
  {
    report: 'inspections',
    icon: ClipboardCheck,
    title: 'Inspecciones',
    copy: 'Programación, ejecución, responsables y estados por periodo.',
  },
  {
    report: 'nonconformities',
    icon: TriangleAlert,
    title: 'No conformidades y acciones',
    copy: 'Incidencias con su tratamiento y acciones correctivas asociadas.',
  },
  {
    report: 'results',
    icon: FlaskConical,
    title: 'Resultados por parámetro',
    copy: 'Mediciones fisicoquímicas, estándar aplicado y conformidad.',
  },
];

const ReportCardHeading = ({
  definition,
}: {
  readonly definition: ReportDefinition;
}) => {
  const Icon = definition.icon;
  return (
    <CardHeader>
      <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <CardTitle>{definition.title}</CardTitle>
      <CardDescription>{definition.copy}</CardDescription>
    </CardHeader>
  );
};

const DemoOption = (): React.JSX.Element => (
  <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm sm:col-span-2">
    <input type="checkbox" name="includeDemo" />
    <Database className="size-4 text-muted-foreground" aria-hidden="true" />
    Incluir datos DEMO
  </label>
);

const ReportCard = ({
  canIncludeDemo,
  definition,
  loading,
  masters,
  onDownload,
}: {
  readonly canIncludeDemo: boolean;
  readonly definition: ReportDefinition;
  readonly loading: boolean;
  readonly masters: ReportMasters;
  readonly onDownload: (report: ExcelReport, form: FormData) => Promise<void>;
}) => {
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void onDownload(definition.report, new FormData(event.currentTarget));
  };
  return (
    <Card>
      <ReportCardHeading definition={definition} />
      <form onSubmit={submit}>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <ReportFilterFields report={definition.report} masters={masters} />
          {canIncludeDemo ? <DemoOption /> : null}
        </CardContent>
        <CardFooter className="mt-5">
          <Button className="w-full" type="submit" disabled={loading}>
            <Download aria-hidden="true" />{' '}
            {loading ? 'Generando…' : 'Descargar Excel'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const ReportsHeader = (): React.JSX.Element => (
  <header className="page-heading">
    <div>
      <p className="eyebrow">Evidencia operativa</p>
      <h1>Reportes</h1>
      <p>
        Configure los filtros antes de descargar. Cada exportación queda
        registrada en auditoría.
      </p>
    </div>
    <FileSpreadsheet className="size-10 text-primary" aria-hidden="true" />
  </header>
);

const ReportsGrid = ({
  canIncludeDemo,
  loading,
  masters,
  onDownload,
}: {
  readonly canIncludeDemo: boolean;
  readonly loading: ExcelReport | undefined;
  readonly masters: ReportMasters;
  readonly onDownload: (report: ExcelReport, form: FormData) => Promise<void>;
}) => (
  <div className="grid gap-4 xl:grid-cols-3">
    {definitions.map((definition) => (
      <ReportCard
        key={definition.report}
        definition={definition}
        masters={masters}
        canIncludeDemo={canIncludeDemo}
        loading={loading === definition.report}
        onDownload={onDownload}
      />
    ))}
  </div>
);

const MastersStatus = ({
  error,
  loading,
}: {
  readonly error: string | undefined;
  readonly loading: boolean;
}) => (
  <>
    {error ? (
      <p className="form-error" role="alert">
        {error}
      </p>
    ) : null}
    {loading ? (
      <p className="text-sm text-muted-foreground">Cargando filtros…</p>
    ) : null}
  </>
);

export const ReportsPage = (): React.JSX.Element => {
  const { request, requestBlob, user } = useAuth();
  const masters = useReportMasters(request);
  const [loading, setLoading] = useState<ExcelReport>();
  const canIncludeDemo =
    user?.role === Role.ADMIN || user?.role === Role.JEFE_CALIDAD;
  const download = async (report: ExcelReport, form: FormData) => {
    setLoading(report);
    try {
      await downloadExcelReport(
        requestBlob,
        report,
        reportQueryFrom(report, form, canIncludeDemo),
      );
      toast.success('Reporte Excel generado correctamente.');
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setLoading(undefined);
    }
  };
  return (
    <div className="space-y-5">
      <ReportsHeader />
      <MastersStatus error={masters.error} loading={masters.loading} />
      <ReportsGrid
        canIncludeDemo={canIncludeDemo}
        loading={loading}
        masters={masters.data}
        onDownload={download}
      />
    </div>
  );
};
