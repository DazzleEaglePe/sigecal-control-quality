import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { ApiErrorSchema, UserListResponseSchema } from '@sigecal/shared';
import type {
  AreaItem,
  AreaListQuery,
  ChangePasswordRequest,
  CreateAreaRequest,
  CreateUserRequest,
  LoginRequest,
  ResetUserPasswordRequest,
  Role,
  UpdateAreaRequest,
  UpdateUserRequest,
  UserItem,
  UserListQuery,
  UserSession,
} from '@sigecal/shared';

import { createApp } from '../../app.js';
import { env } from '../../config/env.js';
import type { AreasUseCases } from '../areas/areas.types.js';
import type {
  AuthUseCases,
  AuthenticatedRequestUser,
  LoginResult,
  RefreshResult,
} from '../auth/auth.types.js';
import type { UsersUseCases } from './users.types.js';

const area: AreaItem = {
  id: '22222222-2222-4222-a222-222222222222',
  code: 'CALIDAD',
  name: 'Calidad',
  isActive: true,
  isProvisional: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const user: UserItem = {
  id: '11111111-1111-4111-a111-111111111111',
  firstName: 'Ana',
  lastName: 'Paz',
  email: 'ana@example.com',
  role: 'ADMIN',
  area,
  position: null,
  isActive: true,
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

class RoleAuth implements AuthUseCases {
  public constructor(
    private readonly role: Role,
    private readonly provisional = false,
  ) {}
  public authenticate(): Promise<AuthenticatedRequestUser> {
    return Promise.resolve({
      userId: user.id,
      role: this.role,
      mustChangePassword: this.provisional,
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
  public changePassword(
    _id: string,
    _input: ChangePasswordRequest,
  ): Promise<void> {
    void _id;
    void _input;
    return Promise.resolve();
  }
}

class FakeUsers implements UsersUseCases {
  public list(_query: UserListQuery) {
    void _query;
    return Promise.resolve({ data: [user], total: 1 });
  }
  public get() {
    return Promise.resolve(user);
  }
  public create(_input: CreateUserRequest) {
    void _input;
    return Promise.resolve(user);
  }
  public update(_id: string, _input: UpdateUserRequest) {
    void _id;
    void _input;
    return Promise.resolve(user);
  }
  public setStatus(_id: string, _active: boolean) {
    void _id;
    void _active;
    return Promise.resolve(user);
  }
  public resetPassword(_id: string, _input: ResetUserPasswordRequest) {
    void _id;
    void _input;
    return Promise.resolve();
  }
}

class FakeAreas implements AreasUseCases {
  public list(_query: AreaListQuery) {
    void _query;
    return Promise.resolve([area]);
  }
  public create(_input: CreateAreaRequest) {
    void _input;
    return Promise.resolve(area);
  }
  public update(_id: string, _input: UpdateAreaRequest) {
    void _id;
    void _input;
    return Promise.resolve(area);
  }
}

const appFor = (role: Role, provisional = false) =>
  createApp({
    authService: new RoleAuth(role, provisional),
    usersService: new FakeUsers(),
    areasService: new FakeAreas(),
  });
const bearer = { Authorization: 'Bearer access-prueba' };

describe('autorización de usuarios', () => {
  it('permite listar únicamente a ADMIN', async () => {
    const allowed = await request(appFor('ADMIN'))
      .get(`${env.API_PREFIX}/users`)
      .set(bearer)
      .expect(200);
    expect(UserListResponseSchema.parse(allowed.body).meta).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1,
    });
    await request(appFor('JEFE_CALIDAD'))
      .get(`${env.API_PREFIX}/users`)
      .set(bearer)
      .expect(403);
  });

  it('bloquea módulos mientras la contraseña sea provisional', async () => {
    const response = await request(appFor('ADMIN', true))
      .get(`${env.API_PREFIX}/users`)
      .set(bearer)
      .expect(403);
    expect(ApiErrorSchema.parse(response.body).error.message).toContain(
      'contraseña provisional',
    );
  });
});

describe('autorización de áreas', () => {
  it('permite consultar a todos y escribir solo a ADMIN o JEFE_CALIDAD', async () => {
    await request(appFor('ANALISTA'))
      .get(`${env.API_PREFIX}/masters/areas`)
      .set(bearer)
      .expect(200);
    await request(appFor('ANALISTA'))
      .post(`${env.API_PREFIX}/masters/areas`)
      .set(bearer)
      .send({ code: 'NUEVA', name: 'Nueva' })
      .expect(403);
    await request(appFor('JEFE_CALIDAD'))
      .post(`${env.API_PREFIX}/masters/areas`)
      .set(bearer)
      .send({ code: 'NUEVA', name: 'Nueva' })
      .expect(201);
  });
});
