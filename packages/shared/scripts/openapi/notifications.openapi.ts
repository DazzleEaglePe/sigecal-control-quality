import { z } from 'zod';

import {
  NotificationListResponseSchema,
  NotificationResponseSchema,
  UnreadNotificationCountResponseSchema,
} from '../../src/index.js';

const schema = (value: z.ZodType): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...z.toJSONSchema(value) };
  delete result.$schema;
  return result;
};
const json = (name: string) => ({
  'application/json': { schema: { $ref: `#/components/schemas/${name}` } },
});
const secured = { security: [{ bearerAuth: [] }], tags: ['Notificaciones'] };
const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

export const notificationPaths = {
  '/notifications': {
    get: {
      ...secured,
      operationId: 'listNotifications',
      summary: 'Lista las notificaciones del usuario autenticado',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
        {
          name: 'pageSize',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100 },
        },
        { name: 'isRead', in: 'query', schema: { type: 'boolean' } },
      ],
      responses: {
        '200': {
          description: 'Notificaciones propias paginadas.',
          content: json('NotificationListResponse'),
        },
      },
    },
  },
  '/notifications/unread-count': {
    get: {
      ...secured,
      operationId: 'getUnreadNotificationCount',
      summary: 'Cuenta las notificaciones no leídas del usuario',
      responses: {
        '200': {
          description: 'Contador de no leídas.',
          content: json('UnreadNotificationCountResponse'),
        },
      },
    },
  },
  '/notifications/read-all': {
    patch: {
      ...secured,
      operationId: 'markAllNotificationsRead',
      summary: 'Marca como leídas todas las notificaciones propias',
      responses: {
        '200': {
          description: 'Cantidad marcada como leída.',
          content: json('UnreadNotificationCountResponse'),
        },
      },
    },
  },
  '/notifications/{id}/read': {
    patch: {
      ...secured,
      operationId: 'markNotificationRead',
      summary: 'Marca una notificación propia como leída',
      parameters: [idParameter],
      responses: {
        '200': {
          description: 'Notificación actualizada.',
          content: json('NotificationResponse'),
        },
        '404': {
          description: 'La notificación no existe o pertenece a otro usuario.',
          content: json('ApiError'),
        },
      },
    },
  },
};

export const notificationSchemas = {
  NotificationListResponse: schema(NotificationListResponseSchema),
  NotificationResponse: schema(NotificationResponseSchema),
  UnreadNotificationCountResponse: schema(
    UnreadNotificationCountResponseSchema,
  ),
};
