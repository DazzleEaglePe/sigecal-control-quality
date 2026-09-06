import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type {
  ChangePasswordRequest,
  LoginRequest,
  Role,
  UserSession,
} from '@sigecal/shared';
import {
  ApiErrorSchema,
  ReportsDashboardResponseSchema,
} from '@sigecal/shared';

import { createApp } from '../../app.js';
import { env } from '../../config/env.js';
import type {
  AuthUseCases,
  AuthenticatedRequestUser,
  LoginResult,
  RefreshResult,
} from '../auth/auth.types.js';
import { ReportsService } from './reports.service.js';
import type { ReportsDataset, ReportsRepositoryPort } from './reports.types.js';

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

class EmptyReportsRepository implements ReportsRepositoryPort {
  public loadDashboard(): Promise<ReportsDataset> {
    return Promise.resolve({
      results: [],
      inspections: [],
      nonConformities: [],
      batchStages: [],
    });
  }
}

const appFor = (role: Role) =>
  createApp({
    authService: new RoleAuth(role),
    reportsService: new ReportsService(
      new EmptyReportsRepository(),
      () => new Date('2026-09-20T17:00:00.000Z'),
    ),
  });
const bearer = { Authorization: 'Bearer prueba' };
const path = `${env.API_PREFIX}/reports/dashboard?dateFrom=2026-09-01&dateTo=2026-09-30`;

describe('rutas de indicadores', () => {
  it('entrega el contrato consolidado a un usuario autenticado', async () => {
    const response = await request(appFor('OPERARIO'))
      .get(path)
      .set(bearer)
      .expect(200);
    expect(
      ReportsDashboardResponseSchema.safeParse(response.body).success,
    ).toBe(true);
  });

  it('rechaza un periodo invertido y el acceso sin token', async () => {
    const invalid = await request(appFor('ADMIN'))
      .get(
        `${env.API_PREFIX}/reports/dashboard?dateFrom=2026-10-01&dateTo=2026-09-30`,
      )
      .set(bearer)
      .expect(400);
    expect(ApiErrorSchema.parse(invalid.body).error.code).toBe(
      'VALIDATION_ERROR',
    );
    await request(appFor('ADMIN')).get(path).expect(401);
  });

  it('impide que el analista mezcle datos DEMO', async () => {
    const response = await request(appFor('ANALISTA'))
      .get(`${path}&includeDemo=true`)
      .set(bearer)
      .expect(403);
    expect(ApiErrorSchema.parse(response.body).error.code).toBe(
      'INSUFFICIENT_PERMISSIONS',
    );
  });
});
