import { ArrowLeft, Wine } from 'lucide-react';
import { Link } from 'react-router-dom';
import type {
  InspectionItem,
  SensoryPanelistOption,
  SensoryPreparation,
} from '@sigecal/shared';
import { NativeSelect } from '../../components/ui/native-select.js';
import { SensoryForm, type SensoryFormValue } from './SensoryForm.js';

const InspectionSelector = ({
  id,
  items,
  select,
}: {
  readonly id: string;
  readonly items: readonly InspectionItem[];
  readonly select: (id: string) => void;
}) => (
  <section className="quality-panel">
    <div className="quality-panel-heading">
      <div>
        <span className="quality-kicker">Inspección en proceso</span>
        <h2>Seleccionar contexto</h2>
      </div>
      <Wine />
    </div>
    <label>
      Inspección organoléptica
      <NativeSelect
        value={id}
        onChange={(event) => {
          select(event.target.value);
        }}
      >
        <option value="">Seleccione…</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.code} · {item.batch.code}
          </option>
        ))}
      </NativeSelect>
    </label>
  </section>
);
const NewSessionHeader = () => (
  <header className="page-heading quality-heading">
    <div>
      <p className="eyebrow">Captura controlada</p>
      <h1>Nueva evaluación organoléptica</h1>
      <p>
        Las calificaciones describen el producto; no evalúan a las personas.
      </p>
    </div>
    <Link className="secondary-button" to="/organoleptico">
      <ArrowLeft /> Volver
    </Link>
  </header>
);
export const NewSensorySessionView = (props: {
  readonly inspectionId: string;
  readonly inspections: readonly InspectionItem[];
  readonly preparation: SensoryPreparation | null;
  readonly options: readonly SensoryPanelistOption[];
  readonly saving: boolean;
  readonly error?: string;
  readonly select: (id: string) => void;
  readonly submit: (value: SensoryFormValue) => void;
}): React.JSX.Element => (
  <div className="page-stack quality-page">
    <NewSessionHeader />
    {props.error ? <p className="form-error">{props.error}</p> : null}
    <InspectionSelector
      id={props.inspectionId}
      items={props.inspections}
      select={props.select}
    />
    {props.preparation ? (
      <section className="quality-panel">
        <SensoryForm
          preparation={props.preparation}
          options={props.options}
          saving={props.saving}
          submit={props.submit}
        />
      </section>
    ) : null}
  </div>
);
