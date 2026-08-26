import { useState, type SyntheticEvent } from 'react';
import { CalendarPlus, Check, FlaskConical, Info, Wine } from 'lucide-react';
import {
  CreateInspectionRequestSchema,
  type CreateInspectionRequest,
} from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { createInspection } from './inspections-api.js';
import type { InspectionMasters } from './useInspections.js';

interface Props {
  readonly request: AuthorizedRequest;
  readonly masters: InspectionMasters;
  readonly completed: (id: string) => void;
}
type InspectionType = CreateInspectionRequest['type'];

const field = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
};

const inputFrom = (form: FormData): CreateInspectionRequest =>
  CreateInspectionRequestSchema.parse({
    batchId: field(form, 'batchId'),
    stageId: field(form, 'stageId'),
    type: field(form, 'type'),
    scheduledDate: new Date(field(form, 'scheduledDate')).toISOString(),
    responsibleId: field(form, 'responsibleId'),
    equipmentId: field(form, 'equipmentId') || null,
    parameterIds: form
      .getAll('parameterIds')
      .filter((value): value is string => typeof value === 'string'),
    notes: field(form, 'notes').trim() || null,
  });

interface FieldProps {
  readonly masters: InspectionMasters;
  readonly type: InspectionType;
  readonly changeType: (value: InspectionType) => void;
}

const LotAndStageFields = ({
  masters,
}: Pick<FieldProps, 'masters'>): React.JSX.Element => (
  <>
    <label>
      Lote
      <select name="batchId" required>
        <option value="">Seleccione un lote</option>
        {masters.batches.map((batch) => (
          <option key={batch.id} value={batch.id}>
            {batch.code}
          </option>
        ))}
      </select>
    </label>
    <label>
      Etapa
      <select name="stageId" required>
        <option value="">Seleccione una etapa</option>
        {masters.stages
          .filter((stage) => stage.isActive)
          .map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
      </select>
    </label>
  </>
);

const TypeAndDateFields = ({
  type,
  changeType,
}: Omit<FieldProps, 'masters'>): React.JSX.Element => (
  <>
    <label>
      Tipo de inspección
      <select
        name="type"
        value={type}
        onChange={(event) => {
          changeType(event.target.value as InspectionType);
        }}
      >
        <option value="FISICOQUIMICO">Fisicoquímico</option>
        <option value="ORGANOLEPTICO">Organoléptico</option>
      </select>
    </label>
    <label>
      Fecha y hora
      <input name="scheduledDate" type="datetime-local" required />
    </label>
  </>
);

const ContextFields = (props: FieldProps): React.JSX.Element => (
  <>
    <LotAndStageFields masters={props.masters} />
    <TypeAndDateFields type={props.type} changeType={props.changeType} />
  </>
);

const ResourceFields = ({
  masters,
  type,
}: Omit<FieldProps, 'changeType'>): React.JSX.Element => (
  <>
    <label>
      Responsable
      <select name="responsibleId" required>
        <option value="">Seleccione una persona</option>
        {masters.users
          .filter((user) => user.isActive)
          .map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName} · {user.role}
            </option>
          ))}
      </select>
    </label>
    <label>
      Equipo{' '}
      {type === 'FISICOQUIMICO' ? '(requerido para iniciar)' : '(opcional)'}
      <select name="equipmentId">
        <option value="">Sin equipo</option>
        {masters.equipment
          .filter((item) => item.isActive)
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.status}
            </option>
          ))}
      </select>
    </label>
  </>
);

const MainFields = (props: FieldProps): React.JSX.Element => (
  <div className="quality-form-grid">
    <ContextFields {...props} />
    <ResourceFields masters={props.masters} type={props.type} />
  </div>
);

const ParameterPicker = ({
  masters,
  type,
}: {
  readonly masters: InspectionMasters;
  readonly type: InspectionType;
}): React.JSX.Element => {
  const parameters = masters.parameters.filter(
    (parameter) => parameter.isActive && parameter.type === type,
  );
  return (
    <fieldset className="parameter-picker">
      <legend>Parámetros esperados</legend>
      <p>El resultado definitivo solo podrá registrarse para esta selección.</p>
      <div>
        {parameters.map((parameter) => (
          <label key={parameter.id}>
            <input name="parameterIds" type="checkbox" value={parameter.id} />
            <span>
              <strong>{parameter.name}</strong>
              <small>{parameter.unit}</small>
            </span>
            <Check aria-hidden="true" />
          </label>
        ))}
      </div>
      {parameters.length === 0 ? (
        <p className="form-error">No hay parámetros activos para este tipo.</p>
      ) : null}
    </fieldset>
  );
};

const FormAside = ({ type }: { readonly type: InspectionType }) => {
  const Icon = type === 'FISICOQUIMICO' ? FlaskConical : Wine;
  return (
    <aside className="quality-form-aside">
      <span>
        <Icon aria-hidden="true" />
      </span>
      <p className="quality-kicker">Antes de confirmar</p>
      <h2>
        {type === 'FISICOQUIMICO'
          ? 'Control fisicoquímico'
          : 'Evaluación organoléptica'}
      </h2>
      <p>
        Revise la fecha, el responsable, el equipo y cada parámetro esperado. La
        programación quedará auditada.
      </p>
      <ul>
        <li>
          <Info /> El origen de datos se hereda del lote.
        </li>
        <li>
          <Info /> Los estándares se resuelven en el servidor.
        </li>
        <li>
          <Info /> El equipo debe estar operativo al iniciar.
        </li>
      </ul>
    </aside>
  );
};

export const InspectionForm = ({
  request,
  masters,
  completed,
}: Props): React.JSX.Element => {
  const [type, setType] = useState<InspectionType>('FISICOQUIMICO');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const input = inputFrom(new FormData(event.currentTarget));
      if (
        !window.confirm(
          '¿Confirma la programación definitiva de esta inspección?',
        )
      )
        return;
      setSaving(true);
      const result = await createInspection(request, input);
      completed(result.id);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };
  return (
    <InspectionFormView
      masters={masters}
      type={type}
      changeType={setType}
      saving={saving}
      error={error}
      submit={submit}
    />
  );
};

interface FormViewProps extends FieldProps {
  readonly saving: boolean;
  readonly error: string | undefined;
  readonly submit: (event: SyntheticEvent<HTMLFormElement>) => Promise<void>;
}

const InspectionFormBody = (props: FormViewProps): React.JSX.Element => (
  <>
    <div className="quality-panel-heading">
      <div>
        <span className="quality-kicker">Programación individual</span>
        <h2>Datos de la inspección</h2>
      </div>
      <CalendarPlus />
    </div>
    <MainFields
      masters={props.masters}
      type={props.type}
      changeType={props.changeType}
    />
    <ParameterPicker masters={props.masters} type={props.type} />
    <label>
      Notas operativas
      <textarea
        name="notes"
        rows={3}
        placeholder="Información útil para la ejecución"
      />
    </label>
    {props.error ? (
      <p className="form-error" role="alert">
        {props.error}
      </p>
    ) : null}
    <button className="primary-button" type="submit" disabled={props.saving}>
      {props.saving ? 'Programando…' : 'Revisar y programar'}
    </button>
  </>
);

const InspectionFormView = (props: FormViewProps): React.JSX.Element => {
  return (
    <div className="quality-form-layout">
      <form
        className="quality-panel quality-form"
        onSubmit={(event) => {
          void props.submit(event);
        }}
      >
        <InspectionFormBody {...props} />
      </form>
      <FormAside type={props.type} />
    </div>
  );
};
