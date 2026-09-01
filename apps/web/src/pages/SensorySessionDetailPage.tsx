import { useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth.js';
import { SensorySessionDetailView } from '../features/sensory/SensorySessionDetailView.js';
import {
  useSensoryCorrection,
  useSensorySessionRecord,
} from '../features/sensory/useSensorySessionDetail.js';

export const SensorySessionDetailPage = (): React.JSX.Element => {
  const { id = '' } = useParams();
  const { request, user } = useAuth();
  const record = useSensorySessionRecord(request, id);
  const correction = useSensoryCorrection(request, record);
  if (!record.session)
    return (
      <section className="quality-panel">
        <p className={record.error ? 'form-error' : undefined}>
          {record.error ?? 'Cargando sesión…'}
        </p>
      </section>
    );
  const canCorrect =
    record.session.status !== 'ANULADO' &&
    !record.session.replacementId &&
    Boolean(user?.permissions.includes('SENSORY_RECORD'));
  return (
    <SensorySessionDetailView
      session={record.session}
      {...(record.profile ? { profile: record.profile } : {})}
      {...(correction.preparation
        ? { preparation: correction.preparation }
        : {})}
      options={correction.options}
      saving={correction.saving}
      {...(record.error ? { error: record.error } : {})}
      canCorrect={canCorrect}
      correcting={correction.correcting}
      open={() => {
        void correction.open();
      }}
      submit={(value) => {
        void correction.submit(value);
      }}
    />
  );
};
