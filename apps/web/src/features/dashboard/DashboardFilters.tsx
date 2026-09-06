import { useState } from 'react';
import { Database, Filter } from 'lucide-react';

import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import type { DashboardFilters as Filters } from './useDashboard.js';

interface DashboardFiltersProps {
  readonly canIncludeDemo: boolean;
  readonly filters: Filters;
  readonly onApply: (filters: Filters) => void;
}

const DateField = ({
  label,
  max,
  min,
  onChange,
  value,
}: {
  readonly label: string;
  readonly max?: string;
  readonly min?: string;
  readonly onChange: (value: string) => void;
  readonly value: string;
}) => (
  <label className="grid gap-1 text-xs text-muted-foreground">
    {label}
    <Input
      type="date"
      value={value}
      max={max}
      min={min}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      required
    />
  </label>
);

const DemoButton = ({
  active,
  onToggle,
}: {
  readonly active: boolean;
  readonly onToggle: () => void;
}) => (
  <Button
    type="button"
    variant={active ? 'default' : 'outline'}
    size="sm"
    onClick={onToggle}
    aria-pressed={active}
  >
    <Database aria-hidden="true" /> Datos DEMO
  </Button>
);

export const DashboardFilters = ({
  canIncludeDemo,
  filters,
  onApply,
}: DashboardFiltersProps): React.JSX.Element => {
  const [draft, setDraft] = useState(filters);
  const update = (values: Partial<Filters>) => {
    setDraft({ ...draft, ...values });
  };
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft);
      }}
    >
      <FilterFields
        canIncludeDemo={canIncludeDemo}
        draft={draft}
        update={update}
      />
      <Button type="submit" variant="outline" size="sm">
        <Filter aria-hidden="true" /> Aplicar periodo
      </Button>
    </form>
  );
};

const FilterFields = ({
  canIncludeDemo,
  draft,
  update,
}: {
  readonly canIncludeDemo: boolean;
  readonly draft: Filters;
  readonly update: (values: Partial<Filters>) => void;
}) => (
  <>
    <DateField
      label="Desde"
      value={draft.dateFrom}
      max={draft.dateTo}
      onChange={(dateFrom) => {
        update({ dateFrom });
      }}
    />
    <DateField
      label="Hasta"
      value={draft.dateTo}
      min={draft.dateFrom}
      onChange={(dateTo) => {
        update({ dateTo });
      }}
    />
    {canIncludeDemo ? (
      <DemoButton
        active={draft.includeDemo}
        onToggle={() => {
          update({ includeDemo: !draft.includeDemo });
        }}
      />
    ) : null}
  </>
);
