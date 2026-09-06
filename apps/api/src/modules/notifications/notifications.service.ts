import type { NotificationItem, NotificationListQuery } from '@sigecal/shared';

import { NotFoundError } from '../../errors/app-error.js';
import type {
  NotificationRecord,
  NotificationRepositoryPort,
  NotificationsUseCases,
} from './notifications.types.js';

const toItem = (record: NotificationRecord): NotificationItem => ({
  ...record,
  createdAt: record.createdAt.toISOString(),
});

export class NotificationsService implements NotificationsUseCases {
  public constructor(private readonly repository: NotificationRepositoryPort) {}

  public async list(userId: string, query: NotificationListQuery) {
    const result = await this.repository.list(userId, query);
    return { items: result.items.map(toItem), total: result.total };
  }

  public unreadCount(userId: string): Promise<number> {
    return this.repository.unreadCount(userId);
  }

  public async markRead(userId: string, id: string): Promise<NotificationItem> {
    const notification = await this.repository.markRead(userId, id);
    if (!notification) throw new NotFoundError('La notificación no existe.');
    return toItem(notification);
  }

  public markAllRead(userId: string): Promise<number> {
    return this.repository.markAllRead(userId);
  }
}
