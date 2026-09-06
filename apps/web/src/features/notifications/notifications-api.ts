import {
  NotificationListResponseSchema,
  NotificationResponseSchema,
  UnreadNotificationCountResponseSchema,
  type NotificationItem,
} from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';

export const listNotifications = async (
  request: AuthorizedRequest,
): Promise<readonly NotificationItem[]> =>
  NotificationListResponseSchema.parse(
    await request<unknown>('/notifications?page=1&pageSize=20'),
  ).data;

export const unreadNotificationCount = async (
  request: AuthorizedRequest,
): Promise<number> =>
  UnreadNotificationCountResponseSchema.parse(
    await request<unknown>('/notifications/unread-count'),
  ).data.count;

export const markNotificationRead = async (
  request: AuthorizedRequest,
  id: string,
): Promise<NotificationItem> =>
  NotificationResponseSchema.parse(
    await request<unknown>(`/notifications/${id}/read`, { method: 'PATCH' }),
  ).data;

export const markAllNotificationsRead = async (
  request: AuthorizedRequest,
): Promise<number> =>
  UnreadNotificationCountResponseSchema.parse(
    await request<unknown>('/notifications/read-all', { method: 'PATCH' }),
  ).data.count;
