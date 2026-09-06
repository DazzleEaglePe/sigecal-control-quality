import type { Request, RequestHandler } from 'express';
import type { NotificationListQuery } from '@sigecal/shared';

import type { NotificationsUseCases } from './notifications.types.js';

const userId = (request: Request): string => request.auth?.userId ?? '';
const entityId = (request: Request): string =>
  typeof request.params.id === 'string' ? request.params.id : '';

export class NotificationsController {
  public constructor(private readonly notifications: NotificationsUseCases) {}

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const query = request.query as unknown as NotificationListQuery;
      const result = await this.notifications.list(userId(request), query);
      response.json({
        success: true,
        data: result.items,
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly unreadCount: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const count = await this.notifications.unreadCount(userId(request));
      response.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  };

  public readonly markRead: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.notifications.markRead(
        userId(request),
        entityId(request),
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly markAllRead: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const count = await this.notifications.markAllRead(userId(request));
      response.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  };
}
