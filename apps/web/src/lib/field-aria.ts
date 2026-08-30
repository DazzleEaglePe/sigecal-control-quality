export const ISSUE_ID_SUFFIX = '-issue';
export const NOTE_ID_SUFFIX = '-note';

export interface FieldAria {
  readonly 'aria-describedby': string | undefined;
  readonly 'aria-invalid': true | undefined;
}

/** Enlaza el campo con su mensaje de error o su aviso, nunca con ambos: el
 * error reemplaza al aviso mientras esté presente. */
export const fieldAria = (
  id: string,
  issue: string | undefined,
  note?: string,
): FieldAria => {
  if (issue) {
    return {
      'aria-describedby': `${id}${ISSUE_ID_SUFFIX}`,
      'aria-invalid': true,
    };
  }
  return {
    'aria-describedby': note ? `${id}${NOTE_ID_SUFFIX}` : undefined,
    'aria-invalid': undefined,
  };
};
