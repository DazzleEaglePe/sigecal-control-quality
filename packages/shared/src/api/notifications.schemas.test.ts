import { describe, expect, it } from 'vitest';

import {
  NotificationItemSchema,
  NotificationListQuerySchema,
} from './notifications.schemas.js';

describe('contrato de notificaciones', () => {
  it('interpreta el filtro false sin coerción ambigua', () => {
    expect(
      NotificationListQuerySchema.parse({ isRead: 'false' }),
    ).toMatchObject({
      page: 1,
      pageSize: 20,
      isRead: false,
    });
  });

  it('no permite exponer la clave interna de deduplicación', () => {
    const value = {
      id: '11111111-1111-4111-a111-111111111111',
      type: 'INSPECTION_DUE_SOON',
      title: 'Inspección próxima',
      message: 'Mensaje',
      entityType: 'Inspection',
      entityId: '22222222-2222-4222-a222-222222222222',
      isRead: false,
      createdAt: '2026-09-06T12:00:00.000Z',
      dedupeKey: 'privado',
    };
    expect(NotificationItemSchema.safeParse(value).success).toBe(false);
  });
});
