import type { SyntheticEvent } from 'react';
import type { NonConformityListQuery } from '@sigecal/shared';

import { Input } from '../../components/ui/input.js';
import { NativeSelect } from '../../components/ui/native-select.js';
import type { NonConformityMasters } from './useNonConformities.js';

interface Props {
  readonly masters: NonConformityMasters;
  readonly query: NonConformityListQuery;
  readonly apply: (query: NonConformityListQuery) => void;
}
interface Option {
  readonly value: string;
  readonly label: string;
}

const FilterSelect = ({
  name,
  label,
  initial,
  options,
}: {
  readonly name: string;
  readonly label: string;
  readonly initial: string | undefined;
  readonly options: readonly Option[];
}): React.JSX.Element => (
  <label>
    {label}
    <NativeSelect name={name} defaultValue={initial ?? ''}>
      {options.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </NativeSelect>
  </label>
);

const catalogOptions = (
  first: string,
  items: readonly { readonly id: string; readonly name: string }[],
): readonly Option[] => [
  { value: '', label: first },
  ...items.map((item) => ({ value: item.id, label: item.name })),
];

const MainFilters = ({ query }: Pick<Props, 'query'>): React.JSX.Element => (
  <>
    <label>
      Buscar
      <Input
        name="search"
        defaultValue={query.search}
        placeholder="Código o descripción"
      />
    </label>
    <FilterSelect
      name="status"
      label="Estado"
      initial={query.status}
      options={[
        { value: '', label: 'Todos' },
        { value: 'ABIERTA', label: 'Abierta' },
        { value: 'EN_ANALISIS', label: 'En análisis' },
        { value: 'EN_TRATAMIENTO', label: 'En tratamiento' },
        { value: 'EN_VERIFICACION', label: 'En verificación' },
        { value: 'CERRADA', label: 'Cerrada' },
        { value: 'ANULADA', label: 'Anulada' },
      ]}
    />
    <FilterSelect
      name="severity"
      label="Severidad"
      initial={query.severity}
      options={[
        { value: '', label: 'Todas' },
        { value: 'LEVE', label: 'Leve' },
        { value: 'MODERADA', label: 'Moderada' },
        { value: 'CRITICA', label: 'Crítica' },
      ]}
    />
  </>
);

const DateRangeFilters = ({
  query,
}: Pick<Props, 'query'>): React.JSX.Element => (
  <>
    <label>
      Desde
      <Input
        type="date"
        name="dateFrom"
        defaultValue={query.dateFrom?.slice(0, 10)}
      />
    </label>
    <label>
      Hasta
      <Input
        type="date"
        name="dateTo"
        defaultValue={query.dateTo?.slice(0, 10)}
      />
    </label>
  </>
);

const ExtraFilters = ({
  masters,
  query,
}: Omit<Props, 'apply'>): React.JSX.Element => (
  <>
    <FilterSelect
      name="stageId"
      label="Etapa"
      initial={query.stageId}
      options={catalogOptions('Todas', masters.stages)}
    />
    <FilterSelect
      name="assignedAreaId"
      label="Área responsable"
      initial={query.assignedAreaId}
      options={catalogOptions('Todas', masters.areas)}
    />
    <FilterSelect
      name="origin"
      label="Origen"
      initial={query.origin}
      options={[
        { value: '', label: 'Todos' },
        { value: 'MANUAL', label: 'Manual' },
        {
          value: 'AUTOMATICA_FISICOQUIMICA',
          label: 'Automática (fisicoquímico)',
        },
        { value: 'AUTOMATICA_SENSORIAL', label: 'Automática (organoléptico)' },
      ]}
    />
    <DateRangeFilters query={query} />
  </>
);

const value = (form: FormData, name: string): string | undefined => {
  const item = form.get(name);
  return typeof item === 'string' && item !== '' ? item : undefined;
};
const isoDate = (
  raw: string | undefined,
  endOfDay: boolean,
): string | undefined =>
  raw ? `${raw}T${endOfDay ? '23:59:59' : '00:00:00'}Z` : undefined;

const queryFrom = (
  form: FormData,
  pageSize: number,
): NonConformityListQuery => ({
  page: 1,
  pageSize,
  search: value(form, 'search'),
  status: value(form, 'status') as NonConformityListQuery['status'],
  severity: value(form, 'severity') as NonConformityListQuery['severity'],
  stageId: value(form, 'stageId'),
  assignedAreaId: value(form, 'assignedAreaId'),
  origin: value(form, 'origin') as NonConformityListQuery['origin'],
  dateFrom: isoDate(value(form, 'dateFrom'), false),
  dateTo: isoDate(value(form, 'dateTo'), true),
});

export const NonConformityFilters = (props: Props): React.JSX.Element => {
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    props.apply(
      queryFrom(new FormData(event.currentTarget), props.query.pageSize),
    );
  };
  return (
    <form className="batch-filters" onSubmit={submit}>
      <MainFilters query={props.query} />
      <ExtraFilters masters={props.masters} query={props.query} />
      <button className="secondary-button" type="submit">
        Aplicar filtros
      </button>
    </form>
  );
};
