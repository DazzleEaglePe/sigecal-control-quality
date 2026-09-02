import { randomBytes } from 'node:crypto';

import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserItem,
  UserListQuery,
} from '@sigecal/shared';

import { ConflictError, NotFoundError } from '../../errors/app-error.js';
import type { AccountAccessUseCases } from '../account-access/account-access.types.js';
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
  emailVerifiedAt: record.emailVerifiedAt?.toISOString() ?? null,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export class UsersService implements UsersUseCases {
  public constructor(
    private readonly repository: UserRepositoryPort,
    private readonly passwords: PasswordHasher,
    private readonly accountAccess: AccountAccessUseCases,
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
    const passwordHash = await this.passwords.hash(
      randomBytes(48).toString('base64url'),
    );
    const user = await this.repository.create(
      input,
      passwordHash,
      actorId,
      ipAddress,
    );
    await this.accountAccess.sendInvitation(user.id, actorId, ipAddress);
    return toItem(user);
  }

  public async update(
    id: string,
    input: UpdateUserRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserItem> {
    const current = await this.existing(id);
    const emailChanged = Boolean(
      input.email && input.email.toLowerCase() !== current.email,
    );
    if (emailChanged && input.email)
      await this.ensureUniqueEmail(input.email, id);
    if (input.areaId) await this.ensureActiveArea(input.areaId);
    const effectiveInput = emailChanged
      ? input
      : { ...input, email: undefined };
    const user = await this.repository.update(
      id,
      effectiveInput,
      actorId,
      ipAddress,
    );
    if (emailChanged)
      await this.accountAccess.sendInvitation(id, actorId, ipAddress);
    return toItem(user);
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
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.existing(id);
    await this.accountAccess.requestPasswordResetForUser(
      id,
      actorId,
      ipAddress,
    );
  }

  public async resendInvitation(
    id: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.existing(id);
    await this.accountAccess.sendInvitation(id, actorId, ipAddress);
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
