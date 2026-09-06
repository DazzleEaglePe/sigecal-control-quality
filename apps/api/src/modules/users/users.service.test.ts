import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserListQuery,
} from '@sigecal/shared';

import { ConflictError } from '../../errors/app-error.js';
import type { AccountAccessUseCases } from '../account-access/account-access.types.js';
import { UsersService } from './users.service.js';
import type {
  PasswordHasher,
  UserRecord,
  UserRepositoryPort,
  UserSortField,
} from './users.types.js';

const area = {
  id: '22222222-2222-4222-a222-222222222222',
  code: 'CALIDAD',
  name: 'Calidad',
  isActive: true,
  isProvisional: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const record = (id = '11111111-1111-4111-a111-111111111111'): UserRecord => ({
  id,
  firstName: 'Ana',
  lastName: 'Paz',
  email: 'ana@example.com',
  role: 'ADMIN',
  area,
  position: 'Calidad',
  isActive: true,
  mustChangePassword: true,
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

class MemoryUsers implements UserRepositoryPort {
  public assignmentOptions() {
    return Promise.resolve({ data: [], total: 0 });
  }
  public users: UserRecord[] = [];
  public activeArea = true;
  public revoked = false;

  public list(_query: UserListQuery, _sortBy: UserSortField) {
    void _query;
    void _sortBy;
    return Promise.resolve({ items: this.users, total: this.users.length });
  }
  public findById(id: string) {
    return Promise.resolve(this.users.find((user) => user.id === id) ?? null);
  }
  public findByEmail(email: string) {
    return Promise.resolve(
      this.users.find((user) => user.email === email) ?? null,
    );
  }
  public areaIsActive() {
    return Promise.resolve(this.activeArea);
  }
  public create(input: CreateUserRequest) {
    const user: UserRecord = {
      ...record(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      role: input.role,
      position: input.position ?? null,
    };
    this.users.push(user);
    return Promise.resolve(user);
  }
  public update(id: string, input: UpdateUserRequest) {
    const current = this.users.find((user) => user.id === id) ?? record(id);
    const user: UserRecord = {
      ...current,
      firstName: input.firstName ?? current.firstName,
      lastName: input.lastName ?? current.lastName,
      email: input.email ?? current.email,
      role: input.role ?? current.role,
      position: input.position ?? current.position,
    };
    return Promise.resolve(user);
  }
  public setStatus(id: string, isActive: boolean) {
    const user = {
      ...(this.users.find((item) => item.id === id) ?? record(id)),
      isActive,
    };
    this.revoked = !isActive;
    return Promise.resolve(user);
  }
}

const hashPassword = vi.fn(() => Promise.resolve('hash-seguro'));
const hasher: PasswordHasher = { hash: hashPassword };
const sendInvitation = vi.fn(() => Promise.resolve());
const requestPasswordResetForUser = vi.fn(() => Promise.resolve());
const accountAccess: AccountAccessUseCases = {
  sendInvitation,
  requestPasswordReset: vi.fn(() => Promise.resolve()),
  requestPasswordResetForUser,
  activate: vi.fn(() => Promise.resolve()),
  resetPassword: vi.fn(() => Promise.resolve()),
};
const serviceFor = (repository: UserRepositoryPort) =>
  new UsersService(repository, hasher, accountAccess);
const createInput: CreateUserRequest = {
  firstName: 'Ana',
  lastName: 'Paz',
  email: 'NUEVA@EXAMPLE.COM',
  role: 'ANALISTA',
  areaId: area.id,
  position: 'Analista',
};

describe('UsersService creación', () => {
  let repository: MemoryUsers;
  beforeEach(() => {
    repository = new MemoryUsers();
    vi.clearAllMocks();
  });

  it('exige un correo único y un área activa antes de hashear', async () => {
    repository.activeArea = false;
    await expect(
      serviceFor(repository).create(createInput, record().id),
    ).rejects.toMatchObject({ code: 'AREA_NOT_ACTIVE' });
    expect(hashPassword).not.toHaveBeenCalled();
  });

  it('crea con contraseña hasheada y nunca la incorpora al resultado', async () => {
    const result = await serviceFor(repository).create(
      createInput,
      record().id,
    );
    expect(hashPassword).toHaveBeenCalledOnce();
    expect(sendInvitation).toHaveBeenCalledWith(
      result.id,
      record().id,
      undefined,
    );
    expect(result.email).toBe('nueva@example.com');
    expect(result).not.toHaveProperty('temporaryPassword');
  });
});

describe('UsersService estados', () => {
  it('impide la autodesactivación administrativa', async () => {
    const repository = new MemoryUsers();
    repository.users.push(record());
    const service = serviceFor(repository);
    await expect(
      service.setStatus(record().id, false, record().id),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repository.revoked).toBe(false);
  });

  it('inicia la recuperación administrativa sin generar una contraseña', async () => {
    const repository = new MemoryUsers();
    repository.users.push(record());
    await serviceFor(repository).resetPassword(record().id, 'actor-id');
    expect(requestPasswordResetForUser).toHaveBeenCalledWith(
      record().id,
      'actor-id',
      undefined,
    );
  });
});
