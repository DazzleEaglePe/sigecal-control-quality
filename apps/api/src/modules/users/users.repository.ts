import { AuditAction } from '../../generated/prisma/enums.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserListQuery,
} from '@sigecal/shared';

import type {
  UserRecord,
  UserRepositoryPort,
  UserSortField,
} from './users.types.js';

const areaSelection = {
  id: true,
  code: true,
  name: true,
  isActive: true,
  isProvisional: true,
  createdAt: true,
  updatedAt: true,
} as const;

const userSelection = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  area: { select: areaSelection },
  position: true,
  isActive: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const auditView = (user: UserRecord) => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  areaId: user.area?.id ?? null,
  position: user.position,
  isActive: user.isActive,
  mustChangePassword: user.mustChangePassword,
});

const updateData = (input: UpdateUserRequest) => ({
  ...(input.firstName === undefined ? {} : { firstName: input.firstName }),
  ...(input.lastName === undefined ? {} : { lastName: input.lastName }),
  ...(input.email === undefined ? {} : { email: input.email.toLowerCase() }),
  ...(input.role === undefined ? {} : { role: input.role }),
  ...(input.position === undefined ? {} : { position: input.position }),
  ...(input.areaId === undefined
    ? {}
    : { area: { connect: { id: input.areaId } } }),
});

export class UserRepository implements UserRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public async list(query: UserListQuery, sortBy: UserSortField) {
    const where = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.search
        ? {
            OR: [
              {
                firstName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                lastName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: { contains: query.search, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await this.client.$transaction([
      this.client.user.findMany({
        where,
        select: userSelection,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [sortBy]: query.sortOrder ?? 'asc' },
      }),
      this.client.user.count({ where }),
    ]);
    return { items, total };
  }

  public findById(id: string): Promise<UserRecord | null> {
    return this.client.user.findUnique({
      where: { id },
      select: userSelection,
    });
  }

  public findByEmail(email: string): Promise<UserRecord | null> {
    return this.client.user.findUnique({
      where: { email },
      select: userSelection,
    });
  }

  public async areaIsActive(id: string): Promise<boolean> {
    return (
      (await this.client.area.count({ where: { id, isActive: true } })) === 1
    );
  }

  public create(
    input: CreateUserRequest,
    passwordHash: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserRecord> {
    return this.client.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email.toLowerCase(),
          passwordHash,
          role: input.role,
          areaId: input.areaId,
          position: input.position ?? null,
          mustChangePassword: true,
        },
        select: userSelection,
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: AuditAction.CREATE,
          entity: 'User',
          entityId: user.id,
          after: auditView(user),
          ipAddress: ipAddress ?? null,
        },
      });
      return user;
    });
  }

  public update(
    id: string,
    input: UpdateUserRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserRecord> {
    return this.client.$transaction(async (tx) => {
      const before = await tx.user.findUniqueOrThrow({
        where: { id },
        select: userSelection,
      });
      const user = await tx.user.update({
        where: { id },
        data: updateData(input),
        select: userSelection,
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: AuditAction.UPDATE,
          entity: 'User',
          entityId: id,
          before: auditView(before),
          after: auditView(user),
          ipAddress: ipAddress ?? null,
        },
      });
      return user;
    });
  }

  public setStatus(
    id: string,
    isActive: boolean,
    actorId: string,
    ipAddress?: string,
  ): Promise<UserRecord> {
    return this.client.$transaction(async (tx) => {
      const before = await tx.user.findUniqueOrThrow({
        where: { id },
        select: userSelection,
      });
      const user = await tx.user.update({
        where: { id },
        data: { isActive },
        select: userSelection,
      });
      if (!isActive)
        await tx.refreshToken.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: AuditAction.STATE_CHANGE,
          entity: 'User',
          entityId: id,
          before: auditView(before),
          after: auditView(user),
          ipAddress: ipAddress ?? null,
        },
      });
      return user;
    });
  }

  public async resetPassword(
    id: string,
    passwordHash: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.client.$transaction(async (tx) => {
      const before = await tx.user.findUniqueOrThrow({
        where: { id },
        select: { mustChangePassword: true },
      });
      await tx.user.update({
        where: { id },
        data: {
          passwordHash,
          mustChangePassword: true,
          failedAttempts: 0,
          lockedUntil: null,
        },
      });
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: AuditAction.UPDATE,
          entity: 'UserPassword',
          entityId: id,
          before: { mustChangePassword: before.mustChangePassword },
          after: { mustChangePassword: true },
          ipAddress: ipAddress ?? null,
        },
      });
    });
  }
}
