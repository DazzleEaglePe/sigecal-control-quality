import type { SyntheticEvent } from 'react';
import type { BatchListQuery } from '@sigecal/shared';

import type { BatchMasters } from './useBatches.js';

interface BatchFiltersProps {
  readonly masters: BatchMasters;
  readonly query: BatchListQuery;
  readonly apply: (query: BatchListQuery) => void;
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
    <select name={name} defaultValue={initial ?? ''}>
      {options.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  </label>
);

const catalogOptions = (
  first: string,
  items: readonly { readonly id: string; readonly name: string }[],
): readonly Option[] => [
  { value: '', label: first },
  ...items.map((item) => ({ value: item.id, label: item.name })),
];

const MainFilters = ({ masters, query }: Omit<BatchFiltersProps, 'apply'>) => (
  <>
    <label>
      Buscar
      <input
        name="search"
        defaultValue={query.search}
        placeholder="Código u origen"
      />
    </label>
    <FilterSelect
      name="status"
      label="Estado"
      initial={query.status}
      options={[
        { value: '', label: 'Todos' },
        { value: 'EN_PROCESO', label: 'En proceso' },
        { value: 'EN_OBSERVACION', label: 'En observación' },
        { value: 'CERRADO', label: 'Cerrado' },
        { value: 'RECHAZADO', label: 'Rechazado' },
      ]}
    />
    <FilterSelect
      name="piscoTypeId"
      label="Tipo de pisco"
      initial={query.piscoTypeId}
      options={catalogOptions('Todos', masters.piscoTypes)}
    />
    <FilterSelect
      name="varietyId"
      label="Variedad"
      initial={query.varietyId}
      options={catalogOptions('Todas', masters.varieties)}
    />
  </>
);

const ExtraFilters = ({ masters, query }: Omit<BatchFiltersProps, 'apply'>) => (
  <>
    <FilterSelect
      name="stageId"
      label="Etapa actual"
      initial={query.stageId}
      options={catalogOptions('Todas', masters.stages)}
    />
    <FilterSelect
      name="dataOrigin"
      label="Origen de datos"
      initial={query.dataOrigin}
      options={[
        { value: '', label: 'Real y demostración' },
        { value: 'REAL', label: 'Real' },
        { value: 'DEMO', label: 'Demostración' },
      ]}
    />
    <label>
      Desde
      <input type="date" name="dateFrom" defaultValue={query.dateFrom} />
    </label>
    <label>
      Hasta
      <input type="date" name="dateTo" defaultValue={query.dateTo} />
    </label>
  </>
);

const value = (form: FormData, name: string): string | undefined => {
  const item = form.get(name);
  return typeof item === 'string' && item !== '' ? item : undefined;
};
const queryFrom = (form: FormData, pageSize: number): BatchListQuery => ({
  page: 1,
  pageSize,
  search: value(form, 'search'),
  status: value(form, 'status') as BatchListQuery['status'],
  varietyId: value(form, 'varietyId'),
  piscoTypeId: value(form, 'piscoTypeId'),
  stageId: value(form, 'stageId'),
  dataOrigin: value(form, 'dataOrigin') as BatchListQuery['dataOrigin'],
  dateFrom: value(form, 'dateFrom'),
  dateTo: value(form, 'dateTo'),
});

export const BatchFilters = (props: BatchFiltersProps): React.JSX.Element => {
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    props.apply(
      queryFrom(new FormData(event.currentTarget), props.query.pageSize),
    );
  };
  return (
    <form className="batch-filters" onSubmit={submit}>
      <MainFilters masters={props.masters} query={props.query} />
      <ExtraFilters masters={props.masters} query={props.query} />
      <button className="secondary-button" type="submit">
        Aplicar filtros
      </button>
    </form>
  );
};
