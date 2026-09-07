import { Role, type SearchQuery, type SearchType } from '@sigecal/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type {
  DiscoveryActor,
  DiscoveryRepositoryPort,
  SearchRecord,
} from './discovery.types.js';

const enabled = (query: SearchQuery, type: SearchType): boolean =>
  !query.types || query.types.includes(type);

const batchAccess = (actor: DiscoveryActor): Prisma.BatchWhereInput =>
  actor.role === Role.OPERARIO
    ? {
        OR: [
          { createdById: actor.userId },
          { stages: { some: { responsibleId: actor.userId } } },
          { inspections: { some: { responsibleId: actor.userId } } },
        ],
      }
    : {};

const inspectionAccess = (
  actor: DiscoveryActor,
): Prisma.InspectionWhereInput =>
  actor.role === Role.OPERARIO
    ? { OR: [{ responsibleId: actor.userId }, { createdById: actor.userId }] }
    : {};

const nonConformityAccess = (
  actor: DiscoveryActor,
): Prisma.NonConformityWhereInput =>
  actor.role === Role.OPERARIO
    ? { OR: [{ detectedById: actor.userId }, { assignedToId: actor.userId }] }
    : {};

export class DiscoveryRepository implements DiscoveryRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  private async batches(
    query: SearchQuery,
    actor: DiscoveryActor,
  ): Promise<readonly SearchRecord[]> {
    if (!enabled(query, 'BATCH')) return [];
    const rows = await this.client.batch.findMany({
      where: {
        AND: [
          batchAccess(actor),
          {
            OR: [
              { code: { contains: query.q, mode: 'insensitive' } },
              { harvestOrigin: { contains: query.q, mode: 'insensitive' } },
              {
                piscoType: { name: { contains: query.q, mode: 'insensitive' } },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        code: true,
        status: true,
        piscoType: { select: { name: true } },
        currentStage: { select: { name: true } },
      },
      take: query.limitPerType,
      orderBy: { code: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      type: 'BATCH',
      code: row.code,
      status: row.status,
      context: `${row.piscoType.name} · ${row.currentStage.name}`,
    }));
  }

  private async inspections(
    query: SearchQuery,
    actor: DiscoveryActor,
  ): Promise<readonly SearchRecord[]> {
    if (!enabled(query, 'INSPECTION')) return [];
    const rows = await this.client.inspection.findMany({
      where: {
        AND: [
          inspectionAccess(actor),
          {
            OR: [
              { code: { contains: query.q, mode: 'insensitive' } },
              { notes: { contains: query.q, mode: 'insensitive' } },
              { batch: { code: { contains: query.q, mode: 'insensitive' } } },
            ],
          },
        ],
      },
      select: {
        id: true,
        code: true,
        status: true,
        batch: { select: { code: true } },
        stage: { select: { name: true } },
      },
      take: query.limitPerType,
      orderBy: { code: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      type: 'INSPECTION',
      code: row.code,
      status: row.status,
      context: `Lote ${row.batch.code} · ${row.stage.name}`,
    }));
  }

  private async nonConformities(
    query: SearchQuery,
    actor: DiscoveryActor,
  ): Promise<readonly SearchRecord[]> {
    if (!enabled(query, 'NONCONFORMITY')) return [];
    const rows = await this.client.nonConformity.findMany({
      where: {
        AND: [
          nonConformityAccess(actor),
          {
            OR: [
              { code: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
              { batch: { code: { contains: query.q, mode: 'insensitive' } } },
            ],
          },
        ],
      },
      select: {
        id: true,
        code: true,
        status: true,
        description: true,
        batch: { select: { code: true } },
      },
      take: query.limitPerType,
      orderBy: { code: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      type: 'NONCONFORMITY',
      code: row.code,
      status: row.status,
      context: `Lote ${row.batch.code} · ${row.description.slice(0, 80)}`,
    }));
  }

  public async search(query: SearchQuery, actor: DiscoveryActor) {
    const [batches, inspections, nonConformities] = await Promise.all([
      this.batches(query, actor),
      this.inspections(query, actor),
      this.nonConformities(query, actor),
    ]);
    return { batches, inspections, nonConformities };
  }

  public async audit(query: Parameters<DiscoveryRepositoryPort['audit']>[0]) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.client.auditLog.count({ where }),
      this.client.auditLog.findMany({
        where,
        select: {
          id: true,
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
          action: true,
          entity: true,
          entityId: true,
          before: true,
          after: true,
          ipAddress: true,
          createdAt: true,
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { items, total };
  }
}
