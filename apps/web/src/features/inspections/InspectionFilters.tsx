import type { SyntheticEvent } from 'react';
import type { InspectionListQuery } from '@sigecal/shared';

import { Input } from '../../components/ui/input.js';
import { NativeSelect } from '../../components/ui/native-select.js';
import type { InspectionMasters } from './useInspections.js';

interface Props {
  readonly query: InspectionListQuery;
  readonly masters: Pick<InspectionMasters, 'stages' | 'users'>;
  readonly apply: (query: InspectionListQuery) => void;
}

const value = (form: FormData, name: string): string | undefined => {
  const entry = form.get(name);
  return typeof entry === 'string' && entry !== '' ? entry : undefined;
};
const limaBoundary = (
  date: string | undefined,
  boundary: 'start' | 'end',
): string | undefined =>
  date
    ? `${date}T${boundary === 'start' ? '00:00:00' : '23:59:59'}-05:00`
    : undefined;

const queryFrom = (form: FormData, pageSize: number): InspectionListQuery => ({
  page: 1,
  pageSize,
  status: value(form, 'status') as InspectionListQuery['status'],
  type: value(form, 'type') as InspectionListQuery['type'],
  stageId: value(form, 'stageId'),
  responsibleId: value(form, 'responsibleId'),
  dateFrom: limaBoundary(value(form, 'dateFrom'), 'start'),
  dateTo: limaBoundary(value(form, 'dateTo'), 'end'),
});

const initialDate = (value: string | undefined): string =>
  value?.slice(0, 10) ?? '';

const StatusAndTypeFilters = ({
  query,
}: Pick<Props, 'query'>): React.JSX.Element => (
  <>
    <label>
      Estado
      <NativeSelect name="status" defaultValue={query.status ?? ''}>
        <option value="">Todos</option>
        <option value="PROGRAMADA">Programada</option>
        <option value="EN_PROCESO">En proceso</option>
        <option value="COMPLETADA">Completada</option>
        <option value="VENCIDA">Vencida</option>
        <option value="CANCELADA">Cancelada</option>
        <option value="REPROGRAMADA">Reprogramada</option>
      </NativeSelect>
    </label>
    <label>
      Tipo
      <NativeSelect name="type" defaultValue={query.type ?? ''}>
        <option value="">Todos</option>
        <option value="FISICOQUIMICO">Fisicoquímico</option>
        <option value="ORGANOLEPTICO">Organoléptico</option>
      </NativeSelect>
    </label>
  </>
);

const MasterFilters = ({ masters, query }: Props): React.JSX.Element => (
  <>
    <label>
      Etapa
      <NativeSelect name="stageId" defaultValue={query.stageId ?? ''}>
        <option value="">Todas</option>
        {masters.stages.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.name}
          </option>
        ))}
      </NativeSelect>
    </label>
    <label>
      Responsable
      <NativeSelect
        name="responsibleId"
        defaultValue={query.responsibleId ?? ''}
      >
        <option value="">Todos</option>
        {masters.users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.firstName} {user.lastName}
          </option>
        ))}
      </NativeSelect>
    </label>
  </>
);

const DateFilters = ({ query }: Pick<Props, 'query'>): React.JSX.Element => (
  <>
    <label>
      Desde
      <Input
        name="dateFrom"
        type="date"
        defaultValue={initialDate(query.dateFrom)}
      />
    </label>
    <label>
      Hasta
      <Input
        name="dateTo"
        type="date"
        defaultValue={initialDate(query.dateTo)}
      />
    </label>
  </>
);

export const InspectionFilters = ({
  query,
  masters,
  apply,
}: Props): React.JSX.Element => {
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    apply(queryFrom(new FormData(event.currentTarget), query.pageSize));
  };
  return (
    <form className="quality-filters" onSubmit={submit}>
      <StatusAndTypeFilters query={query} />
      <MasterFilters query={query} masters={masters} apply={apply} />
      <DateFilters query={query} />
      <button className="secondary-button" type="submit">
        Aplicar filtros
      </button>
    </form>
  );
};
