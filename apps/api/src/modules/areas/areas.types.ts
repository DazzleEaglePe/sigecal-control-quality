import type {
  AreaItem,
  AreaListQuery,
  CreateAreaRequest,
  UpdateAreaRequest,
} from '@sigecal/shared';

export interface AreaRecord extends Omit<AreaItem, 'createdAt' | 'updatedAt'> {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AreaRepositoryPort {
  list(query: AreaListQuery): Promise<readonly AreaRecord[]>;
  findById(id: string): Promise<AreaRecord | null>;
  findByCode(code: string): Promise<AreaRecord | null>;
  countActiveUsers(id: string): Promise<number>;
  create(
    input: CreateAreaRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<AreaRecord>;
  update(
    id: string,
    input: UpdateAreaRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<AreaRecord>;
}

export interface AreasUseCases {
  list(query: AreaListQuery): Promise<readonly AreaItem[]>;
  create(
    input: CreateAreaRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<AreaItem>;
  update(
    id: string,
    input: UpdateAreaRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<AreaItem>;
}
