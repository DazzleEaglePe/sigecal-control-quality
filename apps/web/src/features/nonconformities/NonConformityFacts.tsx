import type { NonConformityDetail } from '@sigecal/shared';

import {
  localDateTime,
  ncStatusLabel,
  severityLabel,
} from '../batches/batches-labels.js';

const hours = (value: number | null): string =>
  value === null
    ? '—'
    : `${value.toLocaleString('es-PE', { maximumFractionDigits: 1 })} h`;

const IdentityFacts = ({ nc }: { readonly nc: NonConformityDetail }) => (
  <>
    <div>
      <dt>Lote</dt>
      <dd>{nc.batch.code}</dd>
    </div>
    <div>
      <dt>Etapa</dt>
      <dd>{nc.stage?.name ?? 'Sin especificar'}</dd>
    </div>
    <div>
      <dt>Severidad</dt>
      <dd>
        <span className={`state-pill nc-severity-${nc.severity.toLowerCase()}`}>
          {severityLabel[nc.severity]}
        </span>
      </dd>
    </div>
    <div>
      <dt>Estado</dt>
      <dd>
        <span className={`state-pill nc-status-${nc.status.toLowerCase()}`}>
          {ncStatusLabel[nc.status]}
        </span>
      </dd>
    </div>
    <div>
      <dt>Detectada</dt>
      <dd>{localDateTime(nc.detectedAt)}</dd>
    </div>
    <div>
      <dt>Detectada por</dt>
      <dd>
        {nc.detectedBy.firstName} {nc.detectedBy.lastName}
      </dd>
    </div>
  </>
);

const TimingFacts = ({ nc }: { readonly nc: NonConformityDetail }) => (
  <>
    <div>
      <dt>Inicio de atención</dt>
      <dd>
        {nc.attentionStartedAt
          ? localDateTime(nc.attentionStartedAt)
          : 'Pendiente'}
      </dd>
    </div>
    <div>
      <dt>Tiempo de respuesta</dt>
      <dd>{hours(nc.responseTimeHours)}</dd>
    </div>
    <div>
      <dt>Cierre</dt>
      <dd>{nc.closedAt ? localDateTime(nc.closedAt) : 'Pendiente'}</dd>
    </div>
    <div>
      <dt>Tiempo de cierre</dt>
      <dd>{hours(nc.closureTimeHours)}</dd>
    </div>
    <div>
      <dt>Área responsable</dt>
      <dd>{nc.assignedArea?.name ?? 'Sin especificar'}</dd>
    </div>
    <div>
      <dt>Persona responsable</dt>
      <dd>
        {nc.assignedTo
          ? `${nc.assignedTo.firstName} ${nc.assignedTo.lastName}`
          : 'Sin asignar'}
      </dd>
    </div>
  </>
);

export const FactGrid = ({ nc }: { readonly nc: NonConformityDetail }) => (
  <dl>
    <IdentityFacts nc={nc} />
    <TimingFacts nc={nc} />
  </dl>
);

export const DescriptionPanel = ({
  nc,
}: {
  readonly nc: NonConformityDetail;
}) => (
  <section className="admin-panel">
    <h2>Descripción</h2>
    <p>{nc.description}</p>
    {nc.rootCause ? (
      <>
        <h3>Causa raíz</h3>
        <p>{nc.rootCause}</p>
      </>
    ) : null}
    {nc.status === 'ANULADA' && nc.annulReason ? (
      <>
        <h3>Motivo de anulación</h3>
        <p>{nc.annulReason}</p>
        {nc.annulledBy ? (
          <p className="field-help">
            Anulada por {nc.annulledBy.firstName} {nc.annulledBy.lastName}
            {nc.annulledAt ? ` · ${localDateTime(nc.annulledAt)}` : ''}
          </p>
        ) : null}
      </>
    ) : null}
    {nc.status === 'CERRADA' && nc.closeComment ? (
      <>
        <h3>Comentario de cierre</h3>
        <p>{nc.closeComment}</p>
      </>
    ) : null}
  </section>
);
