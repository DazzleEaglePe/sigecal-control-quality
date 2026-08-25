import type {
  AreaItem,
  AreaListQuery,
  CreateAreaRequest,
  UpdateAreaRequest,
} from '@sigecal/shared';

import { ConflictError, NotFoundError } from '../../errors/app-error.js';
import type {
  AreaRecord,
  AreaRepositoryPort,
  AreasUseCases,
} from './areas.types.js';

const toItem = (record: AreaRecord): AreaItem => ({
  ...record,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export class AreasService implements AreasUseCases {
  public constructor(private readonly repository: AreaRepositoryPort) {}

  public async list(query: AreaListQuery): Promise<readonly AreaItem[]> {
    return (await this.repository.list(query)).map(toItem);
  }

  public async create(
    input: CreateAreaRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<AreaItem> {
    await this.ensureUniqueCode(input.code);
    return toItem(await this.repository.create(input, actorId, ipAddress));
  }

  public async update(
    id: string,
    input: UpdateAreaRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<AreaItem> {
    await this.existing(id);
    if (input.code) await this.ensureUniqueCode(input.code, id);
    if (
      input.isActive === false &&
      (await this.repository.countActiveUsers(id)) > 0
    ) {
      throw new ConflictError(
        'No puede desactivar un área con usuarios activos.',
        'RESOURCE_IN_USE',
      );
    }
    return toItem(await this.repository.update(id, input, actorId, ipAddress));
  }

  private async existing(id: string): Promise<AreaRecord> {
    const area = await this.repository.findById(id);
    if (!area) throw new NotFoundError('El área no existe.');
    return area;
  }

  private async ensureUniqueCode(
    code: string,
    excludedId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByCode(code);
    if (existing && existing.id !== excludedId) {
      throw new ConflictError(
        'Ya existe un área con ese código.',
        'CODE_IN_USE',
      );
    }
  }
}
