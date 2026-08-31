import { useState, type SyntheticEvent } from 'react';
import { CalendarPlus, Check } from 'lucide-react';
import {
  CreateInspectionRequestSchema,
  type CreateInspectionRequest,
} from '@sigecal/shared';
import { toast } from 'sonner';

import { useConfirm } from '../../components/ui/use-confirm.js';
import { Input } from '../../components/ui/input.js';
import { NativeSelect } from '../../components/ui/native-select.js';
import { Textarea } from '../../components/ui/textarea.js';
import { errorMessage } from '../admin/admin-ui.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { createInspection } from './inspections-api.js';
import { InspectionFormAside } from './InspectionFormAside.js';
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
      Etapa
      <NativeSelect name="stageId" required defaultValue="">
        <option value="">Seleccione una etapa</option>
        {masters.stages
          .filter((stage) => stage.isActive)
          .map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
      </NativeSelect>
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
      <NativeSelect
        name="type"
        value={type}
        onChange={(event) => {
          changeType(event.target.value as InspectionType);
        }}
      >
        <option value="FISICOQUIMICO">Fisicoquímico</option>
        <option value="ORGANOLEPTICO">Organoléptico</option>
      </NativeSelect>
    </label>
    <label>
      Fecha y hora
      <Input name="scheduledDate" type="datetime-local" required />
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
      <NativeSelect name="responsibleId" required defaultValue="">
        <option value="">Seleccione una persona</option>
        {masters.users
          .filter((user) => user.isActive)
          .map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName} · {user.role}
            </option>
          ))}
      </NativeSelect>
    </label>
    <label>
      Equipo{' '}
      {type === 'FISICOQUIMICO' ? '(requerido para iniciar)' : '(opcional)'}
      <NativeSelect name="equipmentId" defaultValue="">
        <option value="">Sin equipo</option>
        {masters.equipment
          .filter((item) => item.isActive)
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.status}
            </option>
          ))}
      </NativeSelect>
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

const createAfterConfirmation = async (
  request: AuthorizedRequest,
  input: CreateInspectionRequest,
  confirm: ReturnType<typeof useConfirm>,
): Promise<string | undefined> => {
  const accepted = await confirm({
    title: 'Programar inspección',
    description:
      'Revise que el lote, la fecha, el responsable y los parámetros sean correctos. La programación quedará auditada.',
    confirmLabel: 'Programar inspección',
  });
  if (!accepted) return undefined;
  const result = await createInspection(request, input);
  toast.success('Inspección programada correctamente', {
    description: 'Ya está disponible en el calendario y el listado.',
  });
  return result.id;
};

export const InspectionForm = ({
  request,
  masters,
  completed,
}: Props): React.JSX.Element => {
  const [type, setType] = useState<InspectionType>('FISICOQUIMICO');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const confirm = useConfirm();
  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const input = inputFrom(new FormData(event.currentTarget));
      setSaving(true);
      const id = await createAfterConfirmation(request, input, confirm);
      if (id) completed(id);
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error('No se pudo programar la inspección', {
        description: message,
      });
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
      <Textarea
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
      <InspectionFormAside type={props.type} />
    </div>
  );
};
