import { z } from 'zod';

import { createApiSuccessSchema, PaginationQuerySchema } from './contracts.js';

export const NotificationTypeSchema = z.enum([
  'INSPECTION_DUE_SOON',
  'INSPECTION_OVERDUE',
  'NONCONFORMITY_ASSIGNED',
  'ACTION_ASSIGNED',
  'ACTION_DUE_SOON',
]);

export const NotificationEntityTypeSchema = z.enum([
  'Inspection',
  'NonConformity',
  'CorrectiveAction',
]);

export const NotificationItemSchema = z
  .object({
    id: z.uuid(),
    type: NotificationTypeSchema,
    title: z.string().trim().min(1),
    message: z.string().trim().min(1),
    entityType: NotificationEntityTypeSchema.nullable(),
    entityId: z.uuid().nullable(),
    isRead: z.boolean(),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const NotificationListQuerySchema = PaginationQuerySchema.omit({
  sortBy: true,
  sortOrder: true,
  search: true,
}).extend({
  isRead: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export const NotificationListResponseSchema = createApiSuccessSchema(
  z.array(NotificationItemSchema),
);
export const NotificationResponseSchema = createApiSuccessSchema(
  NotificationItemSchema,
);
export const UnreadNotificationCountSchema = z
  .object({ count: z.number().int().nonnegative() })
  .strict();
export const UnreadNotificationCountResponseSchema = createApiSuccessSchema(
  UnreadNotificationCountSchema,
);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationEntityType = z.infer<
  typeof NotificationEntityTypeSchema
>;
export type NotificationItem = z.infer<typeof NotificationItemSchema>;
export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;
