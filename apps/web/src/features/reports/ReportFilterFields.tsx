import type { ReactNode } from 'react';
import type { ExcelReport } from './reports-api.js';
import type { ReportMasters } from './useReportMasters.js';
import { Input } from '../../components/ui/input.js';
import { NativeSelect } from '../../components/ui/native-select.js';

const SelectField = ({
  label,
  name,
  children,
}: {
  readonly label: string;
  readonly name: string;
  readonly children: ReactNode;
}) => (
  <label className="grid gap-1.5 text-xs text-muted-foreground">
    {label}
    <NativeSelect name={name}>{children}</NativeSelect>
  </label>
);

const CommonFields = ({ masters }: { readonly masters: ReportMasters }) => (
  <>
    <label className="grid gap-1.5 text-xs text-muted-foreground">
      Desde
      <Input type="date" name="dateFrom" />
    </label>
    <label className="grid gap-1.5 text-xs text-muted-foreground">
      Hasta
      <Input type="date" name="dateTo" />
    </label>
    <SelectField label="Lote" name="batchId">
      <option value="">Todos los lotes</option>
      {masters.batches.map((batch) => (
        <option key={batch.id} value={batch.id}>
          {batch.code}
        </option>
      ))}
    </SelectField>
  </>
);

const StageField = ({ masters }: { readonly masters: ReportMasters }) => (
  <SelectField label="Etapa" name="stageId">
    <option value="">Todas las etapas</option>
    {masters.stages.map((stage) => (
      <option key={stage.id} value={stage.id}>
        {stage.name}
      </option>
    ))}
  </SelectField>
);

const InspectionFields = ({ masters }: { readonly masters: ReportMasters }) => (
  <>
    <StageField masters={masters} />
    <SelectField label="Responsable" name="responsibleId">
      <option value="">Todos los responsables</option>
      {masters.users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.firstName} {user.lastName}
        </option>
      ))}
    </SelectField>
    <SelectField label="Estado" name="status">
      <option value="">Todos los estados</option>
      <option value="PROGRAMADA">Programada</option>
      <option value="EN_PROCESO">En proceso</option>
      <option value="COMPLETADA">Completada</option>
      <option value="VENCIDA">Vencida</option>
      <option value="CANCELADA">Cancelada</option>
      <option value="REPROGRAMADA">Reprogramada</option>
    </SelectField>
    <SelectField label="Tipo" name="type">
      <option value="">Todos los tipos</option>
      <option value="FISICOQUIMICO">Fisicoquímico</option>
      <option value="ORGANOLEPTICO">Organoléptico</option>
    </SelectField>
  </>
);

const NonConformityFields = ({
  masters,
}: {
  readonly masters: ReportMasters;
}) => (
  <>
    <StageField masters={masters} />
    <SelectField label="Asignado a" name="assignedToId">
      <option value="">Todos los responsables</option>
      {masters.users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.firstName} {user.lastName}
        </option>
      ))}
    </SelectField>
    <SelectField label="Área" name="assignedAreaId">
      <option value="">Todas las áreas</option>
      {masters.areas.map((area) => (
        <option key={area.id} value={area.id}>
          {area.name}
        </option>
      ))}
    </SelectField>
    <SelectField label="Estado" name="status">
      <option value="">Todos los estados</option>
      <option value="ABIERTA">Abierta</option>
      <option value="EN_ANALISIS">En análisis</option>
      <option value="EN_TRATAMIENTO">En tratamiento</option>
      <option value="EN_VERIFICACION">En verificación</option>
      <option value="CERRADA">Cerrada</option>
      <option value="ANULADA">Anulada</option>
    </SelectField>
    <SelectField label="Severidad" name="severity">
      <option value="">Todas las severidades</option>
      <option value="LEVE">Leve</option>
      <option value="MODERADA">Moderada</option>
      <option value="CRITICA">Crítica</option>
    </SelectField>
  </>
);

const ResultFields = ({ masters }: { readonly masters: ReportMasters }) => (
  <>
    <SelectField label="Parámetro" name="parameterId">
      <option value="">Todos los parámetros</option>
      {masters.parameters.map((parameter) => (
        <option key={parameter.id} value={parameter.id}>
          {parameter.name}
        </option>
      ))}
    </SelectField>
    <SelectField label="Estado" name="status">
      <option value="">Todos los estados</option>
      <option value="CONFORME">Conforme</option>
      <option value="NO_CONFORME">No conforme</option>
      <option value="ANULADO">Anulado</option>
    </SelectField>
    <label className="grid gap-1.5 text-xs text-muted-foreground">
      ID de inspección
      <Input name="inspectionId" placeholder="Filtro opcional" />
    </label>
  </>
);

export const ReportFilterFields = ({
  report,
  masters,
}: {
  readonly report: ExcelReport;
  readonly masters: ReportMasters;
}) => (
  <>
    <CommonFields masters={masters} />
    {report === 'inspections' ? <InspectionFields masters={masters} /> : null}
    {report === 'nonconformities' ? (
      <NonConformityFields masters={masters} />
    ) : null}
    {report === 'results' ? <ResultFields masters={masters} /> : null}
  </>
);
