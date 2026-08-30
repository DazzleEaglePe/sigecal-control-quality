import { TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { ISSUE_ID_SUFFIX, NOTE_ID_SUFFIX } from '../lib/field-aria.js';

interface AuthFieldProps {
  /** Control del campo: el `input` y, si aplica, su botón anexo. */
  readonly children: ReactNode;
  readonly icon: ReactNode;
  readonly id: string;
  readonly issue: string | undefined;
  readonly label: string;
  readonly note?: string | undefined;
}

export const AuthField = ({
  children,
  icon,
  id,
  issue,
  label,
  note,
}: AuthFieldProps): React.JSX.Element => (
  <div className="auth-field">
    <label htmlFor={id}>{label}</label>
    <div className={issue ? 'auth-input-shell is-invalid' : 'auth-input-shell'}>
      {icon}
      {children}
    </div>
    {issue ? (
      <p className="field-issue" id={`${id}${ISSUE_ID_SUFFIX}`}>
        <TriangleAlert aria-hidden="true" />
        {issue}
      </p>
    ) : null}
    {note && !issue ? (
      <p className="field-note" id={`${id}${NOTE_ID_SUFFIX}`} role="status">
        {note}
      </p>
    ) : null}
  </div>
);
