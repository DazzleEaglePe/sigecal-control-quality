import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  ApiErrorSchema,
  PhysChemValidationResponseSchema,
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
import { PhysChemService } from './physchem.service.js';
import {
  IDS,
  MemoryPhysChemMutationRepository,
  MemoryPhysChemReadRepository,
} from './physchem.test-helpers.js';

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
    physChemService: new PhysChemService(
      new MemoryPhysChemReadRepository(),
      new MemoryPhysChemMutationRepository(),
    ),
  });
const bearer = { Authorization: 'Bearer access-prueba' };
const payload = {
  inspectionId: IDS.inspection,
  results: [{ parameterId: IDS.parameter, value: 15 }],
};

describe('rutas de resultados fisicoquímicos', () => {
  it('permite al analista previsualizar la conformidad', async () => {
    const response = await request(appFor('ANALISTA'))
      .post(`${env.API_PREFIX}/physchem/results/validate`)
      .set(bearer)
      .send(payload)
      .expect(200);
    const body = PhysChemValidationResponseSchema.parse(response.body);
    expect(body.data[0]?.status).toBe('CONFORME');
  });

  it('rechaza estado y estándar enviados por el cliente', async () => {
    const response = await request(appFor('JEFE_CALIDAD'))
      .post(`${env.API_PREFIX}/physchem/results`)
      .set(bearer)
      .send({
        ...payload,
        results: [{ ...payload.results[0], status: 'CONFORME' }],
      })
      .expect(400);
    expect(ApiErrorSchema.parse(response.body).error.code).toBe(
      'VALIDATION_ERROR',
    );
  });

  it('impide registrar resultados al operario', async () => {
    await request(appFor('OPERARIO'))
      .post(`${env.API_PREFIX}/physchem/results`)
      .set(bearer)
      .send(payload)
      .expect(403);
  });
});
