import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type {
  ChangePasswordRequest,
  LoginRequest,
  Role,
  UserSession,
} from '@sigecal/shared';
import { createApp } from '../../app.js';
import { env } from '../../config/env.js';
import type {
  AuthUseCases,
  AuthenticatedRequestUser,
  LoginResult,
  RefreshResult,
} from '../auth/auth.types.js';
import type { SensoryUseCases } from './sensory.types.js';

const id = '11111111-1111-4111-8111-111111111111';
class RoleAuth implements AuthUseCases {
  public constructor(private readonly role: Role) {}
  public authenticate(): Promise<AuthenticatedRequestUser> {
    return Promise.resolve({
      userId: id,
      role: this.role,
      mustChangePassword: false,
    });
  }
  public login(input: LoginRequest): Promise<LoginResult> {
    void input;
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
    userId: string,
    input: ChangePasswordRequest,
  ): Promise<void> {
    void userId;
    void input;
    return Promise.resolve();
  }
}
const createSpy = vi.fn().mockResolvedValue({});
const sensory = {
  list: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  detail: vi.fn(),
  create: createSpy,
  correct: vi.fn(),
  profile: vi.fn(),
  compare: vi.fn(),
  panelistOptions: vi.fn().mockResolvedValue([]),
  preparation: vi.fn(),
} as unknown as SensoryUseCases;
const appFor = (role: Role) =>
  createApp({ authService: new RoleAuth(role), sensoryService: sensory });
const bearer = { Authorization: 'Bearer prueba' };
const payload = {
  inspectionId: id,
  sessionDate: '2026-11-10',
  panelists: [
    {
      externalName: 'Panelista externo',
      scores: [
        { attributeId: '22222222-2222-4222-8222-222222222222', score: 4 },
      ],
    },
  ],
};

describe('rutas sensoriales', () => {
  it('permite registrar la matriz al analista', async () => {
    await request(appFor('ANALISTA'))
      .post(`${env.API_PREFIX}/sensory/sessions`)
      .set(bearer)
      .send(payload)
      .expect(201);
    expect(createSpy).toHaveBeenCalled();
  });
  it('impide registrar sesiones al operario', async () => {
    await request(appFor('OPERARIO'))
      .post(`${env.API_PREFIX}/sensory/sessions`)
      .set(bearer)
      .send(payload)
      .expect(403);
  });
  it('rechaza umbral y estado manipulados por el cliente', async () => {
    await request(appFor('ANALISTA'))
      .post(`${env.API_PREFIX}/sensory/sessions`)
      .set(bearer)
      .send({ ...payload, appliedThreshold: 1, status: 'CONFORME' })
      .expect(400);
  });
});
