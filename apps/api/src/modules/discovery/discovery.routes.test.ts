import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type {
  AuditQuery,
  ChangePasswordRequest,
  LoginRequest,
  Role,
  SearchQuery,
  UserSession,
} from '@sigecal/shared';
import {
  ApiErrorSchema,
  AuditListResponseSchema,
  SearchResponseSchema,
} from '@sigecal/shared';

import { createApp } from '../../app.js';
import { env } from '../../config/env.js';
import type {
  AuthUseCases,
  AuthenticatedRequestUser,
  LoginResult,
  RefreshResult,
} from '../auth/auth.types.js';
import type { DiscoveryActor, DiscoveryUseCases } from './discovery.types.js';

class RoleAuth implements AuthUseCases {
  public constructor(private readonly role: Role) {}
  public authenticate(): Promise<AuthenticatedRequestUser> {
    return Promise.resolve({
      userId: '11111111-1111-4111-a111-111111111111',
      role: this.role,
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

class DiscoveryStub implements DiscoveryUseCases {
  public search(_query: SearchQuery, _actor: DiscoveryActor) {
    void _query;
    void _actor;
    return Promise.resolve({
      batches: [],
      inspections: [],
      nonConformities: [],
      total: 0,
    });
  }
  public audit(_query: AuditQuery) {
    void _query;
    return Promise.resolve({ items: [], total: 0 });
  }
}

const bearer = { Authorization: 'Bearer prueba' };
const appFor = (role: Role) =>
  createApp({
    authService: new RoleAuth(role),
    discoveryService: new DiscoveryStub(),
  });

describe('rutas de búsqueda y auditoría', () => {
  it('busca para cualquier rol autenticado y valida la consulta', async () => {
    const response = await request(appFor('OPERARIO'))
      .get(`${env.API_PREFIX}/search?q=LT`)
      .set(bearer)
      .expect(200);
    expect(SearchResponseSchema.safeParse(response.body).success).toBe(true);
    const invalid = await request(appFor('ADMIN'))
      .get(`${env.API_PREFIX}/search?q=L`)
      .set(bearer)
      .expect(400);
    expect(ApiErrorSchema.parse(invalid.body).error.code).toBe(
      'VALIDATION_ERROR',
    );
  });

  it('reserva la bitácora para administración y jefatura', async () => {
    const response = await request(appFor('JEFE_CALIDAD'))
      .get(`${env.API_PREFIX}/audit`)
      .set(bearer)
      .expect(200);
    expect(AuditListResponseSchema.safeParse(response.body).success).toBe(true);
    await request(appFor('OPERARIO'))
      .get(`${env.API_PREFIX}/audit`)
      .set(bearer)
      .expect(403);
  });
});
