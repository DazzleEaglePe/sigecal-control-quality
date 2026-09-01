import { ArrowLeft, RefreshCcw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type {
  SensoryPanelistOption,
  SensoryPreparation,
  SensoryProfile,
  SensorySessionItem,
} from '@sigecal/shared';
import { SensoryForm, type SensoryFormValue } from './SensoryForm.js';
import { SensoryRadar } from './SensoryRadar.js';

const Facts = ({ session }: { readonly session: SensorySessionItem }) => (
  <div className="sensory-facts">
    <span>
      <small>Lote</small>
      <strong>{session.batch.code}</strong>
    </span>
    <span>
      <small>Inspección</small>
      <strong>{session.inspection.code}</strong>
    </span>
    <span>
      <small>Promedio general</small>
      <strong>{session.overallAverage}</strong>
    </span>
    <span>
      <small>Umbral aplicado</small>
      <strong>{session.appliedThreshold}</strong>
    </span>
    <span>
      <small>Estado</small>
      <strong>{session.status.replace('_', ' ')}</strong>
    </span>
    <span>
      <small>Panel</small>
      <strong>{session.panelists.length} participantes</strong>
    </span>
  </div>
);
const VersionLinks = ({
  session,
}: {
  readonly session: SensorySessionItem;
}) => (
  <>
    {session.replacesId ? (
      <p>
        Esta versión reemplaza a{' '}
        <Link to={`/organoleptico/${session.replacesId}`}>
          la sesión anterior
        </Link>
        .
      </p>
    ) : null}
    {session.replacementId ? (
      <p>
        Esta versión fue anulada. Consulte{' '}
        <Link to={`/organoleptico/${session.replacementId}`}>su reemplazo</Link>
        .
      </p>
    ) : null}
  </>
);
const SummaryPanel = ({
  session,
}: {
  readonly session: SensorySessionItem;
}) => (
  <section className="quality-panel">
    <div className="quality-panel-heading">
      <div>
        <span className="quality-kicker">Versión registrada</span>
        <h2>Resumen de evaluación</h2>
      </div>
      <ShieldCheck />
    </div>
    <Facts session={session} />
    <VersionLinks session={session} />
  </section>
);
const ProfilePanel = ({
  profile,
}: {
  readonly profile?: SensoryProfile | undefined;
}) =>
  profile ? (
    <section className="quality-panel">
      <div className="quality-panel-heading">
        <div>
          <span className="quality-kicker">Promedios por atributo</span>
          <h2>Perfil sensorial del producto</h2>
        </div>
      </div>
      <SensoryRadar profiles={[profile]} />
    </section>
  ) : null;
const CorrectionPanel = ({
  session,
  preparation,
  options,
  saving,
  submit,
}: {
  readonly session: SensorySessionItem;
  readonly preparation?: SensoryPreparation | undefined;
  readonly options: readonly SensoryPanelistOption[];
  readonly saving: boolean;
  readonly submit: (value: SensoryFormValue) => void;
}) =>
  preparation ? (
    <section className="quality-panel">
      <div className="quality-panel-heading">
        <div>
          <span className="quality-kicker">Nueva versión</span>
          <h2>Corregir sin sobrescribir</h2>
        </div>
      </div>
      <SensoryForm
        key={session.id}
        preparation={preparation}
        options={options}
        initial={session}
        saving={saving}
        submit={submit}
      />
    </section>
  ) : null;

interface Props {
  readonly session: SensorySessionItem;
  readonly profile?: SensoryProfile | undefined;
  readonly preparation?: SensoryPreparation | undefined;
  readonly options: readonly SensoryPanelistOption[];
  readonly saving: boolean;
  readonly error?: string;
  readonly canCorrect: boolean;
  readonly correcting: boolean;
  readonly open: () => void;
  readonly submit: (value: SensoryFormValue) => void;
}
export const SensorySessionDetailView = (props: Props): React.JSX.Element => (
  <div className="page-stack quality-page">
    <header className="page-heading quality-heading">
      <div>
        <p className="eyebrow">Resultado final e inmutable</p>
        <h1>Sesión {props.session.inspection.code}</h1>
        <p>Perfil promedio del producto y trazabilidad del panel.</p>
      </div>
      <div className="quality-heading-actions">
        <Link className="secondary-button" to="/organoleptico">
          <ArrowLeft /> Volver
        </Link>
        {props.canCorrect ? (
          <button className="secondary-button" onClick={props.open}>
            <RefreshCcw /> Corregir sesión
          </button>
        ) : null}
      </div>
    </header>
    {props.error ? <p className="form-error">{props.error}</p> : null}
    <SummaryPanel session={props.session} />
    <ProfilePanel profile={props.profile} />
    {props.correcting ? (
      <CorrectionPanel
        session={props.session}
        preparation={props.preparation}
        options={props.options}
        saving={props.saving}
        submit={props.submit}
      />
    ) : null}
  </div>
);
