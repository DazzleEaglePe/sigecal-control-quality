import { expect, it } from 'vitest';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listAssignmentOptions } from './assignment-options-api.js';

it('recorre todas las páginas sin consultar el directorio ADMIN', async () => {
  const paths: string[] = [];
  const request: AuthorizedRequest = <T>(path: string): Promise<T> => {
    paths.push(path);
    return Promise.resolve({
      success: true,
      data: [
        {
          id: `11111111-1111-4111-a111-${String(paths.length).padStart(12, '0')}`,
          firstName: 'Responsable',
          lastName: 'Prueba',
          role: 'ANALISTA',
          isActive: true,
        },
      ],
      meta: { page: paths.length, pageSize: 100, total: 2 },
    } as T);
  };
  expect((await listAssignmentOptions(request)).data).toHaveLength(2);
  expect(paths).toEqual([
    '/users/assignment-options?page=1&pageSize=100',
    '/users/assignment-options?page=2&pageSize=100',
  ]);
});
