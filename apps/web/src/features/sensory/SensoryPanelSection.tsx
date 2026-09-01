import { Plus, Trash2 } from 'lucide-react';
import type { SensoryPanelistOption } from '@sigecal/shared';
import { Input } from '../../components/ui/input.js';
import { NativeSelect } from '../../components/ui/native-select.js';
import { panelistLabel, type PanelistDraft } from './sensory-form-state.js';
import type { SensoryDraft } from './useSensoryForm.js';

const UserIdentity = ({
  draft,
  options,
  change,
}: {
  readonly draft: PanelistDraft;
  readonly options: readonly SensoryPanelistOption[];
  readonly change: (value: string) => void;
}) => (
  <NativeSelect
    aria-label="Usuario panelista"
    value={draft.identity}
    onChange={(event) => {
      change(event.target.value);
    }}
  >
    <option value="">Seleccione…</option>
    {options.map((option) => (
      <option key={option.id} value={option.id}>
        {panelistLabel(option)}
      </option>
    ))}
  </NativeSelect>
);
const ExternalIdentity = ({
  draft,
  change,
}: {
  readonly draft: PanelistDraft;
  readonly change: (value: string) => void;
}) => (
  <Input
    aria-label="Nombre externo"
    placeholder="Nombre del panelista"
    value={draft.identity}
    onChange={(event) => {
      change(event.target.value);
    }}
  />
);
const KindSelect = ({
  draft,
  change,
}: {
  readonly draft: PanelistDraft;
  readonly change: (kind: 'user' | 'external') => void;
}) => (
  <NativeSelect
    aria-label="Tipo de panelista"
    value={draft.kind}
    onChange={(event) => {
      change(event.target.value as 'user' | 'external');
    }}
  >
    <option value="external">Externo</option>
    <option value="user">Usuario del sistema</option>
  </NativeSelect>
);
const PanelistIdentity = ({
  draft,
  options,
  change,
}: {
  readonly draft: PanelistDraft;
  readonly options: readonly SensoryPanelistOption[];
  readonly change: (patch: Partial<PanelistDraft>) => void;
}) => (
  <div className="panelist-identity">
    <KindSelect
      draft={draft}
      change={(kind) => {
        change({ kind, identity: '' });
      }}
    />
    {draft.kind === 'user' ? (
      <UserIdentity
        draft={draft}
        options={options}
        change={(identity) => {
          change({ identity });
        }}
      />
    ) : (
      <ExternalIdentity
        draft={draft}
        change={(identity) => {
          change({ identity });
        }}
      />
    )}
  </div>
);
const PanelistCard = ({
  form,
  panelist,
  index,
  options,
}: {
  readonly form: SensoryDraft;
  readonly panelist: PanelistDraft;
  readonly index: number;
  readonly options: readonly SensoryPanelistOption[];
}) => (
  <article className="panelist-card">
    <header>
      <strong>Panelista {index + 1}</strong>
      {form.panelists.length > 1 ? (
        <button
          type="button"
          aria-label="Quitar panelista"
          onClick={() => {
            form.remove(panelist.key);
          }}
        >
          <Trash2 />
        </button>
      ) : null}
    </header>
    <PanelistIdentity
      draft={panelist}
      options={options}
      change={(value) => {
        form.patch(panelist.key, value);
      }}
    />
  </article>
);

export const SensoryPanelSection = ({
  form,
  options,
}: {
  readonly form: SensoryDraft;
  readonly options: readonly SensoryPanelistOption[];
}) => (
  <>
    <div className="sensory-panel-heading">
      <div>
        <h2>Panel de evaluación</h2>
        <p>Los nombres se conservan solo para trazabilidad.</p>
      </div>
      <button className="secondary-button" type="button" onClick={form.add}>
        <Plus /> Agregar panelista
      </button>
    </div>
    <div className="panelist-cards">
      {form.panelists.map((panelist, index) => (
        <PanelistCard
          key={panelist.key}
          form={form}
          panelist={panelist}
          index={index}
          options={options}
        />
      ))}
    </div>
  </>
);
