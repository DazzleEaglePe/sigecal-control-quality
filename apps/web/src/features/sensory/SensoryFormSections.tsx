import type { SensoryPreparation } from '@sigecal/shared';
import { Input } from '../../components/ui/input.js';
import { Textarea } from '../../components/ui/textarea.js';
import type { SensoryDraft } from './useSensoryForm.js';

export const SensoryMetaSection = ({
  form,
  preparation,
}: {
  readonly form: SensoryDraft;
  readonly preparation: SensoryPreparation;
}) => (
  <div className="sensory-meta-grid">
    <label>
      Fecha de sesión
      <Input
        type="date"
        value={form.sessionDate}
        onChange={(event) => {
          form.setSessionDate(event.target.value);
        }}
      />
    </label>
    <div className="threshold-readonly">
      <small>Umbral aplicado por el servidor</small>
      <strong>{preparation.threshold.minAverage}</strong>
      <span>
        {preparation.threshold.referenceNorm ?? 'Sin norma informada'} · vigente
        desde {preparation.threshold.validFrom}
      </span>
    </div>
  </div>
);
export const SensorySummary = ({
  average,
  threshold,
}: {
  readonly average: number | null;
  readonly threshold: string;
}) => (
  <div className="sensory-summary">
    <span>Promedio general del producto</span>
    <strong>{average?.toFixed(2) ?? '—'}</strong>
    <small>
      {average === null
        ? 'Complete toda la matriz.'
        : average < Number(threshold)
          ? 'Resultado preliminar: no conforme'
          : 'Resultado preliminar: conforme'}
    </small>
  </div>
);
export const SensoryNotesSection = ({
  form,
  correcting,
}: {
  readonly form: SensoryDraft;
  readonly correcting: boolean;
}) => (
  <div className="sensory-notes">
    <label>
      Defectos identificados
      <Textarea
        value={form.defectsFound}
        onChange={(event) => {
          form.setDefects(event.target.value);
        }}
      />
    </label>
    <label>
      Observaciones
      <Textarea
        value={form.notes}
        onChange={(event) => {
          form.setNotes(event.target.value);
        }}
      />
    </label>
    {correcting ? (
      <label>
        Motivo de corrección
        <Input
          required
          value={form.reason}
          onChange={(event) => {
            form.setReason(event.target.value);
          }}
        />
      </label>
    ) : null}
  </div>
);
