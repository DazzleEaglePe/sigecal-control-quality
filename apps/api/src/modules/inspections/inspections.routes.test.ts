import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  ApiErrorSchema,
  InspectionListResponseSchema,
  InspectionDetailResponseSchema,
  InspectionResponseSchema,
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
import { InspectionsService } from './inspections.service.js';
import {
  createInput,
  IDS,
  MemoryInspectionMutationRepository,
  MemoryInspectionReadRepository,
} from './inspections.test-helpers.js';

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
    inspectionsService: new InspectionsService(
      new MemoryInspectionReadRepository(),
      new MemoryInspectionMutationRepository(),
    ),
  });
const bearer = { Authorization: 'Bearer access-prueba' };

describe('rutas de inspecciones', () => {
  it('lista con paginación y contrato de respuesta', async () => {
    const response = await request(appFor('JEFE_CALIDAD'))
      .get(`${env.API_PREFIX}/inspections`)
      .set(bearer)
      .expect(200);

    const body = InspectionListResponseSchema.parse(response.body);
    expect(body.meta).toMatchObject({ page: 1, pageSize: 20, total: 1 });
  });

  it('consolida el detalle de parámetros y trazabilidad', async () => {
    const response = await request(appFor('JEFE_CALIDAD'))
      .get(`${env.API_PREFIX}/inspections/${IDS.inspection}`)
      .set(bearer)
      .expect(200);

    const detail = InspectionDetailResponseSchema.parse(response.body).data;
    expect(detail.parameterDetails).toEqual([
      expect.objectContaining({
        applicableStandard: null,
        currentResult: null,
        history: [],
      }),
    ]);
  });
});

describe('permisos y transiciones de inspecciones', () => {
  it('impide programar a ANALISTA y rechaza metadatos manipulables', async () => {
    await request(appFor('ANALISTA'))
      .post(`${env.API_PREFIX}/inspections`)
      .set(bearer)
      .send(createInput)
      .expect(403);
    const invalid = await request(appFor('JEFE_CALIDAD'))
      .post(`${env.API_PREFIX}/inspections`)
      .set(bearer)
      .send({ ...createInput, dataOrigin: 'DEMO' })
      .expect(400);
    expect(ApiErrorSchema.parse(invalid.body).error.code).toBe(
      'VALIDATION_ERROR',
    );
  });

  it('permite iniciar al analista responsable', async () => {
    const response = await request(appFor('ANALISTA'))
      .post(`${env.API_PREFIX}/inspections/${IDS.inspection}/start`)
      .set(bearer)
      .expect(200);
    expect(InspectionResponseSchema.parse(response.body).data.id).toBe(
      IDS.inspection,
    );
  });
});
