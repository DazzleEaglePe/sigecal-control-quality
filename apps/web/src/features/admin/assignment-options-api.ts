import {
  AssignmentOptionsResponseSchema,
  type AssignmentOption,
} from '@sigecal/shared';
import type { AuthorizedRequest } from '../auth/auth-context.js';

/** La API limita cada página; no se deben perder responsables después de la primera. */
export const listAssignmentOptions = async (request: AuthorizedRequest) => {
  const data: AssignmentOption[] = [];
  let page = 1;
  let total: number;
  do {
    const response = AssignmentOptionsResponseSchema.parse(
      await request<unknown>(
        `/users/assignment-options?page=${String(page)}&pageSize=100`,
      ),
    );
    data.push(...response.data);
    total = response.meta.total;
    page += 1;
    if (response.data.length === 0) break;
  } while (data.length < total);
  return { data };
};
