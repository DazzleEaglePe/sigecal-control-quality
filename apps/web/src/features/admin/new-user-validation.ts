import { CreateUserRequestSchema } from '@sigecal/shared';

import { fieldValue } from './admin-ui.js';

export const fieldNames = [
  'firstName',
  'lastName',
  'email',
  'role',
  'areaId',
  'position',
] as const;

export type FieldName = (typeof fieldNames)[number];
export type FieldIssues = Partial<Record<FieldName, string>>;

export const inputFrom = (form: HTMLFormElement) =>
  CreateUserRequestSchema.safeParse({
    firstName: fieldValue(form, 'firstName'),
    lastName: fieldValue(form, 'lastName'),
    email: fieldValue(form, 'email'),
    role: fieldValue(form, 'role'),
    areaId: fieldValue(form, 'areaId'),
    position: fieldValue(form, 'position') || undefined,
  });

export const issuesFrom = (form: HTMLFormElement): FieldIssues => {
  const parsed = inputFrom(form);
  if (parsed.success) return {};
  return parsed.error.issues.reduce<FieldIssues>((issues, issue) => {
    const name = issue.path[0];
    if (!fieldNames.includes(name as FieldName)) return issues;
    const field = name as FieldName;
    issues[field] ??= fieldIssueMessage(field, fieldValue(form, field));
    return issues;
  }, {});
};

const fieldIssueMessage = (field: FieldName, value: string): string => {
  if (field === 'firstName') return 'Ingrese un nombre válido.';
  if (field === 'lastName') return 'Ingrese los apellidos.';
  if (field === 'email') {
    return value
      ? 'Ingrese un correo válido.'
      : 'Ingrese el correo institucional.';
  }
  if (field === 'areaId') return 'Seleccione un área activa.';
  if (field === 'position') return 'El cargo no puede estar vacío.';
  return 'Seleccione un rol válido.';
};
