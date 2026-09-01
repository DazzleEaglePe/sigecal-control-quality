import { useAuth } from '../features/auth/useAuth.js';
import { NewSensorySessionView } from '../features/sensory/NewSensorySessionView.js';
import { useNewSensorySession } from '../features/sensory/useNewSensorySession.js';

export const NewSensorySessionPage = (): React.JSX.Element => {
  const { request } = useAuth();
  const form = useNewSensorySession(request);
  return (
    <NewSensorySessionView
      inspectionId={form.inspectionId}
      inspections={form.inspections}
      preparation={form.preparation}
      options={form.options}
      saving={form.saving}
      {...(form.error ? { error: form.error } : {})}
      select={form.selectInspection}
      submit={(value) => {
        void form.submit(value);
      }}
    />
  );
};
