import type {
  AuditItem,
  AuditQuery,
  SearchQuery,
  SearchResponseData,
} from '@sigecal/shared';

import type {
  AuditRecord,
  DiscoveryActor,
  DiscoveryRepositoryPort,
  DiscoveryUseCases,
} from './discovery.types.js';

const toAuditItem = (record: AuditRecord): AuditItem => ({
  ...record,
  before: record.before ?? null,
  after: record.after ?? null,
  createdAt: record.createdAt.toISOString(),
});

export class DiscoveryService implements DiscoveryUseCases {
  public constructor(private readonly repository: DiscoveryRepositoryPort) {}

  public async search(
    query: SearchQuery,
    actor: DiscoveryActor,
  ): Promise<SearchResponseData> {
    const result = await this.repository.search(query, actor);
    return {
      batches: [...result.batches],
      inspections: [...result.inspections],
      nonConformities: [...result.nonConformities],
      total:
        result.batches.length +
        result.inspections.length +
        result.nonConformities.length,
    };
  }

  public async audit(query: AuditQuery) {
    const result = await this.repository.audit(query);
    return { items: result.items.map(toAuditItem), total: result.total };
  }
}
