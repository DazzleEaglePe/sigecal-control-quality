import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  ApiErrorSchema,
  NonConformityDetailResponseSchema,
  NonConformityListResponseSchema,
  type ChangePasswordRequest,
  type LoginRequest,
  type Role,
  type UserSession,
} from '@sigecal/shared';

import { createApp } from '../../app.js';
import { env } from '../../config/env.js';
import type {
  AuthUseCases,
  AuthenticatedRequestUser,
  LoginResult,
  RefreshResult,
} from '../auth/auth.types.js';
import { NonConformitiesService } from './nonconformities.service.js';
import {
  createInput,
  IDS,
  MemoryNonConformityMutationRepository,
  MemoryNonConformityReadRepository,
} from './nonconformities.test-helpers.js';

class RoleAuth implements AuthUseCases {
  public constructor(private readonly role: Role) {}
  public authenticate(): Promise<AuthenticatedRequestUser> {
    return Promise.resolve({
      userId: IDS.user,
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
  public changePassword(
    _id: string,
    _input: ChangePasswordRequest,
  ): Promise<void> {
    void _id;
    void _input;
    return Promise.resolve();
  }
}

const appFor = (role: Role) =>
  createApp({
    authService: new RoleAuth(role),
    nonConformitiesService: new NonConformitiesService(
      new MemoryNonConformityReadRepository(),
      new MemoryNonConformityMutationRepository(),
    ),
  });
const bearer = { Authorization: 'Bearer access-prueba' };

describe('rutas de no conformidades', () => {
  it('lista con paginación y contrato de respuesta', async () => {
    const response = await request(appFor('JEFE_CALIDAD'))
      .get(`${env.API_PREFIX}/nonconformities`)
      .set(bearer)
      .expect(200);

    const body = NonConformityListResponseSchema.parse(response.body);
    expect(body.meta).toMatchObject({ page: 1, pageSize: 20, total: 1 });
  });

  it('devuelve el detalle consolidado con acciones y tiempos calculados', async () => {
    const response = await request(appFor('JEFE_CALIDAD'))
      .get(`${env.API_PREFIX}/nonconformities/${IDS.nc}`)
      .set(bearer)
      .expect(200);

    const detail = NonConformityDetailResponseSchema.parse(response.body).data;
    expect(detail).toMatchObject({
      code: 'NC-2026-0001',
      responseTimeHours: null,
      closureTimeHours: null,
      actions: [],
    });
  });

  it('permite al operario registrar una no conformidad manual', async () => {
    const response = await request(appFor('OPERARIO'))
      .post(`${env.API_PREFIX}/nonconformities`)
      .set(bearer)
      .send(createInput)
      .expect(201);
    expect(NonConformityDetailResponseSchema.parse(response.body).data.id).toBe(
      IDS.nc,
    );
  });
});

describe('permisos de escritura', () => {
  it('rechaza al operario en el inicio de atención', async () => {
    const response = await request(appFor('OPERARIO'))
      .post(`${env.API_PREFIX}/nonconformities/${IDS.nc}/start-attention`)
      .set(bearer)
      .expect(403);
    expect(ApiErrorSchema.parse(response.body).error.code).toBe(
      'INSUFFICIENT_PERMISSIONS',
    );
  });

  it('rechaza al analista en el cierre', async () => {
    const response = await request(appFor('ANALISTA'))
      .post(`${env.API_PREFIX}/nonconformities/${IDS.nc}/close`)
      .set(bearer)
      .send({})
      .expect(403);
    expect(ApiErrorSchema.parse(response.body).error.code).toBe(
      'INSUFFICIENT_PERMISSIONS',
    );
  });

  it('rechaza sin token', async () => {
    await request(appFor('JEFE_CALIDAD'))
      .get(`${env.API_PREFIX}/nonconformities`)
      .expect(401);
  });
});
