import { FlaskConical, Info, Wine } from 'lucide-react';
import type { CreateInspectionRequest } from '@sigecal/shared';

export const InspectionFormAside = ({
  type,
}: {
  readonly type: CreateInspectionRequest['type'];
}): React.JSX.Element => {
  const Icon = type === 'FISICOQUIMICO' ? FlaskConical : Wine;
  return (
    <aside className="quality-form-aside">
      <span>
        <Icon aria-hidden="true" />
      </span>
      <p className="quality-kicker">Antes de confirmar</p>
      <h2>
        {type === 'FISICOQUIMICO'
          ? 'Control fisicoquímico'
          : 'Evaluación organoléptica'}
      </h2>
      <p>
        Revise la fecha, el responsable, el equipo y cada parámetro esperado. La
        programación quedará auditada.
      </p>
      <ul>
        <li>
          <Info /> El origen de datos se hereda del lote.
        </li>
        <li>
          <Info /> Los estándares se resuelven en el servidor.
        </li>
        <li>
          <Info /> El equipo debe estar operativo al iniciar.
        </li>
      </ul>
    </aside>
  );
};
