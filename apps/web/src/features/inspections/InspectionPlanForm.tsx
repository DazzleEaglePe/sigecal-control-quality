import { useMemo, useState, type SyntheticEvent } from 'react';
import { CalendarRange, CheckCircle2, Layers3 } from 'lucide-react';
import {
  CreateInspectionPlanRequestSchema,
  type InspectionTemplateItem,
  type Role,
} from '@sigecal/shared';
import { toast } from 'sonner';

import { useConfirm } from '../../components/ui/use-confirm.js';
import { NativeSelect } from '../../components/ui/native-select.js';
import { errorMessage } from '../admin/admin-ui.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { createInspectionPlan } from './inspections-api.js';
import type { InspectionMasters } from './useInspections.js';

interface Props {
  readonly request: AuthorizedRequest;
  readonly masters: InspectionMasters;
  readonly completed: () => void;
}
const roleLabel: Readonly<Record<Role, string>> = {
  ADMIN: 'Administrador',
  JEFE_CALIDAD: 'Jefe de calidad',
  ANALISTA: 'Analista',
  OPERARIO: 'Operario',
};

const TemplateSummary = ({
  template,
}: {
  readonly template: InspectionTemplateItem | undefined;
}): React.JSX.Element => {
  if (!template)
    return (
      <p className="quality-empty">
        Seleccione una plantilla para revisar su plan.
      </p>
    );
  return (
    <div className="template-summary">
      <div>
        <span>{template.code}</span>
        <strong>{template.name}</strong>
        <small>{template.piscoType.name}</small>
      </div>
      <ul>
        {template.items.map((item) => (
          <li key={item.id}>
            <span>
              <Layers3 aria-hidden="true" />
            </span>
            <div>
              <strong>{item.stage.name}</strong>
              <small>
                Día +{item.offsetDaysFromBatchStart} ·{' '}
                {item.scheduledLocalTime.slice(0, 5)}
              </small>
            </div>
            <em>{roleLabel[item.responsibleRole]}</em>
          </li>
        ))}
      </ul>
    </div>
  );
};

const roleAssignments = (
  template: InspectionTemplateItem | undefined,
  form: FormData,
): Partial<Record<Role, string>> => {
  const result: Partial<Record<Role, string>> = {};
  for (const role of new Set(
    template?.items.map((item) => item.responsibleRole),
  )) {
    const value = form.get(`role-${role}`);
    if (typeof value === 'string' && value) result[role] = value;
  }
  return result;
};

const planInputFrom = (
  template: InspectionTemplateItem | undefined,
  templateId: string,
  form: FormData,
) =>
  CreateInspectionPlanRequestSchema.parse({
    batchId: form.get('batchId'),
    templateId,
    responsibleByRole: roleAssignments(template, form),
  });

interface PlanState {
  readonly template: InspectionTemplateItem | undefined;
  readonly templateId: string;
  readonly roles: readonly Role[];
  readonly saving: boolean;
  readonly error: string | undefined;
  readonly changeTemplate: (id: string) => void;
  readonly submit: (event: SyntheticEvent<HTMLFormElement>) => Promise<void>;
}

const usePlanForm = ({ request, masters, completed }: Props): PlanState => {
  const confirm = useConfirm();
  const [templateId, changeTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const template = masters.templates.find((item) => item.id === templateId);
  const roles = useMemo(
    () => [...new Set(template?.items.map((item) => item.responsibleRole))],
    [template],
  );
  const submit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const input = planInputFrom(template, templateId, form);
      const accepted = await confirm({
        title: 'Generar el plan de inspecciones',
        description:
          'Se crearán todas las inspecciones de la plantilla con las fechas y responsables seleccionados.',
        confirmLabel: 'Generar plan',
      });
      if (!accepted) return;
      setSaving(true);
      await createInspectionPlan(request, input);
      toast.success('Plan de inspecciones generado');
      completed();
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error('No se pudo generar el plan', { description: message });
    } finally {
      setSaving(false);
    }
  };
  return { template, templateId, roles, saving, error, changeTemplate, submit };
};

const PlanSelectors = ({
  masters,
  state,
}: {
  readonly masters: InspectionMasters;
  readonly state: PlanState;
}): React.JSX.Element => (
  <>
    <label>
      Lote
      <NativeSelect name="batchId" required defaultValue="">
        <option value="">Seleccione un lote</option>
        {masters.batches.map((batch) => (
          <option key={batch.id} value={batch.id}>
            {batch.code}
          </option>
        ))}
      </NativeSelect>
    </label>
    <label>
      Plantilla vigente
      <NativeSelect
        value={state.templateId}
        required
        onChange={(event) => {
          state.changeTemplate(event.target.value);
        }}
      >
        <option value="">Seleccione una plantilla</option>
        {masters.templates.map((item) => (
          <option key={item.id} value={item.id}>
            {item.code} · {item.name}
          </option>
        ))}
      </NativeSelect>
    </label>
  </>
);

const RoleFields = ({
  masters,
  roles,
}: {
  readonly masters: InspectionMasters;
  readonly roles: readonly Role[];
}): React.JSX.Element => (
  <>
    {roles.map((role) => (
      <label key={role}>
        Responsable · {roleLabel[role]}
        <NativeSelect name={`role-${role}`} required defaultValue="">
          <option value="">Seleccione una persona</option>
          {masters.users
            .filter((user) => user.isActive && user.role === role)
            .map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
        </NativeSelect>
      </label>
    ))}
  </>
);

const PlanHeading = (): React.JSX.Element => (
  <div className="quality-panel-heading">
    <div>
      <span className="quality-kicker">Plan por lote</span>
      <h2>Generar desde plantilla</h2>
    </div>
    <CalendarRange />
  </div>
);

const PlanFormCard = ({
  masters,
  state,
}: {
  readonly masters: InspectionMasters;
  readonly state: PlanState;
}): React.JSX.Element => (
  <form
    className="quality-panel quality-form"
    onSubmit={(event) => {
      void state.submit(event);
    }}
  >
    <PlanHeading />
    <PlanSelectors masters={masters} state={state} />
    <RoleFields masters={masters} roles={state.roles} />
    <div className="quality-callout">
      <CheckCircle2 />
      <p>
        Las fechas se calcularán desde el inicio del lote en la zona horaria de
        Lima.
      </p>
    </div>
    {state.error ? (
      <p className="form-error" role="alert">
        {state.error}
      </p>
    ) : null}
    <button
      className="primary-button"
      type="submit"
      disabled={state.saving || !state.template}
    >
      {state.saving ? 'Generando…' : 'Confirmar plan completo'}
    </button>
  </form>
);

const PlanPreview = ({
  template,
}: Pick<PlanState, 'template'>): React.JSX.Element => (
  <section className="quality-panel">
    <div className="quality-panel-heading">
      <div>
        <span className="quality-kicker">Vista previa</span>
        <h2>Secuencia de controles</h2>
      </div>
    </div>
    <TemplateSummary template={template} />
  </section>
);

export const InspectionPlanForm = (props: Props): React.JSX.Element => {
  const state = usePlanForm(props);
  return (
    <div className="quality-plan-layout">
      <PlanFormCard masters={props.masters} state={state} />
      <PlanPreview template={state.template} />
    </div>
  );
};
