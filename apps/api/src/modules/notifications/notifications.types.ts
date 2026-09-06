import type {
  NotificationEntityType,
  NotificationItem,
  NotificationListQuery,
  NotificationType,
} from '@sigecal/shared';

export interface NotificationRecord {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly entityType: NotificationEntityType | null;
  readonly entityId: string | null;
  readonly isRead: boolean;
  readonly createdAt: Date;
}

export interface NotificationRepositoryPort {
  list(
    userId: string,
    query: NotificationListQuery,
  ): Promise<{
    readonly items: readonly NotificationRecord[];
    readonly total: number;
  }>;
  unreadCount(userId: string): Promise<number>;
  markRead(userId: string, id: string): Promise<NotificationRecord | null>;
  markAllRead(userId: string): Promise<number>;
}

export interface NotificationGenerationPort {
  generate(now: Date, dueAt: Date): Promise<number>;
}

export interface NotificationsUseCases {
  list(
    userId: string,
    query: NotificationListQuery,
  ): Promise<{
    readonly items: readonly NotificationItem[];
    readonly total: number;
  }>;
  unreadCount(userId: string): Promise<number>;
  markRead(userId: string, id: string): Promise<NotificationItem>;
  markAllRead(userId: string): Promise<number>;
}

export interface NotificationGenerationUseCase {
  execute(now?: Date): Promise<number>;
}
