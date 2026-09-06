import { logger } from '../../config/logger.js';
import type { NotificationGenerationUseCase } from './notifications.types.js';

const NOTIFICATION_INTERVAL_MS = 60_000;

export const generateNotifications = async (
  notifications: NotificationGenerationUseCase,
): Promise<void> => {
  try {
    const created = await notifications.execute();
    if (created > 0) {
      logger.info({ created }, 'Notificaciones internas generadas');
    }
  } catch (error) {
    logger.error({ err: error }, 'Falló la generación de notificaciones');
  }
};

export const startNotificationJob = (
  notifications: NotificationGenerationUseCase,
): NodeJS.Timeout => {
  void generateNotifications(notifications);
  const timer = setInterval(
    () => void generateNotifications(notifications),
    NOTIFICATION_INTERVAL_MS,
  );
  timer.unref();
  return timer;
};
