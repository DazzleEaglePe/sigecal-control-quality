import type { GrapeVarietyItem, PiscoTypeItem } from '@sigecal/shared';

import { fieldAria, ISSUE_ID_SUFFIX } from '../../lib/field-aria.js';
import type { BatchFieldIssues } from './batch-form-validation.js';

export const FieldIssue = ({
  id,
  issue,
}: {
  readonly id: string;
  readonly issue: string;
}): React.JSX.Element => (
  <span className="field-issue" id={`${id}${ISSUE_ID_SUFFIX}`}>
    {issue}
  </span>
);

export const TypeField = ({
  types,
  typeId,
  selectType,
  issue,
}: {
  readonly types: readonly PiscoTypeItem[];
  readonly typeId: string;
  readonly selectType: (id: string) => void;
  readonly issue?: string | undefined;
}): React.JSX.Element => (
  <div className="admin-form-field">
    <label htmlFor="batch-type">Tipo de pisco</label>
    <select
      id="batch-type"
      name="piscoTypeId"
      required
      value={typeId}
      {...fieldAria('batch-type', issue)}
      onChange={(event) => {
        selectType(event.target.value);
      }}
    >
      {types.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
    {issue ? <FieldIssue id="batch-type" issue={issue} /> : null}
  </div>
);

const StartDateField = ({
  issue,
}: {
  readonly issue?: string | undefined;
}): React.JSX.Element => (
  <div className="admin-form-field">
    <label htmlFor="batch-start-date">Fecha de inicio</label>
    <input
      id="batch-start-date"
      name="startDate"
      type="date"
      required
      {...fieldAria('batch-start-date', issue)}
    />
    {issue ? <FieldIssue id="batch-start-date" issue={issue} /> : null}
  </div>
);

const VolumeField = ({
  issue,
}: {
  readonly issue?: string | undefined;
}): React.JSX.Element => (
  <div className="admin-form-field">
    <label htmlFor="batch-volume">Volumen inicial (L)</label>
    <input
      id="batch-volume"
      name="volumeLiters"
      type="number"
      min="0.001"
      step="0.001"
      required
      {...fieldAria('batch-volume', issue)}
    />
    {issue ? <FieldIssue id="batch-volume" issue={issue} /> : null}
  </div>
);

const HarvestOriginField = ({
  issue,
}: {
  readonly issue?: string | undefined;
}): React.JSX.Element => (
  <div className="admin-form-field">
    <label htmlFor="batch-origin">Origen de cosecha</label>
    <input
      id="batch-origin"
      name="harvestOrigin"
      maxLength={200}
      placeholder="Fundo, valle o proveedor"
      {...fieldAria('batch-origin', issue)}
    />
    {issue ? <FieldIssue id="batch-origin" issue={issue} /> : null}
  </div>
);

export const ProductionFields = ({
  issues,
}: {
  readonly issues: BatchFieldIssues;
}): React.JSX.Element => (
  <>
    <StartDateField issue={issues.startDate} />
    <VolumeField issue={issues.volumeLiters} />
    <HarvestOriginField issue={issues.harvestOrigin} />
  </>
);

const VarietyOption = ({
  item,
  checked,
  toggle,
}: {
  readonly item: GrapeVarietyItem;
  readonly checked: boolean;
  readonly toggle: (id: string) => void;
}): React.JSX.Element => (
  <label className={`variety-option ${checked ? 'is-selected' : ''}`}>
    <span>
      <input
        name="varietySelection"
        type="checkbox"
        data-variety-id={item.id}
        checked={checked}
        onChange={() => {
          toggle(item.id);
        }}
      />{' '}
      {item.name}
    </span>
    <input
      aria-label={`Porcentaje de ${item.name}`}
      data-validation-field="varieties"
      name={`percentage-${item.id}`}
      type="number"
      min="0.01"
      max="100"
      step="0.01"
      placeholder="%"
      disabled={!checked}
    />
  </label>
);

const VarietyOptions = ({
  items,
  selected,
  toggle,
}: {
  readonly items: readonly GrapeVarietyItem[];
  readonly selected: readonly string[];
  readonly toggle: (id: string) => void;
}): React.JSX.Element => (
  <div className="variety-grid">
    {items.map((item) => (
      <VarietyOption
        key={item.id}
        item={item}
        checked={selected.includes(item.id)}
        toggle={toggle}
      />
    ))}
  </div>
);

export const VarietyFields = ({
  items,
  selected,
  toggle,
  issue,
}: {
  readonly items: readonly GrapeVarietyItem[];
  readonly selected: readonly string[];
  readonly toggle: (id: string) => void;
  readonly issue?: string | undefined;
}): React.JSX.Element => (
  <fieldset
    id="batch-varieties"
    className="variety-selector form-span"
    aria-invalid={issue ? true : undefined}
    aria-describedby={issue ? 'batch-varieties-issue' : undefined}
  >
    <legend>Composición de uvas</legend>
    <p className="field-help">
      Los porcentajes son opcionales; si informa uno, todos deben sumar 100%.
    </p>
    <VarietyOptions items={items} selected={selected} toggle={toggle} />
    {issue ? <FieldIssue id="batch-varieties" issue={issue} /> : null}
  </fieldset>
);
