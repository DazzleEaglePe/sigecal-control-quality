import type {
  CreateUserRequest,
  ResetUserPasswordRequest,
  UpdateUserRequest,
  UserItem,
  UserListQuery,
} from '@sigecal/shared';

import { ConflictError, NotFoundError } from '../../errors/app-error.js';
import type {
  PasswordHasher,
  UserRecord,
  UserRepositoryPort,
  UsersUseCases,
} from './users.types.js';
import { USER_SORT_FIELDS } from './users.types.js';

const toItem = (record: UserRecord): UserItem => ({
  ...record,
  area: record.area
    ? {
        ...record.area,
        createdAt: record.area.createdAt.toISOString(),
        updatedAt: record.area.updatedAt.toISOString(),
      }
    : null,
  lastLoginAt: record.lastLoginAt?.toISOString() ?? null,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export class UsersService implements UsersUseCases {
  public constructor(
    private readonly repository: UserRepositoryPort,
    private readonly passwords: PasswordHasher,
  ) {}

  public async list(query: UserListQuery) {
    const sortBy =
      USER_SORT_FIELDS.find((field) => field === query.sortBy) ?? 'lastName';
    const result = await this.repository.list(query, sortBy);
    return { data: result.items.map(toItem), total: result.total };
  }

  public async get(id: string): Promise<UserItem> {
    return toItem(await this.existing(id));
  }

  public async create(
    input: CreateUserRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserItem> {
    await this.ensureUniqueEmail(input.email);
    await this.ensureActiveArea(input.areaId);
    const passwordHash = await this.passwords.hash(input.temporaryPassword);
    return toItem(
      await this.repository.create(input, passwordHash, actorId, ipAddress),
    );
  }

  public async update(
    id: string,
    input: UpdateUserRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserItem> {
    await this.existing(id);
    if (input.email) await this.ensureUniqueEmail(input.email, id);
    if (input.areaId) await this.ensureActiveArea(input.areaId);
    return toItem(await this.repository.update(id, input, actorId, ipAddress));
  }

  public async setStatus(
    id: string,
    isActive: boolean,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserItem> {
    await this.existing(id);
    if (!isActive && id === actorId) {
      throw new ConflictError(
        'No puede desactivar su propia cuenta.',
        'SELF_DEACTIVATION',
      );
    }
    return toItem(
      await this.repository.setStatus(id, isActive, actorId, ipAddress),
    );
  }

  public async resetPassword(
    id: string,
    input: ResetUserPasswordRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.existing(id);
    const passwordHash = await this.passwords.hash(input.temporaryPassword);
    await this.repository.resetPassword(id, passwordHash, actorId, ipAddress);
  }

  private async existing(id: string): Promise<UserRecord> {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundError('El usuario no existe.');
    return user;
  }

  private async ensureUniqueEmail(
    email: string,
    excludedId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByEmail(email.toLowerCase());
    if (existing && existing.id !== excludedId) {
      throw new ConflictError(
        'Ya existe un usuario con ese correo.',
        'EMAIL_IN_USE',
      );
    }
  }

  private async ensureActiveArea(id: string): Promise<void> {
    if (!(await this.repository.areaIsActive(id))) {
      throw new ConflictError(
        'El área seleccionada no está activa.',
        'AREA_NOT_ACTIVE',
      );
    }
  }
}
