import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type {
  ChangePasswordRequest,
  LoginRequest,
  UserSession,
} from '@sigecal/shared';
import {
  NotificationListResponseSchema,
  NotificationResponseSchema,
  UnreadNotificationCountResponseSchema,
} from '@sigecal/shared';

import { createApp } from '../../app.js';
import { env } from '../../config/env.js';
import type {
  AuthUseCases,
  AuthenticatedRequestUser,
  LoginResult,
  RefreshResult,
} from '../auth/auth.types.js';
import { NotificationsService } from './notifications.service.js';
import type {
  NotificationRecord,
  NotificationRepositoryPort,
} from './notifications.types.js';

const USER_ID = '11111111-1111-4111-a111-111111111111';
const NOTIFICATION_ID = '22222222-2222-4222-a222-222222222222';

class AuthStub implements AuthUseCases {
  public authenticate(): Promise<AuthenticatedRequestUser> {
    return Promise.resolve({
      userId: USER_ID,
      role: 'OPERARIO',
      mustChangePassword: false,
    });
  }
  public login(_input: LoginRequest): Promise<LoginResult> {
    void _input;
    return Promise.reject(new Error('unused'));
  }
  public refresh(): Promise<RefreshResult> {
    return Promise.reject(new Error('unused'));
  }
  public logout(): Promise<void> {
    return Promise.resolve();
  }
  public me(): Promise<UserSession> {
    return Promise.reject(new Error('unused'));
  }
  public changePassword(_id: string, _input: ChangePasswordRequest) {
    void _id;
    void _input;
    return Promise.resolve();
  }
}

const record: NotificationRecord = {
  id: NOTIFICATION_ID,
  type: 'INSPECTION_DUE_SOON',
  title: 'Inspección próxima',
  message: 'Tiene una inspección dentro de 48 horas.',
  entityType: 'Inspection',
  entityId: '33333333-3333-4333-a333-333333333333',
  isRead: false,
  createdAt: new Date('2026-09-06T12:00:00.000Z'),
};

const repository = () => {
  const list = vi.fn().mockResolvedValue({ items: [record], total: 1 });
  const unreadCount = vi.fn().mockResolvedValue(1);
  const markRead = vi.fn().mockResolvedValue({ ...record, isRead: true });
  const markAllRead = vi.fn().mockResolvedValue(1);
  const repo: NotificationRepositoryPort = {
    list,
    unreadCount,
    markRead,
    markAllRead,
  };
  return { repo, mocks: { list, markRead } };
};

const appFor = (memory = repository()) => ({
  app: createApp({
    authService: new AuthStub(),
    notificationsService: new NotificationsService(memory.repo),
  }),
  mocks: memory.mocks,
});
const bearer = { Authorization: 'Bearer prueba' };

describe('rutas de notificaciones', () => {
  it('lista solo en el contexto del usuario autenticado y pagina', async () => {
    const { app, mocks } = appFor();
    const response = await request(app)
      .get(`${env.API_PREFIX}/notifications?isRead=false`)
      .set(bearer)
      .expect(200);
    const body = NotificationListResponseSchema.parse(response.body);
    expect(body.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
    expect(mocks.list).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ isRead: false }),
    );
  });

  it('consulta el contador y marca una notificación propia', async () => {
    const { app, mocks } = appFor();
    const count = await request(app)
      .get(`${env.API_PREFIX}/notifications/unread-count`)
      .set(bearer)
      .expect(200);
    expect(
      UnreadNotificationCountResponseSchema.parse(count.body).data.count,
    ).toBe(1);
    const read = await request(app)
      .patch(`${env.API_PREFIX}/notifications/${NOTIFICATION_ID}/read`)
      .set(bearer)
      .expect(200);
    expect(NotificationResponseSchema.parse(read.body).data.isRead).toBe(true);
    expect(mocks.markRead).toHaveBeenCalledWith(USER_ID, NOTIFICATION_ID);
  });
});
