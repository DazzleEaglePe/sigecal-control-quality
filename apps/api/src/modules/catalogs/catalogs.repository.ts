import type { CatalogListQuery } from '@sigecal/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { AuditAction } from '../../generated/prisma/enums.js';
import {
  createWith,
  updateWith,
  type CatalogDb,
} from './catalogs.mutations.js';
import { countCatalogReferences } from './catalogs.usage.js';
import type {
  CatalogCreateInput,
  CatalogItem,
  CatalogKind,
  CatalogRepositoryPort,
  CatalogUpdateInput,
} from './catalogs.types.js';

const activeWhere = (query: CatalogListQuery) =>
  query.isActive === undefined ? {} : { isActive: query.isActive };

const findByIdWith = (
  db: CatalogDb,
  kind: CatalogKind,
  id: string,
): Promise<CatalogItem | null> => {
  switch (kind) {
    case 'varieties':
      return db.grapeVariety.findUnique({ where: { id } });
    case 'pisco-types':
      return db.piscoType.findUnique({ where: { id } });
    case 'stages':
      return db.processStage.findUnique({ where: { id } });
    case 'equipment':
      return db.equipment.findUnique({ where: { id } });
    case 'sensory-attributes':
      return db.sensoryAttribute.findUnique({ where: { id } });
    case 'parameters':
      return db.parameter.findUnique({ where: { id } });
  }
};

export class CatalogRepository implements CatalogRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public list(
    kind: CatalogKind,
    query: CatalogListQuery,
  ): Promise<readonly CatalogItem[]> {
    const where = activeWhere(query);
    const orderBy = { name: 'asc' as const };
    switch (kind) {
      case 'varieties':
        return this.client.grapeVariety.findMany({ where, orderBy });
      case 'pisco-types':
        return this.client.piscoType.findMany({ where, orderBy });
      case 'stages':
        return this.client.processStage.findMany({
          where,
          orderBy: { sequence: 'asc' },
        });
      case 'equipment':
        return this.client.equipment.findMany({ where, orderBy });
      case 'sensory-attributes':
        return this.client.sensoryAttribute.findMany({
          where,
          orderBy: { sequence: 'asc' },
        });
      case 'parameters':
        return this.client.parameter.findMany({ where, orderBy });
    }
  }

  public findById(kind: CatalogKind, id: string): Promise<CatalogItem | null> {
    return findByIdWith(this.client, kind, id);
  }

  public findByCode(
    kind: CatalogKind,
    code: string,
  ): Promise<CatalogItem | null> {
    switch (kind) {
      case 'varieties':
        return this.client.grapeVariety.findUnique({ where: { code } });
      case 'pisco-types':
        return this.client.piscoType.findUnique({ where: { code } });
      case 'stages':
        return this.client.processStage.findUnique({ where: { code } });
      case 'equipment':
        return this.client.equipment.findUnique({ where: { code } });
      case 'sensory-attributes':
        return this.client.sensoryAttribute.findUnique({ where: { code } });
      case 'parameters':
        return this.client.parameter.findUnique({ where: { code } });
    }
  }

  public findBySequence(
    kind: CatalogKind,
    sequence: number,
  ): Promise<CatalogItem | null> {
    if (kind === 'stages')
      return this.client.processStage.findUnique({ where: { sequence } });
    if (kind === 'sensory-attributes')
      return this.client.sensoryAttribute.findUnique({ where: { sequence } });
    return Promise.resolve(null);
  }

  public countReferences(kind: CatalogKind, id: string): Promise<number> {
    return countCatalogReferences(this.client, kind, id);
  }

  public create(
    kind: CatalogKind,
    input: CatalogCreateInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<CatalogItem> {
    return this.client.$transaction(async (tx: Prisma.TransactionClient) => {
      const item = await createWith(tx, kind, input);
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: AuditAction.CREATE,
          entity: kind,
          entityId: item.id,
          after: item,
          ipAddress: ipAddress ?? null,
        },
      });
      return item;
    });
  }

  public update(
    kind: CatalogKind,
    id: string,
    input: CatalogUpdateInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<CatalogItem> {
    return this.client.$transaction(async (tx: Prisma.TransactionClient) => {
      const before = await findByIdWith(tx, kind, id);
      const item = await updateWith(tx, kind, id, input);
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action:
            input.isActive === undefined
              ? AuditAction.UPDATE
              : AuditAction.STATE_CHANGE,
          entity: kind,
          entityId: id,
          ...(before ? { before } : {}),
          after: item,
          ipAddress: ipAddress ?? null,
        },
      });
      return item;
    });
  }
}
