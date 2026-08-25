import request from 'supertest';
import { describe, expect, it } from 'vitest';

import {
  LoginResponseSchema,
  MeResponseSchema,
  RefreshResponseSchema,
  type ChangePasswordRequest,
  type LoginRequest,
  type UserSession,
} from '@sigecal/shared';

import { createApp } from '../../app.js';
import { env } from '../../config/env.js';
import type {
  AuthUseCases,
  AuthenticatedRequestUser,
  LoginResult,
  RefreshResult,
} from './auth.types.js';

const session: UserSession = {
  id: '11111111-1111-4111-a111-111111111111',
  firstName: 'Jefatura',
  lastName: 'Calidad',
  email: 'jefe@sigecal.pe',
  role: 'JEFE_CALIDAD',
  mustChangePassword: true,
  permissions: ['MASTERS_MANAGE'],
};

class FakeAuthUseCases implements AuthUseCases {
  public refreshReceived = '';

  public login(_input: LoginRequest): Promise<LoginResult> {
    void _input;
    return Promise.resolve({
      accessToken: 'access-login',
      refreshToken: 'refresh-login',
      user: session,
    });
  }

  public refresh(refreshToken: string): Promise<RefreshResult> {
    this.refreshReceived = refreshToken;
    return Promise.resolve({
      accessToken: 'access-refreshed',
      refreshToken: 'refresh-rotated',
    });
  }

  public logout(): Promise<void> {
    return Promise.resolve();
  }

  public authenticate(token: string): Promise<AuthenticatedRequestUser> {
    if (token !== 'access-ok') return Promise.reject(new Error('invalid'));
    return Promise.resolve({
      userId: session.id,
      role: session.role,
      mustChangePassword: session.mustChangePassword,
    });
  }

  public me(): Promise<UserSession> {
    return Promise.resolve(session);
  }

  public changePassword(
    _userId: string,
    _input: ChangePasswordRequest,
  ): Promise<void> {
    void _userId;
    void _input;
    return Promise.resolve();
  }
}

const cookieHeader = (response: request.Response): string => {
  const value: unknown = response.headers['set-cookie'];
  if (Array.isArray(value)) return value.join('; ');
  return typeof value === 'string' ? value : '';
};

describe('rutas públicas de autenticación', () => {
  it('entrega access en JSON y refresh únicamente en cookie protegida', async () => {
    const response = await request(
      createApp({ authService: new FakeAuthUseCases() }),
    )
      .post(`${env.API_PREFIX}/auth/login`)
      .send({ email: 'jefe@sigecal.pe', password: 'Correcta1' })
      .expect(200);

    const body = LoginResponseSchema.parse(response.body);
    expect(body.data).not.toHaveProperty('refreshToken');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(cookieHeader(response)).toMatch(/sigecal_refresh=.*HttpOnly/);
    expect(cookieHeader(response)).toContain('SameSite=Strict');
    expect(cookieHeader(response)).toContain('Path=/api/v1/auth');
  });

  it('rota la cookie sin incluir el refresh en la respuesta', async () => {
    const auth = new FakeAuthUseCases();
    const response = await request(createApp({ authService: auth }))
      .post(`${env.API_PREFIX}/auth/refresh`)
      .set('Cookie', 'sigecal_refresh=refresh-anterior')
      .expect(200);

    expect(RefreshResponseSchema.parse(response.body).data.accessToken).toBe(
      'access-refreshed',
    );
    expect(auth.refreshReceived).toBe('refresh-anterior');
    expect(JSON.stringify(response.body)).not.toContain('refresh-rotated');
    expect(cookieHeader(response)).toContain('sigecal_refresh=refresh-rotated');
  });
});

describe('rutas protegidas de autenticación', () => {
  it('rechaza /me sin bearer y devuelve permisos con bearer válido', async () => {
    const app = createApp({ authService: new FakeAuthUseCases() });
    await request(app).get(`${env.API_PREFIX}/auth/me`).expect(401);
    const response = await request(app)
      .get(`${env.API_PREFIX}/auth/me`)
      .set('Authorization', 'Bearer access-ok')
      .expect(200);

    expect(MeResponseSchema.parse(response.body).data).toEqual(session);
  });

  it('rechaza contraseñas nuevas que incumplen la política', async () => {
    await request(createApp({ authService: new FakeAuthUseCases() }))
      .patch(`${env.API_PREFIX}/auth/password`)
      .set('Authorization', 'Bearer access-ok')
      .send({ currentPassword: 'Correcta1', newPassword: 'sin-numeros' })
      .expect(400);
  });
});
