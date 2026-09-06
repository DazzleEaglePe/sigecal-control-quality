import { expect, it } from 'vitest';

import type { RequestOptions } from '../../lib/api-client.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
} from './notifications-api.js';

const item = {
  id: '11111111-1111-4111-a111-111111111111',
  type: 'NONCONFORMITY_ASSIGNED',
  title: 'No conformidad asignada',
  message: 'Tiene una no conformidad asignada.',
  entityType: 'NonConformity',
  entityId: '22222222-2222-4222-a222-222222222222',
  isRead: false,
  createdAt: '2026-09-06T12:00:00.000Z',
} as const;

it('consulta lista y contador en sus rutas protegidas', async () => {
  const paths: string[] = [];
  const request: AuthorizedRequest = <T>(path: string): Promise<T> => {
    paths.push(path);
    const response = path.endsWith('unread-count')
      ? { success: true, data: { count: 1 } }
      : {
          success: true,
          data: [item],
          meta: { page: 1, pageSize: 20, total: 1 },
        };
    return Promise.resolve(response as T);
  };
  expect(await listNotifications(request)).toHaveLength(1);
  expect(await unreadNotificationCount(request)).toBe(1);
  expect(paths).toEqual([
    '/notifications?page=1&pageSize=20',
    '/notifications/unread-count',
  ]);
});

it('marca una o todas como leídas con PATCH', async () => {
  const calls: {
    path: string;
    method: RequestOptions['method'] | undefined;
  }[] = [];
  const request: AuthorizedRequest = <T>(
    path: string,
    options?: Omit<RequestOptions, 'accessToken'>,
  ): Promise<T> => {
    calls.push({ path, method: options?.method });
    const response = path.endsWith('read-all')
      ? { success: true, data: { count: 1 } }
      : { success: true, data: { ...item, isRead: true } };
    return Promise.resolve(response as T);
  };
  expect(await markNotificationRead(request, item.id)).toMatchObject({
    isRead: true,
  });
  expect(await markAllNotificationsRead(request)).toBe(1);
  expect(calls).toEqual([
    { path: `/notifications/${item.id}/read`, method: 'PATCH' },
    { path: '/notifications/read-all', method: 'PATCH' },
  ]);
});
