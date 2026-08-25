import { ApiClientError } from '../../lib/api-client.js';

export const errorMessage = (cause: unknown): string =>
  cause instanceof ApiClientError
    ? cause.message
    : 'No fue posible completar la operación.';

export const fieldValue = (form: HTMLFormElement, name: string): string => {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement || field instanceof HTMLSelectElement
    ? field.value
    : '';
};
