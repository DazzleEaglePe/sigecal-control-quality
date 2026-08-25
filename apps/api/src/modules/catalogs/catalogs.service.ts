import type { CatalogListQuery } from '@sigecal/shared';

import { ConflictError, NotFoundError } from '../../errors/app-error.js';
import type {
  CatalogCreateInput,
  CatalogItem,
  CatalogKind,
  CatalogRepositoryPort,
  CatalogsUseCases,
  CatalogUpdateInput,
} from './catalogs.types.js';

const sequenceOf = (
  input: CatalogCreateInput | CatalogUpdateInput,
): number | undefined => ('sequence' in input ? input.sequence : undefined);

export class CatalogsService implements CatalogsUseCases {
  public constructor(private readonly repository: CatalogRepositoryPort) {}

  public list(
    kind: CatalogKind,
    query: CatalogListQuery,
  ): Promise<readonly CatalogItem[]> {
    return this.repository.list(kind, query);
  }

  public async create(
    kind: CatalogKind,
    input: CatalogCreateInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<CatalogItem> {
    await this.ensureUniqueCode(kind, input.code);
    await this.ensureUniqueSequence(kind, sequenceOf(input));
    return this.repository.create(kind, input, actorId, ipAddress);
  }

  public async update(
    kind: CatalogKind,
    id: string,
    input: CatalogUpdateInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<CatalogItem> {
    const existing = await this.repository.findById(kind, id);
    if (!existing)
      throw new NotFoundError('El elemento del catálogo no existe.');
    if (
      input.isActive === false &&
      existing.isActive &&
      (await this.repository.countReferences(kind, id)) > 0
    ) {
      throw new ConflictError(
        'No puede desactivar un elemento utilizado por otros registros.',
        'RESOURCE_IN_USE',
      );
    }
    if (input.code) await this.ensureUniqueCode(kind, input.code, id);
    await this.ensureUniqueSequence(kind, sequenceOf(input), id);
    return this.repository.update(kind, id, input, actorId, ipAddress);
  }

  private async ensureUniqueCode(
    kind: CatalogKind,
    code: string,
    excludedId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByCode(kind, code);
    if (existing && existing.id !== excludedId) {
      throw new ConflictError(
        'Ya existe un elemento con ese código.',
        'CODE_IN_USE',
      );
    }
  }

  private async ensureUniqueSequence(
    kind: CatalogKind,
    sequence: number | undefined,
    excludedId?: string,
  ): Promise<void> {
    if (sequence === undefined) return;
    const existing = await this.repository.findBySequence(kind, sequence);
    if (existing && existing.id !== excludedId) {
      throw new ConflictError(
        'Ya existe un elemento con ese orden.',
        'SEQUENCE_IN_USE',
      );
    }
  }
}
