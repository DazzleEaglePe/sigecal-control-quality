import type {
  AuditAction,
  AuditItem,
  AuditQuery,
  Role,
  SearchQuery,
  SearchResponseData,
  SearchType,
} from '@sigecal/shared';

export interface DiscoveryActor {
  readonly userId: string;
  readonly role: Role;
}

export interface SearchRecord {
  readonly id: string;
  readonly type: SearchType;
  readonly code: string;
  readonly status: string;
  readonly context: string;
}

export interface AuditRecord {
  readonly id: string;
  readonly user: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
  } | null;
  readonly action: AuditAction;
  readonly entity: string;
  readonly entityId: string;
  readonly before: unknown;
  readonly after: unknown;
  readonly ipAddress: string | null;
  readonly createdAt: Date;
}

export interface DiscoveryRepositoryPort {
  search(
    query: SearchQuery,
    actor: DiscoveryActor,
  ): Promise<{
    readonly batches: readonly SearchRecord[];
    readonly inspections: readonly SearchRecord[];
    readonly nonConformities: readonly SearchRecord[];
  }>;
  audit(query: AuditQuery): Promise<{
    readonly items: readonly AuditRecord[];
    readonly total: number;
  }>;
}

export interface DiscoveryUseCases {
  search(
    query: SearchQuery,
    actor: DiscoveryActor,
  ): Promise<SearchResponseData>;
  audit(query: AuditQuery): Promise<{
    readonly items: readonly AuditItem[];
    readonly total: number;
  }>;
}
