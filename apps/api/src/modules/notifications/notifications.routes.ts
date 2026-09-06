import { Router } from 'express';
import { EntityIdParamsSchema } from '@sigecal/shared';

import { validate } from '../../middleware/validate.js';
import {
  authenticate,
  requirePasswordChanged,
} from '../auth/auth.middleware.js';
import type { AuthUseCases } from '../auth/auth.types.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationListQuerySchema } from './notifications.schema.js';
import type { NotificationsUseCases } from './notifications.types.js';

export const createNotificationsRouter = (
  auth: AuthUseCases,
  notifications: NotificationsUseCases,
): Router => {
  const router = Router();
  const controller = new NotificationsController(notifications);
  router.use(authenticate(auth), requirePasswordChanged);
  router.get(
    '/',
    validate({ query: NotificationListQuerySchema }),
    controller.list,
  );
  router.get('/unread-count', controller.unreadCount);
  router.patch('/read-all', controller.markAllRead);
  router.patch(
    '/:id/read',
    validate({ params: EntityIdParamsSchema }),
    controller.markRead,
  );
  return router;
};
