import type {
  CreateAreaRequest,
  UpdateAreaRequest,
  AreaListQuery,
} from '@sigecal/shared';

import { AuditAction } from '../../generated/prisma/enums.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import type { AreaRecord, AreaRepositoryPort } from './areas.types.js';

const selection = {
  id: true,
  code: true,
  name: true,
  isActive: true,
  isProvisional: true,
  createdAt: true,
  updatedAt: true,
} as const;

const auditView = (area: AreaRecord) => ({
  code: area.code,
  name: area.name,
  isActive: area.isActive,
  isProvisional: area.isProvisional,
});

export class AreaRepository implements AreaRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public list(query: AreaListQuery): Promise<readonly AreaRecord[]> {
    return this.client.area.findMany({
      where: query.isActive === undefined ? {} : { isActive: query.isActive },
      select: selection,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  public findById(id: string): Promise<AreaRecord | null> {
    return this.client.area.findUnique({ where: { id }, select: selection });
  }

  public findByCode(code: string): Promise<AreaRecord | null> {
    return this.client.area.findUnique({ where: { code }, select: selection });
  }

  public countActiveUsers(id: string): Promise<number> {
    return this.client.user.count({ where: { areaId: id, isActive: true } });
  }

  public create(
    input: CreateAreaRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<AreaRecord> {
    return this.client.$transaction(async (tx) => {
      const area = await tx.area.create({ data: input, select: selection });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: AuditAction.CREATE,
          entity: 'Area',
          entityId: area.id,
          after: auditView(area),
          ipAddress: ipAddress ?? null,
        },
      });
      return area;
    });
  }

  public update(
    id: string,
    input: UpdateAreaRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<AreaRecord> {
    return this.client.$transaction(async (tx) => {
      const before = await tx.area.findUniqueOrThrow({
        where: { id },
        select: selection,
      });
      const area = await tx.area.update({
        where: { id },
        data: {
          ...(input.code === undefined ? {} : { code: input.code }),
          ...(input.name === undefined ? {} : { name: input.name }),
          ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
          ...(input.isProvisional === undefined
            ? {}
            : { isProvisional: input.isProvisional }),
        },
        select: selection,
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action:
            input.isActive === undefined
              ? AuditAction.UPDATE
              : AuditAction.STATE_CHANGE,
          entity: 'Area',
          entityId: id,
          before: auditView(before),
          after: auditView(area),
          ipAddress: ipAddress ?? null,
        },
      });
      return area;
    });
  }
}
