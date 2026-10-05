import {
  CreateBatchRequestSchema,
  type CreateBatchRequest,
} from '@sigecal/shared';

const inputValue = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

const compositionFrom = (
  form: FormData,
  selected: readonly string[],
): CreateBatchRequest['varieties'] => {
  const percentages = selected.map((id) =>
    inputValue(form, `percentage-${id}`),
  );
  const reported = percentages.some(Boolean);
  return selected.map((varietyId, index) => ({
    varietyId,
    ...(reported ? { percentage: Number(percentages[index]) } : {}),
  }));
};

export const requestFrom = (
  form: FormData,
  selected: readonly string[],
): unknown => ({
  piscoTypeId: inputValue(form, 'piscoTypeId'),
  varieties: compositionFrom(form, selected),
  startDate: inputValue(form, 'startDate'),
  volumeLiters: Number(inputValue(form, 'volumeLiters')),
  harvestOrigin: inputValue(form, 'harvestOrigin') || undefined,
  notes: inputValue(form, 'notes') || undefined,
});

export const ruleMessage = (
  code: string | undefined,
  count: number,
): string | undefined => {
  if (code === 'PURO' && count !== 1)
    return 'Un pisco puro requiere exactamente una variedad.';
  if (code === 'ACHOLADO' && count < 2)
    return 'Un pisco acholado requiere al menos dos variedades.';
  return undefined;
};

export const batchFieldNames = [
  'piscoTypeId',
  'varieties',
  'startDate',
  'volumeLiters',
  'harvestOrigin',
] as const;
export type BatchFieldName = (typeof batchFieldNames)[number];
export type BatchFieldIssues = Partial<Record<BatchFieldName, string>>;

const fieldMessage = (field: BatchFieldName): string => {
  if (field === 'piscoTypeId') return 'Seleccione un tipo de pisco.';
  if (field === 'varieties')
    return 'Revise la composición de variedades y porcentajes.';
  if (field === 'startDate') return 'Indique una fecha de inicio válida.';
  if (field === 'volumeLiters') return 'Ingrese un volumen mayor que cero.';
  return 'Revise el origen de cosecha.';
};

export const batchIssuesFrom = (
  form: HTMLFormElement,
  selected: readonly string[],
  typeCode: string | undefined,
): BatchFieldIssues => {
  const parsed = CreateBatchRequestSchema.safeParse(
    requestFrom(new FormData(form), selected),
  );
  const issues: BatchFieldIssues = {};
  const compositionIssue = ruleMessage(typeCode, selected.length);
  if (compositionIssue) issues.varieties = compositionIssue;
  if (parsed.success) return issues;
  for (const issue of parsed.error.issues) {
    const path = issue.path[0];
    const field = batchFieldNames.find((name) => name === path);
    if (!field) continue;
    issues[field] ??= fieldMessage(field);
  }
  return issues;
};
